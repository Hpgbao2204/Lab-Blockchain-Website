import { and, count, eq, gte, inArray, lt } from "drizzle-orm";
import type { Db } from "../db/client";
import { attachments, comments, groupMembers, groups, links, posts, taskAssignees, tasks, users } from "../db/schema";
import type { SessionUser } from "../auth/sessions";
import { labToday } from "@/lib/weeks";
import { requireAdmin } from "./users";

export interface MemberLine {
  userId: string;
  name: string;
  email: string;
  role: "lead" | "member";
  completed: number;
  completedLate: number;
  open: number;
  overdue: number;
  updates: number;
}

export interface GroupReport {
  id: string;
  name: string;
  paperTitle: string | null;
  targetVenue: string | null;
  submissionDeadline: string | null;
  status: string;
  created: number;
  completed: number;
  completedLate: number;
  open: number;
  overdue: number;
  posts: number;
  comments: number;
  files: number;
  links: number;
  members: MemberLine[];
  completedTasks: { title: string; dueDate: string; completedOn: string; assignees: string[] }[];
  overdueTasks: { title: string; dueDate: string; assignees: string[] }[];
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const start = `${month}-01`;
  const end = `${next}-01`;
  // Lab time is UTC+7 all year.
  return { start, end, startAt: new Date(`${start}T00:00:00+07:00`), endAt: new Date(`${end}T00:00:00+07:00`) };
}

const labDay = (d: Date) => labToday(d);

/**
 * Progress for one month, per paper group and per member. "Open" and "overdue" are measured at the
 * end of the month, or today while the month is still running.
 */
export async function monthlyReport(db: Db, actor: SessionUser | null, month: string, now = new Date()) {
  requireAdmin(actor);
  const { start, end, startAt, endAt } = monthRange(month);
  const cutoffAt = now < endAt ? now : endAt;
  const cutoff = labDay(cutoffAt);

  const groupRows = await db.select().from(groups).where(lt(groups.createdAt, endAt));
  if (!groupRows.length) return { month, start, end, cutoff, groups: [] as GroupReport[] };
  const ids = groupRows.map((g) => g.id);

  const taskRows = await db.select().from(tasks).where(and(inArray(tasks.groupId, ids), lt(tasks.createdAt, endAt)));
  const taskIds = taskRows.map((t) => t.id);
  const [memberRows, assigneeRows] = await Promise.all([
    db
      .select({ groupId: groupMembers.groupId, userId: users.id, name: users.name, email: users.email, role: groupMembers.role })
      .from(groupMembers)
      .innerJoin(users, eq(users.id, groupMembers.userId))
      .where(inArray(groupMembers.groupId, ids)),
    taskIds.length
      ? db
          .select({ taskId: taskAssignees.taskId, userId: taskAssignees.userId, name: users.name })
          .from(taskAssignees)
          .innerJoin(users, eq(users.id, taskAssignees.userId))
          .where(inArray(taskAssignees.taskId, taskIds))
      : [],
  ]);
  const inMonth = <T extends { createdAt: unknown }>(t: T) => and(gte(t.createdAt as never, startAt), lt(t.createdAt as never, endAt));
  const perGroup = async (table: typeof posts | typeof comments | typeof attachments | typeof links) =>
    new Map(
      (await db.select({ id: table.groupId, n: count() }).from(table).where(and(inArray(table.groupId, ids), inMonth(table))).groupBy(table.groupId)).map((r) => [
        r.id,
        Number(r.n),
      ]),
    );
  const [postN, commentN, fileN, linkN] = await Promise.all([perGroup(posts), perGroup(comments), perGroup(attachments), perGroup(links)]);
  // Posts and comments written by each member this month.
  const activity = await db
    .select({ groupId: posts.groupId, userId: posts.authorId, n: count() })
    .from(posts)
    .where(and(inArray(posts.groupId, ids), inMonth(posts)))
    .groupBy(posts.groupId, posts.authorId)
    .unionAll(
      db
        .select({ groupId: comments.groupId, userId: comments.authorId, n: count() })
        .from(comments)
        .where(and(inArray(comments.groupId, ids), inMonth(comments)))
        .groupBy(comments.groupId, comments.authorId),
    );
  const updates = new Map<string, number>();
  for (const a of activity) updates.set(`${a.groupId}:${a.userId}`, (updates.get(`${a.groupId}:${a.userId}`) ?? 0) + Number(a.n));

  const assignees = new Map<string, { userId: string; name: string }[]>();
  for (const a of assigneeRows) assignees.set(a.taskId, [...(assignees.get(a.taskId) ?? []), a]);

  const reports: GroupReport[] = groupRows.map((g) => {
    const gTasks = taskRows.filter((t) => t.groupId === g.id);
    const members = memberRows.filter((m) => m.groupId === g.id);
    const doneInMonth = gTasks.filter((t) => t.completedAt && t.completedAt >= startAt && t.completedAt < endAt);
    const openAtCutoff = gTasks.filter((t) => !t.completedAt || t.completedAt >= cutoffAt);
    const overdueAtCutoff = openAtCutoff.filter((t) => t.dueDate < cutoff);
    const late = (t: (typeof gTasks)[number]) => labDay(t.completedAt!) > t.dueDate;
    const whoDoes = (t: (typeof gTasks)[number]) => {
      const a = assignees.get(t.id);
      return a?.length ? a.map((x) => x.userId) : members.map((m) => m.userId);
    };
    const names = (t: (typeof gTasks)[number]) => assignees.get(t.id)?.map((a) => a.name) ?? ["Whole group"];
    return {
      id: g.id,
      name: g.name,
      paperTitle: g.paperTitle,
      targetVenue: g.targetVenue,
      submissionDeadline: g.submissionDeadline,
      status: g.status,
      created: gTasks.filter((t) => t.createdAt >= startAt).length,
      completed: doneInMonth.length,
      completedLate: doneInMonth.filter(late).length,
      open: openAtCutoff.length,
      overdue: overdueAtCutoff.length,
      posts: postN.get(g.id) ?? 0,
      comments: commentN.get(g.id) ?? 0,
      files: fileN.get(g.id) ?? 0,
      links: linkN.get(g.id) ?? 0,
      members: members
        .map((m) => {
          const mine = (list: typeof gTasks) => list.filter((t) => whoDoes(t).includes(m.userId));
          return {
            userId: m.userId,
            name: m.name,
            email: m.email,
            role: m.role,
            completed: mine(doneInMonth).length,
            completedLate: mine(doneInMonth).filter(late).length,
            open: mine(openAtCutoff).length,
            overdue: mine(overdueAtCutoff).length,
            updates: updates.get(`${g.id}:${m.userId}`) ?? 0,
          };
        })
        .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "lead" ? -1 : 1)),
      completedTasks: doneInMonth.map((t) => ({ title: t.title, dueDate: t.dueDate, completedOn: labDay(t.completedAt!), assignees: names(t) })),
      overdueTasks: overdueAtCutoff.map((t) => ({ title: t.title, dueDate: t.dueDate, assignees: names(t) })),
    };
  });
  // Groups archived before the month with no activity in it are left out.
  const shown = reports.filter((r) => r.status === "active" || r.completed || r.created || r.posts || r.comments);
  return { month, start, end, cutoff, groups: shown };
}

export type MonthlyReport = Awaited<ReturnType<typeof monthlyReport>>;

const cell = (v: string | number | null) => {
  const s = v === null ? "" : String(v);
  // Quote everything and neutralise spreadsheet formulas.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export function reportCsv(r: MonthlyReport) {
  const head = ["month", "group", "paper", "target_venue", "member", "email", "role", "completed", "completed_late", "open", "overdue", "posts_and_comments"];
  const lines = [head.map(cell).join(",")];
  for (const g of r.groups) {
    for (const m of g.members) {
      lines.push([r.month, g.name, g.paperTitle, g.targetVenue, m.name, m.email, m.role, m.completed, m.completedLate, m.open, m.overdue, m.updates].map(cell).join(","));
    }
    lines.push([r.month, g.name, g.paperTitle, g.targetVenue, "(group total)", "", "", g.completed, g.completedLate, g.open, g.overdue, g.posts + g.comments].map(cell).join(","));
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}
