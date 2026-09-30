import { route } from "@/lib/api/handler";
import { labToday } from "@/lib/weeks";
import { mailConfigured } from "@/server/mail";
import { runWeeklyDigest, siteUrl } from "@/server/jobs/weekly-digest";
import { buildDigests, renderDigest } from "@/server/services/digest";
import { requireAdmin } from "@/server/services/users";

/** Preview of this Monday's reminder emails. */
export const GET = route(async ({ db, user }) => {
  requireAdmin(user);
  const today = labToday();
  const digests = await buildDigests(db, today);
  return { today, mailConfigured: mailConfigured(), emails: digests.map((d) => ({ ...renderDigest(d, siteUrl(), today), name: d.name, overdue: d.overdue.length, thisWeek: d.thisWeek.length })) };
});

/** Sends the reminders now (same as the Monday cron). */
export const POST = route(async ({ db, user }) => {
  requireAdmin(user);
  return runWeeklyDigest(db, labToday());
});
