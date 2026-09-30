import type {
  ImageAsset,
  Member,
  Project,
  Publication,
  SiteSettings
} from "@/types/content";
import { cache } from "react";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeOrcidUrl, slugify, splitList } from "@/lib/utils";

type RawRecord = Record<string, unknown>;

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function imageFromRecord(data: RawRecord, alt: string): ImageAsset | undefined {
  const url = asString(data.imageUrl) ?? asString(data.avatarUrl) ?? asString(data.avatar);
  const cloudinaryId = asString(data.cloudinaryId);

  if (!url && !cloudinaryId) {
    return undefined;
  }

  return {
    ...(url ? { url } : {}),
    ...(cloudinaryId ? { cloudinaryId } : {}),
    alt
  };
}

export function normalizeMemberRecord(id: string, data: RawRecord): Member {
  const name = asString(data.name) ?? "Unnamed member";
  const links = (data.links as RawRecord | undefined) ?? {};

  return {
    id,
    name,
    slug: asString(data.slug) ?? slugify(name) ?? id,
    role: asString(data.role) ?? "Research member",
    avatar: imageFromRecord(data, name),
    bio: asString(data.bio),
    links: {
      googleScholar: asString(links.googleScholar) ?? asString(data.googleScholar),
      orcid: normalizeOrcidUrl(links.orcid) ?? normalizeOrcidUrl(data.orcid),
      webOfScience: asString(links.webOfScience) ?? asString(data.webOfScience),
      scopus: asString(links.scopus) ?? asString(data.scopus),
      website: asString(links.website) ?? asString(data.website),
      github: asString(links.github) ?? asString(data.github)
    },
    aliases: splitList(data.aliases),
    researchInterests: splitList(data.researchInterests),
    education: splitList(data.education),
    achievements: splitList(data.achievements),
    cvUrl: asString(data.cvUrl),
    publicationIds: splitList(data.publicationIds),
    projectIds: splitList(data.projectIds),
    order: asNumber(data.order) ?? 999,
    isActive: asBoolean(data.isActive, true),
    isPublic: asBoolean(data.isPublic, false),
    hasPublicProfile: asBoolean(data.isPublic, false)
  };
}

export function normalizePublicationRecord(id: string, data: RawRecord): Publication {
  const title = asString(data.title) ?? "Untitled publication";
  const doi = asString(data.doi)?.toLowerCase();
  const externalIds =
    typeof data.externalIds === "object" && data.externalIds && !Array.isArray(data.externalIds)
      ? Object.fromEntries(
          Object.entries(data.externalIds as Record<string, unknown>)
            .map(([key, value]) => [key, asString(value)])
            .filter((entry): entry is [string, string] => Boolean(entry[1]))
        )
      : {};

  return {
    id,
    title,
    authors: splitList(data.authors),
    year: asNumber(data.year),
    venue: asString(data.venue) ?? asString(data.journal),
    type: asString(data.type),
    doi,
    url: asString(data.url) ?? (doi ? `https://doi.org/${doi}` : undefined),
    abstract: asString(data.abstract),
    source: asString(data.source),
    orcidPutCodes: splitList(data.orcidPutCodes)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value)),
    externalIds,
    image: imageFromRecord(data, title),
    isFeatured: asBoolean(data.isFeatured, false),
    isPublished: asBoolean(data.isPublished, true)
  };
}

export function normalizeProjectRecord(id: string, data: RawRecord): Project {
  const title = asString(data.title) ?? "Untitled project";

  return {
    id,
    title,
    slug: asString(data.slug) ?? id,
    description: asString(data.description),
    status:
      data.status === "ongoing" || data.status === "completed" || data.status === "open"
        ? data.status
        : undefined,
    leader: asString(data.leader) ?? asString(data.principalInvestigator) ?? "Unassigned",
    members: splitList(data.members),
    memberIds: splitList(data.memberIds),
    tags: splitList(data.tags),
    funding: asString(data.funding),
    level: asString(data.level),
    type: asString(data.type),
    startYear: asNumber(data.startYear),
    endYear: asNumber(data.endYear),
    budget: asNumber(data.budget),
    fundingAgency: asString(data.fundingAgency),
    abstract: asString(data.abstract),
    objectives: asString(data.objectives),
    results: asString(data.results),
    url: asString(data.url),
    doi: asString(data.doi)?.toLowerCase(),
    image: imageFromRecord(data, title),
    isFeatured: asBoolean(data.isFeatured, false)
  };
}

async function readCollection<T>(
  collectionName: string,
  normalize: (id: string, data: RawRecord) => T
): Promise<T[]> {
  const db = getAdminDb();
  if (!db) {
    return [];
  }

  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => normalize(doc.id, doc.data()));
}

function normalizeContributorName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function derivePublicMembers(
  manualMembers: Member[],
  publications: Publication[],
  includeUnmappedContributors = true
): Member[] {
  const activeMembers = manualMembers.filter((member) => member.isActive);

  function memberCard(member: Member): Member {
    if (member.isPublic) return { ...member, hasPublicProfile: true };
    return {
      id: member.id,
      name: member.name,
      slug: member.slug,
      role: member.role,
      links: {},
      aliases: [],
      researchInterests: [],
      education: [],
      achievements: [],
      publicationIds: [],
      projectIds: [],
      order: member.order,
      isActive: true,
      isPublic: false,
      hasPublicProfile: false
    };
  }

  // Inactive members must not be reintroduced as unmapped publication contributors.
  const hiddenContributorNames = new Set<string>();
  for (const member of manualMembers) {
    if (member.isActive) continue;
    hiddenContributorNames.add(normalizeContributorName(member.name));
    for (const alias of member.aliases) hiddenContributorNames.add(normalizeContributorName(alias));
  }

  const canonicalMembers = new Map<string, Member>();
  for (const member of activeMembers) {
    canonicalMembers.set(normalizeContributorName(member.name), member);
  }

  const aliasOwners = new Map<string, Member>();
  const ambiguousAliases = new Set<string>();
  for (const member of activeMembers) {
    for (const alias of member.aliases) {
      const normalizedAlias = normalizeContributorName(alias);
      if (!normalizedAlias || canonicalMembers.has(normalizedAlias) || ambiguousAliases.has(normalizedAlias)) {
        continue;
      }

      const existingOwner = aliasOwners.get(normalizedAlias);
      if (existingOwner && existingOwner.id !== member.id) {
        aliasOwners.delete(normalizedAlias);
        ambiguousAliases.add(normalizedAlias);
      } else {
        aliasOwners.set(normalizedAlias, member);
      }
    }
  }

  for (const name of canonicalMembers.keys()) hiddenContributorNames.delete(name);
  for (const name of aliasOwners.keys()) hiddenContributorNames.delete(name);

  // Track distinct publication ids per canonical member, keyed by normalized canonical name.
  const publicationIdsByCanonical = new Map<string, Set<string>>();
  // Display names for unmapped contributors keyed by "unmapped:<normalizedName>".
  const displayNames = new Map<string, string>();

  for (const publication of publications) {
    if (!publication.isPublished) {
      continue;
    }

    // A publication may list the same person under multiple aliases; count it once.
    const matchedKeys = new Set<string>();

    for (const author of publication.authors) {
      const normalizedAuthor = normalizeContributorName(author);
      if (!normalizedAuthor) {
        continue;
      }

      if (hiddenContributorNames.has(normalizedAuthor)) {
        continue;
      }

      const canonical = canonicalMembers.get(normalizedAuthor) ?? aliasOwners.get(normalizedAuthor);
      if (canonical) {
        matchedKeys.add(normalizeContributorName(canonical.name));
      } else {
        const unmappedKey = `unmapped:${normalizedAuthor}`;
        matchedKeys.add(unmappedKey);
        if (!displayNames.has(unmappedKey)) {
          displayNames.set(unmappedKey, author.trim().replace(/\s+/g, " "));
        }
      }
    }

    for (const key of matchedKeys) {
      let ids = publicationIdsByCanonical.get(key);
      if (!ids) {
        ids = new Set();
        publicationIdsByCanonical.set(key, ids);
      }
      ids.add(publication.id);
    }
  }

  const result = new Map<string, Member>();

  // Build canonical members from aggregated publication counts.
  for (const member of activeMembers) {
    const key = normalizeContributorName(member.name);
    const ids = publicationIdsByCanonical.get(key);
    if (ids?.size) {
      result.set(key, { ...memberCard(member), publicationCount: ids.size });
    }
  }

  // Build unmapped contributors when requested.
  if (includeUnmappedContributors) {
    for (const [key, ids] of publicationIdsByCanonical) {
      if (!key.startsWith("unmapped:")) {
        continue;
      }
      const name = displayNames.get(key) ?? key.slice("unmapped:".length);
      result.set(key, {
        id: `contributor-${slugify(name) || key.slice("unmapped:".length)}`,
        name,
        slug: slugify(name) || key.slice("unmapped:".length),
        role: "Publication contributor",
        links: {},
        aliases: [],
        researchInterests: [],
        education: [],
        achievements: [],
        publicationIds: [],
        projectIds: [],
        order: 999,
        isActive: true,
        isPublic: true,
        hasPublicProfile: false,
        publicationCount: ids.size
      });
    }
  }

  // Add active manual members that have no publications so they still appear.
  for (const member of activeMembers) {
    const key = normalizeContributorName(member.name);
    if (!result.has(key)) {
      result.set(key, memberCard(member));
    }
  }

  return [...result.values()].sort(
    (a, b) => (b.publicationCount ?? 0) - (a.publicationCount ?? 0) || a.name.localeCompare(b.name)
  );
}

export async function getPublicMembers(
  options: { limit?: number; includeUnmappedContributors?: boolean } = {}
): Promise<Member[]> {
  const { limit, includeUnmappedContributors = true } = options;
  const [members, publications] = await Promise.all([
    readCollection("members", normalizeMemberRecord),
    readCollection("publications", normalizePublicationRecord)
  ]);
  const publicMembers = derivePublicMembers(members, publications, includeUnmappedContributors);

  return typeof limit === "number" ? publicMembers.slice(0, limit) : publicMembers;
}

export async function getPublicPublications(limit?: number): Promise<Publication[]> {
  const publications = await readCollection("publications", normalizePublicationRecord);
  const sorted = publications
    .filter((publication) => publication.isPublished)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));

  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export async function getPublicProjects(limit?: number): Promise<Project[]> {
  const projects = await readCollection("projects", normalizeProjectRecord);
  const sorted = projects.sort(
    (a, b) => (b.startYear ?? 0) - (a.startYear ?? 0) || a.title.localeCompare(b.title)
  );

  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

function selectInOrder<T extends { id: string }>(ids: string[], records: T[]) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const selected: T[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    const record = byId.get(id);
    if (record) selected.push(record);
    seen.add(id);
  }
  return selected;
}

export const getPublicMemberProfile = cache(async (slug: string) => {
  const db = getAdminDb();
  if (!db) return null;

  const snapshot = await db.collection("members").where("slug", "==", slug).limit(1).get();
  const document = snapshot.docs[0];
  if (!document) return null;

  const member = normalizeMemberRecord(document.id, document.data());
  if (!member.isActive || !member.isPublic) return null;

  const [publications, projects] = await Promise.all([
    getPublicPublications(),
    getPublicProjects()
  ]);
  return {
    member,
    publications: selectInOrder(member.publicationIds, publications),
    projects: selectInOrder(member.projectIds, projects)
  };
});

export async function getSiteSettings(): Promise<SiteSettings> {
  const db = getAdminDb();
  if (!db) {
    return defaultSiteSettings;
  }

  const snapshot = await db.collection("siteSettings").doc("homepage").get();
  if (!snapshot.exists) {
    return defaultSiteSettings;
  }

  const data = snapshot.data() as RawRecord;

  return {
    siteName: asString(data.siteName) ?? defaultSiteSettings.siteName,
    tagline: asString(data.tagline) ?? defaultSiteSettings.tagline,
    contactEmail: asString(data.contactEmail) ?? defaultSiteSettings.contactEmail,
    orcidId: asString(data.orcidId) ?? defaultSiteSettings.orcidId,
    googleScholarUrl: asString(data.googleScholarUrl),
    featureFlags: {
      orcidSyncEnabled: asBoolean(
        (data.featureFlags as RawRecord | undefined)?.orcidSyncEnabled,
        false
      )
    },
    principalInvestigator: {
      name: asString((data.principalInvestigator as RawRecord | undefined)?.name) ?? defaultSiteSettings.principalInvestigator.name,
      title: asString((data.principalInvestigator as RawRecord | undefined)?.title) ?? defaultSiteSettings.principalInvestigator.title,
      bio: asString((data.principalInvestigator as RawRecord | undefined)?.bio) ?? defaultSiteSettings.principalInvestigator.bio,
      avatarUrl:
        asString((data.principalInvestigator as RawRecord | undefined)?.avatarUrl) ??
        defaultSiteSettings.principalInvestigator.avatarUrl,
      researchInterests: splitList((data.principalInvestigator as RawRecord | undefined)?.researchInterests)
    },
    orcidSync: {
      status: normalizeSyncStatus((data.orcidSync as RawRecord | undefined)?.status),
      lastSyncAt: asString((data.orcidSync as RawRecord | undefined)?.lastSyncAt),
      lastSuccessfulAt: asString((data.orcidSync as RawRecord | undefined)?.lastSuccessfulAt),
      lastError: asString((data.orcidSync as RawRecord | undefined)?.lastError)
    }
  };
}

function normalizeSyncStatus(value: unknown): SiteSettings["orcidSync"]["status"] {
  return value === "running" || value === "succeeded" || value === "failed" ? value : "idle";
}

export const defaultSiteSettings: SiteSettings = {
  siteName: "Blockchainist Research Group",
  tagline: "Blockchain, Networks & Security research at academic depth.",
  contactEmail: "contact@blockchainist.id.vn",
  orcidId: "0000-0003-1156-7072",
  featureFlags: {
    orcidSyncEnabled: false
  },
  principalInvestigator: {
    name: "Tuan-Dung Tran",
    title: "Principal Investigator",
    bio: "Researcher in blockchain, network security, and trustworthy digital systems.",
    avatarUrl: "/tuandung-tran.png",
    researchInterests: ["Blockchain", "Network security", "IoT", "Privacy-preserving systems"]
  },
  orcidSync: {
    status: "idle"
  }
};
