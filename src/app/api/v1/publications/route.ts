import { listPublications, publicationFacets, publicationQuerySchema } from "@/lib/content";
import { badQuery, ok, searchParamsObject } from "@/lib/api/respond";

export function GET(req: Request) {
  const parsed = publicationQuerySchema.safeParse(searchParamsObject(req.url));
  if (!parsed.success) return badQuery(parsed.error);
  const data = listPublications(parsed.data);
  return ok(data, { count: data.length, query: parsed.data, facets: publicationFacets(), source: "sample" });
}
