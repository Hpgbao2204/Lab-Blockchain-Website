import { describe, expect, it } from "vitest";
import {
  findExistingPublication,
  normalizeDoi,
  normalizeOrcidWork,
  type ExistingPublication
} from "./normalize";

const work = {
  "put-code": 12345,
  title: { title: { value: " Secure Blockchain Systems " } },
  "publication-date": { year: { value: "2025" } },
  type: "JOURNAL_ARTICLE",
  "journal-title": { value: "Journal of Systems" },
  url: { value: "https://example.com/paper" },
  "short-description": "A research abstract.",
  contributors: {
    contributor: [{ "credit-name": { value: "Tuan-Dung Tran" } }]
  },
  "external-ids": {
    "external-id": [
      { "external-id-type": "doi", "external-id-value": "https://doi.org/10.1000/ABC" },
      { "external-id-type": "eid", "external-id-value": "2-s2.0-123" }
    ]
  }
};

describe("ORCID work normalization", () => {
  it("normalizes public work details into the publication model", () => {
    expect(normalizeOrcidWork(work)).toEqual({
      putCode: 12345,
      title: "Secure Blockchain Systems",
      authors: ["Tuan-Dung Tran"],
      year: 2025,
      venue: "Journal of Systems",
      type: "Journal Article",
      doi: "10.1000/abc",
      url: "https://example.com/paper",
      abstract: "A research abstract.",
      externalIds: { doi: "https://doi.org/10.1000/ABC", eid: "2-s2.0-123" }
    });
  });

  it("normalizes DOI variants", () => {
    expect(normalizeDoi("DOI: 10.1000/ABC")).toBe("10.1000/abc");
  });

  it("matches existing publications by DOI before ORCID put-code", () => {
    const incoming = normalizeOrcidWork(work);
    if (!incoming) throw new Error("Expected normalized work");

    const publications: ExistingPublication[] = [
      { id: "doi-match", doi: "10.1000/abc", orcidPutCodes: [] },
      { id: "put-code-match", doi: "10.9999/else", orcidPutCodes: [12345] }
    ];

    expect(findExistingPublication(publications, incoming)?.id).toBe("doi-match");
  });

  it("matches existing publications by put-code when DOI is unavailable", () => {
    const incoming = { ...normalizeOrcidWork(work)!, doi: undefined };
    const publications: ExistingPublication[] = [
      { id: "put-code-match", orcidPutCodes: [12345] }
    ];

    expect(findExistingPublication(publications, incoming)?.id).toBe("put-code-match");
  });

  it("matches existing publications by normalized title and year as a final fallback", () => {
    const incoming = { ...normalizeOrcidWork(work)!, doi: undefined, putCode: 99999 };
    const publications: ExistingPublication[] = [
      { id: "title-match", title: "secure blockchain systems", year: 2025, orcidPutCodes: [] }
    ];

    expect(findExistingPublication(publications, incoming)?.id).toBe("title-match");
  });
});
