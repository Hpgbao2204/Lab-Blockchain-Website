import { getStats } from "@/lib/content";
import { ok } from "@/lib/api/respond";

export function GET() {
  return ok(getStats());
}
