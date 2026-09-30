import { route, body } from "@/lib/api/handler";
import { createTask, listTasks } from "@/server/services/wall";
import { taskInput } from "@/server/validation";

export const GET = route<{ id: string }>(async ({ db, user, params }) => listTasks(db, user, params.id));
export const POST = route<{ id: string }>(async ({ db, user, req, params }) => createTask(db, user, params.id, await body(req, taskInput)));
