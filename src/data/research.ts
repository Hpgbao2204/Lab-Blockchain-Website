export type Accent = "yellow" | "blue" | "red" | "violet" | "teal" | "orange" | "pink" | "lime";

export interface ResearchArea {
  slug: string;
  title: string;
  /** one line for cards */
  summary: string;
  /** a few paragraphs for the detail page */
  overview: string[];
  questions: string[];
  keywords: string[];
  accent: Accent;
}

/**
 * Research directions. M3/M4 move these into `site_settings` so the admin can edit them;
 * until then this file is the single source for both the pages and `/api/v1/research`.
 */
export const researchAreas: ResearchArea[] = [
  {
    slug: "cross-chain",
    title: "Cross-Chain Interoperability",
    summary: "Moving value and messages between blockchains without trusting a single bridge or relay.",
    overview: [
      "Independent blockchains increasingly need to talk to each other, yet most bridges still concentrate trust in a small committee or a single operator. We design protocols where that trust is minimized or removed altogether.",
      "Our work spans hash time-locked contracts, light-client verification and market-based multi-relay architectures, with an eye on liveness, cost and resistance to linkability attacks.",
    ],
    questions: [
      "How can a relay network stay honest without a trusted operator?",
      "What does it cost to verify another chain's state on-chain?",
      "Can cross-chain swaps stay unlinkable to outside observers?",
    ],
    keywords: ["HTLC", "Light clients", "Relays", "Bridges"],
    accent: "yellow",
  },
  {
    slug: "zero-knowledge",
    title: "Zero-Knowledge & Privacy",
    summary: "Proving that something is true without revealing the data behind it.",
    overview: [
      "Zero-knowledge proofs let a party convince others of a statement while keeping the witness private. We apply them where transparency of public ledgers collides with the need for confidentiality.",
      "Typical settings include private verification between consortium and public chains, selective disclosure of credentials, and formally verified privacy guarantees.",
    ],
    questions: [
      "Which cross-chain steps leak information, and can a proof replace them?",
      "How small and fast can proofs be for real deployments?",
    ],
    keywords: ["zk-SNARK", "Commitments", "Selective disclosure"],
    accent: "blue",
  },
  {
    slug: "identity",
    title: "Decentralized Identity & Reputation",
    summary: "Self-sovereign identity, verifiable credentials and reputation that resists manipulation.",
    overview: [
      "Identity on open networks must be portable, private and hard to forge. We study decentralized identifiers, verifiable academic credentials and soulbound tokens.",
      "On the reputation side, we model how trust evolves from evidence over time and how reputation can safely weight consensus or peer review.",
    ],
    questions: [
      "How should evidence from many sources fuse into one trust score?",
      "Can reputation be both verifiable and privacy-preserving?",
    ],
    keywords: ["DID", "Verifiable credentials", "Soulbound tokens"],
    accent: "teal",
  },
  {
    slug: "smart-contract-security",
    title: "Smart Contract Security",
    summary: "Finding, fixing and formally ruling out exploitable bugs in contracts and protocols.",
    overview: [
      "Smart contracts hold real value and cannot easily be patched. We analyse contracts and protocol designs for exploitable behaviour and use formal methods to rule whole classes of bugs out.",
    ],
    questions: [
      "Which properties of a protocol can be formally verified end to end?",
      "How do attacks compose across contracts and chains?",
    ],
    keywords: ["Formal verification", "Fuzzing", "MEV"],
    accent: "red",
  },
  {
    slug: "consensus",
    title: "Consensus & Networks",
    summary: "Consensus, governance and networking for education and enterprise blockchains.",
    overview: [
      "Permissioned and educational blockchains have different trade-offs from public ones. We design consensus and governance mechanisms, such as reputation-weighted proof-of-authority with verifiable randomness, that fit those settings.",
    ],
    questions: [
      "How can validator selection reward merit without centralizing power?",
      "What governance rules keep a consortium chain fair over time?",
    ],
    keywords: ["BFT", "PoA / VRF", "P2P"],
    accent: "violet",
  },
  {
    slug: "iot-ai",
    title: "Blockchain for IoT, Edge & AI",
    summary: "Trustworthy data and learning for IoT, edge networks and digital twins.",
    overview: [
      "Billions of constrained devices produce data that must be trusted without a central authority. We combine blockchains with edge computing, sharding and digital twins to make that data verifiable and its processing accountable.",
      "On the AI side, we use federated and reinforcement learning to detect vulnerabilities and adapt trust across chains, and we study how blockchains can keep learning pipelines private and auditable.",
    ],
    questions: [
      "How light can cross-chain verification be for resource-constrained devices?",
      "Can federated learning find smart contract bugs without sharing code or data?",
    ],
    keywords: ["Edge", "Federated learning", "Digital twins"],
    accent: "orange",
  },
];
