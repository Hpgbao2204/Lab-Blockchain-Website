import { ok } from "@/lib/api/respond";
import { getDb } from "@/server/db";
import { listPublicPeople } from "@/server/services/people";

export const dynamic = "force-dynamic";

/** Public roster: the PI and every member who published a profile (portfolio link or CV). */
export async function GET() {
  const data = await listPublicPeople(await getDb());
  return ok(data, { count: data.length, sample: data.filter((p) => p.sample).length });
}
