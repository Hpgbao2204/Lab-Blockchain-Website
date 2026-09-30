import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getTaskRef, getTasksCollection, serializeTask } from "@/lib/api/tasks";
import { getActiveWallMemberIds, getTeamRef, serializeTeam } from "@/lib/api/teams";
import { isAuthError, jsonError, requireAdmin } from "@/lib/api/auth";
import { parseTaskInput } from "@/lib/validation/tasks";

async function getActiveTaskRecipients(db: NonNullable<ReturnType<typeof getAdminDb>>, teamId: string) {
  const team = await getTeamRef(db, teamId).get();
  if (!team.exists) return null;
  const data = serializeTeam(team.id, team.data() ?? {});
  if (!data.isActive) return null;
  return getActiveWallMemberIds(db, data.memberIds);
}

export async function GET(request: Request) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  const snapshot = await getTasksCollection(db).orderBy("updatedAt", "desc").get();
  return Response.json({ data: snapshot.docs.map((document) => serializeTask(document.id, document.data())) });
}

export async function POST(request: Request) {
  const session = await requireAdmin(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  let input;
  try {
    input = parseTaskInput(await request.json());
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid task input", 400);
  }
  const assigneeMemberIds = await getActiveTaskRecipients(db, input.teamId);
  if (!assigneeMemberIds) return jsonError("Wall không hợp lệ hoặc không còn hoạt động.", 400);
  if (!assigneeMemberIds.length) {
    return jsonError("Wall cần ít nhất một thành viên đang hoạt động có tài khoản trước khi tạo công việc.", 400);
  }
  const reference = await getTasksCollection(db).add({
    ...input,
    assigneeMemberIds,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: session.uid,
  });
  const created = await getTaskRef(db, reference.id).get();
  return Response.json({ data: serializeTask(created.id, created.data() ?? {}) }, { status: 201 });
}
