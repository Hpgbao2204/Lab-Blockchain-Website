import { body, route } from "@/lib/api/handler";
import { notifyAnnouncement } from "@/server/jobs/notify";
import { createAnnouncement, listAnnouncements } from "@/server/services/meetings";
import { announcementInput } from "@/server/validation";

/** Recent lab-wide announcements, for any signed-in member. */
export const GET = route(async ({ db, user }) => listAnnouncements(db, user, 20));

/** Admin: post to everyone; `notify` (default true) also emails every member. */
export const POST = route(async ({ db, user, req }) => {
  const { notify, ...input } = await body(req, announcementInput);
  const announcement = await createAnnouncement(db, user, input);
  return { announcement, email: notify ? await notifyAnnouncement(db, announcement, user!.name) : null };
});
