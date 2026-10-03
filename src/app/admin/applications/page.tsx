import type { Metadata } from "next";
import { ApplicationCard } from "@/components/app/admin-applications";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { listResearchAreas } from "@/lib/content";
import { formatStamp } from "@/lib/weeks";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { mailConfigured } from "@/server/mail";
import { listApplications } from "@/server/services/applications";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsAdminPage() {
  const user = await requirePageUser({ admin: true });
  const rows = await listApplications(await getDb(), user);
  const areaTitles = Object.fromEntries(listResearchAreas().map((a) => [a.slug, a.title]));
  const open = rows.filter((r) => r.status === "new" || r.status === "contacted");
  const closed = rows.filter((r) => r.status === "accepted" || r.status === "declined");
  const view = (r: (typeof rows)[number]) => ({ ...r, sent: formatStamp(r.createdAt) });

  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHead eyebrow="Admin · join" title={<>Applications</>}>
        Sent from the form on /join. {mailConfigured() ? "Each new one is also emailed to the admins." : "Once email is set up, each new one is also emailed to the admins."}{" "}
        To let someone in, create their account under Accounts.
      </PageHead>
      <section aria-labelledby="open" className="grid gap-4">
        <SectionHead id="open" no={String(open.length).padStart(2, "0")} title="To handle" />
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {open.map((r) => (
            <ApplicationCard key={r.id} a={view(r)} areaTitles={areaTitles} />
          ))}
        </div>
        {!open.length && (
          <p className="note">
            <b>Inbox zero</b>
            <span>No open applications.</span>
          </p>
        )}
      </section>
      {closed.length > 0 && (
        <section aria-labelledby="closed" className="grid gap-4">
          <SectionHead id="closed" no={String(closed.length).padStart(2, "0")} title="Decided" />
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {closed.map((r) => (
              <ApplicationCard key={r.id} a={view(r)} areaTitles={areaTitles} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
