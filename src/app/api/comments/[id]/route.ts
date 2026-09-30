import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getCommentRef, serializeComment } from "@/lib/api/team-content";
import { getTeamAccess } from "@/lib/api/teams";
import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";
import { parseCommentUpdate } from "@/lib/validation/team-content";

async function commentForRequest(request: Request, id: string) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  const reference = getCommentRef(db, id);
  const snapshot = await reference.get();
  if (!snapshot.exists) return jsonError("Comment not found", 404);
  return { session, db, reference, data: serializeComment(snapshot.id, snapshot.data() ?? {}) };
}

function canEdit(access: string | null, authorUid: string, uid: string) { return access === "admin" || Boolean(access && authorUid === uid); }

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await context.params;
  const result = await commentForRequest(request, id);
  if (result instanceof Response) return result;
  if (result.data.targetType !== "task") return jsonError("Legacy comments are read-only.", 410);
  if (!canEdit(await getTeamAccess(result.db, result.session, result.data.teamId), result.data.authorUid, result.session.uid)) return jsonError("Only the author can update this comment", 403);
  let input;
  try { input = parseCommentUpdate(await request.json()); } catch { return jsonError("Invalid comment update", 400); }
  await result.reference.set({ ...input, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  const updated = await result.reference.get();
  return Response.json({ data: serializeComment(updated.id, updated.data() ?? {}) });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const { id } = await context.params;
  const result = await commentForRequest(request, id);
  if (result instanceof Response) return result;
  if (result.data.targetType !== "task") return jsonError("Legacy comments are read-only.", 410);
  if (!canEdit(await getTeamAccess(result.db, result.session, result.data.teamId), result.data.authorUid, result.session.uid)) return jsonError("Only the author can delete this comment", 403);
  await result.reference.delete();
  return Response.json({ data: { id } });
}
