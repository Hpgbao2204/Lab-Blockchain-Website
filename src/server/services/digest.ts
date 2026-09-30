import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/client";
import { groupMembers, groups, taskAssignees, tasks, users } from "../db/schema";
import { addDays, formatDay, weekStart } from "@/lib/weeks";

export interface DigestTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  groupId: string;
  groupName: string;
  venue: string | null;
  wholeGroup: boolean;
}

export interface Digest {
  userId: string;
  email: string;
  name: string;
  overdue: DigestTask[];
  thisWeek: DigestTask[];
}

/**
 * The Monday reminder: for every active member, the open tasks that are overdue or due this
 * week (Monday to Sunday) in their active groups, whether assigned to them or to the whole group.
 * Members with nothing due get no email.
 */
export async function buildDigests(db: Db, today: string): Promise<Digest[]> {
  const weekEnd = addDays(weekStart(today), 7);
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      id: tasks.id,
      title: tasks.title,
      dueDate: tasks.dueDate,
      status: tasks.status,
      venue: tasks.venue,
      groupId: groups.id,
      groupName: groups.name,
    })
    .from(tasks)
    .innerJoin(groups, eq(groups.id, tasks.groupId))
    .innerJoin(groupMembers, eq(groupMembers.groupId, tasks.groupId))
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(and(eq(groups.status, "active"), eq(users.active, true), inArray(tasks.status, ["todo", "doing", "review"])))
    .orderBy(asc(tasks.dueDate), asc(tasks.title));
  const due = rows.filter((r) => r.dueDate < weekEnd);
  if (!due.length) return [];

  const assigned = await db
    .select({ taskId: taskAssignees.taskId, userId: taskAssignees.userId })
    .from(taskAssignees)
    .where(inArray(taskAssignees.taskId, [...new Set(due.map((r) => r.id))]));
  const byTask = new Map<string, Set<string>>();
  for (const a of assigned) byTask.set(a.taskId, (byTask.get(a.taskId) ?? new Set()).add(a.userId));

  const digests = new Map<string, Digest>();
  for (const r of due) {
    const who = byTask.get(r.id);
    if (who && !who.has(r.userId)) continue;
    const d = digests.get(r.userId) ?? { userId: r.userId, email: r.email, name: r.name, overdue: [], thisWeek: [] };
    const t: DigestTask = { id: r.id, title: r.title, dueDate: r.dueDate, status: r.status, groupId: r.groupId, groupName: r.groupName, venue: r.venue, wholeGroup: !who };
    (r.dueDate < today ? d.overdue : d.thisWeek).push(t);
    digests.set(r.userId, d);
  }
  return [...digests.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function renderDigest(d: Digest, siteUrl: string, today: string) {
  const first = d.name.split(" ").at(-1) ?? d.name;
  const n = d.overdue.length + d.thisWeek.length;
  const plural = (k: number, w: string) => `${k} ${w}${k === 1 ? "" : "s"}`;
  const parts = [d.overdue.length ? `${d.overdue.length} overdue` : "", d.thisWeek.length ? `${d.thisWeek.length} due this week` : ""].filter(Boolean);
  const subject = `[Blockchainist] ${parts.length === 2 ? parts.join(", ") : `${plural(d.overdue.length || d.thisWeek.length, "task")} ${d.overdue.length ? "overdue" : "due this week"}`}`;
  const line = (t: DigestTask) => `${formatDay(t.dueDate)} · ${t.title} (${t.groupName}${t.wholeGroup ? ", whole group" : ""})`;
  const text = [
    `Hi ${first},`,
    "",
    `Week of ${formatDay(weekStart(today))}: ${n} open task${n === 1 ? "" : "s"} need you.`,
    ...(d.overdue.length ? ["", "OVERDUE", ...d.overdue.map((t) => `- ${line(t)}`)] : []),
    ...(d.thisWeek.length ? ["", "DUE THIS WEEK", ...d.thisWeek.map((t) => `- ${line(t)}`)] : []),
    "",
    `Open your wall: ${siteUrl}/app`,
    "",
    "Blockchainist lab · sent every Monday morning",
  ].join("\n");
  const section = (title: string, color: string, list: DigestTask[]) =>
    list.length
      ? `<h3 style="margin:20px 0 8px;font:700 13px/1 monospace;letter-spacing:.08em;color:${color}">${title}</h3><ul style="margin:0;padding:0;list-style:none">${list
          .map(
            (t) =>
              `<li style="margin:0 0 8px;padding:10px 12px;border:2px solid #16140f;border-radius:10px;background:#fff"><a href="${esc(siteUrl)}/app/groups/${t.groupId}" style="color:#16140f;font-weight:700;text-decoration:none">${esc(t.title)}</a><br><span style="font:12px monospace;color:#555">${formatDay(t.dueDate)} · ${esc(t.groupName)}${t.wholeGroup ? " · whole group" : ""}${t.venue ? ` · ${esc(t.venue)}` : ""}</span></li>`,
          )
          .join("")}</ul>`
      : "";
  const html = `<div style="background:#f6f3ec;padding:24px;font-family:Arial,sans-serif;color:#16140f"><div style="max-width:560px;margin:auto"><p style="font:700 20px/1.2 Arial,sans-serif">Hi ${esc(first)},</p><p>Week of ${formatDay(weekStart(today))}: <b>${n}</b> open task${n === 1 ? "" : "s"} need you.</p>${section("OVERDUE", "#c2361d", d.overdue)}${section("DUE THIS WEEK", "#1f4fd6", d.thisWeek)}<p style="margin-top:24px"><a href="${esc(siteUrl)}/app" style="display:inline-block;padding:10px 16px;background:#ffd23f;border:2px solid #16140f;border-radius:10px;color:#16140f;font-weight:700;text-decoration:none">Open my wall</a></p><p style="font-size:12px;color:#666">Blockchainist lab · sent every Monday morning</p></div></div>`;
  return { to: d.email, subject, text, html };
}
