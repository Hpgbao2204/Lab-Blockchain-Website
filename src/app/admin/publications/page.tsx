import type { Metadata } from "next";
import { PublicationsAdmin } from "@/components/app/admin-publications";
import { PageHead } from "@/components/site/page-head";
import { listResearchAreas } from "@/lib/content";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { listAdminPublications } from "@/server/services/publications";

export const metadata: Metadata = { title: "Publications" };

export default async function PublicationsAdminPage() {
  const user = await requirePageUser({ admin: true });
  const pubs = await listAdminPublications(await getDb(), user);
  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHead eyebrow="Admin · public site" title={<>Publications</>}>
        The list on /publications comes from Crossref (the PI&apos;s ORCID). Add papers Crossref misses, such as new acceptances, and hide any that
        should not be shown. Papers from Crossref can only be hidden, not edited.
      </PageHead>
      <PublicationsAdmin pubs={pubs} areas={listResearchAreas().map(({ slug, title }) => ({ slug, title }))} />
    </div>
  );
}
