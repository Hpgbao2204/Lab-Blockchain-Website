import { and, asc, eq } from "drizzle-orm";
import type { z } from "zod";
import type { Db } from "../db/client";
import { links, taskAssignees, tasks, users } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import type { linkInput, linkKinds } from "../validation";
import { groupAccess, type Access } from "./groups";

type LinkKind = (typeof linkKinds)[number];

/** Guesses the kind of a link from its host so the wall can show the right chip. */
export function detectLinkKind(url: string): LinkKind {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "other";
  }
  const is = (d: string) => host === d || host.endsWith(`.${d}`);
  if (is("overleaf.com")) return "overleaf";
  if (is("github.com") || is("gitlab.com")) return "github";
  if (is("drive.google.com") || is("docs.google.com")) return "drive";
  if (is("arxiv.org") || is("doi.org") || is("easychair.org") || is("openreview.net") || is("ieeexplore.ieee.org")) return "paper";
  return "other";
}

export type LinkView = Awaited<ReturnType<typeof listLinks>>[number];

export async function listLinks(db: Db, actor: SessionUser | null, groupId: string) {
  await groupAccess(db, actor, groupId);
  return db
    .select({ id: links.id, taskId: links.taskId, kind: links.kind, url: links.url, label: links.label, createdAt: links.createdAt, addedBy: { id: users.id, name: users.name } })
    .from(links)
    .leftJoin(users, eq(users.id, links.addedBy))
    .where(eq(links.groupId, groupId))
    .orderBy(asc(links.createdAt));
}

/** A member may work on a task when it is assigned to them or to the whole group. */
export async function canWorkOn(db: Db, actor: SessionUser, access: Access, taskId: string) {
  if (access.canManage) return true;
  const assigned = await db.select({ id: taskAssignees.userId }).from(taskAssignees).where(eq(taskAssignees.taskId, taskId));
  return assigned.length === 0 || assigned.some((a) => a.id === actor.id);
}

/**
 * Group-level links (the Overleaf project, the call for papers) are set by the admin or a lead.
 * Members can add links (a GitHub repo, a draft) to tasks they are working on.
 */
export async function createLink(db: Db, actor: SessionUser | null, groupId: string, input: z.infer<typeof linkInput>) {
  const access = await groupAccess(db, actor, groupId);
  if (input.taskId) {
    const [t] = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.id, input.taskId), eq(tasks.groupId, groupId)));
    if (!t) throw new AppError("not_found", "Task not found.");
    if (!(await canWorkOn(db, actor!, access, input.taskId))) throw new AppError("forbidden", "You can only add links to tasks you work on.");
  } else if (!access.canManage) {
    throw new AppError("forbidden", "Only the admin or a group lead can pin links to the whole group.");
  }
  const [l] = await db
    .insert(links)
    .values({ groupId, taskId: input.taskId ?? null, kind: input.kind ?? detectLinkKind(input.url), url: input.url, label: input.label ?? null, addedBy: actor!.id })
    .returning();
  return l;
}

export async function deleteLink(db: Db, actor: SessionUser | null, linkId: string) {
  const [l] = await db.select().from(links).where(eq(links.id, linkId)).limit(1);
  if (!l) throw new AppError("not_found", "Link not found.");
  const access = await groupAccess(db, actor, l.groupId);
  if (!access.canManage && l.addedBy !== actor!.id) throw new AppError("forbidden", "Only whoever added a link, a lead or the admin can remove it.");
  await db.delete(links).where(eq(links.id, linkId));
}
