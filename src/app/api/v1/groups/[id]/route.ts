import { route } from "@/lib/api/handler";
import { getGroup } from "@/server/services/groups";

export const GET = route<{ id: string }>(async ({ db, user, params }) => getGroup(db, user, params.id));
