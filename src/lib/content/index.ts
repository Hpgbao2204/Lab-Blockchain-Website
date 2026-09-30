/**
 * Read-side content repository. Pages (server components) and `/api/v1/*` route
 * handlers both go through these functions, so swapping the static data for
 * Supabase/ORCID in M2–M3 only touches this module.
 */
import { z } from "zod";
import { people, type Person } from "@/data/people";
import { pioneers, type Pioneer } from "@/data/pioneers";
import { publications, type Publication, type PublicationKind } from "@/data/publications";
import { researchAreas, type ResearchArea } from "@/data/research";

export type { Person, Pioneer, Publication, PublicationKind, ResearchArea };

export const PUBLICATION_KINDS = ["journal", "conference", "article"] as const satisfies readonly PublicationKind[];

export const publicationQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  kind: z.enum(PUBLICATION_KINDS).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  area: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type PublicationQuery = z.infer<typeof publicationQuerySchema>;

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

export function listPublications(query: PublicationQuery = {}): Publication[] {
  const q = query.q ? norm(query.q) : "";
  const rows = publications
    .filter((p) => !query.kind || p.kind === query.kind)
    .filter((p) => !query.year || p.year === query.year)
    .filter((p) => !query.area || p.areas.includes(query.area))
    .filter((p) => !q || norm([p.name, p.title, p.venue ?? "", ...p.authors].join(" ")).includes(q))
    .sort((a, b) => b.year - a.year);
  return query.limit ? rows.slice(0, query.limit) : rows;
}

export function publicationFacets() {
  const byKind = Object.fromEntries(PUBLICATION_KINDS.map((k) => [k, publications.filter((p) => p.kind === k).length])) as Record<PublicationKind, number>;
  const years = [...new Set(publications.map((p) => p.year))].sort((a, b) => b - a);
  return { total: publications.length, byKind, years };
}

export const listResearchAreas = (): ResearchArea[] => researchAreas;
export const getResearchArea = (slug: string): ResearchArea | undefined => researchAreas.find((a) => a.slug === slug);

export const listPeople = (): Person[] => people;
export const listPioneers = (): Pioneer[] => pioneers;

export function getStats() {
  const f = publicationFacets();
  return {
    publications: f.total,
    journals: f.byKind.journal,
    researchAreas: researchAreas.length,
    members: people.length,
    pioneers: pioneers.length,
    since: Math.min(...f.years),
  };
}

export const doiUrl = (doi: string) => `https://doi.org/${doi}`;
export const scholarSearchUrl = (p: Publication) =>
  `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${p.name}: ${p.title}"`)}`;
export const publicationUrl = (p: Publication) => (p.doi ? doiUrl(p.doi) : scholarSearchUrl(p));
