import { describe, expect, it } from "vitest";
import type { Member, Publication } from "@/types/content";
import {
  defaultSiteSettings,
  derivePublicMembers,
  normalizeMemberRecord,
  normalizeProjectRecord,
  normalizePublicationRecord
} from "./public-content";

function publication(overrides: Partial<Publication>): Publication {
  return {
    id: "publication",
    title: "A publication",
    authors: [],
    orcidPutCodes: [],
    externalIds: {},
    isFeatured: false,
    isPublished: true,
    ...overrides
  };
}

function manualMember(name: string, overrides: Partial<Member> = {}): Member {
  return {
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    role: "Research member",
    avatar: { url: "https://example.com/avatar.jpg", alt: name },
    links: {},
    aliases: [],
    researchInterests: [],
    education: [],
    achievements: [],
    cvAttachmentIds: [],
    publicationIds: [],
    projectIds: [],
    order: 1,
    isActive: true,
    isPublic: true,
    hasPublicProfile: true,
    ...overrides
  };
}

describe("normalizeProjectRecord", () => {
  it("maps project records into the public project shape", () => {
    const project = normalizeProjectRecord("legacy-id", {
      title: "Lightweight Blockchain for IoT",
      leader: "Tran Tuan Dung",
      members: "Student A, Student B",
      level: "Cấp trường",
      type: "Nghiên cứu ứng dụng",
      startYear: 2024,
      endYear: 2025,
      budget: 50000000,
      fundingAgency: "UIT",
      abstract: "Research summary",
      objectives: "Research objectives",
      results: "Research results",
      url: "https://example.com/report",
      doi: "10.1000/example",
      imageUrl: "https://example.com/image.jpg",
      cloudinaryId: "blockchainist/gallery/project"
    });

    expect(project).toEqual({
      id: "legacy-id",
      title: "Lightweight Blockchain for IoT",
      slug: "legacy-id",
      description: undefined,
      status: undefined,
      leader: "Tran Tuan Dung",
      members: ["Student A", "Student B"],
      memberIds: [],
      tags: [],
      funding: undefined,
      level: "Cấp trường",
      type: "Nghiên cứu ứng dụng",
      startYear: 2024,
      endYear: 2025,
      budget: 50000000,
      fundingAgency: "UIT",
      abstract: "Research summary",
      objectives: "Research objectives",
      results: "Research results",
      url: "https://example.com/report",
      doi: "10.1000/example",
      image: {
        url: "https://example.com/image.jpg",
        cloudinaryId: "blockchainist/gallery/project",
        alt: "Lightweight Blockchain for IoT"
      },
      isFeatured: false
    });
  });
});

describe("normalizePublicationRecord", () => {
  it("defaults publication visibility to published for backward-compatible records", () => {
    expect(
      normalizePublicationRecord("publication-id", {
        title: "A publication",
        authors: ["Author A"]
      })
    ).toMatchObject({
      id: "publication-id",
      title: "A publication",
      isPublished: true
    });
  });
});

describe("normalizeMemberRecord", () => {
  it("maps avatar, nested links, and profile lists into the public member shape", () => {
    expect(
      normalizeMemberRecord("member-id", {
        name: "Ada Lovelace",
        role: "Research Fellow",
        avatarUrl: "https://example.com/avatar.jpg",
        links: {
          googleScholar: "https://scholar.google.com/citations?user=abc",
          orcid: "https://orcid.org/0000-0002-1825-0097",
          webOfScience: "https://www.webofscience.com",
          scopus: "https://www.scopus.com",
          website: "https://example.com",
          github: "https://github.com/ada"
        },
        researchInterests: ["Blockchain", "Security"],
        education: ["PhD - University A", "MSc - University B"],
        achievements: ["Award A", "Award B"],
        publicationIds: ["publication-a"],
        projectIds: ["project-a"],
        order: 7,
        isActive: false,
        isPublic: false
      })
    ).toMatchObject({
      id: "member-id",
      name: "Ada Lovelace",
      role: "Research Fellow",
      avatar: {
        url: "https://example.com/avatar.jpg",
        alt: "Ada Lovelace"
      },
      links: {
        googleScholar: "https://scholar.google.com/citations?user=abc",
        orcid: "https://orcid.org/0000-0002-1825-0097",
        webOfScience: "https://www.webofscience.com",
        scopus: "https://www.scopus.com",
        website: "https://example.com",
        github: "https://github.com/ada"
      },
      researchInterests: ["Blockchain", "Security"],
      education: ["PhD - University A", "MSc - University B"],
      achievements: ["Award A", "Award B"],
      publicationIds: ["publication-a"],
      projectIds: ["project-a"],
      order: 7,
      isActive: false,
      isPublic: false,
      hasPublicProfile: false
    });
  });
});

describe("derivePublicMembers", () => {
  it("derives one contributor per normalized published author and counts distinct works", () => {
    const members = derivePublicMembers([], [
      publication({ id: "one", authors: ["Ada Lovelace", " ada   lovelace "] }),
      publication({ id: "two", authors: ["Ada Lovelace"] }),
      publication({ id: "hidden", authors: ["Hidden Author"], isPublished: false })
    ]);

    expect(members).toMatchObject([
      {
        name: "Ada Lovelace",
        role: "Publication contributor",
        publicationCount: 2
      }
    ]);
  });

  it("enriches matching contributors and retains unmatched active manual members", () => {
    const members = derivePublicMembers(
      [
        manualMember("Ada Lovelace", { role: "PhD candidate", bio: "Manual profile" }),
        manualMember("Grace Hopper")
      ],
      [publication({ id: "one", authors: ["ada lovelace"] })]
    );

    expect(members).toMatchObject([
      {
        name: "Ada Lovelace",
        role: "PhD candidate",
        bio: "Manual profile",
        publicationCount: 1
      },
      {
        name: "Grace Hopper"
      }
    ]);
    expect(members[1].publicationCount).toBeUndefined();
  });

  it("hides contributors when their manual profile is inactive", () => {
    const members = derivePublicMembers(
      [manualMember("Ada Lovelace", { role: "Inactive profile", isActive: false })],
      [publication({ authors: ["Ada Lovelace"] })]
    );

    expect(members).toEqual([]);
  });

  it("lists active private members without exposing their profile details", () => {
    const members = derivePublicMembers(
      [manualMember("Ada Lovelace", {
        isPublic: false,
        bio: "Private bio",
        links: { github: "https://github.com/ada" },
        researchInterests: ["Private interest"],
        education: ["Private education"],
        achievements: ["Private achievement"],
        cvUrl: "https://example.com/private-cv"
      })],
      [publication({ authors: ["Ada Lovelace"] })]
    );

    expect(members).toMatchObject([{
      name: "Ada Lovelace",
      hasPublicProfile: false,
      links: {},
      researchInterests: [],
      education: [],
      achievements: []
    }]);
    expect(members[0].bio).toBeUndefined();
    expect(members[0].cvUrl).toBeUndefined();
  });

  it("omits unmapped contributors when only approved public profiles are requested", () => {
    const members = derivePublicMembers(
      [manualMember("Ada Lovelace")],
      [publication({ authors: ["Ada Lovelace", "Unmapped Contributor"] })],
      false
    );

    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ name: "Ada Lovelace", publicationCount: 1 });
  });

  it("merges aliases of the same canonical member and aggregates publication counts", () => {
    const members = derivePublicMembers(
      [
        manualMember("Tuan-Dung Tran", {
          aliases: ["Tran, T.-D.", "Tuan, D.T."],
          role: "Principal Investigator"
        })
      ],
      [
        publication({ id: "p1", authors: ["Tuan-Dung Tran"] }),
        publication({ id: "p2", authors: ["Tran, T.-D."] }),
        publication({ id: "p3", authors: ["Tuan, D.T."] }),
        publication({ id: "p4", authors: ["Tuan-Dung Tran", "Tran, T.-D."] }),
        publication({ id: "p5", authors: ["Tuan, D.T.", "Another Researcher"] })
      ]
    );

    expect(members).toMatchObject([
      {
        name: "Tuan-Dung Tran",
        role: "Principal Investigator",
        publicationCount: 5
      },
      {
        name: "Another Researcher",
        role: "Publication contributor",
        publicationCount: 1
      }
    ]);
  });

  it("keeps unmapped names separate instead of inferring them as aliases", () => {
    const members = derivePublicMembers(
      [manualMember("Van-Hau Pham", { aliases: ["Pham, V.-H."] })],
      [
        publication({ id: "p1", authors: ["Van-Hau Pham"] }),
        publication({ id: "p2", authors: ["Pham, V.-H."] }),
        publication({ id: "p3", authors: ["Hau, V.P."] })
      ]
    );

    expect(members).toHaveLength(2);
    expect(members).toMatchObject([
      { name: "Van-Hau Pham", publicationCount: 2 },
      { name: "Hau, V.P.", publicationCount: 1 }
    ]);
  });

  it("keeps a canonical name owned by its matching member when another member claims it as an alias", () => {
    const members = derivePublicMembers(
      [
        manualMember("Canonical Researcher"),
        manualMember("Alias Owner", { aliases: ["Canonical Researcher"] })
      ],
      [publication({ id: "p1", authors: ["Canonical Researcher"] })]
    );
    const membersByName = new Map(members.map((member) => [member.name, member]));

    expect(membersByName.get("Canonical Researcher")?.publicationCount).toBe(1);
    expect(membersByName.get("Alias Owner")?.publicationCount).toBeUndefined();
  });

  it("leaves an alias unmapped when multiple members claim it", () => {
    const members = derivePublicMembers(
      [
        manualMember("First Researcher", { aliases: ["Shared Alias"] }),
        manualMember("Second Researcher", { aliases: ["Shared Alias"] })
      ],
      [publication({ id: "p1", authors: ["Shared Alias"] })]
    );
    const membersByName = new Map(members.map((member) => [member.name, member]));

    expect(membersByName.get("Shared Alias")?.publicationCount).toBe(1);
    expect(membersByName.get("First Researcher")?.publicationCount).toBeUndefined();
    expect(membersByName.get("Second Researcher")?.publicationCount).toBeUndefined();
  });
});

describe("defaultSiteSettings", () => {
  it("uses the supplied local portrait as the PI fallback avatar", () => {
    expect(defaultSiteSettings.principalInvestigator.avatarUrl).toBe("/tuandung-tran.png");
  });

  it("does not expose an unconfigured Google Scholar profile", () => {
    expect(defaultSiteSettings.googleScholarUrl).toBeUndefined();
  });
});
