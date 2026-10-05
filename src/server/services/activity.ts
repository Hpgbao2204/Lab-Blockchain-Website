import { and, count, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import type { Db } from "../db/client";
import { announcements, attachments, comments, groupMembers, groups, links, meetings, posts, tasks, wallReads } from "../db/schema";
import { AppError } from "../errors";
import type { SessionUser } from "../auth/sessions";
import { groupAccess } from "./groups";

/** Before someone has opened a wall, only the last week counts as new. */
const FIRST_LOOK_DAYS = 7;
export const LAB_SCOPE = "lab";

export interface Activity {
  /** everything new, for the dot on "My wall" */
  total: number;
  /** new lab meetings and announcements */
  lab: number;
  /** new things per group wall, by group id (groups with nothing new are left out) */
  groups: Record<string, number>;
}

/**
 * What other people did since this person last opened each wall: posts, comments, links, files,
 * tasks created or changed, plus lab meetings and announcements. Their own actions never count.
 */
export async function wallActivity(db: Db, actor: SessionUser | null): Promise<Activity> {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
  const me = actor.id;
  const firstLook = sql`${new Date(Date.now() - FIRST_LOOK_DAYS * 864e5).toISOString()}::timestamptz`;
  const ids =
    actor.role === "admin"
      ? (await db.select({ id: groups.id }).from(groups).where(eq(groups.status, "active"))).map((r) => r.id)
      : (
          await db
            .select({ id: groupMembers.groupId })
            .from(groupMembers)
            .innerJoin(groups, eq(groups.id, groupMembers.groupId))
            .where(and(eq(groupMembers.userId, me), eq(groups.status, "active")))
        ).map((r) => r.id);

  const byGroup: Record<string, number> = {};
  if (ids.length) {
    const seen = (groupCol: AnyPgColumn) => and(eq(wallReads.userId, me), eq(wallReads.scope, sql`${groupCol}::text`));
    const after = (at: AnyPgColumn) => sql`${at} > coalesce(${wallReads.seenAt}, ${firstLook})`;
    const notMe = (who: AnyPgColumn) => sql`${who} is distinct from ${me}`;
    const perGroup = (table: PgTable, groupCol: AnyPgColumn, isNew: SQL | undefined) =>
      db
        .select({ id: groupCol, n: count() })
        .from(table)
        .leftJoin(wallReads, seen(groupCol))
        .where(and(inArray(groupCol, ids), isNew))
        .groupBy(groupCol);
    const counts = await Promise.all([
      perGroup(posts, posts.groupId, and(notMe(posts.authorId), after(posts.createdAt))),
      perGroup(comments, comments.groupId, and(notMe(comments.authorId), after(comments.createdAt))),
      perGroup(links, links.groupId, and(notMe(links.addedBy), after(links.createdAt))),
      perGroup(attachments, attachments.groupId, and(notMe(attachments.uploaderId), after(attachments.createdAt))),
      perGroup(
        tasks,
        tasks.groupId,
        or(and(notMe(tasks.createdBy), after(tasks.createdAt)), and(sql`${tasks.updatedBy} is not null`, notMe(tasks.updatedBy), after(tasks.updatedAt))),
      ),
    ]);
    for (const row of counts.flat()) byGroup[row.id as string] = (byGroup[row.id as string] ?? 0) + Number(row.n);
  }

  const [labRead] = await db
    .select({ at: wallReads.seenAt })
    .from(wallReads)
    .where(and(eq(wallReads.userId, me), eq(wallReads.scope, LAB_SCOPE)))
    .limit(1);
  const labSince = labRead ? sql`${labRead.at.toISOString()}::timestamptz` : firstLook;
  const [[a], [m]] = await Promise.all([
    db
      .select({ n: count() })
      .from(announcements)
      .where(and(sql`${announcements.authorId} is distinct from ${me}`, sql`${announcements.createdAt} > ${labSince}`)),
    db
      .select({ n: count() })
      .from(meetings)
      .where(and(sql`${meetings.createdBy} is distinct from ${me}`, sql`${meetings.createdAt} > ${labSince}`)),
  ]);
  const lab = Number(a?.n ?? 0) + Number(m?.n ?? 0);
  const total = lab + Object.values(byGroup).reduce((s, n) => s + n, 0);
  return { total, lab, groups: byGroup };
}

/** Marks a wall as read now: a group the person can see, or the lab-wide notices. */
export async function markWallSeen(db: Db, actor: SessionUser | null, scope: string) {
  if (!actor) throw new AppError("unauthorized", "Sign in first.");
  if (scope !== LAB_SCOPE) await groupAccess(db, actor, scope);
  // the database clock, so it lines up with the created_at of what was read
  await db
    .insert(wallReads)
    .values({ userId: actor.id, scope, seenAt: sql`now()` })
    .onConflictDoUpdate({ target: [wallReads.userId, wallReads.scope], set: { seenAt: sql`now()` } });
}
