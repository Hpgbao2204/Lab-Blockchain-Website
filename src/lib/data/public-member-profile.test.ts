import { describe, expect, it, vi } from "vitest";

const records = vi.hoisted(() => ({
  member: null as { id: string; data: () => Record<string, unknown> } | null,
  publications: [] as { id: string; data: () => Record<string, unknown> }[],
  projects: [] as { id: string; data: () => Record<string, unknown> }[]
}));

const getAdminDb = vi.hoisted(() =>
  vi.fn(() => ({
    collection: (name: string) => ({
      where: () => ({
        limit: () => ({ get: () => Promise.resolve({ docs: records.member ? [records.member] : [] }) })
      }),
      get: () => Promise.resolve({ docs: name === "publications" ? records.publications : name === "projects" ? records.projects : [] })
    })
  }))
);

vi.mock("@/lib/firebase/admin", () => ({ getAdminDb }));

import { getPublicMemberProfile } from "./public-content";

describe("getPublicMemberProfile", () => {
  it("returns only a public active profile and keeps selected work in member-defined order", async () => {
    records.member = {
      id: "member-1",
      data: () => ({
        name: "Ada Lovelace",
        slug: "ada-lovelace-cv",
        role: "Research member",
        isActive: true,
        isPublic: true,
        publicationIds: ["publication-2", "publication-1"],
        projectIds: ["project-2", "project-1"]
      })
    };
    records.publications = [
      { id: "publication-1", data: () => ({ title: "First", authors: [], isPublished: true }) },
      { id: "publication-2", data: () => ({ title: "Second", authors: [], isPublished: true }) }
    ];
    records.projects = [
      { id: "project-1", data: () => ({ title: "First project" }) },
      { id: "project-2", data: () => ({ title: "Second project" }) }
    ];

    const profile = await getPublicMemberProfile("ada-lovelace-cv");

    expect(profile?.publications.map((publication) => publication.id)).toEqual(["publication-2", "publication-1"]);
    expect(profile?.projects.map((project) => project.id)).toEqual(["project-2", "project-1"]);
  });

  it("does not expose an inactive or private profile", async () => {
    records.member = {
      id: "member-2",
      data: () => ({ name: "Private Member", slug: "private-member-cv", role: "Research member", isActive: true, isPublic: false })
    };
    records.publications = [];
    records.projects = [];

    await expect(getPublicMemberProfile("private-member-cv")).resolves.toBeNull();
  });
});
