import { body, route } from "@/lib/api/handler";
import { notifyMeeting } from "@/server/jobs/notify";
import { deleteMeeting, updateMeeting } from "@/server/services/meetings";
import { meetingInput } from "@/server/validation";

/** Admin: replace the meeting's details and presenters; `notify` emails everyone about the change. */
export const PATCH = route<{ id: string }>(async ({ db, user, req, params }) => {
  const { notify, ...input } = await body(req, meetingInput);
  const meeting = await updateMeeting(db, user, params.id, input);
  return { meeting, email: notify ? await notifyMeeting(db, meeting, "updated") : null };
});

export const DELETE = route<{ id: string }>(async ({ db, user, params }) => {
  await deleteMeeting(db, user, params.id);
  return { ok: true };
});
