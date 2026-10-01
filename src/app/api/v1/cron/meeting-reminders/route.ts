import { ok } from "@/lib/api/respond";
import { labToday } from "@/lib/weeks";
import { checkCron } from "@/server/cron-auth";
import { getDb } from "@/server/db";
import { runMeetingReminders } from "@/server/jobs/notify";

export const dynamic = "force-dynamic";

/** Daily at 07:00 Vietnam time (see vercel.json): reminds everyone about meetings happening today. */
export async function GET(req: Request) {
  const denied = checkCron(req);
  if (denied) return denied;
  return ok(await runMeetingReminders(await getDb(), labToday()), undefined, { cache: false });
}
