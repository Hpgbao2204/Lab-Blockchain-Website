import { badQuery, ok, searchParamsObject } from "@/lib/api/respond";
import { getDb } from "@/server/db";
import { browseVenues, venueQuerySchema } from "@/server/services/venues";

export const dynamic = "force-dynamic";

/** Conference and journal search. Without `kind`, the best six of each kind. */
export async function GET(req: Request) {
  const parsed = venueQuerySchema.safeParse(searchParamsObject(req.url));
  if (!parsed.success) return badQuery(parsed.error);
  const res = await browseVenues(await getDb(), parsed.data);
  const meta = { total: res.total, page: res.page, pages: res.pages, counts: res.counts, fuzzy: res.fuzzy };
  return ok(res.kind ? res.items : res.groups, meta);
}
