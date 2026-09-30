import type { Firestore } from "firebase-admin/firestore";
import type { UserSession } from "@/lib/api/auth";
import { getTeamsForSession, isTeamAdmin } from "@/lib/api/teams";
import type { Task } from "@/types/content";

type RawRecord = Record<string, unknown>;

function timestamp(value: unknown): string | undefined {
  if (value && typeof value === "object" && "toDate" in value) return (value as { toDate?: () => Date }).toDate?.().toISOString();
  return typeof value === "string" ? value : undefined;
}

export function serializeTask(id: string, data: RawRecord): Task {
  const rawStatus = String(data.status ?? "not_started");
  const status = rawStatus === "blocked"
    ? "blocked"
    : rawStatus === "submitted" || rawStatus === "accepted" || rawStatus === "completed"
      ? "completed"
      : "in_progress";
  return {
    id,
    teamId: String(data.teamId ?? ""),
    title: String(data.title ?? ""),
    description: data.description ? String(data.description) : undefined,
    status,
    targetDate: data.targetDate ? String(data.targetDate) : undefined,
    assigneeMemberIds: Array.isArray(data.assigneeMemberIds) ? data.assigneeMemberIds.map(String) : [],
    likedByUids: Array.isArray(data.likedByUids) ? data.likedByUids.map(String) : [],
    submittedAt: timestamp(data.submittedAt),
    submittedBy: data.submittedBy ? String(data.submittedBy) : undefined,
    reviewedAt: timestamp(data.reviewedAt),
    reviewedBy: data.reviewedBy ? String(data.reviewedBy) : undefined,
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt),
    updatedBy: data.updatedBy ? String(data.updatedBy) : undefined
  };
}

export function getTasksCollection(db: Firestore) {
  return db.collection("tasks");
}

export function getTaskRef(db: Firestore, id: string) {
  return getTasksCollection(db).doc(id);
}

export async function getTasksForSession(db: Firestore, session: UserSession): Promise<Task[]> {
  const snapshot = await getTasksCollection(db).orderBy("updatedAt", "desc").get();
  const tasks = snapshot.docs.map((document) => serializeTask(document.id, document.data()));
  if (isTeamAdmin(session)) return tasks;
  const teamIds = new Set((await getTeamsForSession(db, session)).map((team) => team.id));
  return tasks.filter((task) => teamIds.has(task.teamId));
}
