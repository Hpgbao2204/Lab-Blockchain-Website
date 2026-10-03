import { describe, expect, it, vi } from "vitest";
import { createTestDb } from "@/server/db/client";

// public routes merge the admin's publication changes from the database
vi.mock("@/server/db", () => {
  const db = createTestDb();
  return { getDb: () => db };
});
import { GET as index } from "./route";
import { GET as publications } from "./publications/route";
import { GET as researchOne } from "./research/[slug]/route";
import { GET as stats } from "./stats/route";
import { GET as unknown } from "./[...path]/route";

const req = (path: string) => new Request(`http://localhost${path}`);

describe("/api/v1", () => {
  it("lists endpoints", async () => {
    const body = await index().json();
    expect(body.data.version).toBe("v1");
    expect(body.data.endpoints.length).toBeGreaterThan(3);
  });

  it("filters publications and reports meta", async () => {
    const res = await publications(req("/api/v1/publications?kind=conference"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("s-maxage");
    const body = await res.json();
    expect(body.data.every((p: { kind: string }) => p.kind === "conference")).toBe(true);
    expect(body.meta.count).toBe(body.data.length);
  });

  it("rejects bad query params with the error envelope", async () => {
    const res = await publications(req("/api/v1/publications?year=abc"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("invalid_query");
  });

  it("returns one research area with related papers, 404 otherwise", async () => {
    const ok = await researchOne(req("/api/v1/research/cross-chain"), { params: Promise.resolve({ slug: "cross-chain" }) });
    const body = await ok.json();
    expect(body.data.slug).toBe("cross-chain");
    expect(body.data.publications.length).toBeGreaterThan(0);
    const missing = await researchOne(req("/api/v1/research/nope"), { params: Promise.resolve({ slug: "nope" }) });
    expect(missing.status).toBe(404);
  });

  it("serves stats and a JSON 404 for unknown paths", async () => {
    expect((await (await stats()).json()).data.publications).toBeGreaterThan(0);
    const res = unknown();
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("not_found");
  });
});
