import type { Metadata } from "next";
import Link from "next/link";
import { VenueImport } from "@/components/app/admin-venues";
import { PageHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { venueStats } from "@/server/services/venues";

export const metadata: Metadata = { title: "Venues" };
export const dynamic = "force-dynamic";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }) : "never");

export default async function VenuesAdminPage() {
  const user = await requirePageUser({ admin: true });
  const stats = await venueStats(await getDb(), user);
  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHead eyebrow="Admin · public site" title={<>Venues</>}>
        The conference and journal search on <Link href="/venues" className="underline">/venues</Link> reads from these lists. Import a newer CSV to update them, for example
        once a year when the new impact factors come out (June). Links to venue pages stay the same.
      </PageHead>
      <dl className="venue-stats">
        {(["conference", "journal"] as const).map((k) => (
          <div key={k} className="venue-stat">
            <dt>{k}s</dt>
            <dd>{stats[k].count.toLocaleString("en-US")}</dd>
            <span className="src">last import: {when(stats[k].updatedAt)}</span>
          </div>
        ))}
      </dl>
      <VenueImport />
    </div>
  );
}
