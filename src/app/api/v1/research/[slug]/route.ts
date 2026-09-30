import { getResearchArea, listPublications } from "@/lib/content";
import { fail, ok } from "@/lib/api/respond";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const area = getResearchArea(slug);
  if (!area) return fail(404, "not_found", `No research direction '${slug}'.`);
  return ok({ ...area, publications: listPublications({ area: slug }) });
}
