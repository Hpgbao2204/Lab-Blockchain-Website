import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Member, Project, Publication } from "@/types/content";
import { PublicProfile } from "./public-profile";

const member = {
  id: "member-1",
  name: "Van-Thinh Nguyen",
  slug: "van-thinh-nguyen",
  role: "Research Member",
  links: { orcid: "https://orcid.org/0000-0003-1156-7072", github: "https://github.com/vanthinh26102005" },
  aliases: [],
  researchInterests: ["Zero-knowledge proofs", "Blockchain security"],
  education: ["B.Eng. in Information Security, UIT"],
  achievements: ["Research assistant"],
  publicationIds: ["publication-1"],
  projectIds: ["project-1"],
  order: 1,
  isActive: true,
  isPublic: true,
  hasPublicProfile: true,
  bio: "I build verifiable systems for trustworthy supply chains.",
  cvUrl: "https://example.com/cv"
} as Member;

const publication = {
  id: "publication-1",
  title: "Verifiable Supply Chains",
  authors: ["Van-Thinh Nguyen"],
  year: 2026,
  venue: "Blockchainist Working Paper",
  orcidPutCodes: [],
  externalIds: {},
  isFeatured: false,
  isPublished: true
} as Publication;

const project = {
  id: "project-1",
  title: "EUDR Traceability",
  slug: "eudr-traceability",
  leader: "Van-Thinh Nguyen",
  members: [],
  memberIds: [],
  tags: [],
  isFeatured: false
} as Project;

describe("PublicProfile", () => {
  it("renders a shareable portfolio from populated member data", () => {
    const html = renderToStaticMarkup(<PublicProfile member={member} publications={[publication]} projects={[project]} locale="vi" />);

    expect(html).toContain("Van-Thinh Nguyen");
    expect(html).toContain("Hướng nghiên cứu");
    expect(html).toContain("Verifiable Supply Chains");
    expect(html).toContain('href="https://orcid.org/0000-0003-1156-7072"');
    expect(html).toContain('rel="noreferrer"');
  });

  it("shows a clear fallback instead of an empty public profile", () => {
    const html = renderToStaticMarkup(<PublicProfile member={{ ...member, bio: undefined, links: {}, researchInterests: [], education: [], achievements: [], cvUrl: undefined, publicationIds: [], projectIds: [] }} publications={[]} projects={[]} locale="vi" />);

    expect(html).toContain("Hồ sơ đang được cập nhật");
  });
});
