import { getAdminDb } from "@/lib/firebase/admin";
import { getTeamsForSession, isTeamAdmin } from "@/lib/api/teams";
import { getResourcesCollection, serializeResource } from "@/lib/api/team-content";
import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";

export async function GET(request: Request) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  const snapshot = await getResourcesCollection(db).orderBy("updatedAt", "desc").get();
  let data = snapshot.docs.map((document) => serializeResource(document.id, document.data()));
  if (!isTeamAdmin(session)) {
    const teamIds = new Set((await getTeamsForSession(db, session)).map((team) => team.id));
    data = data.filter((resource) => teamIds.has(resource.teamId));
  }
  return Response.json({ data });
}

export async function POST(request: Request) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  return jsonError("Resource links have moved to task comments.", 410);
}
