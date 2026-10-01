import { route } from "@/lib/api/handler";
import { presenterRotation } from "@/server/services/meetings";

/** Admin: who presented how often and when last, longest-ago first (to pick the next presenter). */
export const GET = route(async ({ db, user }) => presenterRotation(db, user));
