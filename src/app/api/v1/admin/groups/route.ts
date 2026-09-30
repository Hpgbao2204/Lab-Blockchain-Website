import { route, body } from "@/lib/api/handler";
import { createGroup, listGroups } from "@/server/services/groups";
import { requireAdmin } from "@/server/services/users";
import { groupInput } from "@/server/validation";

export const GET = route(async ({ db, user }) => {
  requireAdmin(user);
  return listGroups(db, user, { includeArchived: true });
});
export const POST = route(async ({ db, user, req }) => createGroup(db, user, await body(req, groupInput)));
