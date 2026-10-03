import type { Metadata } from "next";
import { AdminNewsRow, NewNews } from "@/components/app/admin-news";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { listNews } from "@/server/services/news";
import { labToday } from "@/lib/weeks";

export const metadata: Metadata = { title: "News" };

export default async function NewsAdminPage() {
  const user = await requirePageUser({ admin: true });
  const items = await listNews(await getDb(), user, { all: true });
  const today = labToday();

  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHead eyebrow="Admin · public site" title={<>Lab <span className="hl">news</span></>}>
        Accepted papers, awards and events. Published items appear on /news and the latest three on the home page. Write in English: the public site is
        in English.
      </PageHead>
      <section aria-labelledby="items" className="grid gap-4">
        <SectionHead id="items" no={String(items.length).padStart(2, "0")} title="All items" />
        <NewNews today={today} />
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((n) => (
            <AdminNewsRow key={n.id} item={n} today={today} />
          ))}
        </div>
        {!items.length && (
          <p className="note">
            <b>Empty</b>
            <span>No news yet. The News section on the home page stays hidden until the first item is live.</span>
          </p>
        )}
      </section>
    </div>
  );
}
