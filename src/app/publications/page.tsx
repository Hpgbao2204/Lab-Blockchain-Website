import type { Metadata } from "next";
import { PublicationBrowser } from "@/components/pubs/publication-browser";
import { PageHead } from "@/components/site/page-head";
import { listPublications, listResearchAreas, publicationFacets } from "@/lib/content";
import { getDb } from "@/server/db";
import { allPublications } from "@/server/services/publications";

export const metadata: Metadata = { title: "Publications", description: "Papers published by the Blockchainist group." };

export const dynamic = "force-dynamic";

export default async function PublicationsPage() {
  const all = await allPublications(await getDb());
  return (
    <div className="wrap page">
      <PageHead eyebrow="Publications" title={<>Papers &amp; <span className="hl">proofs</span></>}>
        Journal and conference work from the group. The <span className="pi">underlined</span> author is the principal investigator.
      </PageHead>
      <p className="note mb-6">
        <b>Source</b>
        <span>Pulled from Crossref using the principal investigator&apos;s ORCID, plus papers the lab adds by hand. For citation counts see Google Scholar.</span>
      </p>
      <PublicationBrowser
        initial={listPublications({}, all)}
        facets={publicationFacets(all)}
        areas={listResearchAreas().map(({ slug, title }) => ({ slug, title }))}
      />
    </div>
  );
}
