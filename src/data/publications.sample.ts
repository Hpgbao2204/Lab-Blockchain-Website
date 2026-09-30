/**
 * SAMPLE DATA (M1). Titles/years/DOIs are real outputs of the group, but the list is
 * hand-picked. M3 replaces this with publications synced from ORCID.
 */
export interface SamplePublication {
  title: string;
  year: number;
  doi: string;
  kind: "Journal" | "Conference";
}

export const samplePublications: SamplePublication[] = [
  {
    title: "ChronosRep: Entropy-regularized evidence fusion and stochastic differential trust dynamics for decentralized identity intelligence",
    year: 2026,
    doi: "10.1016/j.ins.2026.123323",
    kind: "Journal",
  },
  {
    title: "Acheron: A market-based multi-relay architecture for adaptive and secure cross-chain communication",
    year: 2025,
    doi: "10.1016/j.iot.2025.101836",
    kind: "Journal",
  },
  {
    title: "DAVE-CC: A decentralized, access-controlled, verifiable ecosystem for cross-chain academic credential management",
    year: 2025,
    doi: "10.1016/j.jisa.2025.104238",
    kind: "Journal",
  },
  {
    title: "Proof-of-Merit: A Reputation-Weighted VRF-PoA Consensus and Governance for Educational Blockchains",
    year: 2025,
    doi: "10.1109/rivf68649.2025.11365043",
    kind: "Conference",
  },
];
