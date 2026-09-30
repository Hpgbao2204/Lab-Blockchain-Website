import { PublicationsList } from "@/components/content/publications-list";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/site/page-hero";
import { getPublicPublications } from "@/lib/data/public-content";
import { getRequestLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export const metadata = {
  title: "Publications",
};

export const dynamic = "force-dynamic";

export default async function PublicationsPage() {
  const [publications, locale] = await Promise.all([
    getPublicPublications(),
    getRequestLocale(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={translate(locale, "publicationsEyebrow")}
        title={translate(locale, "publicationsTitle")}
        highlight={translate(locale, "publicationsHighlight")}
        description={translate(locale, "publicationsDescription")}
      />
      <section className="mx-auto max-w-7xl px-6 py-14">
        {publications.length ? (
          <PublicationsList initialPublications={publications} />
        ) : (
          <EmptyState
            title={translate(locale, "noPublicationsTitle")}
            description={translate(locale, "noPublicationsDescription")}
          />
        )}
      </section>
    </>
  );
}
