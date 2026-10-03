import { and, count, desc, eq } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { applications, users, type Application } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { Mail } from "../mail";
import type { applicationInput, applicationUpdateInput } from "../validation";
import { requireAdmin } from "./users";
import { button, esc, shell } from "./meetings";
import { formatStamp } from "@/lib/weeks";

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
    ["Sent", formatStamp(a.createdAt)],
  ];
  const text = [
    `New application from ${a.name}`,
    "",
    ...facts.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    "",
    a.message,
    "",
    `All applications: ${siteUrl}/admin/applications`,
  ].join("\n");
  const html = shell(
    `<p style="font:700 20px/1.2 Arial,sans-serif">New application from ${esc(a.name)}</p>` +
      `<table style="font:14px Arial,sans-serif;border-collapse:collapse">${facts
        .filter(([, v]) => v)
        .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#555">${k}</td><td style="padding:2px 0">${esc(v!)}</td></tr>`)
        .join("")}</table>` +
      `<div style="margin-top:12px;padding:14px 16px;border:2px solid #16140f;border-radius:12px;background:#fff"><p style="margin:0;white-space:pre-line">${esc(a.message)}</p></div>` +
      `<p style="margin-top:20px">${button(`${siteUrl}/admin/applications`, "Open applications")}</p>`,
    "Blockchainist lab · sent to admins when someone applies on /join",
  );
  return { to: to.email, subject, text, html };
}
