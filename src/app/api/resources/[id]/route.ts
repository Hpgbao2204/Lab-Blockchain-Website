import { isAuthError, jsonError, requireUser } from "@/lib/api/auth";

export async function PATCH(request: Request, _context: { params: Promise<{ id: string }> | { id: string } }) {
  void _context;
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  return jsonError("Resource links have moved to task comments.", 410);
}

export async function DELETE(request: Request, _context: { params: Promise<{ id: string }> | { id: string } }) {
  void _context;
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  return jsonError("Resource links have moved to task comments.", 410);
}
