import { route, body } from "@/lib/api/handler";
import { notifyAccount } from "@/server/jobs/notify";
import { createUser, listUsers } from "@/server/services/users";
import { createUserInput } from "@/server/validation";

export const GET = route(async ({ db, user }) => listUsers(db, user));

/** Creates the account; `notify` (default true) emails the login details to its address. */
export const POST = route(async ({ db, user, req }) => {
  const { notify, ...input } = await body(req, createUserInput);
  const created = await createUser(db, user, input);
  const email = notify ? await notifyAccount(created.user, created.temporaryPassword, "welcome") : null;
  return { ...created, email };
});
