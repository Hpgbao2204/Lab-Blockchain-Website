import { listPioneers } from "@/lib/content";
import { ok } from "@/lib/api/respond";

export function GET() {
  const data = listPioneers();
  return ok(data, { count: data.length });
}
