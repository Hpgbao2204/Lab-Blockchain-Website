import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { bootstrapAdminUser, getUserByUid } from "@/lib/api/users";
import type { User } from "@/types/content";

export type UserSession = {
  uid: string;
  email: string;
  role: User["role"];
  status: User["status"];
  memberId: string | null;
};

export type AdminSession = UserSession;

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export function isAuthError(value: UserSession | Response): value is Response {
  return value instanceof Response;
}

function getOwnerEmail(): string | undefined {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return email || undefined;
}

export async function requireUser(request: Request): Promise<UserSession | Response> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return jsonError("Missing Firebase ID token", 401);
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return jsonError("Missing Firebase ID token", 401);
  }

  const auth = getAdminAuth();
  if (!auth) {
    return jsonError("Firebase Admin is not configured", 503);
  }

  const db = getAdminDb();
  if (!db) {
    return jsonError("Firebase Admin is not configured", 503);
  }

  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(token, true);
  } catch {
    return jsonError("Invalid Firebase ID token", 401);
  }

  const email = decodedToken.email?.trim().toLowerCase();
  if (!email) {
    return jsonError("Email is required", 403);
  }

  const existingUser = await getUserByUid(decodedToken.uid);

  if (existingUser) {
    if (existingUser.status !== "active") {
      return jsonError("Account is not active", 403);
    }
    const ownerEmail = getOwnerEmail();
    if (
      existingUser.role === "admin" ||
      (existingUser.role === "owner" && existingUser.email.toLowerCase() !== ownerEmail)
    ) {
      return jsonError("Access is required", 403);
    }

    return {
      uid: existingUser.uid,
      email: existingUser.email.toLowerCase(),
      role: existingUser.role,
      status: existingUser.status,
      memberId: existingUser.memberId ?? null
    };
  }

  if (decodedToken.email_verified === true && email === getOwnerEmail()) {
    const bootstrapped = await bootstrapAdminUser(decodedToken.uid, email);
    return {
      uid: bootstrapped.uid,
      email: bootstrapped.email,
      role: bootstrapped.role,
      status: bootstrapped.status,
      memberId: bootstrapped.memberId ?? null
    };
  }

  return jsonError("Access is required", 403);
}

export async function requireAdmin(request: Request): Promise<UserSession | Response> {
  const session = await requireUser(request);
  if (isAuthError(session)) {
    return session;
  }

  if (session.role === "owner") {
    return session;
  }

  return jsonError("Admin access is required", 403);
}

export async function requireMemberOwnership(
  request: Request,
  memberId: string
): Promise<UserSession | Response> {
  const session = await requireUser(request);
  if (isAuthError(session)) {
    return session;
  }

  if (session.role === "owner") {
    return session;
  }

  if (session.role === "member" && session.memberId === memberId) {
    return session;
  }

  return jsonError("Access to this member record is required", 403);
}

export async function requireAnyOfRoles(
  request: Request,
  allowedRoles: User["role"][]
): Promise<UserSession | Response> {
  const session = await requireUser(request);
  if (isAuthError(session)) {
    return session;
  }

  if (allowedRoles.includes(session.role)) {
    return session;
  }

  return jsonError("Access is required", 403);
}
