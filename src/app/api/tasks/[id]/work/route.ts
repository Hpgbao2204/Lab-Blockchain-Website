import { jsonError } from "@/lib/api/auth";

export async function POST(_request: Request, _context?: { params: Promise<{ id: string }> | { id: string } }) {
  void _request;
  void _context;
  return jsonError("Task status is managed by the wall owner", 410);
}
