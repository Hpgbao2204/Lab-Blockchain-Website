import { route, body } from "@/lib/api/handler";
import { AppError } from "@/server/errors";
import { changePassword } from "@/server/services/users";
import { changePasswordInput } from "@/server/validation";

export const POST = route(
  async ({ db, user, req }) => {
    if (!user) throw new AppError("unauthorized", "Sign in first.");
    await changePassword(db, user, await body(req, changePasswordInput));
    return { ok: true };
  },
  { allowPasswordChange: true },
);
