import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Db } from "../db/client";
import { createSession, userFromToken, type SessionUser } from "../auth/sessions";
import { authenticate, createUser, ensureAdmin } from "./users";
import { browseVenues, finishVenueImport, getVenue, importVenueRows, searchVenues, similarVenues, venueFacets, venueQuerySchema, venueStats } from "./venues";
import { parseCsv, venueFileKind } from "@/lib/venues/csv";
import { cleanSubfields } from "@/lib/venues/topics";

const CONFERENCES = `conference_id,acronym,name,primary_domain,core_rank,core_rank_clean,core_rank_numeric,ccf_rank,ccf_rank_numeric,is_top_tier,core_for_code,core_for_name,organizer,publisher,h5_index,h5_median,total_editions,first_edition_year,latest_edition_year,years_history,virtual_editions_count,hybrid_editions_count,latest_city,latest_country,total_deadlines_tracked,has_upcoming_deadline,subfields,tags
c-cvpr,CVPR,IEEE Conference on Computer Vision and Pattern Recognition,Computer Science,A*,A*,4,A,3,1,4603,Computer vision and multimedia computation,,,389.0,,16,2010.0,2027.0,18,0,0,Seattle,United States,15,1,AI; CV; Multimedia; SYS,CONF
c-fc,FC,Financial Cryptography and Data Security Conference,Computer Science,A,A,3,C,1,1,4604,Cybersecurity and privacy,,,,,16,2010.0,2027.0,18,0,0,Barbados,,14,0,"SEC; ['BC', 'CS']; SC; Privacy",CONF
c-sp,S&amp;P,IEEE Symposium on Security and Privacy,Computer Science,A*,A*,4,A,3,1,4604,Cybersecurity and privacy,,,,,16,2008.0,2027.0,20,0,0,Montreal,Canada,28,1,"['CS']; Theory; SEC; Privacy",CONF
c-neurips,NeurIPS,Advances in Neural Information Processing Systems,Computer Science,A*,A*,4,A,3,1,4611,Machine learning,,,309.0,,10,2016,2026,10,0,0,Sydney,Australia,9,0,Machine Learning; AI; ML,CONF
c-icbc,ICBC,IEEE International Conference on Blockchain and Cryptocurrency,Computer Science,C,C,1,,0,0,,,,,,,3,2024,2027,3,0,0,,,0,0,"['BC']",CONF
`;

const JOURNALS = `journal_id,name,issn,issn_online,publisher,publisher_group,country,region,founding_year,journal_age,frequency,oa_model,is_open_access,is_oa_diamond,annual_articles,gold_oa_rate,original_research_rate,impact_factor,impact_factor_diff,wos_quartile_best,wos_category_count,is_scie,is_ssci,is_ahci,is_esci,cas_tier_best,is_top_journal,is_review_journal,is_cas_warned,self_citation_rate,h_index,sjr,scimago_quartile,total_docs_3years,total_citations_3years,citable_docs_3years,citations_per_doc_2years,ref_per_doc,female_author_rate,overton_citations,estimated_apc_usd,estimated_value_usd,top_ai_tags,research_areas,scopus_areas
j-access,IEEE Access,2169-3536,,Institute of Electrical and Electronics Engineers Inc.,Other,United States,Northern America,2013.0,13.0,Continuous publication,Hybrid,1,0,12388.0,99.97,96.33,4.2,0.6,Q2,6,1,0,0,0,Tier 3,0,0,1,11.8,56.0,0.884,Q1,33086.0,207594.0,33077.0,6.01,51.97,25.72,0.0,3271.0,1,Computer science; Engineering,"COMPUTER SCIENCE; ENGINEERING","Computer Science; Engineering"
j-fib,Frontiers in Blockchain,,2624-7852,Frontiers Media S.A.,Frontiers,Switzerland,Western Europe,,,,Gold OA,1,0,50.0,100.0,87.5,3.1,0.7,Q3,4,0,0,0,1,Tier 3,0,0,0,15.8,34.0,0.569,Q2,95.0,444.0,90.0,4.86,58.87,41.56,0.0,2949.0,1,Computer science; Blockchain,Multiple,Computer Science; Economics
j-lancet,Lancet,0140-6736,1474-547X,Elsevier,Elsevier,England,Western Europe,1823,203,Weekly,Hybrid,0,0,256,25.49,72.2,109,20.5,Q1,1,1,0,0,0,Tier 1,1,0,0,1.1,700,14.821,Q1,4112,59974,1272,13.95,30,37.3,0,5406,1,Medicine,Medicine,Medicine
j-cyber,IEEE Transactions on Cybernetics,2168-2267,,IEEE,IEEE,United States,,,,,Hybrid,0,0,500,1,90,11.3,0.1,Q1,3,1,0,0,0,Tier 1,1,0,0,10,81,3.72,Q1,1,1,1,1,1,1,0,0,1,Computer science; Artificial intelligence,COMPUTER SCIENCE,Computer Science
j-dup,Lancet,,,Unknown,Unknown,,,,,,,0,0,,,,,,,0,0,0,0,0,,0,0,0,,,,,,,,,,,,,,,,
`;

let db: Db;
let admin: SessionUser, member: SessionUser;

const login = async (email: string, password: string) => {
  const u = await authenticate(db, email, password);
  return (await userFromToken(db, (await createSession(db, u.id)).token))!;
};
const q = (o: Record<string, string> = {}) => venueQuerySchema.parse(o);
async function load(text: string, run: string, prune = true) {
  const { columns, rows } = parseCsv(text);
  const kind = venueFileKind(columns)!;
  const r = await importVenueRows(db, admin, { kind, run, columns, rows });
  const f = await finishVenueImport(db, admin, { kind, run, prune });
  return { ...r, ...f };
}

beforeAll(async () => {
  db = await createTestDb();
  admin = await login("pi@lab.test", (await ensureAdmin(db, { email: "pi@lab.test", name: "PI" }))!);
  const { temporaryPassword } = await createUser(db, admin, { email: "m@lab.test", name: "Member", title: null, role: "member" });
  member = await login("m@lab.test", temporaryPassword);
}, 30_000);

describe("venue import", () => {
  it("reads quoted CSV and tells the two files apart by their header", () => {
    const { columns, rows } = parseCsv('a,b\r\n"x, ""y""",2\n');
    expect(columns).toEqual(["a", "b"]);
    expect(rows).toEqual([['x, "y"', "2"]]);
    expect(venueFileKind(parseCsv(CONFERENCES).columns)).toBe("conference");
    expect(venueFileKind(parseCsv(JOURNALS).columns)).toBe("journal");
    expect(venueFileKind(["id", "name"])).toBeNull();
  });

  it("cleans the mixed subfield codes of the source", () => {
    expect(cleanSubfields("SEC; ['BC', 'CS']; SC; Privacy")).toEqual(["Security & Privacy", "Blockchain"]);
    expect(cleanSubfields("AI; CV; Multimedia")).toEqual(["Artificial Intelligence", "Computer Vision", "Multimedia"]);
  });

  it("is for admins only", async () => {
    const { columns, rows } = parseCsv(CONFERENCES);
    const input = { kind: "conference" as const, run: "run-member", columns, rows };
    await expect(importVenueRows(db, null, input)).rejects.toMatchObject({ code: "unauthorized" });
    await expect(importVenueRows(db, member, input)).rejects.toMatchObject({ code: "forbidden" });
    await expect(finishVenueImport(db, member, { kind: "conference", run: "run-member", prune: true })).rejects.toMatchObject({ code: "forbidden" });
    await expect(venueStats(db, member)).rejects.toMatchObject({ code: "forbidden" });
  });

  it("refuses the wrong file for the kind, and an empty run never prunes", async () => {
    const { columns, rows } = parseCsv(JOURNALS);
    await expect(importVenueRows(db, admin, { kind: "conference", run: "run-wrong", columns, rows })).rejects.toMatchObject({ code: "invalid_input" });
    await expect(finishVenueImport(db, admin, { kind: "journal", run: "run-nothing", prune: true })).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("imports both files, gives unique slugs and normalizes the figures", async () => {
    expect(await load(CONFERENCES, "run-c1")).toMatchObject({ inserted: 5, updated: 0, removed: 0 });
    // the second "Lancet" has no ISSN: it gets a suffixed slug; "Unknown" publishers are dropped
    expect(await load(JOURNALS, "run-j1")).toMatchObject({ inserted: 5, updated: 0 });
    const sp = (await getVenue(db, "conference", "sp"))!;
    expect(sp).toMatchObject({ acronym: "S&P", rank: "A*", ccf: "A", topTier: true });
    expect(sp.areas).toEqual(["Theory", "Security & Privacy"]);
    const lancet = (await getVenue(db, "journal", "lancet"))!;
    expect(lancet).toMatchObject({ issn: "0140-6736", eissn: "1474-547X", quartile: "Q1", impact: 109, topTier: true });
    const dup = (await searchVenues(db, "journal", q({ q: "lancet" }))).items.find((v) => v.slug !== "lancet")!;
    expect(dup.slug).toMatch(/^lancet-/);
    expect(dup.publisher).toBeNull();
    const access = (await getVenue(db, "journal", "ieee-access"))!;
    expect(access.flags).toEqual(["scie", "oa", "warned"]);
    expect(access.data).toMatchObject({ wosQuartile: "Q2", sjrQuartile: "Q1", casTier: "Tier 3", apcUsd: 3271 });
  });

  it("tags topics by meaning, not by noisy source tags or look-alike words", async () => {
    expect((await getVenue(db, "conference", "fc"))!.topics).toEqual(["blockchain", "security"]);
    expect((await getVenue(db, "conference", "icbc"))!.topics).toContain("blockchain");
    expect((await getVenue(db, "journal", "frontiers-in-blockchain"))!.topics).toContain("blockchain");
    // "Cybernetics" is not cyber security, and medicine is not computing
    expect((await getVenue(db, "journal", "ieee-transactions-on-cybernetics"))!.topics).not.toContain("security");
    expect((await getVenue(db, "journal", "lancet"))!.topics).toEqual([]);
  });

  it("updates in place on a newer file, keeps slugs, and prunes what the file dropped", async () => {
    const before = (await getVenue(db, "conference", "cvpr"))!;
    const newer = CONFERENCES.replace("389.0", "400.0")
      .split("\n")
      .filter((l) => !l.startsWith("c-icbc"))
      .join("\n");
    expect(await load(newer, "run-c2")).toMatchObject({ inserted: 0, updated: 4, removed: 1 });
    const after = (await getVenue(db, "conference", "cvpr"))!;
    expect(after.slug).toBe(before.slug);
    expect(after.hIndex).toBe(400);
    expect(await getVenue(db, "conference", "icbc")).toBeNull();
    // --keep: add back without removing anything
    expect(await load(CONFERENCES, "run-c3", false)).toMatchObject({ inserted: 1, removed: 0 });
    expect((await venueStats(db, admin)).conference.count).toBe(5);
  });
});

describe("venue search", () => {
  it("puts the exact acronym first and finds journals by ISSN with or without the dash", async () => {
    expect((await searchVenues(db, "conference", q({ q: "fc" }))).items[0].acronym).toBe("FC");
    expect((await searchVenues(db, "journal", q({ q: "21693536" }))).items[0].name).toBe("IEEE Access");
    expect((await searchVenues(db, "journal", q({ q: "0140-6736" }))).items[0].slug).toBe("lancet");
  });

  it("falls back to spelling matches and says so", async () => {
    const res = await searchVenues(db, "conference", q({ q: "nerips" }));
    expect(res.fuzzy).toBe(true);
    expect(res.items[0].acronym).toBe("NeurIPS");
    expect((await searchVenues(db, "conference", q({ q: "zzzzqqq" }))).total).toBe(0);
  });

  it("filters by rank, topic, quartile, index, open access and the CAS warning", async () => {
    expect((await searchVenues(db, "conference", q({ rank: "A*" }))).items.map((v) => v.acronym).sort()).toEqual(["CVPR", "NeurIPS", "S&P"]);
    expect((await searchVenues(db, "conference", q({ topic: "blockchain" }))).items.map((v) => v.acronym)).toEqual(["FC", "ICBC"]);
    expect((await searchVenues(db, "conference", q({ area: "Computer Vision" }))).items.map((v) => v.acronym)).toEqual(["CVPR"]);
    expect((await searchVenues(db, "journal", q({ quartile: "Q1" }))).items.map((v) => v.name)).toEqual(["Lancet", "IEEE Transactions on Cybernetics"]);
    expect((await searchVenues(db, "journal", q({ index: "esci" }))).items.map((v) => v.name)).toEqual(["Frontiers in Blockchain"]);
    expect((await searchVenues(db, "journal", q({ oa: "1", safe: "1" }))).items.map((v) => v.name)).toEqual(["Frontiers in Blockchain"]);
    // a bad value in the URL is ignored, not an error
    expect(venueQuerySchema.parse({ rank: "A*,Z" }).rank).toEqual(["A*"]);
  });

  it("sorts best-ranked first, by h-index, or by name, and pages", async () => {
    expect((await searchVenues(db, "conference", q({ sort: "h" }))).items[0].acronym).toBe("CVPR");
    expect((await searchVenues(db, "conference", q({ sort: "name" }))).items[0].acronym).toBe("NeurIPS");
    const page2 = await searchVenues(db, "conference", q({ size: "2", page: "2" }));
    expect(page2).toMatchObject({ total: 5, pages: 3, page: 2 });
    expect(page2.items).toHaveLength(2);
  });

  it("the All view groups both kinds and counts each, and one kind still counts the other", async () => {
    const all = await browseVenues(db, q({ q: "blockchain" }));
    expect(all.counts).toEqual({ conference: 1, journal: 1 });
    expect(all.groups!.journal[0].name).toBe("Frontiers in Blockchain");
    const one = await browseVenues(db, q({ kind: "conference", topic: "security", rank: "A" }));
    expect(one.items.map((v) => v.acronym)).toEqual(["FC"]);
    expect(one.counts.journal).toBe(0);
  });

  it("lists facets and similar venues", async () => {
    const f = await venueFacets(db);
    expect(f.total).toEqual({ conference: 5, journal: 5 });
    expect(f.areas.journal.find((a) => a.name === "Computer Science")?.n).toBe(3);
    const sim = await similarVenues(db, (await getVenue(db, "conference", "fc"))!);
    expect(sim.map((v) => v.acronym)).toContain("ICBC");
  });
});
