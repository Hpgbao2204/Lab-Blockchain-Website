import { body, route } from "@/lib/api/handler";
import { notifyMeeting } from "@/server/jobs/notify";
import { createMeeting, listMeetings } from "@/server/services/meetings";
import { meetingInput } from "@/server/validation";

/** Lab meetings for any signed-in member. `?when=past` for earlier ones (default: upcoming). */
export const GET = route(async ({ db, user, req }) => {
  const when = new URL(req.url).searchParams.get("when") === "past" ? "past" : "upcoming";
  return listMeetings(db, user, { when });
});

/** Admin: schedule a meeting with its presenters; `notify` (default true) emails every member. */
export const POST = route(async ({ db, user, req }) => {
  const { notify, ...input } = await body(req, meetingInput);
  const meeting = await createMeeting(db, user, input);
  return { meeting, email: notify ? await notifyMeeting(db, meeting, "new") : null };
});
