import { route, body } from "@/lib/api/handler";
import { getStorage } from "@/server/storage";
import { deleteTask, updateTask } from "@/server/services/wall";
import { taskPatch } from "@/server/validation";

export const PATCH = route<{ id: string }>(async ({ db, user, req, params }) => updateTask(db, user, params.id, await body(req, taskPatch)));
export const DELETE = route<{ id: string }>(async ({ db, user, params }) => {
  await deleteTask(db, user, params.id, getStorage());
  return { ok: true };
});
