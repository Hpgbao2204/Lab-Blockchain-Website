import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { SendReminders } from "@/components/app/send-reminders";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { mailConfigured } from "@/server/mail";
import { siteUrl } from "@/server/jobs/weekly-digest";
import { buildDigests, renderDigest } from "@/server/services/digest";
import { formatDay, labToday, weekStart } from "@/lib/weeks";

export const metadata: Metadata = { title: "Monday email" };

export default async function RemindersPage() {
  await requirePageUser({ admin: true });
  const today = labToday();
  const digests = await buildDigests(await getDb(), today);
  const emails = digests.map((d) => ({ ...renderDigest(d, siteUrl(), today), name: d.name, overdue: d.overdue.length, thisWeek: d.thisWeek.length }));
  const configured = mailConfigured();

  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHead eyebrow="Admin · reminders" title={<>Monday <span className="hl">email</span></>}>
        Every Monday at 08:00 (Vietnam time) each member gets one email with their overdue tasks and what is due this week. Members with nothing due get
        nothing.
      </PageHead>

      <div className={configured ? "success" : "error"}>
        {configured ? (
          <>Email is set up. The Monday job sends automatically; you can also send this week&apos;s emails now.</>
        ) : (
          <>
            Email is not set up yet, so nothing is sent. To turn it on, add <code>RESEND_API_KEY</code>, <code>MAIL_FROM</code> and <code>CRON_SECRET</code> to the
            hosting environment (never paste keys in chat).
          </>
        )}
      </div>
      <SendReminders enabled={configured} count={emails.length} />

      <section aria-labelledby="preview" className="grid gap-4">
        <SectionHead id="preview" no={String(emails.length).padStart(2, "0")} title={`Preview · week of ${formatDay(weekStart(today))}`} />
        {emails.length === 0 && <p className="card p-5">Nobody has anything overdue or due this week.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          {emails.map((e) => (
            <article key={e.to} className="card grid gap-3 p-4">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <Mail size={16} aria-hidden />
                <b>{e.name}</b>
                <span className="mono text-xs text-ink-2">{e.to}</span>
                {e.overdue > 0 && (
                  <span className="tag ml-auto" style={{ "--c": "var(--color-red)" } as React.CSSProperties}>
                    {e.overdue} overdue
                  </span>
                )}
              </p>
              <p className="font-bold">{e.subject}</p>
              <iframe title={`Email to ${e.name}`} className="mail-preview h-[360px] w-full bg-white" sandbox="" srcDoc={e.html} loading="eager" />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
