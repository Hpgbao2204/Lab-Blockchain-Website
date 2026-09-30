import { route, body } from "@/lib/api/handler";
import { setSessionCookie } from "@/server/auth/current";
import { rateLimit, resetRateLimit } from "@/server/auth/rate-limit";
import { createSession } from "@/server/auth/sessions";
import { AppError } from "@/server/errors";
import { authenticate } from "@/server/services/users";
import { loginInput } from "@/server/validation";

export const POST = route(
  async ({ db, req }) => {
    const input = await body(req, loginInput);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
    const key = `login:${ip}:${input.email}`;
    if (!rateLimit(key)) throw new AppError("rate_limited", "Too many attempts. Try again in a few minutes.");
    const user = await authenticate(db, input.email, input.password);
    resetRateLimit(key);
    const { token } = await createSession(db, user.id);
    await setSessionCookie(token);
    return { id: user.id, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword };
  },
  { allowPasswordChange: true },
);
