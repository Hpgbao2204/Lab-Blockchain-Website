import { listPeople } from "@/lib/content";
import { ok } from "@/lib/api/respond";

export function GET() {
  const data = listPeople();
  return ok(data, { count: data.length, sample: data.filter((p) => p.sample).length });
}
