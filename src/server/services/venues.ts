import { and, asc, desc, eq, getTableColumns, inArray, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/client";
import { venues, type Venue } from "../db/schema";
import type { SessionUser } from "../auth/sessions";
import { AppError } from "../errors";
import { requireAdmin } from "./users";
import {
  CCF_RANKS,
  CORE_RANKS,
  JOURNAL_INDEXES,
  QUARTILES,
  TOPIC_SLUGS,
  cleanSubfields,
  venueTopics,
  type VenueKind,
  type VenueSummary,
} from "@/lib/venues/topics";

/* ------------------------------------------------------------------ import -- */

type Row = typeof venues.$inferInsert;
type Raw = Record<string, string | undefined>;

const str = (v: string | undefined) => {
  const s = v?.trim().replace(/&amp;/g, "&");
  return s && !/^(unknown|n\/?a|nan|null|none|-)$/i.test(s) ? s : null;
};
const num = (v: string | undefined) => {
  const n = v == null || v.trim() === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};
const int = (v: string | undefined) => {
  const n = num(v);
  return n == null ? null : Math.round(n);
};
const yes = (v: string | undefined) => v?.trim() === "1" || v?.trim().toLowerCase() === "true";
const list = (v: string | undefined) =>
  (v ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

/** lower case, accents stripped: the form both `venues.search` and queries are compared in */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** "SCIENCE CITATION INDEX" → "Science Citation Index"; mixed case is kept as written */
const tidy = (s: string) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()).replace(/ (And|Of|The|In|For|&) /g, (m) => m.toLowerCase()) : s);

const CORE_SCORE: Record<string, number> = { "A*": 4, A: 3, B: 2, C: 1 };
const CCF_SCORE: Record<string, number> = { A: 3, B: 2, C: 1 };
const Q_SCORE: Record<string, number> = { Q1: 4, Q2: 3, Q3: 2, Q4: 1 };
const oneOf = <T extends string>(v: string | null, allowed: readonly T[]) => (v && (allowed as readonly string[]).includes(v) ? (v as T) : null);

function conferenceRow(r: Raw): Omit<Row, "slug"> | null {
  const id = str(r.conference_id);
  const name = str(r.name);
  const acronym = str(r.acronym);
  if (!id || !name || !acronym) return null;
  const rank = oneOf(str(r.core_rank_clean), CORE_RANKS);
  const ccf = oneOf(str(r.ccf_rank), CCF_RANKS);
  const areas = cleanSubfields(r.subfields);
  const forName = str(r.core_for_name);
  const city = str(r.latest_city);
  const country = str(r.latest_country);
  return {
    id,
    kind: "conference",
    name,
    acronym,
    issn: null,
    eissn: null,
    publisher: str(r.publisher),
    country,
    rank,
    ccf,
    quartile: null,
    // CORE first, CCF breaks ties (and ranks the CCF-only venues above unranked ones)
    rankScore: (rank ? CORE_SCORE[rank] * 4 : 0) + (ccf ? CCF_SCORE[ccf] : 0),
    impact: null,
    hIndex: num(r.h5_index),
    topTier: yes(r.is_top_tier),
    flags: [],
    areas,
    topics: venueTopics({ kind: "conference", name, areas, tags: forName ? [forName] : [] }),
    search: fold(`${acronym} | ${name}`),
    data: {
      coreRank: str(r.core_rank),
      forCode: str(r.core_for_code),
      forName,
      organizer: str(r.organizer),
      h5Median: num(r.h5_median),
      editions: int(r.total_editions),
      firstYear: int(r.first_edition_year),
      latestYear: int(r.latest_edition_year),
      yearsHistory: int(r.years_history),
      virtualEditions: int(r.virtual_editions_count),
      hybridEditions: int(r.hybrid_editions_count),
      city,
      deadlinesTracked: int(r.total_deadlines_tracked),
      upcomingDeadline: yes(r.has_upcoming_deadline),
    },
  };
}

/** Old research-area labels (often upper case) → the Scopus subject area they belong to. */
const AREA_GUESS: [RegExp, string][] = [
  [/comput/i, "Computer Science"],
  [/engineer|technolog/i, "Engineering"],
  [/medic|clinic|surg|oncolog|cardio|pediatr|psychiatr|health|nurs/i, "Medicine"],
  [/math|statist/i, "Mathematics"],
  [/physic|astro/i, "Physics and Astronomy"],
  [/chemi/i, "Chemistry"],
  [/biolog|genet|cell|ecolog/i, "Biochemistry, Genetics and Molecular Biology"],
  [/econom|financ/i, "Economics, Econometrics and Finance"],
  [/busines|manag/i, "Business, Management and Accounting"],
  [/psycho/i, "Psychology"],
  [/educat|social|law|politic|sociolog/i, "Social Sciences"],
  [/humanit|histor|literat|philosoph|art/i, "Arts and Humanities"],
  [/environ/i, "Environmental Science"],
  [/geo|earth/i, "Earth and Planetary Sciences"],
  [/agri/i, "Agricultural and Biological Sciences"],
  [/materi/i, "Materials Science"],
  [/multi/i, "Multidisciplinary"],
];

function journalAreas(r: Raw): string[] {
  const scopus = list(r.scopus_areas);
  if (scopus.length) return [...new Set(scopus)];
  const out = new Set<string>();
  for (const a of list(r.research_areas)) {
    const hit = AREA_GUESS.find(([re]) => re.test(a));
    if (hit) out.add(hit[1]);
  }
  return [...out];
}

const issnOf = (v: string | undefined) => {
  const s = str(v)?.toUpperCase();
  return s && /^\d{4}-\d{3}[\dX]$/.test(s) ? s : null;
};

function journalRow(r: Raw): Omit<Row, "slug"> | null {
  const id = str(r.journal_id);
  const name = str(r.name);
  if (!id || !name) return null;
  const wos = oneOf(str(r.wos_quartile_best), QUARTILES);
  const sjrQ = oneOf(str(r.scimago_quartile), QUARTILES);
  const quartile = wos ?? sjrQ;
  const issn = issnOf(r.issn);
  const eissn = issnOf(r.issn_online);
  const publisher = str(r.publisher) ?? str(r.publisher_group);
  const areas = journalAreas(r);
  const aiTags = list(r.top_ai_tags);
  const researchAreas = [...new Set(list(r.research_areas).map(tidy))];
  const flags = (
    [
      ["scie", r.is_scie],
      ["ssci", r.is_ssci],
      ["ahci", r.is_ahci],
      ["esci", r.is_esci],
      ["oa", r.is_open_access],
      ["diamond", r.is_oa_diamond],
      ["review", r.is_review_journal],
      ["warned", r.is_cas_warned],
    ] as const
  )
    .filter(([, v]) => yes(v))
    .map(([f]) => f);
  return {
    id,
    kind: "journal",
    name,
    acronym: null,
    issn,
    eissn,
    publisher,
    country: str(r.country),
    rank: null,
    ccf: null,
    quartile,
    rankScore: quartile ? Q_SCORE[quartile] : 0,
    impact: num(r.impact_factor),
    hIndex: num(r.h_index),
    topTier: yes(r.is_top_journal),
    flags,
    areas,
    topics: venueTopics({ kind: "journal", name, areas, tags: [...aiTags, ...researchAreas] }),
    search: fold([name, issn, issn?.replace("-", ""), eissn, eissn?.replace("-", ""), publisher].filter(Boolean).join(" | ")),
    data: {
      publisherGroup: str(r.publisher_group),
      region: str(r.region),
      founded: int(r.founding_year),
      frequency: str(r.frequency),
      oaModel: str(r.oa_model),
      annualArticles: int(r.annual_articles),
      goldOaRate: num(r.gold_oa_rate),
      originalResearchRate: num(r.original_research_rate),
      impactChange: num(r.impact_factor_diff),
      wosQuartile: wos,
      wosCategories: int(r.wos_category_count),
      casTier: str(r.cas_tier_best),
      selfCitationRate: num(r.self_citation_rate),
      sjr: num(r.sjr),
      sjrQuartile: sjrQ,
      docs3y: int(r.total_docs_3years),
      citations3y: int(r.total_citations_3years),
      citableDocs3y: int(r.citable_docs_3years),
      citesPerDoc2y: num(r.citations_per_doc_2years),
      refsPerDoc: num(r.ref_per_doc),
      femaleAuthorRate: num(r.female_author_rate),
      policyCitations: int(r.overton_citations),
      apcUsd: num(r.estimated_apc_usd),
      aiTags,
      researchAreas,
    },
  };
}

/** One CSV row → a venue row (without its slug), or null when it lacks an id or a name. */
export function normalizeVenue(kind: VenueKind, raw: Raw) {
  return kind === "conference" ? conferenceRow(raw) : journalRow(raw);
}

const baseSlug = (v: Omit<Row, "slug">) =>
  (v.acronym ?? v.name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "") || "venue";

export const venueImportInput = z.object({
  kind: z.enum(["conference", "journal"]),
  /** one id for every chunk of the same file */
  run: z.string().trim().min(8).max(64),
  columns: z.array(z.string().max(80)).min(2).max(120),
  rows: z.array(z.array(z.string().max(4000)).max(120)).max(1000),
});
export const venueImportFinishInput = z.object({
  kind: z.enum(["conference", "journal"]),
  run: z.string().trim().min(8).max(64),
  /** remove the venues of this kind the file did not contain */
  prune: z.boolean().default(true),
});

/**
 * Upserts one chunk of a CSV file (the browser sends ~1000 rows per request to stay under the
 * host's body limit). New venues get a slug from the acronym or name; existing ones keep theirs.
 */
export async function importVenueRows(db: Db, actor: SessionUser | null, input: z.infer<typeof venueImportInput>) {
  requireAdmin(actor);
  const need = input.kind === "conference" ? "conference_id" : "journal_id";
  if (!input.columns.includes(need)) throw new AppError("invalid_input", `This is not the ${input.kind} file: it has no ${need} column.`);
  const parsed: Omit<Row, "slug">[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const cells of input.rows) {
    const raw = Object.fromEntries(input.columns.map((c, i) => [c, cells[i]]));
    const v = normalizeVenue(input.kind, raw);
    if (!v || seen.has(v.id)) skipped++;
    else {
      seen.add(v.id);
      parsed.push(v);
    }
  }
  if (!parsed.length) return { inserted: 0, updated: 0, skipped };

  const existing = await db
    .select({ id: venues.id, slug: venues.slug })
    .from(venues)
    .where(inArray(venues.id, parsed.map((p) => p.id)));
  const slugById = new Map(existing.map((e) => [e.id, e.slug]));
  // new venues: try the plain slug, then with the ISSN (or id), then numbered, until it is free
  const fresh = parsed.filter((p) => !slugById.has(p.id));
  const attempt = new Map(fresh.map((p) => [p.id, 0]));
  const proposal = (p: Omit<Row, "slug">) => {
    const base = baseSlug(p);
    const n = attempt.get(p.id)!;
    if (n === 0) return base;
    if (n === 1) return `${base}-${(p.issn ?? p.eissn ?? p.id).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}`;
    return `${base}-${n}`;
  };
  let open = fresh;
  for (let round = 0; open.length && round < 20; round++) {
    const wanted = open.map((p) => [p, proposal(p)] as const);
    const inDb = new Set(
      (
        await db
          .select({ slug: venues.slug })
          .from(venues)
          .where(and(eq(venues.kind, input.kind), inArray(venues.slug, [...new Set(wanted.map(([, s]) => s))])))
      ).map((r) => r.slug),
    );
    const claimed = new Set(slugById.values());
    open = [];
    for (const [p, slug] of wanted) {
      if (inDb.has(slug) || claimed.has(slug)) {
        attempt.set(p.id, attempt.get(p.id)! + 1);
        open.push(p);
      } else {
        slugById.set(p.id, slug);
        claimed.add(slug);
      }
    }
  }
  if (open.length) throw new AppError("conflict", "Could not give every venue a unique link; check the file for duplicates.");
  const now = new Date();
  const rows: Row[] = parsed.map((p) => ({ ...p, slug: slugById.get(p.id)!, importRun: input.run, updatedAt: now }));

  const result = await db
    .insert(venues)
    .values(rows)
    .onConflictDoUpdate({
      target: venues.id,
      // every column but the id, the slug and created_at takes the file's value
      set: Object.fromEntries(
        Object.entries(getTableColumns(venues))
          .filter(([key]) => !["id", "slug", "createdAt"].includes(key))
          .map(([key, col]) => [key, sql.raw(`excluded."${col.name}"`)]),
      ),
    })
    .returning({ inserted: sql<boolean>`(xmax = 0)` });
  facetCache = null;
  const inserted = result.filter((r) => r.inserted).length;
  return { inserted, updated: result.length - inserted, skipped };
}

/** After the last chunk: optionally drop the venues of that kind the file no longer lists. */
export async function finishVenueImport(db: Db, actor: SessionUser | null, input: z.infer<typeof venueImportFinishInput>) {
  requireAdmin(actor);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(venues)
    .where(and(eq(venues.kind, input.kind), eq(venues.importRun, input.run)));
  // a run that wrote nothing would otherwise wipe the whole list
  if (!n) throw new AppError("invalid_input", "Nothing was imported in this run, so nothing was removed.");
  let removed = 0;
  if (input.prune) {
    const gone = await db
      .delete(venues)
      .where(and(eq(venues.kind, input.kind), or(isNull(venues.importRun), ne(venues.importRun, input.run))))
      .returning({ id: venues.id });
    removed = gone.length;
  }
  facetCache = null;
  return { total: n, removed };
}

export async function venueStats(db: Db, actor: SessionUser | null) {
  requireAdmin(actor);
  const rows = await db
    .select({ kind: venues.kind, n: sql<number>`count(*)::int`, updatedAt: sql<string | null>`max(${venues.updatedAt})` })
    .from(venues)
    .groupBy(venues.kind);
  const of = (k: VenueKind) => rows.find((r) => r.kind === k);
  return {
    conference: { count: of("conference")?.n ?? 0, updatedAt: of("conference")?.updatedAt ?? null },
    journal: { count: of("journal")?.n ?? 0, updatedAt: of("journal")?.updatedAt ?? null },
  };
}

/* ------------------------------------------------------------------ search -- */

const csv = <T extends string>(allowed: readonly T[]) =>
  z
    .string()
    .max(200)
    .optional()
    .transform((v) => (v ? v.split(",").filter((x): x is T => (allowed as readonly string[]).includes(x)) : []));
const flag = z
  .string()
  .optional()
  .transform((v) => v === "1" || v === "true");

export const venueQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  kind: z.enum(["conference", "journal"]).optional(),
  topic: z.enum(TOPIC_SLUGS as [string, ...string[]]).optional(),
  /** a conference subfield or a journal subject area, exactly as listed in the facets */
  area: z.string().trim().max(80).optional(),
  rank: csv(CORE_RANKS),
  ccf: csv(CCF_RANKS),
  quartile: csv(QUARTILES),
  index: csv(JOURNAL_INDEXES),
  oa: flag,
  top: flag,
  /** leave out journals on the CAS early-warning list */
  safe: flag,
  sort: z.enum(["relevance", "best", "h", "name"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  size: z.coerce.number().int().min(1).max(50).optional().default(20),
});
export type VenueQuery = z.infer<typeof venueQuerySchema>;

const has = (col: typeof venues.flags | typeof venues.areas | typeof venues.topics, v: string) => sql`${col} @> ${JSON.stringify([v])}::jsonb`;
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);
const issnQuery = (q: string) => {
  const m = q.trim().toUpperCase().match(/^(\d{4})-?(\d{3}[\dX])$/);
  return m ? `${m[1]}-${m[2]}` : null;
};

function filters(kind: VenueKind, q: VenueQuery, fuzzy: boolean): SQL {
  const conds: SQL[] = [eq(venues.kind, kind)];
  const text = fold(q.q);
  if (text) {
    if (fuzzy) conds.push(sql`${text} <% ${venues.search}`);
    else for (const w of text.split(" ").slice(0, 8)) conds.push(sql`${venues.search} like ${`%${likeEscape(w)}%`}`);
  }
  if (q.topic) conds.push(has(venues.topics, q.topic));
  if (q.top) conds.push(eq(venues.topTier, true));
  if (q.area) conds.push(has(venues.areas, q.area));
  if (kind === "conference") {
    if (q.rank.length) conds.push(inArray(venues.rank, q.rank));
    if (q.ccf.length) conds.push(inArray(venues.ccf, q.ccf));
  } else {
    if (q.quartile.length) conds.push(inArray(venues.quartile, q.quartile));
    if (q.index.length) conds.push(or(...q.index.map((i) => has(venues.flags, i)))!);
    if (q.oa) conds.push(has(venues.flags, "oa"));
    if (q.safe) conds.push(sql`not (${has(venues.flags, "warned")})`);
  }
  return and(...conds)!;
}

function ordering(q: VenueQuery, fuzzy: boolean) {
  const best = [desc(venues.rankScore), sql`${venues.impact} desc nulls last`, sql`${venues.hIndex} desc nulls last`, asc(venues.name)];
  const sort = q.sort ?? (q.q ? "relevance" : "best");
  if (sort === "name") return [asc(sql`lower(${venues.name})`)];
  if (sort === "h") return [sql`${venues.hIndex} desc nulls last`, ...best];
  if (sort === "best" || !q.q) return best;
  const text = fold(q.q);
  if (fuzzy) return [desc(sql`word_similarity(${text}, ${venues.search})`), ...best];
  const issn = issnQuery(q.q);
  const prefix = `${likeEscape(text)}%`;
  return [
    sql`case
      when lower(${venues.acronym}) = ${text} ${issn ? sql`or ${venues.issn} = ${issn} or ${venues.eissn} = ${issn}` : sql``} then 0
      when lower(${venues.name}) = ${text} then 1
      when lower(${venues.acronym}) like ${prefix} or lower(${venues.name}) like ${prefix} then 2
      else 3 end`,
    ...best,
  ];
}

const summaryColumns = {
  kind: venues.kind,
  slug: venues.slug,
  name: venues.name,
  acronym: venues.acronym,
  publisher: venues.publisher,
  country: venues.country,
  issn: venues.issn,
  eissn: venues.eissn,
  rank: venues.rank,
  ccf: venues.ccf,
  quartile: venues.quartile,
  impact: venues.impact,
  hIndex: venues.hIndex,
  topTier: venues.topTier,
  flags: venues.flags,
  areas: venues.areas,
  topics: venues.topics,
  data: venues.data,
};

export function toSummary(r: Pick<Venue, keyof typeof summaryColumns>): VenueSummary {
  const d = r.data as Record<string, unknown>;
  return {
    kind: r.kind,
    slug: r.slug,
    name: r.name,
    acronym: r.acronym,
    publisher: r.publisher,
    country: r.country,
    issn: r.issn ?? r.eissn,
    rank: r.rank,
    ccf: r.ccf,
    quartile: r.quartile,
    quartileFrom: r.quartile ? (d.wosQuartile ? "WoS" : "SJR") : null,
    impact: r.impact,
    hIndex: r.hIndex,
    topTier: r.topTier,
    flags: r.flags,
    areas: r.areas,
    topics: r.topics,
    edition: r.kind === "conference" ? { city: (d.city as string) ?? null, country: r.country, year: (d.latestYear as number) ?? null } : null,
    sjr: (d.sjr as number) ?? null,
    sjrQuartile: (d.sjrQuartile as string) ?? null,
    casTier: (d.casTier as string) ?? null,
  };
}

async function runSearch(db: Db, kind: VenueKind, q: VenueQuery, fuzzy: boolean, limit: number, offset: number) {
  const run = async (tx: Db) => {
    const where = filters(kind, q, fuzzy);
    const rows = await tx
      .select(summaryColumns)
      .from(venues)
      .where(where)
      .orderBy(...ordering(q, fuzzy))
      .limit(limit)
      .offset(offset);
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(venues).where(where);
    return { items: rows.map(toSummary), total: n };
  };
  if (!fuzzy) return run(db);
  // `<%` uses the trigram index; the default 0.6 misses short typos such as "nerips"
  return db.transaction(async (tx) => {
    await tx.execute(sql`set local pg_trgm.word_similarity_threshold = 0.45`);
    return run(tx as unknown as Db);
  });
}

const canFuzz = (q: VenueQuery) => fold(q.q).length >= 3;

/**
 * One kind of venue, one page. With a query that matches nothing word for word, it retries by
 * spelling similarity (pg_trgm) and says so (`fuzzy`), so "nerips" still finds NeurIPS.
 */
export async function searchVenues(db: Db, kind: VenueKind, q: VenueQuery, opts: { fuzzy?: boolean } = {}) {
  const offset = (q.page - 1) * q.size;
  let res = await runSearch(db, kind, q, false, q.size, offset);
  let fuzzy = false;
  if (!res.total && opts.fuzzy !== false && canFuzz(q)) {
    res = await runSearch(db, kind, q, true, q.size, offset);
    fuzzy = res.total > 0;
  }
  return { ...res, fuzzy, page: q.page, pages: Math.max(1, Math.ceil(res.total / q.size)) };
}

/**
 * The "All" tab: the best few of each kind for the same query, plus how many there are. Spelling
 * matches are only tried when neither kind matches word for word.
 */
export async function searchAllVenues(db: Db, q: VenueQuery, per = 6) {
  const first = { ...q, page: 1, size: per };
  const [conference, journal] = await Promise.all([searchVenues(db, "conference", first, { fuzzy: false }), searchVenues(db, "journal", first, { fuzzy: false })]);
  if (conference.total || journal.total || !canFuzz(q)) return { conference, journal };
  const [c, j] = await Promise.all([searchVenues(db, "conference", first), searchVenues(db, "journal", first)]);
  return { conference: c, journal: j };
}

/** Number of matches of the other kind, for the tab labels: same text, topic and top-tier filter. */
export async function countVenues(db: Db, kind: VenueKind, q: VenueQuery, fuzzy: boolean) {
  const shared: VenueQuery = { ...q, rank: [], ccf: [], quartile: [], index: [], oa: false, safe: false, area: undefined, page: 1, size: 1 };
  return (await runSearch(db, kind, shared, fuzzy, 1, 0)).total;
}

/* ------------------------------------------------------------------ facets -- */

export interface VenueFacets {
  total: Record<VenueKind, number>;
  areas: Record<VenueKind, { name: string; n: number }[]>;
  topics: Record<string, number>;
}
let facetCache: { at: number; value: VenueFacets } | null = null;

/** Counts for the filter lists. Cached for ten minutes per server process, reset by imports. */
export async function venueFacets(db: Db): Promise<VenueFacets> {
  if (facetCache && Date.now() - facetCache.at < 600_000) return facetCache.value;
  const [totals, areas, topics] = await Promise.all([
    db.select({ kind: venues.kind, n: sql<number>`count(*)::int` }).from(venues).groupBy(venues.kind),
    db.execute<{ kind: VenueKind; name: string; n: number }>(
      sql`select kind, a as name, count(*)::int as n from venues, jsonb_array_elements_text(areas) a group by kind, a order by n desc`,
    ),
    db.execute<{ name: string; n: number }>(sql`select t as name, count(*)::int as n from venues, jsonb_array_elements_text(topics) t group by t`),
  ]);
  const areaRows = (areas as unknown as { rows?: { kind: VenueKind; name: string; n: number }[] }).rows ?? (areas as unknown as { kind: VenueKind; name: string; n: number }[]);
  const topicRows = (topics as unknown as { rows?: { name: string; n: number }[] }).rows ?? (topics as unknown as { name: string; n: number }[]);
  const value: VenueFacets = {
    total: { conference: totals.find((t) => t.kind === "conference")?.n ?? 0, journal: totals.find((t) => t.kind === "journal")?.n ?? 0 },
    areas: {
      conference: areaRows.filter((r) => r.kind === "conference").map(({ name, n }) => ({ name, n: Number(n) })),
      journal: areaRows.filter((r) => r.kind === "journal").map(({ name, n }) => ({ name, n: Number(n) })),
    },
    topics: Object.fromEntries(topicRows.map((r) => [r.name, Number(r.n)])),
  };
  facetCache = { at: Date.now(), value };
  return value;
}

/* ------------------------------------------------------------------ detail -- */

export async function getVenue(db: Db, kind: VenueKind, slug: string): Promise<Venue | null> {
  const [row] = await db
    .select()
    .from(venues)
    .where(and(eq(venues.kind, kind), eq(venues.slug, slug)))
    .limit(1);
  return row ?? null;
}

/** Venues of the same kind on the same main topic (or first area), closest in rank first. */
export async function similarVenues(db: Db, v: Venue, limit = 6): Promise<VenueSummary[]> {
  const near = v.topics.length ? has(venues.topics, v.topics[0]) : v.areas.length ? has(venues.areas, v.areas[0]) : null;
  if (!near) return [];
  const rows = await db
    .select(summaryColumns)
    .from(venues)
    .where(and(eq(venues.kind, v.kind), ne(venues.id, v.id), near))
    .orderBy(sql`abs(${venues.rankScore} - ${v.rankScore})`, sql`${venues.hIndex} desc nulls last`, sql`${venues.impact} desc nulls last`)
    .limit(limit);
  return rows.map(toSummary);
}

/** For the sitemap: every conference, and journals with a quartile (the rest are thin pages). */
export async function listVenuePaths(db: Db) {
  return db
    .select({ kind: venues.kind, slug: venues.slug, updatedAt: venues.updatedAt })
    .from(venues)
    .where(or(eq(venues.kind, "conference"), sql`${venues.quartile} is not null`))
    .orderBy(desc(venues.rankScore))
    .limit(45_000);
}

/* ------------------------------------------------------------------ browse -- */

export interface VenueBrowse {
  kind: VenueKind | null;
  /** the page of results for one kind; empty on the All tab */
  items: VenueSummary[];
  /** the All tab: the best few of each kind */
  groups: Record<VenueKind, VenueSummary[]> | null;
  total: number;
  page: number;
  pages: number;
  counts: Record<VenueKind, number>;
  fuzzy: boolean;
}

/** What /venues and `GET /api/v1/venues` show for a query: one kind's page, or both kinds' best. */
export async function browseVenues(db: Db, q: VenueQuery): Promise<VenueBrowse> {
  if (!q.kind) {
    const { conference, journal } = await searchAllVenues(db, q);
    return {
      kind: null,
      items: [],
      groups: { conference: conference.items, journal: journal.items },
      total: conference.total + journal.total,
      page: 1,
      pages: 1,
      counts: { conference: conference.total, journal: journal.total },
      fuzzy: conference.fuzzy || journal.fuzzy,
    };
  }
  const other: VenueKind = q.kind === "conference" ? "journal" : "conference";
  const res = await searchVenues(db, q.kind, q);
  const otherCount = await countVenues(db, other, q, res.fuzzy);
  return {
    kind: q.kind,
    items: res.items,
    groups: null,
    total: res.total,
    page: res.page,
    pages: res.pages,
    counts: { [q.kind]: res.total, [other]: otherCount } as Record<VenueKind, number>,
    fuzzy: res.fuzzy,
  };
}
