import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
import { venueHref } from "@/lib/venues/topics";
import { getDb } from "@/server/db";
import { listVenuePaths } from "@/server/services/venues";

export const dynamic = "force-dynamic";

/** One page per conference and per ranked journal (/venues/sitemap.xml, listed in robots.txt). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await listVenuePaths(await getDb()).catch(() => []);
  return rows.map((r) => ({ url: `${siteUrl}${venueHref(r)}`, lastModified: r.updatedAt, changeFrequency: "monthly" as const, priority: 0.4 }));
}
