import { route, body } from "@/lib/api/handler";
import { addTaskComment, listTaskComments } from "@/server/services/wall";
import { commentInput } from "@/server/validation";

export const GET = route<{ id: string }>(async ({ db, user, params }) => listTaskComments(db, user, params.id));
export const POST = route<{ id: string }>(async ({ db, user, req, params }) => addTaskComment(db, user, params.id, await body(req, commentInput)));
