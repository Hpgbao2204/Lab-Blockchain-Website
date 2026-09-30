import { describe, expect, it } from "vitest";
import { parseAdminContentInput, parseApplicationStatusUpdate, parseSettingsUpdate } from "./content";

describe("parseAdminContentInput", () => {
  it("accepts a valid member payload with aliases", () => {
    expect(
      parseAdminContentInput("members", {
        name: "Research Member",
        slug: "research-member",
        role: "PhD Candidate",
        avatarUrl: "https://example.com/avatar.jpg",
        links: {
          googleScholar: "https://scholar.google.com/citations?user=abc",
          orcid: "https://orcid.org/0000-0002-1825-0097",
          webOfScience: "https://www.webofscience.com",
          scopus: "https://www.scopus.com",
          website: "https://example.com",
          github: "https://github.com/research-member"
        },
        education: ["MIT - PhD Computer Science"],
        achievements: ["Best Paper Award - IEEE 2024"],
        aliases: ["Member, R.", "R. Member"],
        isActive: true
      })
    ).toMatchObject({
      name: "Research Member",
      slug: "research-member",
      role: "PhD Candidate",
      avatarUrl: "https://example.com/avatar.jpg",
      links: {
        googleScholar: "https://scholar.google.com/citations?user=abc",
        orcid: "https://orcid.org/0000-0002-1825-0097",
        webOfScience: "https://www.webofscience.com",
        scopus: "https://www.scopus.com",
        website: "https://example.com",
        github: "https://github.com/research-member"
      },
      education: ["MIT - PhD Computer Science"],
      achievements: ["Best Paper Award - IEEE 2024"],
      aliases: ["Member, R.", "R. Member"],
      isActive: true
    });
  });

  it("rejects invalid member urls", () => {
    expect(() =>
      parseAdminContentInput("members", {
        name: "Research Member",
        slug: "research-member",
        role: "PhD Candidate",
        avatarUrl: "not-a-url"
      })
    ).toThrow("Invalid members input");
  });

  it("rejects client supplied audit fields and ORCID sync metadata", () => {
    expect(() =>
      parseAdminContentInput("publications", {
        title: "Secure ledgers",
        authors: ["Researcher A"],
        createdAt: "2026-01-01",
        orcidPutCodes: [123]
      })
    ).toThrow("Invalid publications input");
  });

  it("rejects an empty update", () => {
    expect(() => parseAdminContentInput("projects", {}, true)).toThrow("Invalid projects input");
  });
});

describe("admin status and settings validation", () => {
  it("only permits application status updates", () => {
    expect(parseApplicationStatusUpdate({ status: "contacted" })).toEqual({ status: "contacted" });
    expect(() => parseApplicationStatusUpdate({ status: "contacted", name: "Changed" })).toThrow(
      "Invalid application status update"
    );
  });

  it("rejects server-managed ORCID sync settings", () => {
    expect(() => parseSettingsUpdate({ orcidSync: { status: "succeeded" } })).toThrow(
      "Invalid settings update"
    );
  });

  it("accepts a configurable Google Scholar URL", () => {
    expect(
      parseSettingsUpdate({
        googleScholarUrl: "https://scholar.google.com/citations?user=abc"
      })
    ).toEqual({
      googleScholarUrl: "https://scholar.google.com/citations?user=abc"
    });
  });
});
