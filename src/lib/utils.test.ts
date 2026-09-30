import { describe, expect, it } from "vitest";
import { normalizeOrcidUrl } from "./utils";

describe("normalizeOrcidUrl", () => {
  it("returns undefined for empty values", () => {
    expect(normalizeOrcidUrl("")).toBeUndefined();
    expect(normalizeOrcidUrl(undefined)).toBeUndefined();
    expect(normalizeOrcidUrl(null)).toBeUndefined();
  });

  it("leaves full ORCID URLs unchanged", () => {
    expect(normalizeOrcidUrl("https://orcid.org/0000-0002-1825-0097")).toBe(
      "https://orcid.org/0000-0002-1825-0097"
    );
    expect(normalizeOrcidUrl("http://orcid.org/0000-0001-2345-6789")).toBe(
      "http://orcid.org/0000-0001-2345-6789"
    );
  });

  it("prepends https://orcid.org/ to a bare ORCID iD", () => {
    expect(normalizeOrcidUrl("0000-0002-1825-0097")).toBe("https://orcid.org/0000-0002-1825-0097");
    expect(normalizeOrcidUrl("0009-0000-8028-3984")).toBe("https://orcid.org/0009-0000-8028-3984");
  });

  it("trims whitespace before normalizing", () => {
    expect(normalizeOrcidUrl("  0000-0002-1825-0097  ")).toBe("https://orcid.org/0000-0002-1825-0097");
  });

  it("returns non-URL, non-ORCID strings as-is", () => {
    expect(normalizeOrcidUrl("not-an-orcid")).toBe("not-an-orcid");
  });
});
