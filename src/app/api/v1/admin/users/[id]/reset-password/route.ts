import { z } from "zod";
import { route } from "@/lib/api/handler";
import { notifyAccount } from "@/server/jobs/notify";
import { resetPassword } from "@/server/services/users";

const input = z.object({ notify: z.boolean().default(true) });

/** New temporary password; `notify` (default true) emails it to the account's address. */
export const POST = route<{ id: string }>(async ({ db, user, params, req }) => {
  const { notify } = input.parse(await req.json().catch(() => ({})));
  const reset = await resetPassword(db, user, params.id);
  const email = notify ? await notifyAccount(reset.user, reset.temporaryPassword, "reset") : null;
  return { ...reset, email };
});
