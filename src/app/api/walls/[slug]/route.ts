import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";
import { getCommentsCollection, serializeComment } from "@/lib/api/team-content";
import { getTasksCollection, serializeTask } from "@/lib/api/tasks";
import { getTeamsForSession, getWallMemberSummaries } from "@/lib/api/teams";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> | { slug: string } }) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const db = getAdminDb();
  if (!db) return jsonError("Firebase Admin is not configured", 503);
  const { slug } = await context.params;
  const wall = (await getTeamsForSession(db, session)).find((team) => team.slug === slug);
  if (!wall) return jsonError("Access to this wall is required", 403);

  const [tasksSnapshot, commentsSnapshot, members] = await Promise.all([
    getTasksCollection(db).orderBy("updatedAt", "desc").get(),
    getCommentsCollection(db).orderBy("createdAt", "asc").get(),
    getWallMemberSummaries(db, wall.memberIds),
  ]);
  const tasks = tasksSnapshot.docs
    .map((document) => serializeTask(document.id, document.data()))
    .filter((task) => task.teamId === wall.id);
  const taskIds = new Set(tasks.map((task) => task.id));
  const comments = commentsSnapshot.docs
    .map((document) => serializeComment(document.id, document.data()))
    .filter((comment) => comment.targetType === "task" && taskIds.has(comment.targetId));

  return Response.json({
    data: {
      wall,
      members,
      tasks,
      comments,
      viewer: { uid: session.uid, role: session.role, memberId: session.memberId },
    },
  });
}
