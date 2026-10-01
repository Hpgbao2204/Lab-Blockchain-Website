import { ok } from "@/lib/api/respond";
import { labToday } from "@/lib/weeks";
import { checkCron } from "@/server/cron-auth";
import { getDb } from "@/server/db";
import { runWeeklyDigest } from "@/server/jobs/weekly-digest";

export const dynamic = "force-dynamic";

/**
 * Called by the scheduler every Monday morning (see vercel.json). Needs
 * `Authorization: Bearer $CRON_SECRET`; `?dryRun=1` builds the emails without sending.
 */
export async function GET(req: Request) {
  const denied = checkCron(req);
  if (denied) return denied;
  const dryRun = new URL(req.url).searchParams.has("dryRun");
  return ok(await runWeeklyDigest(await getDb(), labToday(), { dryRun }), undefined, { cache: false });
}
