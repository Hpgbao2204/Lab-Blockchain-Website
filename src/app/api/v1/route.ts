import { endpoints } from "@/lib/api/catalog";
import { ok } from "@/lib/api/respond";

export function GET() {
  return ok({ name: "Blockchainist API", version: "v1", endpoints });
}
