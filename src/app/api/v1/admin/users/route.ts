import { route, body } from "@/lib/api/handler";
import { createUser, listUsers } from "@/server/services/users";
import { createUserInput } from "@/server/validation";

export const GET = route(async ({ db, user }) => listUsers(db, user));
export const POST = route(async ({ db, user, req }) => createUser(db, user, await body(req, createUserInput)));
