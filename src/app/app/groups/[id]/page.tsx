import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, FileText } from "lucide-react";
import { Feed, type FeedPost } from "@/components/app/feed";
import { Initials } from "@/components/app/initials";
import { TaskBoard } from "@/components/app/task-board";
import { SectionHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { AppError } from "@/server/errors";
import { getGroup } from "@/server/services/groups";
import { listPosts, listTasks } from "@/server/services/wall";
import { formatDay, labToday } from "@/lib/weeks";

export const metadata: Metadata = { title: "Group wall" };

function daysUntil(date: string, today: string) {
  return Math.round((Date.parse(date) - Date.parse(today)) / 864e5);
}

export default async function GroupWall({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  const db = await getDb();
  let group;
  try {
    group = await getGroup(db, user, id);
  } catch (e) {
    if (e instanceof AppError && e.code === "not_found") notFound();
    throw e;
  }
  const [tasks, posts] = await Promise.all([listTasks(db, user, id), listPosts(db, user, id)]);
  const today = labToday();

  return (
    <div className="wrap page grid gap-8">
      <header className="card grid gap-4 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid gap-2">
          <p className="eyebrow">
            <span className="dot" />
            {group.status === "archived" ? "Archived group" : "Group wall"}
          </p>
          <h1 className="display text-[clamp(26px,4vw,44px)]">{group.name}</h1>
          {group.paperTitle && (
            <p className="flex items-start gap-2 font-medium">
              <FileText size={18} className="mt-1 shrink-0" aria-hidden />
              <span>
                {group.paperTitle}
                {group.targetVenue && <span className="font-normal text-ink-2"> · target: {group.targetVenue}</span>}
              </span>
            </p>
          )}
          {group.description && <p className="text-ink-2">{group.description}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {group.members.map((m) => (
              <span key={m.id} className="flex items-center gap-1.5 text-sm">
                <Initials name={m.name} />
                {m.name}
                {m.role === "lead" && <span className="tag">lead</span>}
              </span>
            ))}
          </div>
        </div>
        {group.submissionDeadline && (
          <div className="grid content-center justify-items-center gap-1 rounded-xl border-2 border-ink bg-yellow p-4 text-center" style={{ boxShadow: "var(--shadow)" }}>
            <CalendarClock size={20} aria-hidden />
            <span className="display text-4xl">{Math.max(0, daysUntil(group.submissionDeadline, today))}</span>
            <span className="mono text-xs">days to submission</span>
            <span className="mono text-xs text-ink-2">{formatDay(group.submissionDeadline)}</span>
          </div>
        )}
      </header>

      <section aria-labelledby="board">
        <SectionHead id="board" no={String(tasks.filter((t) => t.status !== "done").length).padStart(2, "0")} title="Weekly board" />
        <TaskBoard groupId={id} tasks={tasks} members={group.members} me={user.id} canManage={group.canManage} today={today} />
      </section>

      <section aria-labelledby="wall" className="max-w-[760px]">
        <SectionHead id="wall" no={String(posts.length).padStart(2, "0")} title="Wall" />
        <Feed groupId={id} posts={JSON.parse(JSON.stringify(posts)) as FeedPost[]} canManage={group.canManage} />
      </section>
    </div>
  );
}
