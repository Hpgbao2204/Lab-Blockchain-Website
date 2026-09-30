import { ok } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export function GET() {
  return ok({ status: "ok", time: new Date().toISOString() }, undefined, { cache: false });
}
