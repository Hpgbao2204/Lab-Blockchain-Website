import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getTeamsCollection, hasLinkedProfiles, serializeTeam } from "@/lib/api/teams";
import { isAuthError, jsonError, requireAdmin } from "@/lib/api/auth";
import { parseTeamInput } from "@/lib/validation/teams";

export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);

  const snapshot = await getTeamsCollection(db).orderBy("name", "asc").get();
  return Response.json({ data: snapshot.docs.map((document) => serializeTeam(document.id, document.data())) });
}

export async function POST(request: Request) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);

  let input;
  try {
    input = parseTeamInput(await request.json());
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid team input", 400);
  }

  if (!(await hasLinkedProfiles(db, input.memberIds))) {
    return jsonError("Every wall member must have an active linked account", 400);
  }
  if (!(await getTeamsCollection(db).where("slug", "==", input.slug).limit(1).get()).empty) {
    return jsonError("Team slug is already in use", 409);
  }

  const document = await getTeamsCollection(db).add({
    ...input,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: session.uid
  });
  const created = await document.get();
  return Response.json({ data: serializeTeam(created.id, created.data() ?? {}) }, { status: 201 });
}
