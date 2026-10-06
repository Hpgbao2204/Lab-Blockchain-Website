import { and, count, desc, eq, gte } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { applications, users, type Applicant, type Application, type ApplicationReply } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { Mail, SendResult } from "../mail";
import type { applicationInput, applicationReplyInput, applicationUpdateInput } from "../validation";
import { createUser, requireAdmin } from "./users";
import { renderAccountMail } from "./account-mail";
import { button, esc, shell, siteHost } from "./meetings";
import { formatStamp } from "@/lib/weeks";
import { zaloLink } from "@/lib/contact";

export type { Applicant, Application };
type ApplicationInput = z.infer<typeof applicationInput>;

/**
 * Anyone may apply from /join; no account needed. The route rate-limits per address, and a
 * filled-in honeypot field is accepted silently but not stored.
 */
export async function submitApplication(db: Db, input: ApplicationInput): Promise<Application | null> {
  if (input.website) return null;
  const [contact] = input.members;
  const [row] = await db
    .insert(applications)
    .values({
      name: contact.name,
      email: contact.email,
      program: input.program,
      studentId: contact.studentId,
      interests: [...new Set(input.interests)],
      message: input.message,
      link: input.link ?? null,
      facebook: contact.facebook,
      zalo: contact.zalo,
      members: input.members,
    })
    .returning();
  return row;
}

/** Everyone on an application; older single-person applications only have the contact fields. */
export function applicantsOf(a: Application): Applicant[] {
  if (a.members.length) return a.members;
  return [{ name: a.name, email: a.email, studentId: a.studentId ?? "", phone: a.zalo ?? "", zalo: a.zalo ?? "", facebook: a.facebook ?? "" }];
}

/** How many applications arrived recently, so a flood stops emailing the admins. */
export async function recentApplicationCount(db: Db, sinceMs: number) {
  const [r] = await db.select({ n: count() }).from(applications).where(gte(applications.createdAt, new Date(Date.now() - sinceMs)));
  return r.n;
}

export async function listApplications(db: Db, actor: SessionUser | null) {
  requireAdmin(actor);
  return db.select().from(applications).orderBy(desc(applications.createdAt)).limit(500);
}

export async function countNewApplications(db: Db, actor: SessionUser | null) {
  requireAdmin(actor);
  const [r] = await db.select({ n: count() }).from(applications).where(eq(applications.status, "new"));
  return r.n;
}

export async function updateApplication(db: Db, actor: SessionUser | null, id: string, input: z.infer<typeof applicationUpdateInput>) {
  requireAdmin(actor);
  const set: Partial<Application> = {};
  if (input.status) set.status = input.status;
  if (input.adminNote !== undefined) set.adminNote = input.adminNote;
  if (!Object.keys(set).length) throw new AppError("invalid_input", "Nothing to change.");
  const [row] = await db.update(applications).set(set).where(eq(applications.id, id)).returning();
  if (!row) throw new AppError("not_found", "Application not found.");
  return row;
}

export async function deleteApplication(db: Db, actor: SessionUser | null, id: string) {
  requireAdmin(actor);
  const [gone] = await db.delete(applications).where(eq(applications.id, id)).returning({ id: applications.id });
  if (!gone) throw new AppError("not_found", "Application not found.");
}

/** Active admins, who get an email for each new application. */
export function adminRecipients(db: Db) {
  return db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.active, true)));
}

const PERSON_FIELDS: [keyof Applicant, string][] = [
  ["studentId", "Student ID"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["zalo", "Zalo"],
  ["facebook", "Facebook"],
];

export function renderApplicationMail(a: Application, to: { email: string }, siteUrl: string): Mail {
  const team = applicantsOf(a);
  const who = team.length > 1 ? `${a.name} and ${team.length - 1} more` : a.name;
  const subject = `[Blockchainist] New application: ${who} (${a.program})`;
  const facts: [string, string | null][] = [
    ["People", String(team.length)],
    ["Program", a.program],
    ["Interests", a.interests.join(", ") || null],
    ["Link", a.link],
    ["Sent", formatStamp(a.createdAt)],
  ];
  const row = (k: string, v: string, key = k) => `<tr><td style="padding:2px 12px 2px 0;color:#555">${k}</td><td style="padding:2px 0">${factHtml(key, v)}</td></tr>`;
  const text = [
    `New application from ${who}`,
    "",
    ...facts.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    "",
    ...team.flatMap((p, i) => [`${i + 1}. ${p.name}`, ...PERSON_FIELDS.filter(([k]) => p[k]).map(([k, label]) => `   ${label}: ${p[k]}`)]),
    "",
    a.message,
    "",
    `Accept (creates their accounts), decline or answer on the site: ${siteUrl}/admin/applications`,
    `Or reply to this email to write to ${a.name} directly.`,
  ].join("\n");
  const html = shell(
    `<p style="font:700 20px/1.2 Arial,sans-serif">New application from ${esc(who)}</p>` +
      `<table style="font:14px Arial,sans-serif;border-collapse:collapse">${facts
        .filter(([, v]) => v)
        .map(([k, v]) => row(k, v!))
        .join("")}</table>` +
      team
        .map(
          (p, i) =>
            `<div style="margin-top:12px;padding:10px 14px;border:2px solid #16140f;border-radius:12px;background:#fff"><p style="margin:0 0 4px;font:700 15px Arial,sans-serif">${i + 1}. ${esc(p.name)}</p><table style="font:14px Arial,sans-serif;border-collapse:collapse">${PERSON_FIELDS.filter(([k]) => p[k])
              .map(([k, label]) => row(label, String(p[k]), label))
              .join("")}</table></div>`,
        )
        .join("") +
      `<div style="margin-top:12px;padding:14px 16px;border:2px dashed #16140f;border-radius:12px;background:#fff"><p style="margin:0;white-space:pre-line;overflow-wrap:anywhere;word-break:break-word">${esc(a.message)}</p></div>` +
      `<p style="margin-top:20px">${button(`${siteUrl}/admin/applications`, "Accept, decline or answer")}</p>` +
      `<p style="font:13px Arial,sans-serif;color:#555">Accepting on the site creates everyone's account and emails them their login. Or press Reply in your mail app to write to ${esc(a.name)} directly.</p>`,
    "Blockchainist lab · sent to admins when someone applies on /join",
  );
  return { to: to.email, subject, text, html, replyTo: a.email };
}

const factHtml = (k: string, v: string) => {
  const href = k === "Email" ? `mailto:${v}` : k === "Zalo" ? zaloLink(v) : k === "Phone" ? `tel:${v.replace(/[^0-9+]/g, "")}` : k === "Link" || k === "Facebook" ? v : null;
  return href ? `<a href="${esc(href)}" style="color:#16140f">${esc(v)}</a>` : esc(v);
};

export async function getApplication(db: Db, actor: SessionUser | null, id: string) {
  requireAdmin(actor);
  const [row] = await db.select().from(applications).where(eq(applications.id, id));
  if (!row) throw new AppError("not_found", "Application not found.");
  return row;
}

const SUBJECTS: Record<ApplicationReply["status"], string> = {
  new: "Phản hồi đơn ứng tuyển của bạn",
  contacted: "Phản hồi đơn ứng tuyển của bạn",
  accepted: "Chào mừng bạn đến với nhóm Blockchainist",
  declined: "Kết quả đơn ứng tuyển của bạn",
};

/**
 * The email an applicant gets when an admin answers from the site. It is sent from the site's
 * no-reply address, with Reply-To set to the admin, so the applicant's answer reaches a person.
 * The wrapper is in Vietnamese, like the other mail to students; the admin writes the message.
 */
export function renderReplyMail(
  a: { name: string; email: string },
  from: { name: string; email: string },
  reply: { status: ApplicationReply["status"]; message: string },
  siteUrl: string,
): Mail {
  const subject = `[Blockchainist] ${SUBJECTS[reply.status]}`;
  const text = [
    `Chào ${a.name},`,
    "",
    reply.message,
    "",
    `${from.name}`,
    "Nhóm nghiên cứu Blockchainist, UIT – VNU-HCM",
    "",
    `Bạn có thể trả lời trực tiếp email này để liên hệ với ${from.name} (${from.email}).`,
  ].join("\n");
  const html = shell(
    `<p style="font:16px/1.5 Arial,sans-serif">Chào ${esc(a.name)},</p>` +
      `<div style="margin:12px 0;padding:14px 16px;border:2px solid #16140f;border-radius:12px;background:#fff"><p style="margin:0;font:15px/1.6 Arial,sans-serif;white-space:pre-line;overflow-wrap:anywhere;word-break:break-word">${esc(reply.message)}</p></div>` +
      `<p style="font:15px/1.5 Arial,sans-serif;margin:0"><b>${esc(from.name)}</b><br>Nhóm nghiên cứu Blockchainist, UIT – VNU-HCM</p>`,
    `Trả lời email này để liên hệ trực tiếp với ${esc(from.name)}. Bạn nhận được email vì đã gửi đơn ứng tuyển trên ${esc(siteHost(siteUrl))}.`,
  );
  return { to: a.email, subject, text, html, replyTo: from.email };
}

const ACCOUNT_TITLES: Record<string, string> = {
  Undergraduate: "Undergraduate researcher",
  "Master's": "Master's student",
  PhD: "PhD student",
};

/**
 * Accepting an application makes an account for each person on it (username = their email,
 * a random temporary password) and emails them the usual welcome mail. People who already
 * have an account keep it. Each person is marked so a second Accept does not repeat this.
 */
async function createAccounts(db: Db, actor: SessionUser, a: Application, siteUrl: string, send: (mails: Mail[]) => Promise<SendResult>) {
  const team = applicantsOf(a);
  const mails: Mail[] = [];
  const result: { email: string; name: string; account: "created" | "existing" }[] = [];
  const members: Applicant[] = [];
  for (const p of team) {
    if (p.userId) {
      members.push(p);
      continue;
    }
    try {
      const { user, temporaryPassword } = await createUser(db, actor, { email: p.email, name: p.name, title: ACCOUNT_TITLES[a.program] ?? null, role: "member" });
      mails.push(renderAccountMail({ name: user.name, email: user.email }, temporaryPassword, siteUrl, "welcome"));
      members.push({ ...p, userId: user.id, account: "created" });
      result.push({ email: p.email, name: p.name, account: "created" });
    } catch (e) {
      if (!(e instanceof AppError && e.code === "conflict")) throw e;
      const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, p.email));
      members.push({ ...p, userId: u?.id ?? null, account: "existing" });
      result.push({ email: p.email, name: p.name, account: "existing" });
    }
  }
  const sent = mails.length ? await send(mails) : { sent: 0, saved: 0 };
  return { members, accounts: result, loginEmails: { sent: sent.sent + sent.saved, of: mails.length, error: sent.error } };
}

/**
 * An admin answers an application: the message is emailed to everyone on it (Reply-To the
 * admin), the status moves to the admin's decision, and the message is kept on the application
 * so other admins see it. Accepting with `createAccounts` also makes their accounts.
 */
export async function replyToApplication(
  db: Db,
  actor: SessionUser | null,
  id: string,
  input: z.infer<typeof applicationReplyInput>,
  opts: { send: (mails: Mail[]) => Promise<SendResult>; siteUrl: string },
) {
  const a = await getApplication(db, actor, id);
  const made = input.status === "accepted" && input.createAccounts ? await createAccounts(db, actor!, a, opts.siteUrl, opts.send) : null;
  const team = applicantsOf(a);
  const result = await opts.send(team.map((p) => renderReplyMail(p, actor!, input, opts.siteUrl)));
  const emailed = result.sent + result.saved > 0;
  const entry: ApplicationReply = { at: new Date().toISOString(), by: actor!.name, status: input.status, message: input.message, emailed };
  const [row] = await db
    .update(applications)
    .set({ status: input.status, replies: [...a.replies, entry], ...(made ? { members: made.members } : {}) })
    .where(eq(applications.id, id))
    .returning();
  return {
    application: row,
    emailed,
    error: emailed ? undefined : (result.error ?? "The email was not sent."),
    accounts: made?.accounts ?? [],
    loginEmails: made?.loginEmails ?? null,
  };
}
