import { route, body } from "@/lib/api/handler";
import { setSessionCookie } from "@/server/auth/current";
import { createSession } from "@/server/auth/sessions";
import { AppError } from "@/server/errors";
import { changePassword } from "@/server/services/users";
import { changePasswordInput } from "@/server/validation";

export const POST = route(
  async ({ db, user, req }) => {
    if (!user) throw new AppError("unauthorized", "Sign in first.");
    await changePassword(db, user, await body(req, changePasswordInput));
    // changePassword revoked all sessions; keep this device signed in with a fresh one.
    const { token } = await createSession(db, user.id);
    await setSessionCookie(token);
    return { ok: true };
  },
  { allowPasswordChange: true },
);
