import type { MetadataRoute } from "next";
import { listResearchAreas } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";
import { getDb } from "@/server/db";
import { listPublicPeople } from "@/server/services/people";
import { listNews } from "@/server/services/news";

export const dynamic = "force-dynamic";

/** Public pages only; the member wall and admin are behind a login and marked noindex. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/news", "/research", "/publications", "/team", "/pioneers", "/join", "/developers"];
  const db = await getDb();
  const [people, news] = await Promise.all([listPublicPeople(db).then((all) => all.filter((p) => p.hasPage)), listNews(db, null)]);
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...listResearchAreas().map((a) => ({ url: `${siteUrl}/research/${a.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...people.map((p) => ({ url: `${siteUrl}/people/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...news.map((n) => ({ url: `${siteUrl}/news/${n.slug}`, lastModified: n.updatedAt, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
