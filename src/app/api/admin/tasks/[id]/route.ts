import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getTaskRef, serializeTask } from "@/lib/api/tasks";
import { isAuthError, jsonError, requireAdmin } from "@/lib/api/auth";
import { parseTaskUpdate } from "@/lib/validation/tasks";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  const { id } = await context.params;
  const reference = getTaskRef(db, id);
  const current = await reference.get();
  if (!current.exists) return jsonError("Task not found", 404);
  let input;
  try {
    input = parseTaskUpdate(await request.json());
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid task update", 400);
  }
  await reference.set({ ...input, updatedAt: FieldValue.serverTimestamp(), updatedBy: session.uid }, { merge: true });
  const updated = await reference.get();
  return Response.json({ data: serializeTask(updated.id, updated.data() ?? {}) });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  const { id } = await context.params;
  const reference = getTaskRef(db, id);
  if (!(await reference.get()).exists) return jsonError("Task not found", 404);
  await reference.delete();
  return Response.json({ data: { id } });
}
