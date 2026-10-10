import type { MetadataRoute } from "next";
import { listResearchAreas } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";
import { getDb } from "@/server/db";
import { listPublicPeople } from "@/server/services/people";
import { listNews } from "@/server/services/news";
import { postHref } from "@/components/news/news-card";

export const dynamic = "force-dynamic";

/** Public pages only; the member wall and admin are behind a login and marked noindex. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/news", "/research", "/publications", "/team", "/pioneers", "/join", "/tutorials"];
  const db = await getDb();
  const [people, news, tutorials] = await Promise.all([
    listPublicPeople(db).then((all) => all.filter((p) => p.hasPage)),
    listNews(db, null),
    listNews(db, null, { kind: "tutorial" }),
  ]);
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...listResearchAreas().map((a) => ({ url: `${siteUrl}/research/${a.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...people.map((p) => ({ url: `${siteUrl}/people/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...[...news, ...tutorials].map((n) => ({ url: `${siteUrl}${postHref(n)}`, lastModified: n.updatedAt, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
