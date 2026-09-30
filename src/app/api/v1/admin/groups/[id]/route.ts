import { route, body } from "@/lib/api/handler";
import { updateGroup } from "@/server/services/groups";
import { groupPatch } from "@/server/validation";

export const PATCH = route<{ id: string }>(async ({ db, user, req, params }) => updateGroup(db, user, params.id, await body(req, groupPatch)));
