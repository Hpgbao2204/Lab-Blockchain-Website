import { listResearchAreas } from "@/lib/content";
import { ok } from "@/lib/api/respond";

export function GET() {
  const data = listResearchAreas();
  return ok(data, { count: data.length });
}
