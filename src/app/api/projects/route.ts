import { getPublicProjects } from "@/lib/data/public-content";

export async function GET() {
  const data = await getPublicProjects();
  return Response.json({ data });
}
