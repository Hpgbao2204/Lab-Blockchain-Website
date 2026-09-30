import { route } from "@/lib/api/handler";
import { deleteLink } from "@/server/services/links";

export const DELETE = route<{ id: string }>(async ({ db, user, params }) => {
  await deleteLink(db, user, params.id);
  return { ok: true };
});
