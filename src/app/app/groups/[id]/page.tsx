import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarClock, FileText, Target } from "lucide-react";
import { Feed, type FeedPost } from "@/components/app/feed";
import { Initials } from "@/components/app/initials";
import { TaskBoard } from "@/components/app/task-board";
import { MarkWallSeen } from "@/components/app/wall-activity";
import { GroupSettings } from "@/components/app/group-settings";
import { AddResource, Resources, type WallFile, type WallLink } from "@/components/app/resources";
import { SectionHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { AppError } from "@/server/errors";
import { getGroup } from "@/server/services/groups";
import { listPosts, listTasks } from "@/server/services/wall";
import { listLinks } from "@/server/services/links";
import { listAttachments } from "@/server/services/attachments";
import { listUsers } from "@/server/services/users";
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
  const admin = user.role === "admin";
  const [tasks, posts, linkRows, fileRows, people] = await Promise.all([
    listTasks(db, user, id),
    listPosts(db, user, id),
    listLinks(db, user, id),
    listAttachments(db, user, id),
    admin ? listUsers(db, user) : Promise.resolve([]),
  ]);
  const links = JSON.parse(JSON.stringify(linkRows)) as WallLink[];
  const files = JSON.parse(JSON.stringify(fileRows)) as WallFile[];
  const groupLinks = links.filter((l) => !l.taskId);
  const groupFiles = files.filter((f) => !f.taskId);
  const today = labToday();

  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-8">
      <MarkWallSeen scope={group.id} />
      <header className="card grid grid-cols-[minmax(0,1fr)] gap-4 p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
          <p className="eyebrow">
            <span className="dot" />
            {group.status === "archived" ? "Archived group" : "Group wall"}
          </p>
          <h1 className="display text-[clamp(26px,4vw,44px)]">{group.name}</h1>
          {group.paperTitle && (
            <p className="flex items-start gap-2 font-medium">
              <FileText size={18} className="mt-1 shrink-0" aria-hidden />
              <span>{group.paperTitle}</span>
            </p>
          )}
          {group.targetVenue && (
            <p className="flex items-center gap-2">
              <Target size={18} className="shrink-0" aria-hidden />
              <span className="mono text-xs uppercase tracking-wider text-muted">Submitting to</span>
              <b>{group.targetVenue}</b>
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
          <div className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 border-t-2 border-dashed border-ink pt-3">
            <p className="mono text-xs uppercase tracking-wider text-muted">Workspace</p>
            {groupLinks.length === 0 && groupFiles.length === 0 && (
              <p className="text-sm text-ink-2">{group.canManage ? "Pin the Overleaf project, the repo and the call for papers here." : "No shared links yet."}</p>
            )}
            <Resources links={groupLinks} files={[]} me={user.id} canManage={group.canManage} />
            {group.canManage && <AddResource groupId={id} linkPlaceholder="https://www.overleaf.com/project/…" />}
          </div>
          {admin && (
            <div className="mt-2 border-t-2 border-dashed border-ink pt-3">
              <GroupSettings
                group={{
                  id: group.id,
                  name: group.name,
                  paperTitle: group.paperTitle,
                  targetVenue: group.targetVenue,
                  submissionDeadline: group.submissionDeadline,
                  description: group.description,
                  status: group.status,
                  members: group.members.map((m) => ({ id: m.id, role: m.role })),
                }}
                people={people.map((p) => ({ id: p.id, name: p.name, active: p.active }))}
                afterDelete="/app"
                label="Edit group & members"
              />
            </div>
          )}
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
        <TaskBoard
          groupId={id}
          tasks={tasks}
          members={group.members}
          me={user.id}
          canManage={group.canManage}
          today={today}
          targetVenue={group.targetVenue}
          links={links}
          files={files}
        />
      </section>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="wall">
          <SectionHead id="wall" no={String(posts.length).padStart(2, "0")} title="Wall" />
          <Feed groupId={id} posts={JSON.parse(JSON.stringify(posts)) as FeedPost[]} canManage={group.canManage} />
        </section>
        <section aria-labelledby="files" className="grid gap-3">
          <SectionHead id="files" no={String(groupFiles.length).padStart(2, "0")} title="Files" />
          <p className="text-sm text-ink-2">PDFs and images up to 10 MB. Only members of this group can open them.</p>
          <Resources links={[]} files={groupFiles} me={user.id} canManage={group.canManage} />
          <AddResource groupId={id} fileOnly />
        </section>
      </div>
    </div>
  );
}
