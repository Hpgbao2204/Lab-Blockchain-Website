import "server-only";
import type { Db } from "../db/client";
import { sendMails } from "../mail";
import { markEmailed, markReminded, meetingsDueForReminder, recipients, renderAnnouncementMail, renderMeetingMail, type MeetingMailKind, type MeetingView } from "../services/meetings";
import { siteUrl } from "./weekly-digest";
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
