/**
 * Canonical origin for metadata, sitemap and robots: NEXT_PUBLIC_SITE_URL, else the project's
 * production domain that Vercel provides, else localhost.
 */
const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || vercelProd || "http://localhost:3000").replace(/\/+$/, "");
