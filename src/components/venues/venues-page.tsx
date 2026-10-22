import Link from "next/link";
import type { Metadata } from "next";
import { PageHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { getCurrentUser } from "@/server/auth/current";
import { browseVenues, venueFacets, venueQuerySchema, type VenueQuery } from "@/server/services/venues";
import { topicOf, type VenueKind } from "@/lib/venues/topics";
import { VenueSearch, type VenueFilters } from "./venue-search";

export type VenueSearchParams = Promise<Record<string, string | string[] | undefined>>;

async function readQuery(searchParams: VenueSearchParams, kind?: VenueKind): Promise<VenueQuery> {
  const raw = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  if (kind) raw.kind = kind;
  const parsed = venueQuerySchema.safeParse(raw);
  // a hand-edited URL with a bad value still shows the page, just without that filter
  return parsed.success ? parsed.data : venueQuerySchema.parse(kind ? { kind } : {});
}

const KIND_TITLE: Record<VenueKind, string> = { conference: "Computer science conferences", journal: "Scientific journals" };

export async function venuesMetadata(searchParams: VenueSearchParams, kind?: VenueKind): Promise<Metadata> {
  const q = await readQuery(searchParams, kind);
  const topic = q.topic ? topicOf(q.topic)?.label : null;
  const base = kind ? KIND_TITLE[kind] : "Conferences & journals";
  const title = q.q ? `${q.q} · ${base}` : topic ? `${topic} venues` : base;
  return {
    title,
    description:
      kind === "conference"
        ? "Search computer science conferences by acronym or name, and filter by CORE and CCF rank, subfield and topic."
        : kind === "journal"
          ? "Search scientific journals by name, ISSN or publisher, and filter by quartile, impact factor, index and open access."
          : "Find where to publish: search computer science conferences and scientific journals by name, acronym or ISSN, with CORE, CCF, WoS and SCImago ranks.",
    alternates: { canonical: kind === "conference" ? "/venues/conferences" : kind === "journal" ? "/venues/journals" : "/venues" },
    // filtered and searched views are for people, not for the index
    robots: q.q || Object.keys(await searchParams).length ? { index: false, follow: true } : undefined,
  };
}

/** /venues, /venues/conferences and /venues/journals: the same search, opened on a different tab. */
export async function VenuesPage({ searchParams, kind }: { searchParams: VenueSearchParams; kind?: VenueKind }) {
  const q = await readQuery(searchParams, kind);
  const db = await getDb();
  const [initial, facets, user] = await Promise.all([browseVenues(db, q), venueFacets(db), getCurrentUser().catch(() => null)]);
  const filters: VenueFilters = {
    q: q.q,
    kind: q.kind ?? "",
    topic: q.topic ?? "",
    area: q.area ?? "",
    rank: q.rank,
    ccf: q.ccf,
    quartile: q.quartile,
    index: q.index,
    oa: q.oa,
    top: q.top,
    safe: q.safe,
    sort: q.sort && q.sort !== "relevance" ? q.sort : "",
  };
  const loaded = facets.total.conference + facets.total.journal > 0;

  return (
    <div className="wrap page">
      <PageHead eyebrow="Venues" title={<>Where to <span className="hl">publish</span></>}>
        {facets.total.conference.toLocaleString("en-US")} computer science conferences and {facets.total.journal.toLocaleString("en-US")} journals, with their CORE,
        CCF, Web of Science and SCImago ranks. Search by acronym, name or ISSN.
      </PageHead>
      {loaded ? (
        <VenueSearch initial={initial} filters={filters} facets={facets} />
      ) : (
        <div className="card grid justify-items-start gap-3 p-6">
          <p className="m-0 font-bold">The venue list is being prepared.</p>
          <p className="m-0 text-muted">Check back soon.</p>
          {user?.role === "admin" && (
            <Link href="/admin/venues" className="btn btn-sm btn-yellow">
              Import the conference and journal files
            </Link>
          )}
        </div>
      )}
      <p className="note mt-10">
        <b>Sources</b>
        <span>
          Ranks come from the CORE conference portal, the CCF list, Clarivate Journal Citation Reports, SCImago and the CAS journal ranking, through the dataset shared by our
          friends at{" "}
          <a href="https://impaq.top" target="_blank" rel="noopener" className="font-bold underline">
            Impaq.top
          </a>
          . They are a guide only: always check the venue&apos;s own website and call for papers before you submit.
        </span>
      </p>
    </div>
  );
}
