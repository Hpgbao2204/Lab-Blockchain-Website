import { describe, expect, it } from "vitest";
import { CYCLE_MS, DIRECTION_MS, STEP_KINDS, STEP_MS, describeStep, getPhase } from "./protocol";

describe("getPhase", () => {
  it("starts with Alice locking funds", () => {
    const p = getPhase(0);
    expect(p).toMatchObject({ direction: 0, sender: "alice", receiver: "bob", kind: "lock", step: 0 });
  });

  it("walks every step of a direction then swaps roles", () => {
    STEP_KINDS.forEach((kind, i) => {
      expect(getPhase(i * STEP_MS + 1).kind).toBe(kind);
    });
    const p = getPhase(DIRECTION_MS + 1);
    expect(p).toMatchObject({ direction: 1, sender: "bob", receiver: "alice", kind: "lock" });
  });

  it("wraps around the cycle and reports in-step progress", () => {
    expect(getPhase(CYCLE_MS).direction).toBe(0);
    expect(getPhase(STEP_MS / 2).progress).toBeCloseTo(0.5, 5);
  });

  it("increments seq on every step", () => {
    expect(getPhase(STEP_MS * 3 + 5).seq).toBe(3);
  });
});

describe("describeStep", () => {
  it("names the right chain for each party", () => {
    expect(describeStep("lock", "alice", "bob").text).toContain("Chain A");
    expect(describeStep("claim", "alice", "bob").text).toContain("Bob");
    expect(describeStep("lock", "bob", "alice").text).toContain("Chain B");
  });
});
