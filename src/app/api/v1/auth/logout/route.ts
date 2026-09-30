import { cookies } from "next/headers";
import { route } from "@/lib/api/handler";
import { clearSessionCookie } from "@/server/auth/current";
import { deleteSession, SESSION_COOKIE } from "@/server/auth/sessions";

export const POST = route(
  async ({ db }) => {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) await deleteSession(db, token);
    await clearSessionCookie();
    return { ok: true };
  },
  { allowPasswordChange: true },
);
