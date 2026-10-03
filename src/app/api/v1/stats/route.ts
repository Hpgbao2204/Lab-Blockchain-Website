import { getStats } from "@/lib/content";
import { ok } from "@/lib/api/respond";
import { getDb } from "@/server/db";
import { allPublications } from "@/server/services/publications";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(getStats(await allPublications(await getDb())));
}
