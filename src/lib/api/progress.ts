import type { Firestore } from "firebase-admin/firestore";
import type { ProgressUpdate } from "@/types/content";

type RawRecord = Record<string, unknown>;

function serializeTimestamp(value: unknown): string | undefined {
  if (value && typeof value === "object" && "toDate" in value) {
    const maybeTimestamp = value as { toDate?: () => Date };
    return maybeTimestamp.toDate?.().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

export function serializeProgressUpdate(id: string, data: RawRecord): ProgressUpdate {
  return {
    id,
    memberId: String(data.memberId ?? ""),
    title: String(data.title ?? ""),
    status: data.status as ProgressUpdate["status"],
    goals: data.goals ? String(data.goals) : undefined,
    note: data.note ? String(data.note) : undefined,
    targetDate: data.targetDate ? String(data.targetDate) : undefined,
    teamId: data.teamId ? String(data.teamId) : undefined,
    taskId: data.taskId ? String(data.taskId) : undefined,
    links: Array.isArray(data.links) ? data.links.map(String) : [],
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.map(String) : [],
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    updatedBy: data.updatedBy ? String(data.updatedBy) : undefined
  };
}

export function getProgressUpdateRef(db: Firestore, id: string) {
  return db.collection("progressUpdates").doc(id);
}

export function getProgressUpdatesCollection(db: Firestore) {
  return db.collection("progressUpdates");
}
