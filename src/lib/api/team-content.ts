import type { Firestore } from "firebase-admin/firestore";
import type { TeamComment, TeamResource } from "@/types/content";

type RawRecord = Record<string, unknown>;

function timestamp(value: unknown): string | undefined {
  if (value && typeof value === "object" && "toDate" in value) return (value as { toDate?: () => Date }).toDate?.().toISOString();
  return typeof value === "string" ? value : undefined;
}

export function serializeResource(id: string, data: RawRecord): TeamResource {
  return {
    id,
    teamId: String(data.teamId ?? ""),
    title: String(data.title ?? ""),
    url: String(data.url ?? ""),
    note: data.note ? String(data.note) : undefined,
    taskId: data.taskId ? String(data.taskId) : undefined,
    progressId: data.progressId ? String(data.progressId) : undefined,
    authorUid: String(data.authorUid ?? ""),
    authorMemberId: data.authorMemberId ? String(data.authorMemberId) : undefined,
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt)
  };
}

export function serializeComment(id: string, data: RawRecord): TeamComment {
  return {
    id,
    teamId: String(data.teamId ?? ""),
    targetType: data.targetType as TeamComment["targetType"],
    targetId: String(data.targetId ?? ""),
    body: String(data.body ?? ""),
    authorUid: String(data.authorUid ?? ""),
    authorMemberId: data.authorMemberId ? String(data.authorMemberId) : undefined,
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt)
  };
}

export function getResourcesCollection(db: Firestore) { return db.collection("resources"); }
export function getResourceRef(db: Firestore, id: string) { return getResourcesCollection(db).doc(id); }
export function getCommentsCollection(db: Firestore) { return db.collection("comments"); }
export function getCommentRef(db: Firestore, id: string) { return getCommentsCollection(db).doc(id); }
