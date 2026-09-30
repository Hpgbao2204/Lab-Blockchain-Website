import { getPublicPublications } from "@/lib/data/public-content";

export async function GET() {
  const data = await getPublicPublications();
  return Response.json({ data });
}
