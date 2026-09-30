import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const record = {
    exists: true,
    data: {
      name: "Ada Lovelace",
      slug: "ada-lovelace",
      role: "Research member",
      links: { googleScholar: "https://scholar.example.com", orcid: "https://orcid.org/0000-0000-0000-0000" },
      aliases: [],
      researchInterests: [],
      education: [],
      achievements: [],
      order: 1,
      isActive: true,
      isPublic: false
    } as Record<string, unknown>
  };
  const memberSet = vi.fn();
  const memberDoc = vi.fn((id: string) => ({
    id,
    get: vi.fn().mockImplementation(() => Promise.resolve({ id, exists: record.exists, data: () => record.data })),
    set: memberSet
  }));
  const content = { exists: true, publicationPublished: true };
  const contentDoc = vi.fn((collection: string, id: string) => ({
    id,
    get: vi.fn().mockImplementation(() =>
      Promise.resolve({
        id,
        exists: content.exists,
        data: () => collection === "publications" ? { title: "Publication", authors: [], isPublished: content.publicationPublished } : { title: "Project" }
      })
    )
  }));
  const getAdminDb = vi.fn(() => ({
    collection: vi.fn((name: string) => ({ doc: name === "members" ? memberDoc : (id: string) => contentDoc(name, id) }))
  }));
  const session = {
    uid: "member-uid",
    email: "member@example.com",
    role: "member" as const,
    status: "active" as const,
    memberId: "member-1" as string | null
  };
  return { content, getAdminDb, memberDoc, memberSet, record, session };
});

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb: mocks.getAdminDb }));
vi.mock("@/lib/api/auth", () => ({
  requireUser: async () => mocks.session,
  isAuthError: (value: unknown) => value instanceof Response,
  jsonError: (message: string, status: number) => Response.json({ error: message }, { status })
}));

import { GET, PATCH } from "./route";

function request(method: string, body?: Record<string, unknown>) {
  return new Request("https://example.com/api/portal/profile", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
}

describe("member profile portal API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.record.exists = true;
    mocks.record.data = {
      name: "Ada Lovelace",
      slug: "ada-lovelace",
      role: "Research member",
      links: { googleScholar: "https://scholar.example.com", orcid: "https://orcid.org/0000-0000-0000-0000" },
      aliases: [],
      researchInterests: [],
      education: [],
      achievements: [],
      order: 1,
      isActive: true,
      isPublic: false
    };
    mocks.session.memberId = "member-1";
    mocks.content.exists = true;
    mocks.content.publicationPublished = true;
  });

  it("returns only the profile linked to the authenticated member", async () => {
    const response = await GET(request("GET"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ data: { id: "member-1", name: "Ada Lovelace" } });
    expect(mocks.memberDoc).toHaveBeenCalledWith("member-1");
  });

  it("updates allowed fields on the linked profile and preserves unrelated links", async () => {
    const response = await PATCH(
      request("PATCH", {
        links: { website: "https://example.com", github: "https://github.com/ada" },
        isPublic: true
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.memberSet).toHaveBeenCalledWith(
      expect.objectContaining({
        isPublic: true,
        updatedBy: "member-uid",
        links: {
          googleScholar: "https://scholar.example.com",
          orcid: "https://orcid.org/0000-0000-0000-0000",
          website: "https://example.com",
          github: "https://github.com/ada"
        }
      }),
      { merge: true }
    );
  });

  it("rejects forged identity and system fields", async () => {
    const response = await PATCH(request("PATCH", { memberId: "member-2", isActive: false }));

    expect(response.status).toBe(400);
    expect(mocks.memberSet).not.toHaveBeenCalled();
  });

  it("requires a valid ORCID before saving a profile", async () => {
    mocks.record.data.links = {};

    const response = await PATCH(request("PATCH", { bio: "Updated bio" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining("ORCID") });
  });

  it("rejects references to records that are not publicly available", async () => {
    mocks.content.exists = false;

    const response = await PATCH(request("PATCH", { publicationIds: ["missing-publication"] }));

    expect(response.status).toBe(400);
    expect(mocks.memberSet).not.toHaveBeenCalled();
  });

  it("rejects an account that has no linked profile", async () => {
    mocks.session.memberId = null;

    const response = await GET(request("GET"));

    expect(response.status).toBe(403);
  });
});
