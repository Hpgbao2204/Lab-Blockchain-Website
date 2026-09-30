/**
 * SAMPLE DATA until M3 syncs publications from ORCID into the database.
 * Titles, venues and DOIs are real outputs of the group; the list is hand-picked.
 */
export type PublicationKind = "journal" | "conference" | "article";

export interface Publication {
  id: string;
  /** short project name shown as the highlighted part of the title */
  name: string;
  title: string;
  year: number;
  kind: PublicationKind;
  authors: string[];
  venue: string | null;
  doi: string | null;
  /** research area slugs, see `research.ts` */
  areas: string[];
}

export const publications: Publication[] = [
  {
    id: "zk-htlc",
    name: "zk-HTLC",
    title: "A formally verified defense against linkability attacks in trust-minimized cross-chain networks",
    year: 2026,
    kind: "journal",
    authors: ["TD Tran", "B Huynh", "VH Pham"],
    venue: "Computer Networks, 112780",
    doi: null,
    areas: ["cross-chain", "zero-knowledge", "smart-contract-security"],
  },
  {
    id: "chronosrep",
    name: "ChronosRep",
    title: "Entropy-regularized evidence fusion and stochastic differential trust dynamics for decentralized identity intelligence",
    year: 2026,
    kind: "journal",
    authors: ["TD Tran", "B Huynh", "VH Pham"],
    venue: "Information Sciences, 123323",
    doi: "10.1016/j.ins.2026.123323",
    areas: ["identity"],
  },
  {
    id: "verifiable-ai-reviewers",
    name: "Verifiable AI Reviewers",
    title: "Decentralized Skill Matching and Soulbound Reputation for Multi-Agent Peer Review",
    year: 2026,
    kind: "conference",
    authors: ["TM Trong", "B Huynh", "HN Nhi", "TT Nguyen", "NP Tai", "N Minh", "TD Tran", "et al."],
    venue: "Intl. Conf. on Multimedia Analysis and Pattern Recognition (MAPR 2026)",
    doi: null,
    areas: ["identity"],
  },
  {
    id: "acheron",
    name: "Acheron",
    title: "A market-based multi-relay architecture for adaptive and secure cross-chain communication",
    year: 2025,
    kind: "journal",
    authors: ["TD Tran", "Q Vu", "B Huynh", "VH Pham"],
    venue: "Internet of Things, 101836",
    doi: "10.1016/j.iot.2025.101836",
    areas: ["cross-chain", "smart-contract-security"],
  },
  {
    id: "dave-cc",
    name: "DAVE-CC",
    title: "A decentralized, access-controlled, verifiable ecosystem for cross-chain academic credential management",
    year: 2025,
    kind: "journal",
    authors: ["TD Tran", "HPG Bao", "NT Cam", "VH Pham"],
    venue: "Journal of Information Security and Applications 94, 104238",
    doi: "10.1016/j.jisa.2025.104238",
    areas: ["cross-chain", "identity"],
  },
  {
    id: "zk-interchain",
    name: "ZK-InterChain",
    title: "Privacy-Preserving Protocol for Cross-Chain Interactions Between Consortium and Public Blockchains",
    year: 2025,
    kind: "article",
    authors: ["TD Tran", "TT Kien", "B Huynh"],
    venue: null,
    doi: null,
    areas: ["zero-knowledge", "cross-chain"],
  },
  {
    id: "proof-of-merit",
    name: "Proof-of-Merit",
    title: "A Reputation-Weighted VRF-PoA Consensus and Governance for Educational Blockchains",
    year: 2025,
    kind: "conference",
    authors: ["TD Tran", "B Huynh", "TM Trong", "TT Nguyen", "NN BK", "VH Pham"],
    venue: "RIVF Intl. Conf. on Computing and Communication Technologies (IEEE)",
    doi: "10.1109/rivf68649.2025.11365043",
    areas: ["consensus", "identity"],
  },
  {
    id: "lotus",
    name: "Lotus",
    title: "A Hybrid Cross-Chain Framework for Privacy-Preserving Digital Identity",
    year: 2025,
    kind: "conference",
    authors: ["TD Tran", "HPG Bao", "TM Trong", "NT Cam", "VH Pham"],
    venue: "24th Intl. Symposium on Communications and Information Technologies (ISCIT, IEEE)",
    doi: "10.1109/iscit67082.2025.11231625",
    areas: ["cross-chain", "identity", "zero-knowledge"],
  },
];
