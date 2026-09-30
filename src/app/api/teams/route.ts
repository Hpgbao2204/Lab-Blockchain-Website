import { getAdminDb } from "@/lib/firebase/admin";
import { getTeamsForSession } from "@/lib/api/teams";
import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";

export async function GET(request: Request) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);

  return Response.json({ data: await getTeamsForSession(db, session) });
}
