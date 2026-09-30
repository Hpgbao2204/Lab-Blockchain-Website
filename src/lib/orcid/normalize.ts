export type NormalizedOrcidPublication = {
  putCode: number;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  type?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  externalIds: Record<string, string>;
};

export type ExistingPublication = {
  id: string;
  doi?: string;
  title?: string;
  year?: number;
  orcidPutCodes: number[];
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }

  return undefined;
}

export function normalizeDoi(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value
    .trim()
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .toLowerCase();
  return normalized || undefined;
}

function normalizeTitle(value: string | undefined): string | undefined {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() || undefined;
}

function friendlyWorkType(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase().replace(/_/g, " ");
  if (normalized.includes("JOURNAL ARTICLE")) return "Journal Article";
  if (normalized.includes("CONFERENCE")) return "Conference Paper";
  if (normalized.includes("BOOK CHAPTER")) return "Book Chapter";
  if (normalized.includes("BOOK")) return "Book";
  if (normalized.includes("PREPRINT")) return "Preprint";
  if (normalized.includes("THESIS")) return "Thesis";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

export function normalizeOrcidWork(input: unknown): NormalizedOrcidPublication | null {
  const work = asRecord(input);
  const putCode = asNumber(work?.["put-code"]);
  const title = asString(asRecord(asRecord(work?.title)?.title)?.value);
  if (!work || !putCode || !title) {
    return null;
  }

  const externalIds: Record<string, string> = {};
  const externalIdEntries = Array.isArray(asRecord(work["external-ids"])?.["external-id"])
    ? (asRecord(work["external-ids"])?.["external-id"] as unknown[])
    : [];
  let doi: string | undefined;
  for (const entry of externalIdEntries) {
    const item = asRecord(entry);
    const type = asString(item?.["external-id-type"]);
    const value = asString(item?.["external-id-value"]);
    if (!type || !value) continue;
    externalIds[type.toLowerCase()] = value;
    if (type.toLowerCase() === "doi") {
      doi = normalizeDoi(value);
    }
  }

  const contributorData = asRecord(work.contributors) ?? asRecord(work["work-contributors"]);
  const contributors = Array.isArray(contributorData?.contributor)
    ? (contributorData.contributor as unknown[])
    : [];
  const authors = contributors
    .map((entry) => {
      const contributor = asRecord(entry);
      return (
        asString(asRecord(contributor?.["credit-name"])?.value) ??
        asString(asRecord(contributor?.name)?.value)
      );
    })
    .filter((name): name is string => Boolean(name));

  const publicationDate = asRecord(work["publication-date"]);
  const year = asNumber(asRecord(publicationDate?.year)?.value);
  const url = asString(asRecord(work.url)?.value) ?? (doi ? `https://doi.org/${doi}` : undefined);

  return {
    putCode,
    title: title.trim(),
    authors,
    year,
    venue: asString(asRecord(work["journal-title"])?.value),
    type: friendlyWorkType(asString(work.type) ?? asString(work["work-type"])),
    doi,
    url,
    abstract: asString(work["short-description"]),
    externalIds
  };
}

export function findExistingPublication(
  publications: ExistingPublication[],
  incoming: NormalizedOrcidPublication
): ExistingPublication | undefined {
  const byDoi = incoming.doi
    ? publications.find((publication) => normalizeDoi(publication.doi) === incoming.doi)
    : undefined;
  if (byDoi) return byDoi;

  const byPutCode = publications.find((publication) => publication.orcidPutCodes.includes(incoming.putCode));
  if (byPutCode) return byPutCode;

  const normalizedTitle = normalizeTitle(incoming.title);
  return publications.find(
    (publication) =>
      Boolean(normalizedTitle) &&
      normalizeTitle(publication.title) === normalizedTitle &&
      publication.year === incoming.year
  );
}
