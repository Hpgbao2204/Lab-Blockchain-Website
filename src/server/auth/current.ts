import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "../db";
import { SESSION_COOKIE, SESSION_DAYS, userFromToken, type SessionUser } from "./sessions";

/** The signed-in user for this request (memoised per render). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return userFromToken(await getDb(), token);
});

/** For pages under /app and /admin. Sends visitors to /login and first-time users to /account/password. */
export async function requirePageUser(opts: { admin?: boolean; allowPasswordChange?: boolean } = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword && !opts.allowPasswordChange) redirect("/account/password");
  if (opts.admin && user.role !== "admin") redirect("/app");
  return user;
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
