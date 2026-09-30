import { getAdminDb } from "@/lib/firebase/admin";
import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";
import { getProgressUpdatesCollection, serializeProgressUpdate } from "@/lib/api/progress";
import { getTeamsForSession } from "@/lib/api/teams";

export async function GET(request: Request) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  const snapshot = await getProgressUpdatesCollection(db).orderBy("updatedAt", "desc").get();
  let data = snapshot.docs.map((doc) => serializeProgressUpdate(doc.id, doc.data())).filter((update) => Boolean(update.teamId && update.taskId));
  if (session.role === "member") {
    if (!session.memberId) return jsonError("Member identity is required", 403);
    const teamIds = new Set((await getTeamsForSession(db, session)).map((team) => team.id));
    data = data.filter((update) => Boolean(update.teamId && teamIds.has(update.teamId)));
  }
  return Response.json({ data, session: { role: session.role, memberId: session.memberId } });
}

export async function POST(request: Request) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  return jsonError("Progress updates have moved to task comments.", 410);
}
