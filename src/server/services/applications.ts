import { and, count, desc, eq } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { applications, users, type Application, type ApplicationReply } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { Mail, SendResult } from "../mail";
import type { applicationInput, applicationReplyInput, applicationUpdateInput } from "../validation";
import { requireAdmin } from "./users";
import { button, esc, shell } from "./meetings";
import { formatStamp } from "@/lib/weeks";
import { zaloLink } from "@/lib/contact";

export type { Application };
type ApplicationInput = z.infer<typeof applicationInput>;

/**
 * Anyone may apply from /join; no account needed. The route rate-limits per address, and a
 * filled-in honeypot field is accepted silently but not stored.
 */
export async function submitApplication(db: Db, input: ApplicationInput): Promise<Application | null> {
  if (input.website) return null;
  const [row] = await db
    .insert(applications)
    .values({
      name: input.name,
      email: input.email,
      program: input.program,
      studentId: input.studentId ?? null,
      interests: [...new Set(input.interests)],
      message: input.message,
      link: input.link ?? null,
      facebook: input.facebook ?? null,
      zalo: input.zalo ?? null,
    })
    .returning();
  return row;
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

export function renderApplicationMail(a: Application, to: { email: string }, siteUrl: string): Mail {
  const subject = `[Blockchainist] New application: ${a.name} (${a.program})`;
  const facts: [string, string | null][] = [
    ["Email", a.email],
    ["Program", a.program],
    ["Student ID", a.studentId],
    ["Interests", a.interests.join(", ") || null],
    ["Link", a.link],
    ["Facebook", a.facebook],
    ["Zalo", a.zalo],
    ["Sent", formatStamp(a.createdAt)],
  ];
  const text = [
    `New application from ${a.name}`,
    "",
    ...facts.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    "",
    a.message,
    "",
    `Accept, decline or answer on the site: ${siteUrl}/admin/applications`,
    `Or reply to this email to write to ${a.name} directly.`,
  ].join("\n");
  const html = shell(
    `<p style="font:700 20px/1.2 Arial,sans-serif">New application from ${esc(a.name)}</p>` +
      `<table style="font:14px Arial,sans-serif;border-collapse:collapse">${facts
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#555">${k}</td><td style="padding:2px 0">${factHtml(k, v!)}</td></tr>`)
        .join("")}</table>` +
      `<div style="margin-top:12px;padding:14px 16px;border:2px solid #16140f;border-radius:12px;background:#fff"><p style="margin:0;white-space:pre-line">${esc(a.message)}</p></div>` +
      `<p style="margin-top:20px">${button(`${siteUrl}/admin/applications`, "Accept, decline or answer")}</p>` +
      `<p style="font:13px Arial,sans-serif;color:#555">Or press Reply in your mail app to write to ${esc(a.name)} directly.</p>`,
    "Blockchainist lab · sent to admins when someone applies on /join",
  );
  return { to: to.email, subject, text, html, replyTo: a.email };
}

const factHtml = (k: string, v: string) => {
  const href = k === "Email" ? `mailto:${v}` : k === "Zalo" ? zaloLink(v) : k === "Link" || k === "Facebook" ? v : null;
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
export function renderReplyMail(a: Application, from: { name: string; email: string }, reply: { status: ApplicationReply["status"]; message: string }): Mail {
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
      `<div style="margin:12px 0;padding:14px 16px;border:2px solid #16140f;border-radius:12px;background:#fff"><p style="margin:0;font:15px/1.6 Arial,sans-serif;white-space:pre-line">${esc(reply.message)}</p></div>` +
      `<p style="font:15px/1.5 Arial,sans-serif;margin:0"><b>${esc(from.name)}</b><br>Nhóm nghiên cứu Blockchainist, UIT – VNU-HCM</p>`,
    `Trả lời email này để liên hệ trực tiếp với ${esc(from.name)}. Bạn nhận được email vì đã gửi đơn ứng tuyển trên blockchainist.id.vn.`,
  );
  return { to: a.email, subject, text, html, replyTo: from.email };
}

/**
 * An admin answers an applicant: the message is emailed (Reply-To the admin), the status moves to
 * the admin's decision, and the message is kept on the application so other admins see it.
 */
export async function replyToApplication(
  db: Db,
  actor: SessionUser | null,
  id: string,
  input: z.infer<typeof applicationReplyInput>,
  send: (mail: Mail) => Promise<SendResult>,
) {
  const a = await getApplication(db, actor, id);
  const result = await send(renderReplyMail(a, actor!, input));
  const emailed = result.sent + result.saved > 0;
  const entry: ApplicationReply = { at: new Date().toISOString(), by: actor!.name, status: input.status, message: input.message, emailed };
  const [row] = await db
    .update(applications)
    .set({ status: input.status, replies: [...a.replies, entry] })
    .where(eq(applications.id, id))
    .returning();
  return { application: row, emailed, error: emailed ? undefined : (result.error ?? "The email was not sent.") };
}
