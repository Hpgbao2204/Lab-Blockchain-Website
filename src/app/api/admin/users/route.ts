import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { isAuthError, jsonError, requireAdmin } from "@/lib/api/auth";
import { sendAccountInvitation } from "@/lib/email/notifications";
import { parseUserProvision } from "@/lib/validation/users";

function getServicesOrError() {
  const db = getAdminDb();
  const auth = getAdminAuth();
  if (!db || !auth) {
    return jsonError("Firebase Admin is not configured", 503);
  }
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

async function sendInvitation(auth: NonNullable<ReturnType<typeof getAdminAuth>>, email: string) {
  const continueUrl = siteUrl();
  const resetLink = await auth.generatePasswordResetLink(email, continueUrl ? { url: continueUrl } : undefined);
  return sendAccountInvitation({ email, resetLink });
}

async function memberIsLinked(db: NonNullable<ReturnType<typeof getAdminDb>>, memberId: string) {
  const existing = await db.collection("users").where("memberId", "==", memberId).limit(1).get();
  return !existing.empty;
}

export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;

  const services = getServicesOrError();
  if (services instanceof Response) return services;

  const snapshot = await services.db.collection("users").orderBy("email", "asc").get();
  const data = snapshot.docs.map((doc) => ({ id: doc.id, uid: doc.id, ...doc.data() }));
  return Response.json({ data });
}

export async function POST(request: Request) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid account provision input", 400);
  }

  let input;
  try {
    input = parseUserProvision(body);
  } catch {
    return jsonError("Invalid account provision input", 400);
  }

  const services = getServicesOrError();
  if (services instanceof Response) return services;

  let memberId = input.memberId;
  let createdMemberId: string | null = null;

  if (memberId) {
    const member = await services.db.collection("members").doc(memberId).get();
    if (!member.exists) return jsonError("Member profile was not found", 404);
  } else if (input.member) {
    const duplicateSlug = await services.db.collection("members").where("slug", "==", input.member.slug).limit(1).get();
    if (!duplicateSlug.empty) return jsonError("Member slug is already in use", 409);
    const memberRef = services.db.collection("members").doc();
    memberId = memberRef.id;
    createdMemberId = memberRef.id;
  }

  if (!memberId) return jsonError("Member identity is required", 400);

  // ponytail: two simultaneous admin requests can race this check; use a Firestore transaction if concurrent provisioning becomes common.
  if (await memberIsLinked(services.db, memberId)) {
    return jsonError("Member profile is already linked to an account", 409);
  }

  let authUser;
  try {
    authUser = await services.auth.createUser({
      email: input.email,
      password: `${crypto.randomUUID()}aA1!`,
      disabled: false
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "auth/email-already-exists") {
      return jsonError("An account already exists for this email", 409);
    }
    return jsonError("Unable to create Firebase Auth account", 502);
  }

  try {
    const batch = services.db.batch();
    if (input.member && createdMemberId) {
      batch.create(services.db.collection("members").doc(createdMemberId), {
        ...input.member,
        aliases: [],
        researchInterests: [],
        education: [],
        achievements: [],
        links: {},
        order: 9_999,
        isActive: true,
        isPublic: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: session.uid
      });
    }
    batch.create(services.db.collection("users").doc(authUser.uid), {
      uid: authUser.uid,
      email: input.email.toLowerCase(),
      role: "member",
      status: "active",
      memberId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    await batch.commit();
  } catch {
    await services.auth.deleteUser(authUser.uid).catch(() => undefined);
    return jsonError("Unable to link account to the member profile", 502);
  }

  let invitationSent = false;
  try {
    invitationSent = (await sendInvitation(services.auth, input.email)).ok;
  } catch {
    invitationSent = false;
  }

  return Response.json(
    { data: { uid: authUser.uid, email: input.email.toLowerCase(), memberId, invitationSent } },
    { status: 201 }
  );
}
