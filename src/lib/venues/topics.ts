/**
 * Shared by the venue search UI and the importer: the topics a reader can browse by, and the
 * clean names of conference subfields. Topics cut across conferences and journals; they are worked
 * out at import from subfields, names and subject tags, so they are a guide, not a ranking.
 */

export type VenueKind = "conference" | "journal";

export const VENUE_TOPICS = [
  { slug: "blockchain", label: "Blockchain & crypto", c: "yellow" },
  { slug: "security", label: "Security & privacy", c: "red" },
  { slug: "ai", label: "AI & machine learning", c: "violet" },
  { slug: "graphics", label: "Vision, graphics & media", c: "pink" },
  { slug: "systems", label: "Systems & networks", c: "blue" },
  { slug: "software", label: "Software engineering", c: "teal" },
  { slug: "data", label: "Data & information", c: "orange" },
  { slug: "hci", label: "Human-computer interaction", c: "lime" },
  { slug: "theory", label: "Theory & algorithms", c: "paper-2" },
] as const;
export type VenueTopic = (typeof VENUE_TOPICS)[number]["slug"];
export const TOPIC_SLUGS = VENUE_TOPICS.map((t) => t.slug) as VenueTopic[];
export const topicOf = (slug: string) => VENUE_TOPICS.find((t) => t.slug === slug);

/** Conference subfield as written in the source file (codes, long names) → the label we show. */
const SUBFIELD: Record<string, string> = {
  ai: "Artificial Intelligence",
  kr: "Artificial Intelligence",
  ap: "Artificial Intelligence",
  ml: "Machine Learning",
  "machine learning": "Machine Learning",
  dm: "Data Mining",
  cv: "Computer Vision",
  nlp: "Natural Language Processing",
  sp: "Speech & Signal Processing",
  ro: "Robotics",
  hri: "Robotics",
  graphics: "Graphics",
  cg: "Graphics",
  vis: "Graphics",
  xr: "Graphics",
  multimedia: "Multimedia",
  hci: "Human-Computer Interaction",
  hi: "Human-Computer Interaction",
  cscw: "Human-Computer Interaction",
  gm: "Human-Computer Interaction",
  des: "Human-Computer Interaction",
  "software engineering": "Software Engineering",
  se: "Software Engineering",
  theory: "Theory",
  ct: "Theory",
  "distributed systems": "Distributed Systems",
  ds: "Distributed Systems",
  os: "Operating Systems",
  sys: "Computer Systems",
  es: "Computer Systems",
  per: "Computer Systems",
  networks: "Networks",
  nw: "Networks",
  net: "Networks",
  sec: "Security & Privacy",
  privacy: "Security & Privacy",
  sc: "Security & Privacy",
  bc: "Blockchain",
  db: "Databases",
  "data science": "Data Science",
  "information systems": "Information Systems",
  mx: "Interdisciplinary",
};

/** "AI; CV" or "['DS', 'BC']" → ["Artificial Intelligence", "Computer Vision"] (unknown codes dropped). */
export function cleanSubfields(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const parts = raw.replace(/[[\]'"]/g, "").split(/[;,]/);
  const out: string[] = [];
  for (const p of parts) {
    const label = SUBFIELD[p.trim().toLowerCase()];
    if (label && !out.includes(label)) out.push(label);
  }
  return out;
}

const SUBFIELD_TOPIC: Record<string, VenueTopic> = {
  "Artificial Intelligence": "ai",
  "Machine Learning": "ai",
  "Data Mining": "data",
  "Computer Vision": "graphics",
  "Natural Language Processing": "ai",
  "Speech & Signal Processing": "ai",
  Robotics: "ai",
  Graphics: "graphics",
  Multimedia: "graphics",
  "Human-Computer Interaction": "hci",
  "Software Engineering": "software",
  Theory: "theory",
  "Distributed Systems": "systems",
  "Operating Systems": "systems",
  Networks: "systems",
  "Security & Privacy": "security",
  Databases: "data",
  "Data Science": "data",
  "Information Systems": "data",
};

const BLOCKCHAIN = /blockchain|distributed ledger|crypto-?currenc|smart contract|decentrali[sz]ed (finance|app)|\bdefi\b|web3|financial cryptography|advances in financial technologies/i;
const SECURITY_STRONG = /cyber(?!net)|cryptolog|cryptograph|information security|computer security|network security|privacy|forensic/i;
const SECURITY = /secur|trust|malware|intrusion|attack/i;
const TOPIC_WORDS: [VenueTopic, RegExp][] = [
  ["ai", /artificial intelligence|machine learning|neural|intelligent|pattern recognition|natural language|computational linguistics|robot|evolutionary|fuzzy|knowledge-based|learning representations|cognitive computing/i],
  ["graphics", /graphic|visuali[sz]|multimedia|image|vision|video|virtual reality|augmented reality|\bgames?\b/i],
  ["systems", /network|distributed|parallel|cloud|internet of things|\biot\b|wireless|mobile comput|embedded|operating system|computer architecture|high performance|supercomput|real-time system|edge comput|communications?\b/i],
  ["software", /software|programming|program analysis|compiler|requirements engineering|formal methods|testing|verification/i],
  ["data", /\bdata\b|database|big data|information (systems|retrieval|management|science)|knowledge (discovery|management)|data mining|web (search|mining)/i],
  ["hci", /human[- ]computer|interaction|user (modeling|interface|experience)|ubiquitous|pervasive|accessib|cscw|interactive/i],
  ["theory", /theor|algorithm|logic in computer|computational complexity|automata|combinatori|discrete math|computational geometry|symbolic computation/i],
];

/** Computing journals only get the broad topics; a journal of "food security" is not a security venue. */
const COMPUTING = /comput|informati|software|artificial intelligence|electrical|electronic|telecommunic|cyber/i;

export function venueTopics(v: { kind: VenueKind; name: string; areas: string[]; tags?: string[] }): VenueTopic[] {
  const out = new Set<VenueTopic>();
  const text = [v.name, ...(v.tags ?? [])].join(" · ");
  if (v.kind === "conference") for (const a of v.areas) if (SUBFIELD_TOPIC[a]) out.add(SUBFIELD_TOPIC[a]);
  // the source tags many general venues (CCS, CAiSE) "blockchain"; only the name counts here
  if (BLOCKCHAIN.test(text)) out.add("blockchain");
  const computing = v.kind === "conference" || COMPUTING.test([...v.areas, ...(v.tags ?? []), v.name].join(" "));
  if (SECURITY_STRONG.test(v.name) || (computing && SECURITY.test(v.name))) out.add("security");
  // conference subfields already say what they are about; names only fill gaps for journals
  if (computing && (v.kind === "journal" || out.size === 0)) for (const [t, re] of TOPIC_WORDS) if (re.test(v.name)) out.add(t);
  return TOPIC_SLUGS.filter((t) => out.has(t));
}

/** What a result card needs; the API returns these. */
export interface VenueSummary {
  kind: VenueKind;
  slug: string;
  name: string;
  acronym: string | null;
  publisher: string | null;
  country: string | null;
  issn: string | null;
  rank: string | null;
  ccf: string | null;
  quartile: string | null;
  /** where `quartile` comes from: Web of Science, else SCImago */
  quartileFrom: "WoS" | "SJR" | null;
  impact: number | null;
  hIndex: number | null;
  topTier: boolean;
  flags: string[];
  areas: string[];
  topics: string[];
  /** conferences: where and when the latest edition is */
  edition: { city: string | null; country: string | null; year: number | null } | null;
  /** journals */
  sjr: number | null;
  sjrQuartile: string | null;
  casTier: string | null;
}

export const venueHref = (v: { kind: VenueKind; slug: string }) => `/venues/${v.kind === "conference" ? "conferences" : "journals"}/${v.slug}`;

/** Accent of the rank tile on cards: the better the rank, the louder the colour. */
export function rankColor(rank: string | null): string {
  switch (rank) {
    case "A*":
    case "Q1":
      return "var(--color-pink)";
    case "A":
    case "Q2":
      return "var(--color-orange)";
    case "B":
    case "Q3":
      return "var(--color-yellow)";
    case "C":
    case "Q4":
      return "var(--color-teal)";
    default:
      return "var(--color-paper-2)";
  }
}

export const FLAG_LABEL: Record<string, string> = {
  scie: "SCIE",
  ssci: "SSCI",
  ahci: "AHCI",
  esci: "ESCI",
  oa: "Open access",
  diamond: "Diamond OA",
  review: "Review journal",
  warned: "CAS warning",
};
export const JOURNAL_INDEXES = ["scie", "ssci", "esci", "ahci"] as const;

export const CORE_RANKS = ["A*", "A", "B", "C"] as const;
export const CCF_RANKS = ["A", "B", "C"] as const;
export const QUARTILES = ["Q1", "Q2", "Q3", "Q4"] as const;

export const VENUE_SORTS = {
  best: "Best ranked",
  h: "Highest h-index",
  name: "Name (A-Z)",
} as const;
export type VenueSort = keyof typeof VENUE_SORTS | "relevance";

/** Quick picks under the search box: venues people look up most. */
export const POPULAR_VENUES = ["CVPR", "NeurIPS", "ICML", "CCS", "S&P", "USENIX Security", "FC", "ICSE", "SIGMOD", "IEEE Access"];
