import { timingSafeEqual } from "node:crypto";
import { fail, ok } from "@/lib/api/respond";
import { labToday } from "@/lib/weeks";
import { getDb } from "@/server/db";
import { runWeeklyDigest } from "@/server/jobs/weekly-digest";

export const dynamic = "force-dynamic";

/**
 * Called by the scheduler every Monday morning (see vercel.json). Needs
 * `Authorization: Bearer $CRON_SECRET`; `?dryRun=1` builds the emails without sending.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail(503, "not_configured", "CRON_SECRET is not set.");
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return fail(401, "unauthorized", "Bad cron secret.");
  const dryRun = new URL(req.url).searchParams.has("dryRun");
  return ok(await runWeeklyDigest(await getDb(), labToday(), { dryRun }), undefined, { cache: false });
}
