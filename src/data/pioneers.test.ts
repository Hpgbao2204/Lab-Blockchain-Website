import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pioneers } from "./pioneers";

describe("pioneers", () => {
  it("has unique ids", () => {
    expect(new Set(pioneers.map((p) => p.id)).size).toBe(pioneers.length);
  });

  it("credits every portrait and ships the image file", () => {
    for (const p of pioneers.filter((x) => x.image)) {
      expect(p.credit?.license, p.id).toBeTruthy();
      expect(p.credit?.source, p.id).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(existsSync(path.join("public", p.image as string)), p.id).toBe(true);
    }
  });

  it("only uses freely-licensed photos", () => {
    for (const p of pioneers.filter((x) => x.credit)) {
      expect(p.credit?.license, p.id).toMatch(/^(CC BY|CC BY-SA|CC0|Public domain)/i);
    }
  });
});
