import "server-only";
import { eq } from "drizzle-orm";
import { users, type NewsItem } from "../db/schema";
import { renderReviewMail, renderSubmittedMail, type NewsKind } from "../services/news";
import type { Db } from "../db/client";
import { sendMails } from "../mail";
import { markEmailed, markReminded, meetingsDueForReminder, recipients, renderAnnouncementMail, renderMeetingMail, type MeetingMailKind, type MeetingView } from "../services/meetings";
import { siteUrl } from "./weekly-digest";
import { renderAccountMail, type AccountMailKind } from "../services/account-mail";
import { adminRecipients, renderApplicationMail, type Application } from "../services/applications";

/** Emails every active member about a meeting (new, changed, or the day-of reminder). */
export async function notifyMeeting(db: Db, meeting: MeetingView, kind: MeetingMailKind) {
  const people = await recipients(db);
  const result = await sendMails(people.map((p) => renderMeetingMail(meeting, p, siteUrl(), kind)));
  return { recipients: people.length, ...result };
}

export async function notifyAnnouncement(db: Db, a: { id: string; title: string; body: string }, author: string) {
  const people = await recipients(db);
  const result = await sendMails(people.map((p) => renderAnnouncementMail({ ...a, author }, p, siteUrl())));
  if (result.sent || result.saved) await markEmailed(db, a.id);
  return { recipients: people.length, ...result };
}

/** Daily job: on the morning of each meeting, remind everyone (and the presenters that it is their turn). */
export async function runMeetingReminders(db: Db, today: string) {
  const due = await meetingsDueForReminder(db, today);
  const results = [];
  for (const m of due) {
    const r = await notifyMeeting(db, m, "reminder");
    if (r.sent || r.saved) await markReminded(db, m.id);
    results.push({ meeting: m.title, ...r });
  }
  return { today, meetings: results.length, results };
}

/** Tells the admins about a new application from the Join form. */
export async function notifyApplication(db: Db, application: Application) {
  const admins = await adminRecipients(db);
  return sendMails(admins.map((a) => renderApplicationMail(application, a, siteUrl())));
}

/** Emails a new or reset account its login details. */
export async function notifyAccount(to: { name: string; email: string }, password: string, kind: AccountMailKind) {
  return sendMails([renderAccountMail(to, password, siteUrl(), kind)]);
}

/** Tells the admins a member submitted a post for review. */
export async function notifyPostSubmitted(db: Db, post: { title: string; summary: string; kind: NewsKind }, author: string) {
  const admins = await adminRecipients(db);
  return sendMails(admins.map((a) => renderSubmittedMail(post, author, a, siteUrl())));
}

/** Tells the author their post was approved or sent back (not when admins review their own). */
export async function notifyPostReviewed(db: Db, post: NewsItem, reviewerName: string) {
  if (!post.authorId || post.authorId === post.reviewedBy) return { sent: 0, saved: 0 };
  const [author] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, post.authorId));
  if (!author) return { sent: 0, saved: 0 };
  return sendMails([renderReviewMail(post, author, reviewerName, siteUrl())]);
}
