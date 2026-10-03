/**
 * Publications of the principal investigator, snapshot from Crossref (ORCID 0000-0003-1156-7072,
 * `npm run sync:publications`) plus three IEEE/MAPR papers Crossref does not attribute yet.
 * M3 moves this into the database and refreshes it on a schedule.
 */
import raw from "./publications.json";

export type PublicationKind = "journal" | "conference" | "article";

export interface Publication {
  id: string;
  /** short project name shown as the highlighted part of the title, when the title has one */
  name: string | null;
  title: string;
  year: number;
  kind: PublicationKind;
  authors: string[];
  venue: string | null;
  doi: string | null;
  /** a link for papers without a DOI (added by the admin) */
  url?: string | null;
  /** research area slugs, see `research.ts` */
  areas: string[];
}

type RawPublication = Omit<Publication, "areas" | "kind"> & { kind: string; areas?: string[] };

/** Title keywords that place a paper under a research direction (a paper can match several). */
const AREA_RULES: [string, RegExp][] = [
  ["cross-chain", /cross-chain|cross-blockchain|multi-chain|interoperab|sidechain|bridge|relay|htlc|interchain|cross-shard/i],
  ["zero-knowledge", /zero[- ]knowledge|\bzk|privacy/i],
  ["identity", /identity|credential|reputation|trust|soulbound|revocation/i],
  ["smart-contract-security", /vulnerab|exploit|audit|reentrancy|smart contract|tls|attack|threat|linkability/i],
  ["consensus", /consensus|bft|shard|governance|order-book|dex|e-voting|auction/i],
  ["iot-ai", /iot|edge|federated|digital twin|cyber-physical|healthcare|medic|language model|machine learning|reinforcement|soft computing/i],
];

export function tagAreas(p: Pick<Publication, "name" | "title">): string[] {
  const text = `${p.name ?? ""} ${p.title}`;
  return AREA_RULES.filter(([, re]) => re.test(text)).map(([slug]) => slug);
}

export const publications: Publication[] = (raw as RawPublication[]).map((p) => ({
  ...p,
  kind: p.kind as PublicationKind,
  areas: p.areas ?? tagAreas(p),
}));

const PI_NAMES = /^(tuan[- ]dung tran|dung tuan tran|tran tuan dung|td tran|dung tran tuan)$/;
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().trim();

/** Author lists come in several spellings; this recognises the principal investigator in all of them. */
export const isPI = (author: string) => PI_NAMES.test(fold(author));
