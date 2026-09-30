import { route, body } from "@/lib/api/handler";
import { createPost, listPosts } from "@/server/services/wall";
import { postInput } from "@/server/validation";

export const GET = route<{ id: string }>(async ({ db, user, params }) => listPosts(db, user, params.id));
export const POST = route<{ id: string }>(async ({ db, user, req, params }) => createPost(db, user, params.id, await body(req, postInput)));
