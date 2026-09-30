import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Target } from "lucide-react";
import { PrintButton } from "@/components/app/print-button";
import { PageHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { monthlyReport } from "@/server/services/reports";
import { monthParam } from "@/server/validation";
import { formatDay, labToday } from "@/lib/weeks";

export const metadata: Metadata = { title: "Monthly report" };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (m: string) => `${MONTHS[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`;
function shift(m: string, n: number) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requirePageUser({ admin: true });
  const thisMonth = labToday().slice(0, 7);
  const parsed = monthParam.safeParse((await searchParams).month);
  const month = parsed.success ? parsed.data : thisMonth;
  const report = await monthlyReport(await getDb(), user, month);
  const total = (k: "completed" | "completedLate" | "open" | "overdue" | "created") => report.groups.reduce((n, g) => n + g[k], 0);
  const running = month === thisMonth;

  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHead eyebrow="Admin · progress" title={<>Monthly <span className="hl">report</span></>}>
        What each paper group finished in {monthName(month)}, what slipped, and who is carrying what. Open and overdue counts are{" "}
        {running ? `as of today (${formatDay(report.cutoff)})` : "as of the end of the month"}.
      </PageHead>

      <div className="no-print flex flex-wrap items-center gap-2">
        <Link className="btn btn-sm" href={`/admin/reports?month=${shift(month, -1)}`} aria-label="Previous month">
          <ChevronLeft size={15} aria-hidden /> {monthName(shift(month, -1)).slice(0, 3)}
        </Link>
        <form className="flex gap-2" action="/admin/reports">
          <input className="field field-sm w-auto" type="month" name="month" defaultValue={month} max={thisMonth} aria-label="Month" />
          <button className="btn btn-sm" type="submit">
            Show
          </button>
        </form>
        {month < thisMonth && (
          <Link className="btn btn-sm" href={`/admin/reports?month=${shift(month, 1)}`} aria-label="Next month">
            {monthName(shift(month, 1)).slice(0, 3)} <ChevronRight size={15} aria-hidden />
          </Link>
        )}
        <span className="ml-auto" />
        <a className="btn btn-yellow btn-sm" href={`/api/v1/admin/reports?month=${month}&format=csv`} download>
          <Download size={15} aria-hidden /> CSV for Excel
        </a>
        <PrintButton />
      </div>

      <div className="stat-row">
        <div style={{ "--c": "var(--color-teal)" } as React.CSSProperties}>
          <b>{total("completed")}</b>
          <span>tasks done</span>
        </div>
        <div style={{ "--c": "var(--color-orange)" } as React.CSSProperties}>
          <b>{total("completedLate")}</b>
          <span>done after the due date</span>
        </div>
        <div style={{ "--c": "var(--color-red)" } as React.CSSProperties}>
          <b>{total("overdue")}</b>
          <span>overdue now</span>
        </div>
        <div style={{ "--c": "var(--color-blue)" } as React.CSSProperties}>
          <b>{total("open")}</b>
          <span>still open</span>
        </div>
        <div>
          <b>{total("created")}</b>
          <span>new tasks</span>
        </div>
      </div>

      {report.groups.length === 0 && <p className="card p-5">No groups had any activity in {monthName(month)}.</p>}

      {report.groups.map((g) => (
        <section key={g.id} className="report-group card grid gap-4 p-5" aria-label={g.name}>
          <div className="flex flex-wrap items-start gap-3">
            <div className="grid gap-1">
              <h2 className="display text-2xl">
                <Link href={`/app/groups/${g.id}`}>{g.name}</Link>
                {g.status === "archived" && <span className="tag ml-2 align-middle">archived</span>}
              </h2>
              {g.paperTitle && <p className="font-medium">{g.paperTitle}</p>}
              {(g.targetVenue || g.submissionDeadline) && (
                <p className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
                  <Target size={15} aria-hidden />
                  {g.targetVenue}
                  {g.submissionDeadline && <span className="mono text-xs">· submission {formatDay(g.submissionDeadline)} {g.submissionDeadline.slice(0, 4)}</span>}
                </p>
              )}
            </div>
            <p className="mono ml-auto text-xs text-ink-2">
              {g.posts} posts · {g.comments} comments · {g.files} files · {g.links} links
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th className="num">Done</th>
                  <th className="num">Late</th>
                  <th className="num">Open</th>
                  <th className="num">Overdue</th>
                  <th className="num">Posts + comments</th>
                </tr>
              </thead>
              <tbody>
                {g.members.map((m) => (
                  <tr key={m.userId}>
                    <td>
                      <b>{m.name}</b> {m.role === "lead" && <span className="tag">lead</span>}
                    </td>
                    <td className="num">{m.completed}</td>
                    <td className="num">{m.completedLate || "–"}</td>
                    <td className="num">{m.open}</td>
                    <td className={`num ${m.overdue ? "font-bold text-red" : ""}`}>{m.overdue || "–"}</td>
                    <td className="num">{m.updates}</td>
                  </tr>
                ))}
                <tr>
                  <td className="mono text-xs uppercase">Group total</td>
                  <td className="num font-bold">{g.completed}</td>
                  <td className="num font-bold">{g.completedLate || "–"}</td>
                  <td className="num font-bold">{g.open}</td>
                  <td className="num font-bold">{g.overdue || "–"}</td>
                  <td className="num font-bold">{g.posts + g.comments}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid content-start gap-2">
              <h3 className="mono text-xs uppercase tracking-wider">Done this month</h3>
              {g.completedTasks.length ? (
                <ul className="grid gap-1 text-sm">
                  {g.completedTasks.map((t, i) => (
                    <li key={i}>
                      ✓ {t.title} <span className="mono text-xs text-ink-2">· {t.assignees.join(", ")} · {formatDay(t.completedOn)}{t.completedOn > t.dueDate ? " (late)" : ""}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-2">Nothing finished.</p>
              )}
            </div>
            <div className="grid content-start gap-2">
              <h3 className="mono text-xs uppercase tracking-wider text-red">Overdue</h3>
              {g.overdueTasks.length ? (
                <ul className="grid gap-1 text-sm">
                  {g.overdueTasks.map((t, i) => (
                    <li key={i}>
                      ! {t.title} <span className="mono text-xs text-ink-2">· {t.assignees.join(", ")} · due {formatDay(t.dueDate)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-2">Nothing overdue.</p>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
