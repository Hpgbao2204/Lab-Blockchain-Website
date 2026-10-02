import { asc, eq } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { users } from "../db/schema";
import { AppError } from "../errors";
import { hashPassword, temporaryPassword, verifyPassword } from "../auth/password";
import { deleteUserSessions, type SessionUser } from "../auth/sessions";
import type { changePasswordInput, createUserInput, updateUserInput } from "../validation";

export const publicUser = {
  id: users.id,
  email: users.email,
  name: users.name,
  title: users.title,
  role: users.role,
  active: users.active,
  mustChangePassword: users.mustChangePassword,
  createdAt: users.createdAt,
};

export function requireAdmin(actor: SessionUser | null): asserts actor is SessionUser {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
  if (actor.role !== "admin") throw new AppError("forbidden", "Admins only.");
}

export async function authenticate(db: Db, email: string, password: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  // Always run a hash comparison so timing does not reveal whether the email exists.
  const ok = await verifyPassword(password, u?.passwordHash ?? "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  if (!u || !ok || !u.active) throw new AppError("unauthorized", "Email or password is incorrect.");
  return u;
}

export async function changePassword(db: Db, actor: SessionUser, input: z.infer<typeof changePasswordInput>) {
  const [u] = await db.select().from(users).where(eq(users.id, actor.id)).limit(1);
  if (!u || !(await verifyPassword(input.currentPassword, u.passwordHash))) throw new AppError("invalid_input", "Current password is incorrect.");
  if (input.currentPassword === input.newPassword) throw new AppError("invalid_input", "Choose a new password.");
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(input.newPassword), mustChangePassword: false })
    .where(eq(users.id, actor.id));
  // Sign out every device, including any opened with a leaked temporary password; the caller signs this one back in.
  await deleteUserSessions(db, actor.id);
}

export async function listUsers(db: Db, actor: SessionUser | null) {
  requireAdmin(actor);
  return db.select(publicUser).from(users).orderBy(asc(users.name));
}

/** Only admins create accounts. Returns the temporary password once; it is never stored in clear. */
export async function createUser(db: Db, actor: SessionUser | null, input: z.infer<typeof createUserInput>) {
  requireAdmin(actor);
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (exists.length) throw new AppError("conflict", "An account with this email already exists.");
  const password = temporaryPassword();
  const [user] = await db
    .insert(users)
    .values({ email: input.email, name: input.name, title: input.title ?? null, role: input.role, passwordHash: await hashPassword(password), mustChangePassword: true })
    .returning(publicUser);
  return { user, temporaryPassword: password };
}

export async function updateUser(db: Db, actor: SessionUser | null, id: string, input: Partial<z.infer<typeof updateUserInput>>) {
  requireAdmin(actor);
  if (id === actor.id && (input.active === false || input.role === "member")) {
    throw new AppError("invalid_input", "You cannot deactivate or demote your own account.");
  }
  const [user] = await db.update(users).set(input).where(eq(users.id, id)).returning(publicUser);
  if (!user) throw new AppError("not_found", "User not found.");
  if (input.active === false) await deleteUserSessions(db, id);
  return user;
}

export async function resetPassword(db: Db, actor: SessionUser | null, id: string) {
  requireAdmin(actor);
  const password = temporaryPassword();
  const [user] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), mustChangePassword: true })
    .where(eq(users.id, id))
    .returning(publicUser);
  if (!user) throw new AppError("not_found", "User not found.");
  await deleteUserSessions(db, id);
  return { user, temporaryPassword: password };
}

/** First admin (seed script). No-op when an admin already exists. */
export async function ensureAdmin(db: Db, input: { email: string; name: string; password?: string }) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin")).limit(1);
  if (existing) return null;
  const password = input.password ?? temporaryPassword();
  await db.insert(users).values({
    email: input.email.toLowerCase(),
    name: input.name,
    title: "Principal Investigator",
    role: "admin",
    passwordHash: await hashPassword(password),
    mustChangePassword: !input.password,
  });
  return password;
}

/**
 * Lost admin password (deploy script, ADMIN_RESET=1): gives the admin with this email, or else
 * the first admin, a temporary password, reactivates it and signs it out everywhere.
 */
export async function recoverAdmin(db: Db, email?: string) {
  const admins = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.role, "admin")).orderBy(asc(users.createdAt));
  const admin = admins.find((a) => a.email === email?.toLowerCase()) ?? admins[0];
  if (!admin) return null;
  const password = temporaryPassword();
  await db.update(users).set({ passwordHash: await hashPassword(password), mustChangePassword: true, active: true }).where(eq(users.id, admin.id));
  await deleteUserSessions(db, admin.id);
  return { email: admin.email, password };
}
