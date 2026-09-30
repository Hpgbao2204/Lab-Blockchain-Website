import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import type { Db } from "../db/client";
import { sessions, users, type User } from "../db/schema";

export const SESSION_COOKIE = "bc_session";
export const SESSION_DAYS = 14;

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(db: Db, userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(sessions).values({ id: digest(token), userId, expiresAt });
  // opportunistic cleanup
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  return { token, expiresAt };
}

export type SessionUser = Pick<User, "id" | "email" | "name" | "title" | "role" | "mustChangePassword">;

export async function userFromToken(db: Db, token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name, title: users.title, role: users.role, mustChangePassword: users.mustChangePassword, active: users.active })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, digest(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.active) return null;
  return { id: row.id, email: row.email, name: row.name, title: row.title, role: row.role, mustChangePassword: row.mustChangePassword };
}

export async function deleteSession(db: Db, token: string) {
  await db.delete(sessions).where(eq(sessions.id, digest(token)));
}

export async function deleteUserSessions(db: Db, userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
