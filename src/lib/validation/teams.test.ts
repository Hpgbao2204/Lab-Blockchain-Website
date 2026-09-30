import { describe, expect, it } from "vitest";
import { parseTeamInput, parseTeamUpdate } from "./teams";

describe("team validation", () => {
  it("accepts a wall with at least one member", () => {
    expect(parseTeamInput({ name: "Ledger", slug: "ledger", memberIds: ["member-1"] })).toMatchObject({ isActive: true });
  });

  it("rejects a wall without members", () => {
    expect(() => parseTeamInput({ name: "Ledger", slug: "ledger", memberIds: [] })).toThrow("A wall needs at least one member");
  });

  it("rejects an update with empty members", () => {
    expect(() => parseTeamUpdate({ memberIds: [] })).toThrow("A wall needs at least one member");
  });

  it("rejects an empty update", () => {
    expect(() => parseTeamUpdate({})).toThrow();
  });
});
