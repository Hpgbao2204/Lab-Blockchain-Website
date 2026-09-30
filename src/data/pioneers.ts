import generated from "./pioneers.generated.json";

export interface PioneerCredit {
  license: string;
  licenseUrl: string | null;
  author: string;
  source: string;
}

export interface Pioneer {
  id: string;
  name: string;
  /** short contribution line shown in the UI */
  contribution: string;
  year: string;
  /** portrait under /public, absent when no freely-licensed photo exists */
  image?: string;
  credit?: PioneerCredit;
  /** which accent the duotone portrait leans toward */
  tint: "blue" | "violet" | "amber";
}

interface GeneratedEntry extends PioneerCredit {
  id: string;
  name: string;
  image: string;
}

const photos = new Map((generated as GeneratedEntry[]).map((g) => [g.id, g]));

type Editorial = Omit<Pioneer, "image" | "credit">;

// Order matters: it is the order shown in the gallery and the hero spotlight.
const editorial: Editorial[] = [
  { id: "diffie", name: "Whitfield Diffie", year: "1976", tint: "blue", contribution: "Public-key cryptography and Diffie–Hellman key exchange, the basis of digital signatures." },
  { id: "hellman", name: "Martin Hellman", year: "1976", tint: "violet", contribution: "Co-author of “New Directions in Cryptography”, which opened the public-key era." },
  { id: "merkle", name: "Ralph Merkle", year: "1979", tint: "amber", contribution: "Merkle trees: summarize and prove block data at logarithmic cost." },
  { id: "rivest", name: "Ron Rivest", year: "1977", tint: "blue", contribution: "Co-inventor of RSA, the most widely deployed public-key cryptosystem and signature scheme." },
  { id: "shamir", name: "Adi Shamir", year: "1979", tint: "violet", contribution: "Shamir secret sharing and RSA, the groundwork for multisig wallets and key recovery." },
  { id: "chaum", name: "David Chaum", year: "1982", tint: "blue", contribution: "Electronic cash (eCash) and mix networks, forerunners of private digital money." },
  { id: "goldwasser", name: "Shafi Goldwasser", year: "1985", tint: "amber", contribution: "Zero-knowledge proofs with Micali and Rackoff, the root of today's zk-SNARKs." },
  { id: "micali", name: "Silvio Micali", year: "1985", tint: "violet", contribution: "Zero knowledge, verifiable random functions (VRF) and the Algorand consensus." },
  { id: "back", name: "Adam Back", year: "1997", tint: "blue", contribution: "Hashcash, the proof-of-work scheme cited in the Bitcoin whitepaper." },
  { id: "satoshi", name: "Satoshi Nakamoto", year: "2008", tint: "amber", contribution: "Bitcoin, the first peer-to-peer electronic cash system and the first working blockchain. Identity still unknown." },
  { id: "buterin", name: "Vitalik Buterin", year: "2013", tint: "violet", contribution: "Ethereum: smart contracts and a general-purpose virtual machine on a blockchain." },
  { id: "wood", name: "Gavin Wood", year: "2016", tint: "blue", contribution: "Ethereum co-founder and Solidity author; Polkadot, a relay-chain architecture for interoperability." },
];

export const pioneers: Pioneer[] = editorial.map((e) => {
  const p = photos.get(e.id);
  return p
    ? { ...e, image: p.image, credit: { license: p.license, licenseUrl: p.licenseUrl, author: p.author, source: p.source } }
    : e;
});

/** Pioneers that have a portrait we may legally show (Satoshi gets a generated silhouette). */
export const pioneersWithPortrait = pioneers.filter((p) => p.image);
