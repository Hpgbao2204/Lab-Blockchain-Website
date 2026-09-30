import type { Metadata } from "next";
import { PublicationBrowser } from "@/components/pubs/publication-browser";
import { PageHead } from "@/components/site/page-head";
import { listPublications, listResearchAreas, publicationFacets } from "@/lib/content";

export const metadata: Metadata = { title: "Publications", description: "Papers published by the Blockchainist group." };

export default function PublicationsPage() {
  return (
    <div className="wrap page">
      <PageHead eyebrow="Publications" title={<>Papers &amp; <span className="hl">proofs</span></>}>
        Journal and conference work from the group. The <span className="pi">underlined</span> author is the principal investigator.
      </PageHead>
      <p className="note mb-6">
        <b>Source</b>
        <span>Pulled from Crossref using the principal investigator&apos;s ORCID, plus a few IEEE papers. For citation counts see Google Scholar.</span>
      </p>
      <PublicationBrowser
        initial={listPublications()}
        facets={publicationFacets()}
        areas={listResearchAreas().map(({ slug, title }) => ({ slug, title }))}
      />
    </div>
  );
}
