import { fail, ok } from "@/lib/api/respond";
import { getDb } from "@/server/db";
import { getVenue, similarVenues } from "@/server/services/venues";

export const dynamic = "force-dynamic";

const KINDS = { conferences: "conference", journals: "journal" } as const;

/** One venue with every figure from the source file, and similar venues. */
export async function GET(_req: Request, ctx: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await ctx.params;
  const k = KINDS[kind as keyof typeof KINDS];
  if (!k) return fail(404, "not_found", "Use /api/v1/venues/conferences/:slug or /api/v1/venues/journals/:slug.");
  const db = await getDb();
  const venue = await getVenue(db, k, slug);
  if (!venue) return fail(404, "not_found", "No such venue.");
  const { kind: k2, slug: s2, name, acronym, issn, eissn, publisher, country, rank, ccf, quartile, impact, hIndex, topTier, flags, areas, topics, data, updatedAt } = venue;
  const out = { kind: k2, slug: s2, name, acronym, issn, eissn, publisher, country, rank, ccf, quartile, impact, hIndex, topTier, flags, areas, topics, data, updatedAt };
  return ok({ ...out, similar: await similarVenues(db, venue) });
}
