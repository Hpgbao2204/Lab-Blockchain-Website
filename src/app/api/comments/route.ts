import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getTaskRef } from "@/lib/api/tasks";
import { getCommentsCollection, serializeComment } from "@/lib/api/team-content";
import { getTeamAccess, getTeamsForSession, isTeamAdmin } from "@/lib/api/teams";
import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";
import { parseCommentInput } from "@/lib/validation/team-content";

async function targetMatchesTeam(db: NonNullable<ReturnType<typeof getAdminDb>>, input: { teamId: string; targetType: "task" | "progress" | "resource"; targetId: string }) {
  const reference = getTaskRef(db, input.targetId);
  const snapshot = await reference.get();
  return snapshot.exists && snapshot.data()?.teamId === input.teamId;
}

export async function GET(request: Request) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  const snapshot = await getCommentsCollection(db).orderBy("createdAt", "asc").get();
  let data = snapshot.docs.map((document) => serializeComment(document.id, document.data()));
  if (!isTeamAdmin(session)) {
    const teamIds = new Set((await getTeamsForSession(db, session)).map((team) => team.id));
    data = data.filter((comment) => teamIds.has(comment.teamId));
  }
  return Response.json({ data });
}

export async function POST(request: Request) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  let input;
  try { input = parseCommentInput(await request.json()); } catch { return jsonError("Invalid comment input", 400); }
  if (!(await getTeamAccess(db, session, input.teamId))) return jsonError("Access to this team is required", 403);
  if (!(await targetMatchesTeam(db, input))) return jsonError("Comment target is invalid", 400);
  const reference = await getCommentsCollection(db).add({ ...input, authorUid: session.uid, ...(session.memberId ? { authorMemberId: session.memberId } : {}), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  const created = await reference.get();
  return Response.json({ data: serializeComment(created.id, created.data() ?? {}) }, { status: 201 });
}
