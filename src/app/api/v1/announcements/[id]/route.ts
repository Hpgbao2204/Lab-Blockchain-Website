import { route } from "@/lib/api/handler";
import { deleteAnnouncement } from "@/server/services/meetings";

export const DELETE = route<{ id: string }>(async ({ db, user, params }) => {
  await deleteAnnouncement(db, user, params.id);
  return { ok: true };
});
