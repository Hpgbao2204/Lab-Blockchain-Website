import { FieldValue } from "firebase-admin/firestore";
import { getTeamAccess } from "@/lib/api/teams";
import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";
import { getTaskRef, serializeTask } from "@/lib/api/tasks";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  const { id } = await context.params;
  const reference = getTaskRef(db, id);

  const result = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) return { error: "Task not found", status: 404 } as const;
    const data = snapshot.data() ?? {};
    if (!(await getTeamAccess(db, session, String(data.teamId ?? "")))) {
      return { error: "Access to this wall is required", status: 403 } as const;
    }
    const current = Array.isArray(data.likedByUids) ? data.likedByUids.map(String) : [];
    const likedByUids = current.includes(session.uid)
      ? current.filter((uid) => uid !== session.uid)
      : [...current, session.uid];
    transaction.set(reference, { likedByUids, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { likedByUids } as const;
  });

  if ("error" in result) return jsonError(result.error!, result.status!);
  const updated = await reference.get();
  return Response.json({ data: serializeTask(updated.id, updated.data() ?? {}) });
}
