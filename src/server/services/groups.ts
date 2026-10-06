import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { attachments, groupMembers, groups, tasks, users, wallReads } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { Storage } from "../storage";
import type { groupInput, groupPatch, membersInput } from "../validation";
import { requireAdmin } from "./users";

export interface Access {
  group: typeof groups.$inferSelect;
  /** admin or group lead: can post announcements, create/edit tasks */
  canManage: boolean;
  isMember: boolean;
}

/** The one place that decides who may see a group's wall. Admins see all groups. */
export async function groupAccess(db: Db, actor: SessionUser | null, groupId: string): Promise<Access> {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group) throw new AppError("not_found", "Group not found.");
  const [m] = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, actor.id)))
    .limit(1);
  if (actor.role === "admin") return { group, canManage: true, isMember: !!m };
  // Same error as a missing group, so outsiders cannot probe which groups exist.
  if (!m) throw new AppError("not_found", "Group not found.");
  return { group, canManage: m.role === "lead", isMember: true };
}

export async function listGroups(db: Db, actor: SessionUser | null, opts: { includeArchived?: boolean } = {}) {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
  const mine = actor.role === "admin" ? null : (await db.select({ id: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, actor.id))).map((r) => r.id);
  if (mine && mine.length === 0) return [];
  const where = and(mine ? inArray(groups.id, mine) : undefined, opts.includeArchived ? undefined : eq(groups.status, "active"));
  const rows = await db.select().from(groups).where(where).orderBy(desc(groups.createdAt));
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const memberCounts = await db.select({ id: groupMembers.groupId, n: count() }).from(groupMembers).where(inArray(groupMembers.groupId, ids)).groupBy(groupMembers.groupId);
  const openTasks = await db
    .select({ id: tasks.groupId, n: count() })
    .from(tasks)
    .where(and(inArray(tasks.groupId, ids), inArray(tasks.status, ["todo", "doing", "review"])))
    .groupBy(tasks.groupId);
  const mc = new Map(memberCounts.map((r) => [r.id, Number(r.n)]));
  const tc = new Map(openTasks.map((r) => [r.id, Number(r.n)]));
  return rows.map((g) => ({ ...g, memberCount: mc.get(g.id) ?? 0, openTasks: tc.get(g.id) ?? 0 }));
}

export async function listMembers(db: Db, groupId: string) {
  return db
    .select({ id: users.id, name: users.name, email: users.email, title: users.title, role: groupMembers.role })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(desc(groupMembers.role), asc(users.name));
}

export async function getGroup(db: Db, actor: SessionUser | null, groupId: string) {
  const access = await groupAccess(db, actor, groupId);
  return { ...access.group, canManage: access.canManage, members: await listMembers(db, groupId) };
}

export async function createGroup(db: Db, actor: SessionUser | null, input: z.infer<typeof groupInput>) {
  requireAdmin(actor);
  const [g] = await db
    .insert(groups)
    .values({ ...input, createdBy: actor.id })
    .returning();
  return g;
}

export async function updateGroup(db: Db, actor: SessionUser | null, id: string, input: Partial<z.infer<typeof groupPatch>>) {
  requireAdmin(actor);
  const [g] = await db.update(groups).set(input).where(eq(groups.id, id)).returning();
  if (!g) throw new AppError("not_found", "Group not found.");
  return g;
}

/**
 * Deletes a group for good: its tasks, wall posts, comments, links and files go with it (the
 * bytes too, when `storage` is given). Archiving keeps everything; this does not.
 */
export async function deleteGroup(db: Db, actor: SessionUser | null, id: string, storage?: Storage) {
  requireAdmin(actor);
  const [g] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, id)).limit(1);
  if (!g) throw new AppError("not_found", "Group not found.");
  const files = await db.select({ key: attachments.storageKey }).from(attachments).where(eq(attachments.groupId, id));
  await db.transaction(async (tx) => {
    await tx.delete(wallReads).where(eq(wallReads.scope, id));
    await tx.delete(groups).where(eq(groups.id, id)); // the rest cascades
  });
  // a file that fails to delete only wastes space; the group is already gone
  if (storage) await Promise.allSettled(files.map((f) => storage.remove(f.key)));
  return { files: files.length };
}

/** Replaces the member list of a group. */
export async function setMembers(db: Db, actor: SessionUser | null, groupId: string, input: z.infer<typeof membersInput>) {
  requireAdmin(actor);
  await groupAccess(db, actor, groupId);
  const unique = [...new Map(input.members.map((m) => [m.userId, m])).values()];
  if (unique.length) {
    const found = await db.select({ id: users.id }).from(users).where(inArray(users.id, unique.map((m) => m.userId)));
    if (found.length !== unique.length) throw new AppError("invalid_input", "Unknown user in member list.");
  }
  await db.transaction(async (tx) => {
    await tx.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
    if (unique.length) await tx.insert(groupMembers).values(unique.map((m) => ({ groupId, userId: m.userId, role: m.role })));
  });
  return listMembers(db, groupId);
}
