import { route, body } from "@/lib/api/handler";
import { updateUser } from "@/server/services/users";
import { updateUserInput } from "@/server/validation";

export const PATCH = route<{ id: string }>(async ({ db, user, req, params }) => updateUser(db, user, params.id, await body(req, updateUserInput)));
