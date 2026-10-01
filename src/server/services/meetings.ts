import { and, asc, desc, eq, gte, inArray, lt, max, count, isNull } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { announcements, meetingPresenters, meetings, users } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { Mail } from "../mail";
import type { announcementInput, meetingInput } from "../validation";
import { requireAdmin } from "./users";
import { addDays, formatStamp, labToday } from "@/lib/weeks";

type MeetingInput = z.infer<typeof meetingInput>;

function signedIn(actor: SessionUser | null): asserts actor is SessionUser {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
}

/** Meetings are entered in Vietnam time (UTC+7, no daylight saving). */
export const meetingStart = (date: string, time: string) => new Date(`${date}T${time}:00+07:00`);

/** `YYYY-MM-DD` and `HH:MM` of a meeting in Vietnam time, for forms. */
export function meetingParts(startsAt: Date) {
  const v = new Date(startsAt.getTime() + 7 * 3600e3).toISOString();
  return { date: v.slice(0, 10), time: v.slice(11, 16) };
}

export interface MeetingView {
  id: string;
  title: string;
  startsAt: Date;
  location: string | null;
  link: string | null;
  notes: string | null;
  presenters: { id: string; name: string; email: string; topic: string | null }[];
}

async function withPresenters(db: Db, rows: (typeof meetings.$inferSelect)[]): Promise<MeetingView[]> {
  if (!rows.length) return [];
  const ps = await db
    .select({ meetingId: meetingPresenters.meetingId, id: users.id, name: users.name, email: users.email, topic: meetingPresenters.topic })
    .from(meetingPresenters)
    .innerJoin(users, eq(users.id, meetingPresenters.userId))
    .where(inArray(meetingPresenters.meetingId, rows.map((r) => r.id)))
    .orderBy(asc(users.name));
  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    startsAt: m.startsAt,
    location: m.location,
    link: m.link,
    notes: m.notes,
    presenters: ps.filter((p) => p.meetingId === m.id).map(({ id, name, email, topic }) => ({ id, name, email, topic })),
  }));
}

/** Every signed-in member sees the lab's meetings. Upcoming: from the start of today (Vietnam time). */
export async function listMeetings(db: Db, actor: SessionUser | null, opts: { when: "upcoming" | "past"; limit?: number }) {
  signedIn(actor);
  const startOfToday = meetingStart(labToday(), "00:00");
  const rows = await db
    .select()
    .from(meetings)
    .where(opts.when === "upcoming" ? gte(meetings.startsAt, startOfToday) : lt(meetings.startsAt, startOfToday))
    .orderBy(opts.when === "upcoming" ? asc(meetings.startsAt) : desc(meetings.startsAt))
    .limit(opts.limit ?? 20);
  return withPresenters(db, rows);
}

export async function getMeeting(db: Db, id: string) {
  const [m] = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  if (!m) throw new AppError("not_found", "Meeting not found.");
  return (await withPresenters(db, [m]))[0];
}

async function checkPresenters(db: Db, presenters: MeetingInput["presenters"]) {
  const unique = [...new Map(presenters.map((p) => [p.userId, p])).values()];
  if (!unique.length) return unique;
  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(and(inArray(users.id, unique.map((p) => p.userId)), eq(users.active, true)));
  if (found.length !== unique.length) throw new AppError("invalid_input", "Presenters must be active members.");
  return unique;
}

export async function createMeeting(db: Db, actor: SessionUser | null, input: Omit<MeetingInput, "notify">) {
  requireAdmin(actor);
  const presenters = await checkPresenters(db, input.presenters);
  const id = await db.transaction(async (tx) => {
    const [m] = await tx
      .insert(meetings)
      .values({ title: input.title, startsAt: meetingStart(input.date, input.time), location: input.location ?? null, link: input.link ?? null, notes: input.notes ?? null, createdBy: actor.id })
      .returning({ id: meetings.id });
    if (presenters.length) await tx.insert(meetingPresenters).values(presenters.map((p) => ({ meetingId: m.id, userId: p.userId, topic: p.topic ?? null })));
    return m.id;
  });
  return getMeeting(db, id);
}

/** Replaces the meeting's details and presenters (e.g. someone swaps their slot). */
export async function updateMeeting(db: Db, actor: SessionUser | null, id: string, input: Omit<MeetingInput, "notify">) {
  requireAdmin(actor);
  const presenters = await checkPresenters(db, input.presenters);
  const startsAt = meetingStart(input.date, input.time);
  await db.transaction(async (tx) => {
    const [old] = await tx.select({ startsAt: meetings.startsAt }).from(meetings).where(eq(meetings.id, id));
    if (!old) throw new AppError("not_found", "Meeting not found.");
    await tx
      .update(meetings)
      .set({
        title: input.title,
        startsAt,
        location: input.location ?? null,
        link: input.link ?? null,
        notes: input.notes ?? null,
        // a new date needs a new reminder
        ...(old.startsAt.getTime() !== startsAt.getTime() ? { remindedAt: null } : {}),
      })
      .where(eq(meetings.id, id));
    await tx.delete(meetingPresenters).where(eq(meetingPresenters.meetingId, id));
    if (presenters.length) await tx.insert(meetingPresenters).values(presenters.map((p) => ({ meetingId: id, userId: p.userId, topic: p.topic ?? null })));
  });
  return getMeeting(db, id);
}

export async function deleteMeeting(db: Db, actor: SessionUser | null, id: string) {
  requireAdmin(actor);
  const [m] = await db.delete(meetings).where(eq(meetings.id, id)).returning({ id: meetings.id });
  if (!m) throw new AppError("not_found", "Meeting not found.");
}

/**
 * Helps the admin rotate presenters fairly: every active account with how many past meetings
 * they presented at and when they last did, people who never presented (or longest ago) first.
 */
export async function presenterRotation(db: Db, actor: SessionUser | null) {
  requireAdmin(actor);
  const now = new Date();
  const stats = await db
    .select({ userId: meetingPresenters.userId, times: count(), last: max(meetings.startsAt) })
    .from(meetingPresenters)
    .innerJoin(meetings, eq(meetings.id, meetingPresenters.meetingId))
    .where(lt(meetings.startsAt, now))
    .groupBy(meetingPresenters.userId);
  const byUser = new Map(stats.map((s) => [s.userId, s]));
  const people = await db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(eq(users.active, true)).orderBy(asc(users.name));
  return people
    .map((p) => ({ ...p, times: Number(byUser.get(p.id)?.times ?? 0), lastPresented: byUser.get(p.id)?.last ? new Date(byUser.get(p.id)!.last!) : null }))
    .sort((a, b) => (a.lastPresented?.getTime() ?? 0) - (b.lastPresented?.getTime() ?? 0) || a.name.localeCompare(b.name));
}

/** Meetings today (Vietnam time) whose day-of reminder has not been sent yet. */
export async function meetingsDueForReminder(db: Db, today: string) {
  const rows = await db
    .select()
    .from(meetings)
    .where(and(gte(meetings.startsAt, meetingStart(today, "00:00")), lt(meetings.startsAt, meetingStart(addDays(today, 1), "00:00")), isNull(meetings.remindedAt)))
    .orderBy(asc(meetings.startsAt));
  return withPresenters(db, rows);
}

export async function markReminded(db: Db, id: string) {
  await db.update(meetings).set({ remindedAt: new Date() }).where(eq(meetings.id, id));
}

// --------------------------------------------------------- announcements --

export async function createAnnouncement(db: Db, actor: SessionUser | null, input: Omit<z.infer<typeof announcementInput>, "notify">) {
  requireAdmin(actor);
  const [a] = await db.insert(announcements).values({ title: input.title, body: input.body, authorId: actor.id }).returning();
  return a;
}

export async function listAnnouncements(db: Db, actor: SessionUser | null, limit = 10) {
  signedIn(actor);
  return db
    .select({ id: announcements.id, title: announcements.title, body: announcements.body, createdAt: announcements.createdAt, emailedAt: announcements.emailedAt, author: { id: users.id, name: users.name } })
    .from(announcements)
    .leftJoin(users, eq(users.id, announcements.authorId))
    .orderBy(desc(announcements.createdAt))
    .limit(limit);
}

export async function deleteAnnouncement(db: Db, actor: SessionUser | null, id: string) {
  requireAdmin(actor);
  const [a] = await db.delete(announcements).where(eq(announcements.id, id)).returning({ id: announcements.id });
  if (!a) throw new AppError("not_found", "Announcement not found.");
}

export async function markEmailed(db: Db, id: string) {
  await db.update(announcements).set({ emailedAt: new Date() }).where(eq(announcements.id, id));
}

// ----------------------------------------------------------------- email --

/** Everyone with an active account: the email they sign in with is where notices go. */
export function recipients(db: Db) {
  return db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq(users.active, true)).orderBy(asc(users.name));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const firstName = (name: string) => name.split(" ").at(-1) ?? name;
const shell = (inner: string, footer: string) =>
  `<div style="background:#f6f3ec;padding:24px;font-family:Arial,sans-serif;color:#16140f"><div style="max-width:560px;margin:auto">${inner}<p style="font-size:12px;color:#666;margin-top:24px">${footer}</p></div></div>`;
const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;padding:10px 16px;background:#ffd23f;border:2px solid #16140f;border-radius:10px;color:#16140f;font-weight:700;text-decoration:none">${label}</a>`;

export type MeetingMailKind = "new" | "updated" | "reminder";

/** One email per member; presenters get a line saying it is their turn. */
export function renderMeetingMail(m: MeetingView, to: { id: string; email: string; name: string }, siteUrl: string, kind: MeetingMailKind): Mail {
  const when = formatStamp(m.startsAt);
  const mine = m.presenters.find((p) => p.id === to.id);
  const who = m.presenters.length ? m.presenters.map((p) => `${p.name}${p.topic ? ` (${p.topic})` : ""}`).join(", ") : "to be announced";
  const lead = { new: "New lab meeting", updated: "Meeting updated", reminder: "Today" }[kind];
  const subject = `[Blockchainist] ${lead}: ${m.title} · ${when}${mine ? " · you are presenting" : ""}`;
  const text = [
    `Hi ${firstName(to.name)},`,
    "",
    kind === "reminder" ? `Reminder: the lab meets today.` : kind === "updated" ? "A lab meeting was changed." : "A lab meeting has been scheduled.",
    ...(mine ? ["", `>> You are presenting${mine.topic ? `: ${mine.topic}` : ""}.`] : []),
    "",
    `${m.title}`,
    `When: ${when} (Vietnam time)`,
    ...(m.location ? [`Where: ${m.location}`] : []),
    ...(m.link ? [`Join: ${m.link}`] : []),
    `Presenting: ${who}`,
    ...(m.notes ? ["", m.notes] : []),
    "",
    `All meetings: ${siteUrl}/app`,
  ].join("\n");
  const row = (k: string, v: string) => `<tr><td style="padding:4px 12px 4px 0;font:12px monospace;color:#555;vertical-align:top">${k}</td><td style="padding:4px 0">${v}</td></tr>`;
  const html = shell(
    `<p style="font:700 20px/1.2 Arial,sans-serif">Hi ${esc(firstName(to.name))},</p>` +
      `<p>${kind === "reminder" ? "Reminder: the lab meets <b>today</b>." : kind === "updated" ? "A lab meeting was <b>changed</b>." : "A lab meeting has been scheduled."}</p>` +
      (mine ? `<p style="padding:10px 12px;background:#ffd23f;border:2px solid #16140f;border-radius:10px;font-weight:700">You are presenting${mine.topic ? `: ${esc(mine.topic)}` : ""}.</p>` : "") +
      `<div style="padding:14px 16px;border:2px solid #16140f;border-radius:12px;background:#fff"><p style="margin:0 0 8px;font:700 17px Arial,sans-serif">${esc(m.title)}</p><table style="border-collapse:collapse">` +
      row("WHEN", `${esc(when)} <span style="color:#555">(Vietnam time)</span>`) +
      (m.location ? row("WHERE", esc(m.location)) : "") +
      (m.link ? row("JOIN", `<a href="${esc(m.link)}">${esc(m.link)}</a>`) : "") +
      row("PRESENTING", esc(who)) +
      `</table>${m.notes ? `<p style="margin:10px 0 0;white-space:pre-line">${esc(m.notes)}</p>` : ""}</div>` +
      `<p style="margin-top:20px">${button(`${siteUrl}/app`, "Open the lab dashboard")}</p>`,
    "Blockchainist lab · you get this because you have a lab account",
  );
  return { to: to.email, subject, text, html };
}

export function renderAnnouncementMail(a: { title: string; body: string; author?: string | null }, to: { email: string; name: string }, siteUrl: string): Mail {
  const subject = `[Blockchainist] ${a.title}`;
  const text = [`Hi ${firstName(to.name)},`, "", a.title, "", a.body, "", ...(a.author ? [`- ${a.author}`, ""] : []), `Lab dashboard: ${siteUrl}/app`].join("\n");
  const html = shell(
    `<p style="font:700 20px/1.2 Arial,sans-serif">Hi ${esc(firstName(to.name))},</p>` +
      `<div style="padding:14px 16px;border:2px solid #16140f;border-radius:12px;background:#fff"><p style="margin:0 0 8px;font:700 17px Arial,sans-serif">${esc(a.title)}</p><p style="margin:0;white-space:pre-line">${esc(a.body)}</p>${a.author ? `<p style="margin:10px 0 0;color:#555">${esc(a.author)}</p>` : ""}</div>` +
      `<p style="margin-top:20px">${button(`${siteUrl}/app`, "Open the lab dashboard")}</p>`,
    "Blockchainist lab · you get this because you have a lab account",
  );
  return { to: to.email, subject, text, html };
}
