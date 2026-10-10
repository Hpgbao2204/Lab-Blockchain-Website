import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CalendarClock, Megaphone } from "lucide-react";
import { MeetingCard } from "@/components/app/meeting-card";
import { MarkWallSeen, UnreadDot } from "@/components/app/wall-activity";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { listGroups } from "@/server/services/groups";
import { listAnnouncements, listMeetings } from "@/server/services/meetings";
import { myOpenTasks } from "@/server/services/wall";
import { wallActivity } from "@/server/services/activity";
import { BUCKET_LABEL, bucketFor, formatDay, formatStamp, labToday } from "@/lib/weeks";

const bucketColor = { overdue: "var(--color-red)", "this-week": "var(--color-yellow)", "next-week": "var(--color-blue)", later: "var(--color-paper-2)", done: "var(--color-teal)" };

export default async function Dashboard() {
  const user = await requirePageUser();
  // admins see every group from the lab console, so "My wall" takes them there
  if (user.role === "admin") redirect("/admin");
  const db = await getDb();
  const [groups, tasks, meetings, notices, activity] = await Promise.all([
    listGroups(db, user),
    myOpenTasks(db, user),
    listMeetings(db, user, { when: "upcoming", limit: 3 }),
    listAnnouncements(db, user, 3),
    wallActivity(db, user),
  ]);
  const presenting = meetings.find((m) => m.presenters.some((p) => p.id === user.id));
  const today = labToday();
  const first = user.name.split(" ").at(-1);

  return (
    <div className="wrap page">
      <MarkWallSeen scope="lab" />
      <PageHead eyebrow={`Today · ${formatDay(today)}`} title={<>Hi, <span className="hl">{first}</span></>}>
        {tasks.length ? `You have ${tasks.length} open task${tasks.length === 1 ? "" : "s"}.` : "Nothing is waiting on you right now."}
        {presenting ? ` You present at "${presenting.title}" on ${formatStamp(presenting.startsAt)}.` : ""}
      </PageHead>

      {(meetings.length > 0 || notices.length > 0) && (
        <div className="mb-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section aria-labelledby="meetings" className="grid gap-3">
            <SectionHead id="meetings" no={String(meetings.length).padStart(2, "0")} title="Lab meetings" />
            {meetings.length ? (
              meetings.map((m, i) => <MeetingCard key={m.id} meeting={m} viewerId={user.id} highlight={i === 0} />)
            ) : (
              <p className="note">
                <b>None</b>
                <span>No meeting scheduled.</span>
              </p>
            )}
          </section>
          <section aria-labelledby="notices" className="grid gap-3">
            <SectionHead id="notices" no={String(notices.length).padStart(2, "0")} title="Announcements" />
            {notices.map((a) => (
              <article key={a.id} className="card grid gap-1.5 p-4">
                <h3 className="flex items-center gap-2 font-bold">
                  <Megaphone size={16} aria-hidden /> {a.title}
                </h3>
                <p className="whitespace-pre-line text-sm text-ink-2">{a.body}</p>
                <p className="mono text-xs text-muted">
                  {a.author?.name ? `${a.author.name} · ` : ""}
                  {formatStamp(a.createdAt)}
                </p>
              </article>
            ))}
            {!notices.length && (
              <p className="note">
                <b>Quiet</b>
                <span>No announcements.</span>
              </p>
            )}
          </section>
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-labelledby="my-tasks">
          <SectionHead id="my-tasks" no={String(tasks.length).padStart(2, "0")} title="My tasks" />
          {tasks.length ? (
            <ul className="grid gap-3">
              {tasks.map((t) => {
                const b = bucketFor(t, today);
                return (
                  <li key={t.id}>
                    <Link href={`/app/groups/${t.groupId}#task-${t.id}`} className="task lift" style={{ "--p": bucketColor[b] } as React.CSSProperties}>
                      <div className="flex items-start justify-between gap-3">
                        <h4>{t.title}</h4>
                        <span className="tag shrink-0" style={{ "--c": bucketColor[b] } as React.CSSProperties}>
                          {BUCKET_LABEL[b]}
                        </span>
                      </div>
                      <div className="meta">
                        <CalendarClock size={14} aria-hidden /> {formatDay(t.dueDate)} · {t.groupName} · {t.status}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="note">
              <b>Clear</b>
              <span>No open tasks. Enjoy the calm, or read a paper.</span>
            </p>
          )}
        </section>

        <section aria-labelledby="my-groups">
          <SectionHead id="my-groups" no={String(groups.length).padStart(2, "0")} title="My groups" />
          {groups.length ? (
            <ul className="grid gap-3">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link href={`/app/groups/${g.id}`} className="card lift relative grid gap-1.5 p-4" style={{ boxShadow: "var(--shadow)" }}>
                    <UnreadDot n={activity.groups[g.id]} />
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold [font-family:var(--font-display)]">{g.name}</h3>
                      <ArrowUpRight size={18} aria-hidden />
                    </div>
                    {g.paperTitle && <p className="text-sm text-ink-2">{g.paperTitle}</p>}
                    <p className="mono text-xs text-muted">
                      {g.memberCount} members · {g.openTasks} open tasks{g.submissionDeadline ? ` · submit by ${formatDay(g.submissionDeadline)}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="note">
              <b>None yet</b>
              <span>The admin has not added you to a group yet.</span>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
