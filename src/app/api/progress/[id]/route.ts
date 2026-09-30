import { getAdminDb } from "@/lib/firebase/admin";
import { isAuthError, jsonError, requireUser, type UserSession } from "@/lib/api/auth";
import { getProgressUpdateRef, serializeProgressUpdate } from "@/lib/api/progress";
import { getTeamAccess } from "@/lib/api/teams";

async function getProgressUpdate(id: string) {
  const db = getAdminDb();
  if (!db) return { error: jsonError("Firebase Admin is not configured", 503) };
  const ref = getProgressUpdateRef(db, id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return { error: jsonError("Progress update not found", 404) };
  return { db, data: snapshot.data() as Record<string, unknown> };
}

async function canRead(session: UserSession, db: NonNullable<ReturnType<typeof getAdminDb>>, data: Record<string, unknown>) {
  if (session.role === "owner") return true;
  if (data.memberId === session.memberId) return true;
  return typeof data.teamId === "string" && Boolean(await getTeamAccess(db, session, data.teamId));
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const { id } = await context.params;
  const result = await getProgressUpdate(id);
  if (result.error) return result.error;
  if (!(await canRead(session, result.db, result.data))) return jsonError("Access to this progress update is required", 403);
  return Response.json({ data: serializeProgressUpdate(id, result.data) });
}

export async function PATCH(request: Request, _context: { params: Promise<{ id: string }> | { id: string } }) {
  void _context;
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  return jsonError("Progress updates have moved to task comments.", 410);
}

export async function DELETE(request: Request, _context: { params: Promise<{ id: string }> | { id: string } }) {
  void _context;
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  return jsonError("Progress updates have moved to task comments.", 410);
}
