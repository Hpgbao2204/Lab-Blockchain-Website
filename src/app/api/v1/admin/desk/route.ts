import { after } from "next/server";
import { route } from "@/lib/api/handler";
import { labToday } from "@/lib/weeks";
import { aiFromEnv } from "@/server/desk/ai";
import { deskStatus, runDesk } from "@/server/desk/desk";
import { requireAdmin } from "@/server/services/users";

export const maxDuration = 300;

/** Admin: recent desk runs, per-feed counts and the latest feed items. */
export const GET = route(async ({ db, user }) => {
  requireAdmin(user);
  return { ai: aiFromEnv()?.label ?? null, ...(await deskStatus(db)) };
});

/**
 * Admin: fetch the feeds and write a post now, even if one was written today. The work (several
 * AI calls) can take minutes, longer than the proxy in front of the site waits (Cloudflare cuts
 * at 100 s with a 524), so it runs after the response; the page polls GET for the new run.
 */
export const POST = route(async ({ db, user }) => {
  requireAdmin(user);
  const startedAt = new Date().toISOString();
  after(async () => {
    try {
      await runDesk(db, { ai: aiFromEnv(), today: labToday(), trigger: "manual", force: true });
    } catch (e) {
      console.error("daily desk (manual) failed", e);
    }
  });
  return { startedAt };
});
