import { describe, expect, it } from "vitest";
import { getWallDestination } from "./wall-destination";

describe("getWallDestination", () => {
  it("opens the matching admin Wall for an owner", () => {
    expect(getWallDestination("eudr rollup", "owner")).toBe("/admin?wall=eudr%20rollup");
  });

  it("opens the matching member Wall for a member", () => {
    expect(getWallDestination("eudr-rollup", "member")).toBe("/portal/walls/eudr-rollup");
  });
});
