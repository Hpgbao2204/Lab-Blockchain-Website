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

/** Admin: fetch the feeds and write a post now, even if one was written today. */
export const POST = route(async ({ db, user }) => {
  requireAdmin(user);
  return runDesk(db, { ai: aiFromEnv(), today: labToday(), trigger: "manual", force: true });
});
