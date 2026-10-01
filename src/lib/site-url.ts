/** Canonical origin for metadata, sitemap and robots (set NEXT_PUBLIC_SITE_URL to the real domain). */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
