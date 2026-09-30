import { and, asc, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { attachments, comments, groupMembers, groups, links, posts, taskAssignees, tasks, users } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { Storage } from "../storage";
import type { commentInput, postInput, taskInput, taskPatch } from "../validation";
import { groupAccess } from "./groups";
import { detectLinkKind } from "./links";

const author = { id: users.id, name: users.name };

// ---------------------------------------------------------------- posts --

export async function listPosts(db: Db, actor: SessionUser | null, groupId: string) {
  await groupAccess(db, actor, groupId);
  const rows = await db
    .select({ id: posts.id, kind: posts.kind, body: posts.body, pinned: posts.pinned, createdAt: posts.createdAt, author })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(eq(posts.groupId, groupId))
    .orderBy(desc(posts.pinned), desc(posts.createdAt))
    .limit(100);
  return rows;
}

export async function createPost(db: Db, actor: SessionUser | null, groupId: string, input: z.infer<typeof postInput>) {
  const access = await groupAccess(db, actor, groupId);
  if ((input.kind === "announcement" || input.pinned) && !access.canManage) {
    throw new AppError("forbidden", "Only the admin or a group lead can post announcements or pin.");
  }
  const [p] = await db
    .insert(posts)
    .values({ groupId, authorId: actor!.id, kind: input.kind, body: input.body, pinned: input.pinned })
    .returning();
  return p;
}

// ---------------------------------------------------------------- tasks --

async function assigneesOf(db: Db, taskIds: string[]) {
  if (!taskIds.length) return new Map<string, { id: string; name: string }[]>();
  const rows = await db
    .select({ taskId: taskAssignees.taskId, id: users.id, name: users.name })
    .from(taskAssignees)
    .innerJoin(users, eq(users.id, taskAssignees.userId))
    .where(inArray(taskAssignees.taskId, taskIds));
  const map = new Map<string, { id: string; name: string }[]>();
  for (const r of rows) map.set(r.taskId, [...(map.get(r.taskId) ?? []), { id: r.id, name: r.name }]);
  return map;
}

async function commentCounts(db: Db, taskIds: string[]) {
  if (!taskIds.length) return new Map<string, number>();
  const rows = await db.select({ id: comments.taskId, n: count() }).from(comments).where(inArray(comments.taskId, taskIds)).groupBy(comments.taskId);
  return new Map(rows.map((r) => [r.id as string, Number(r.n)]));
}

export type TaskView = Awaited<ReturnType<typeof listTasks>>[number];

export async function listTasks(db: Db, actor: SessionUser | null, groupId: string) {
  await groupAccess(db, actor, groupId);
  const rows = await db.select().from(tasks).where(eq(tasks.groupId, groupId)).orderBy(asc(tasks.dueDate), asc(tasks.createdAt));
  const ids = rows.map((t) => t.id);
  const [assignees, counts] = await Promise.all([assigneesOf(db, ids), commentCounts(db, ids)]);
  return rows.map((t) => ({ ...t, assignees: assignees.get(t.id) ?? [], commentCount: counts.get(t.id) ?? 0 }));
}

async function checkAssignees(db: Db, groupId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return unique;
  const rows = await db
    .select({ id: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), inArray(groupMembers.userId, unique)));
  if (rows.length !== unique.length) throw new AppError("invalid_input", "Tasks can only be assigned to members of this group.");
  return unique;
}

type TaskCreate = Omit<z.infer<typeof taskInput>, "venue" | "links"> & Partial<Pick<z.infer<typeof taskInput>, "venue" | "links">>;

export async function createTask(db: Db, actor: SessionUser | null, groupId: string, input: TaskCreate) {
  const access = await groupAccess(db, actor, groupId);
  if (!access.canManage) throw new AppError("forbidden", "Only the admin or a group lead can assign tasks.");
  const assigneeIds = await checkAssignees(db, groupId, input.assigneeIds);
  return db.transaction(async (tx) => {
    const [t] = await tx
      .insert(tasks)
      .values({
        groupId,
        createdBy: actor!.id,
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate,
        priority: input.priority,
        venue: input.venue ?? null,
      })
      .returning();
    if (assigneeIds.length) await tx.insert(taskAssignees).values(assigneeIds.map((userId) => ({ taskId: t.id, userId })));
    const taskLinks = input.links ?? [];
    if (taskLinks.length) {
      await tx
        .insert(links)
        .values(taskLinks.map((l) => ({ groupId, taskId: t.id, url: l.url, label: l.label ?? null, kind: l.kind ?? detectLinkKind(l.url), addedBy: actor!.id })));
    }
    return t;
  });
}

async function loadTask(db: Db, actor: SessionUser | null, taskId: string) {
  const [t] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!t) throw new AppError("not_found", "Task not found.");
  const access = await groupAccess(db, actor, t.groupId);
  return { task: t, access };
}

/**
 * Admin and leads may edit anything. Other members may only move the status of
 * tasks assigned to them, or to the whole group (no assignees).
 */
export async function updateTask(db: Db, actor: SessionUser | null, taskId: string, input: Partial<z.infer<typeof taskPatch>>) {
  const { task, access } = await loadTask(db, actor, taskId);
  const { assigneeIds, ...fields } = input;
  if (!access.canManage) {
    const onlyStatus = Object.entries(input).every(([k, v]) => k === "status" || v === undefined);
    if (!onlyStatus) throw new AppError("forbidden", "Members can only change the status of a task.");
    const assigned = await db.select({ id: taskAssignees.userId }).from(taskAssignees).where(eq(taskAssignees.taskId, taskId));
    if (assigned.length && !assigned.some((a) => a.id === actor!.id)) throw new AppError("forbidden", "This task is assigned to someone else.");
  }
  const ids = assigneeIds ? await checkAssignees(db, task.groupId, assigneeIds) : null;
  await db.transaction(async (tx) => {
    const now = new Date();
    const completedAt = fields.status === undefined || fields.status === task.status ? {} : { completedAt: fields.status === "done" ? now : null };
    await tx.update(tasks).set({ ...fields, ...completedAt, updatedAt: now }).where(eq(tasks.id, taskId));
    if (ids) {
      await tx.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId));
      if (ids.length) await tx.insert(taskAssignees).values(ids.map((userId) => ({ taskId, userId })));
    }
  });
  const [updated] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  return updated;
}

/** Deleting a task also removes its links, comments and files (the bytes too, when `storage` is given). */
export async function deleteTask(db: Db, actor: SessionUser | null, taskId: string, storage?: Storage) {
  const { access } = await loadTask(db, actor, taskId);
  if (!access.canManage) throw new AppError("forbidden", "Only the admin or a group lead can delete tasks.");
  const files = await db.select({ key: attachments.storageKey }).from(attachments).where(eq(attachments.taskId, taskId));
  await db.delete(tasks).where(eq(tasks.id, taskId));
  if (storage) await Promise.all(files.map((f) => storage.remove(f.key)));
}

// ------------------------------------------------------------- comments --

export async function listTaskComments(db: Db, actor: SessionUser | null, taskId: string) {
  await loadTask(db, actor, taskId);
  return db
    .select({ id: comments.id, body: comments.body, createdAt: comments.createdAt, author })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.taskId, taskId))
    .orderBy(asc(comments.createdAt));
}

export async function addTaskComment(db: Db, actor: SessionUser | null, taskId: string, input: z.infer<typeof commentInput>) {
  const { task } = await loadTask(db, actor, taskId);
  const [c] = await db.insert(comments).values({ groupId: task.groupId, taskId, authorId: actor!.id, body: input.body }).returning();
  return c;
}

// ------------------------------------------------------------ dashboard --

/** Open tasks for the signed-in user across their active groups: assigned to them or to the whole group. */
export async function myOpenTasks(db: Db, actor: SessionUser | null) {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
  const mine = db.select({ id: taskAssignees.taskId }).from(taskAssignees).where(eq(taskAssignees.userId, actor.id));
  const anyAssignee = db.select({ id: taskAssignees.taskId }).from(taskAssignees);
  return db
    .select({ id: tasks.id, title: tasks.title, dueDate: tasks.dueDate, status: tasks.status, priority: tasks.priority, groupId: groups.id, groupName: groups.name })
    .from(tasks)
    .innerJoin(groups, eq(groups.id, tasks.groupId))
    .innerJoin(groupMembers, and(eq(groupMembers.groupId, tasks.groupId), eq(groupMembers.userId, actor.id)))
    .where(
      and(
        eq(groups.status, "active"),
        inArray(tasks.status, ["todo", "doing", "review"]),
        or(inArray(tasks.id, mine), sql`${tasks.id} not in ${anyAssignee}`),
      ),
    )
    .orderBy(asc(tasks.dueDate))
    .limit(50);
}

