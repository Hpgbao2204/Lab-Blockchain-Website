import { route, body } from "@/lib/api/handler";
import { setMembers } from "@/server/services/groups";
import { membersInput } from "@/server/validation";

export const PUT = route<{ id: string }>(async ({ db, user, req, params }) => setMembers(db, user, params.id, await body(req, membersInput)));
