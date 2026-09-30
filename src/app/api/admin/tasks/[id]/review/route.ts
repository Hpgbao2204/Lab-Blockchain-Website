import { jsonError } from "@/lib/api/auth";

export async function POST(_request: Request, _context?: { params: Promise<{ id: string }> | { id: string } }) {
  void _request;
  void _context;
  return jsonError("Task review has been replaced by owner-managed statuses", 410);
}
