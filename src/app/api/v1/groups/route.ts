import { route } from "@/lib/api/handler";
import { listGroups } from "@/server/services/groups";

export const GET = route(async ({ db, user }) => listGroups(db, user));
