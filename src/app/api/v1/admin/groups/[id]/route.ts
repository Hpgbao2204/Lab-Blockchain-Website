import { route, body } from "@/lib/api/handler";
import { getStorage } from "@/server/storage";
import { deleteGroup, updateGroup } from "@/server/services/groups";
import { groupPatch } from "@/server/validation";

export const PATCH = route<{ id: string }>(async ({ db, user, req, params }) => updateGroup(db, user, params.id, await body(req, groupPatch)));
export const DELETE = route<{ id: string }>(async ({ db, user, params }) => deleteGroup(db, user, params.id, getStorage()));
