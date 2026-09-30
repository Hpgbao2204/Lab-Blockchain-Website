import { route, body } from "@/lib/api/handler";
import { createLink, listLinks } from "@/server/services/links";
import { linkInput } from "@/server/validation";

export const GET = route<{ id: string }>(async ({ db, user, params }) => listLinks(db, user, params.id));
export const POST = route<{ id: string }>(async ({ db, user, req, params }) => createLink(db, user, params.id, await body(req, linkInput)));
