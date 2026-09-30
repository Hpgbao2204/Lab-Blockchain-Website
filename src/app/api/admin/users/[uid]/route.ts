import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { isAuthError, jsonError, requireAdmin } from "@/lib/api/auth";
import { sendPasswordReset } from "@/lib/email/notifications";
import { parseManagedUserUpdate } from "@/lib/validation/users";

function getServicesOrError() {
  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) return jsonError("Firebase Admin is not configured", 503);
  return { db, auth };
}

function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return undefined;
  try {
    return new URL("/portal", value).toString();
  } catch {
    return undefined;
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ uid: string }> | { uid: string } }) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid account update input", 400);
  }

  let input;
  try {
    input = parseManagedUserUpdate(body);
  } catch {
    return jsonError("Invalid account update input", 400);
  }

  const services = getServicesOrError();
  if (services instanceof Response) return services;

  const { uid } = await context.params;
  const userRef = services.db.collection("users").doc(uid);
  const snapshot = await userRef.get();
  if (!snapshot.exists) return jsonError("Account was not found", 404);

  const existing = snapshot.data() as Record<string, unknown>;
  const existingRole = String(existing.role ?? "member");
  const email = String(existing.email ?? "").trim().toLowerCase();
  if (!email) return jsonError("Account email is invalid", 409);

  if (session.uid === uid && input.status === "inactive") {
    return jsonError("You cannot change your own access level", 400);
  }
  if (existingRole === "owner" && session.uid !== uid) {
    return jsonError("The owner account cannot be modified here", 403);
  }

  if (input.memberId !== undefined && input.memberId !== existing.memberId) {
    if (input.memberId) {
      const member = await services.db.collection("members").doc(input.memberId).get();
      if (!member.exists) return jsonError("Member profile was not found", 404);
      const linked = await services.db.collection("users").where("memberId", "==", input.memberId).limit(1).get();
      if (!linked.empty && linked.docs[0].id !== uid) {
        return jsonError("Member profile is already linked to an account", 409);
      }
    }
  }

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (input.status) updates.status = input.status;
  if (input.memberId !== undefined) updates.memberId = input.memberId;

  if (input.status) {
    await services.auth.updateUser(uid, { disabled: input.status === "inactive" });
  }
  await userRef.set(updates, { merge: true });

  let invitationSent: boolean | undefined;
  if (input.sendReset) {
    try {
      const continueUrl = siteUrl();
      const resetLink = await services.auth.generatePasswordResetLink(email, continueUrl ? { url: continueUrl } : undefined);
      invitationSent = (await sendPasswordReset({ email, resetLink })).ok;
    } catch {
      invitationSent = false;
    }
  }

  return Response.json({ data: { uid, ...updates, ...(invitationSent === undefined ? {} : { invitationSent }) } });
}
