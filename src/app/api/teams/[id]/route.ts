import { getAdminDb } from "@/lib/firebase/admin";
import { getTeamAccess, getTeamRef, serializeTeam } from "@/lib/api/teams";
import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";

export async function GET(request: Request, context: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);

  const { id } = await context.params;
  const snapshot = await getTeamRef(db, id).get();
  if (!snapshot.exists) return jsonError("Team not found", 404);

  if (!(await getTeamAccess(db, session, id))) return jsonError("Access to this team is required", 403);
  return Response.json({ data: serializeTeam(snapshot.id, snapshot.data() ?? {}) });
}
