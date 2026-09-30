import { beforeEach, describe, expect, it, vi } from "vitest";

const getAdminDb = vi.fn();
const getOrcidWorks = vi.fn();
const hasOrcidCredentials = vi.fn();

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb }));
vi.mock("@/lib/orcid/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/orcid/client")>("@/lib/orcid/client");
  return {
    ...actual,
    getOrcidWorks,
    hasOrcidCredentials
  };
});
vi.mock("@/lib/api/auth", () => ({
  requireAdmin: async () => ({ uid: "admin-id", email: "admin.blockchainist.uit@gmail.com" }),
  isAuthError: (value: unknown) => value instanceof Response,
  jsonError: (message: string, status: number) => Response.json({ error: message }, { status })
}));

describe("POST /api/admin/orcid/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ORCID_ID = "0000-0003-1156-7072";
  });

  it("returns 503 when ORCID client credentials are unavailable", async () => {
    hasOrcidCredentials.mockReturnValue(false);
    const { POST } = await import("./route");

    const response = await POST(new Request("https://example.com/api/admin/orcid/sync", { method: "POST" }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "ORCID Public API credentials are not configured"
    });
    expect(getAdminDb).not.toHaveBeenCalled();
  });

  it("imports normalized works and records a successful sync", async () => {
    hasOrcidCredentials.mockReturnValue(true);
    const homepageGet = vi.fn().mockResolvedValue({ exists: false, data: () => undefined });
    const homepageSet = vi.fn().mockResolvedValue(undefined);
    const syncSet = vi.fn().mockResolvedValue(undefined);
    const publicationGet = vi.fn().mockResolvedValue({ docs: [] });
    const publicationAdd = vi.fn().mockResolvedValue({ id: "publication-id" });
    getAdminDb.mockReturnValue({
      collection: (name: string) => {
        if (name === "siteSettings") return { doc: () => ({ get: homepageGet, set: homepageSet }) };
        if (name === "syncRuns") return { add: vi.fn().mockResolvedValue({ id: "sync-run-id", set: syncSet }) };
        return { get: publicationGet, add: publicationAdd, doc: vi.fn() };
      }
    });
    getOrcidWorks.mockResolvedValue([
      {
        "put-code": 1,
        title: { title: { value: "Secure systems" } },
        "work-contributors": { contributor: [] }
      }
    ]);
    const { POST } = await import("./route");

    const response = await POST(new Request("https://example.com/api/admin/orcid/sync", { method: "POST" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { added: 1, updated: 0, skipped: 0, syncRunId: "sync-run-id" }
    });
    expect(publicationAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: "Secure systems",
      isFeatured: false,
      isPublished: true
    }));
    expect(syncSet).toHaveBeenCalledWith(expect.objectContaining({ status: "succeeded" }), { merge: true });
  });

  it("records upstream failures and returns 502", async () => {
    hasOrcidCredentials.mockReturnValue(true);
    const homepageSet = vi.fn().mockResolvedValue(undefined);
    const syncSet = vi.fn().mockResolvedValue(undefined);
    getAdminDb.mockReturnValue({
      collection: (name: string) => {
        if (name === "siteSettings") {
          return { doc: () => ({ get: vi.fn().mockResolvedValue({ exists: false }), set: homepageSet }) };
        }
        return { add: vi.fn().mockResolvedValue({ id: "sync-run-id", set: syncSet }) };
      }
    });
    const { OrcidUpstreamError } = await import("@/lib/orcid/client");
    getOrcidWorks.mockRejectedValue(new OrcidUpstreamError("ORCID works request failed with HTTP 500"));
    const { POST } = await import("./route");

    const response = await POST(new Request("https://example.com/api/admin/orcid/sync", { method: "POST" }));

    expect(response.status).toBe(502);
    expect(syncSet).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }), { merge: true });
    expect(homepageSet).toHaveBeenCalledWith(expect.objectContaining({
      orcidSync: expect.objectContaining({ status: "failed" })
    }), { merge: true });
  });
});
