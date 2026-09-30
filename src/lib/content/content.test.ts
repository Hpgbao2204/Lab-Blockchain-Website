import { describe, expect, it } from "vitest";
import { publications } from "@/data/publications";
import { researchAreas } from "@/data/research";
import { getStats, listPublications, publicationFacets, publicationQuerySchema, publicationUrl } from ".";

describe("content", () => {
  it("tags publications only with known research areas", () => {
    const slugs = new Set(researchAreas.map((a) => a.slug));
    for (const p of publications) for (const a of p.areas) expect(slugs.has(a), `${p.id}:${a}`).toBe(true);
  });

  it("lists newest first and filters by kind, year, area and text", () => {
    const all = listPublications();
    expect(all.map((p) => p.year)).toEqual([...all.map((p) => p.year)].sort((a, b) => b - a));
    expect(listPublications({ kind: "journal" }).every((p) => p.kind === "journal")).toBe(true);
    expect(listPublications({ year: 2026 }).every((p) => p.year === 2026)).toBe(true);
    expect(listPublications({ area: "consensus" }).map((p) => p.id)).toContain("proof-of-merit");
    expect(listPublications().every((p) => p.areas.length > 0)).toBe(true);
    expect(listPublications({ q: "ACHERON" }).map((p) => p.id)).toEqual(["acheron"]);
    expect(listPublications({ q: "tuan-dung tran" }).length).toBeGreaterThan(10);
    expect(listPublications({ limit: 2 })).toHaveLength(2);
  });

  it("validates query params", () => {
    expect(publicationQuerySchema.safeParse({ kind: "book" }).success).toBe(false);
    expect(publicationQuerySchema.parse({ year: "2025" }).year).toBe(2025);
  });

  it("computes facets and stats from the same data", () => {
    const f = publicationFacets();
    expect(f.byKind.journal + f.byKind.conference + f.byKind.article).toBe(f.total);
    expect(getStats().publications).toBe(f.total);
  });

  it("links to DOI when present, Scholar otherwise", () => {
    expect(publicationUrl(publications.find((p) => p.doi)!)).toMatch(/^https:\/\/doi\.org\//);
    expect(publicationUrl(publications.find((p) => !p.doi)!)).toMatch(/^https:\/\/scholar\.google\.com\//);
  });
});

describe("isPI", () => {
  it("recognises every spelling of the principal investigator", async () => {
    const { isPI } = await import("@/data/publications");
    for (const n of ["Tuan-Dung Tran", "Dung Tuan Tran", "TD Tran", "Dũng Trần Tuấn"]) expect(isPI(n), n).toBe(true);
    expect(isPI("Van-Hau Pham")).toBe(false);
  });
});
