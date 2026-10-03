import { body, route } from "@/lib/api/handler";
import { deleteApplication, updateApplication } from "@/server/services/applications";
import { applicationUpdateInput } from "@/server/validation";

/** Admin: set the status (new, contacted, accepted, declined) or a private note. */
export const PATCH = route<{ id: string }>(async ({ db, user, req, params }) => updateApplication(db, user, params.id, await body(req, applicationUpdateInput)));

export const DELETE = route<{ id: string }>(async ({ db, user, params }) => {
  await deleteApplication(db, user, params.id);
  return { ok: true };
});
