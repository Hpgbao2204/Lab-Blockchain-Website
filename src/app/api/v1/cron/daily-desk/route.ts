import { ok } from "@/lib/api/respond";
import { labToday } from "@/lib/weeks";
import { checkCron } from "@/server/cron-auth";
import { getDb } from "@/server/db";
import { aiFromEnv } from "@/server/desk/ai";
import { runDesk } from "@/server/desk/desk";

export const dynamic = "force-dynamic";
/** Fetching ten feeds and three AI calls fit in the Hobby plan's 5 minutes. */
export const maxDuration = 300;

/** Daily at 06:00 Vietnam time (see vercel.json): reads the feeds and drafts one post for review. */
export async function GET(req: Request) {
  const denied = checkCron(req);
  if (denied) return denied;
  return ok(await runDesk(await getDb(), { ai: aiFromEnv(), today: labToday() }), undefined, { cache: false });
}
