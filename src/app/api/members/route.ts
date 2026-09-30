import { getPublicMembers } from "@/lib/data/public-content";

export async function GET() {
  const data = await getPublicMembers();
  return Response.json({ data });
}
