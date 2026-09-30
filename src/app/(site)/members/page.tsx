import { MemberCard } from "@/components/content/member-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/site/page-hero";
import { getPublicMembers } from "@/lib/data/public-content";
import { getRequestLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export const metadata = {
  title: "Contributors",
};

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const [members, locale] = await Promise.all([
    getPublicMembers({ includeUnmappedContributors: false }),
    getRequestLocale(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={translate(locale, "contributorsEyebrow")}
        title={translate(locale, "contributorsTitle")}
        highlight={translate(locale, "contributorsHighlight")}
        description={translate(locale, "contributorsDescription")}
      />
      <section className="mx-auto max-w-7xl px-6 py-14">
        {members.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={translate(locale, "noContributorsTitle")}
            description={translate(locale, "noContributorsDescription")}
          />
        )}
      </section>
    </>
  );
}
