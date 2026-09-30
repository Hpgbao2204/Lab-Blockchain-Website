import { describe, expect, it } from "vitest";
import { parseManagedUserUpdate, parsePortalProfileUpdate, parseUserProvision } from "./users";

describe("account provisioning validation", () => {
  it("accepts either an existing member id or a new member profile", () => {
    expect(parseUserProvision({ email: "member@example.com", memberId: "member-1" })).toMatchObject({ memberId: "member-1" });
    expect(
      parseUserProvision({
        email: "member@example.com",
        member: { name: "Member Name", slug: "member-name", role: "Research member" }
      })
    ).toMatchObject({ member: { slug: "member-name" } });
  });

  it("rejects ambiguous or incomplete member links", () => {
    expect(() => parseUserProvision({ email: "member@example.com" })).toThrow();
    expect(() => parseUserProvision({ email: "member@example.com", memberId: "member-1", member: { name: "A", slug: "a", role: "Member" } })).toThrow();
  });

  it("limits account updates to status, membership, and reset actions", () => {
    expect(parseManagedUserUpdate({ status: "inactive" })).toEqual({ status: "inactive" });
    expect(() => parseManagedUserUpdate({ role: "admin" })).toThrow();
    expect(() => parseManagedUserUpdate({ email: "not-allowed@example.com" })).toThrow();
  });
});

describe("member profile validation", () => {
  it("accepts profile-owned fields and clears optional values", () => {
    expect(
      parsePortalProfileUpdate({
        bio: null,
        links: { orcid: "https://orcid.org/0000-0000-0000-0000", website: "https://example.com", github: "https://github.com/ada" },
        researchInterests: ["Distributed systems"],
        isPublic: true
      })
    ).toMatchObject({ bio: null, isPublic: true });
  });

  it("rejects server-controlled fields", () => {
    expect(() => parsePortalProfileUpdate({ isActive: true })).toThrow();
    expect(() => parsePortalProfileUpdate({ name: "Ada Lovelace" })).toThrow();
    expect(() => parsePortalProfileUpdate({ role: "Member", updatedBy: "forged" })).toThrow();
    expect(() => parsePortalProfileUpdate({ publicationIds: ["publication-1", "publication-1"] })).toThrow();
    expect(() => parsePortalProfileUpdate({ links: { orcid: "https://orcid.org/not-valid" } })).toThrow();
  });
});
