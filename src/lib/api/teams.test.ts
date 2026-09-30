import { describe, expect, it } from "vitest";
import { getActiveWallMemberIds, getTeamAccess, hasLinkedProfiles } from "./teams";

function database(data: Record<string, unknown>) {
  return {
    collection: () => ({
      doc: (id: string) => ({
        get: async () => ({ id, exists: true, data: () => data })
      })
    })
  };
}

describe("team access", () => {
  const base = { uid: "user", email: "member@example.com", status: "active" as const };

  it("grants access only to an assigned wall member", async () => {
    await expect(getTeamAccess(database({ name: "Ledger", slug: "ledger", memberIds: ["member-1"], isActive: true }) as never, { ...base, role: "member", memberId: "member-1" }, "team-1")).resolves.toBe("member");
  });

  it("does not expose inactive teams to participants", async () => {
    await expect(getTeamAccess(database({ name: "Ledger", slug: "ledger", memberIds: ["member-1"], isActive: false }) as never, { ...base, role: "member", memberId: "member-1" }, "team-1")).resolves.toBeNull();
  });

  it("keeps owner access global", async () => {
    await expect(getTeamAccess(database({}) as never, { ...base, role: "owner", memberId: null }, "team-1")).resolves.toBe("admin");
  });
});

describe("wall membership", () => {
  function profiles(records: Record<string, unknown>[]) {
    return {
      collection: () => ({
        where: () => ({
          limit: () => ({ get: async () => ({ docs: records.map((data) => ({ data: () => data })) }) })
        })
      })
    };
  }

  it("requires an active member account for every assigned profile", async () => {
    await expect(hasLinkedProfiles(profiles([{ status: "active", role: "member" }]) as never, ["member-1"])).resolves.toBe(true);
    await expect(hasLinkedProfiles(profiles([{ status: "active", role: "owner" }]) as never, ["member-1"])).resolves.toBe(false);
    await expect(hasLinkedProfiles(profiles([{ status: "inactive", role: "member" }]) as never, ["member-1"])).resolves.toBe(false);
  });

  it("derives task recipients from active Wall members with active linked accounts", async () => {
    const memberRecords = {
      "member-1": { name: "Van-Thinh Nguyen", isActive: true },
      "member-2": { name: "Inactive profile", isActive: false },
      "member-3": { name: "Inactive account", isActive: true },
    };
    const userRecords = {
      "member-1": [{ status: "active", role: "member" }],
      "member-2": [{ status: "active", role: "member" }],
      "member-3": [{ status: "inactive", role: "member" }],
    };
    const db = {
      collection: (name: string) =>
        name === "members"
          ? {
              doc: (id: keyof typeof memberRecords) => ({
                get: async () => ({ exists: Boolean(memberRecords[id]), data: () => memberRecords[id] }),
              }),
            }
          : {
              where: (_field: string, _operator: string, memberId: keyof typeof userRecords) => ({
                limit: () => ({ get: async () => ({ docs: userRecords[memberId].map((data) => ({ data: () => data })) }) }),
              }),
            },
    };

    await expect(getActiveWallMemberIds(db as never, ["member-1", "member-2", "member-3"])).resolves.toEqual(["member-1"]);
  });
});
