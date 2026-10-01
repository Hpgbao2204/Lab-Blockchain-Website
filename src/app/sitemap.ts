import type { MetadataRoute } from "next";
import { listResearchAreas } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";
import { getDb } from "@/server/db";
import { listPublicPeople } from "@/server/services/people";

export const dynamic = "force-dynamic";

/** Public pages only; the member wall and admin are behind a login and marked noindex. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/research", "/publications", "/people", "/pioneers", "/join", "/developers"];
  const people = (await listPublicPeople(await getDb())).filter((p) => p.hasPage);
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...listResearchAreas().map((a) => ({ url: `${siteUrl}/research/${a.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...people.map((p) => ({ url: `${siteUrl}/people/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
