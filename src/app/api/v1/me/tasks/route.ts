import { route } from "@/lib/api/handler";
import { myOpenTasks } from "@/server/services/wall";

export const GET = route(async ({ db, user }) => myOpenTasks(db, user));
