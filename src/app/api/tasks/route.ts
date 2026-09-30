import { getAdminDb } from "@/lib/firebase/admin";
import { getTasksForSession } from "@/lib/api/tasks";
import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";

export async function GET(request: Request) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  return Response.json({ data: await getTasksForSession(db, session) });
}
