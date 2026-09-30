import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getTeamRef, getTeamsCollection, hasLinkedProfiles, serializeTeam } from "@/lib/api/teams";
import { isAuthError, jsonError, requireAdmin } from "@/lib/api/auth";
import { parseTeamInput, parseTeamUpdate } from "@/lib/validation/teams";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);

  const { id } = await context.params;
  const reference = getTeamRef(db, id);
  const current = await reference.get();
  if (!current.exists) return jsonError("Team not found", 404);

  let update;
  try {
    update = parseTeamUpdate(await request.json());
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid team update", 400);
  }

  const existing = serializeTeam(id, current.data() ?? {});
  let merged;
  try {
    merged = parseTeamInput({
      name: update.name ?? existing.name,
      slug: update.slug ?? existing.slug,
      description: update.description ?? existing.description,
      memberIds: update.memberIds ?? existing.memberIds,
      isActive: update.isActive ?? existing.isActive
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid team update", 400);
  }
  if (!(await hasLinkedProfiles(db, merged.memberIds))) {
    return jsonError("Every wall member must have an active linked account", 400);
  }
  if (merged.slug !== String(current.data()?.slug ?? "") && !(await getTeamsCollection(db).where("slug", "==", merged.slug).limit(1).get()).empty) {
    return jsonError("Team slug is already in use", 409);
  }

  await reference.set({ ...merged, updatedAt: FieldValue.serverTimestamp(), updatedBy: session.uid }, { merge: true });
  const updated = await reference.get();
  return Response.json({ data: serializeTeam(updated.id, updated.data() ?? {}) });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);

  const { id } = await context.params;
  const reference = getTeamRef(db, id);
  if (!(await reference.get()).exists) return jsonError("Team not found", 404);
  await reference.set({ isActive: false, updatedAt: FieldValue.serverTimestamp(), updatedBy: session.uid }, { merge: true });
  return Response.json({ data: { id } });
}
