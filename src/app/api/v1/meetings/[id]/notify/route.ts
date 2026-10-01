import { route } from "@/lib/api/handler";
import { notifyMeeting } from "@/server/jobs/notify";
import { getMeeting } from "@/server/services/meetings";
import { requireAdmin } from "@/server/services/users";

/** Admin: email every member about this meeting again. */
export const POST = route<{ id: string }>(async ({ db, user, params }) => {
  requireAdmin(user);
  return notifyMeeting(db, await getMeeting(db, params.id), "new");
});
