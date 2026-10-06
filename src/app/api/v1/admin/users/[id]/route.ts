import { route, body } from "@/lib/api/handler";
import { deleteUser, updateUser } from "@/server/services/users";
import { updateUserInput } from "@/server/validation";

export const PATCH = route<{ id: string }>(async ({ db, user, req, params }) => updateUser(db, user, params.id, await body(req, updateUserInput)));
export const DELETE = route<{ id: string }>(async ({ db, user, params }) => {
  await deleteUser(db, user, params.id);
  return { ok: true };
});
