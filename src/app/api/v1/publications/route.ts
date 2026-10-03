import { listPublications, publicationFacets, publicationQuerySchema } from "@/lib/content";
import { badQuery, ok, searchParamsObject } from "@/lib/api/respond";
import { getDb } from "@/server/db";
import { allPublications } from "@/server/services/publications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const parsed = publicationQuerySchema.safeParse(searchParamsObject(req.url));
  if (!parsed.success) return badQuery(parsed.error);
  const all = await allPublications(await getDb());
  const data = listPublications(parsed.data, all);
  return ok(data, { count: data.length, query: parsed.data, facets: publicationFacets(all), source: "crossref+manual" });
}
