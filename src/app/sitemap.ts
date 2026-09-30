import type { MetadataRoute } from "next";
import { listResearchAreas } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";

/** Public pages only; the member wall and admin are behind a login and marked noindex. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/research", "/publications", "/people", "/pioneers", "/join", "/developers"];
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...listResearchAreas().map((a) => ({ url: `${siteUrl}/research/${a.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
