/**
 * People shown on /people. The principal investigator is real (same public details as the
 * portfolio site). Everyone marked `sample` is a placeholder until the real roster arrives.
 */
export interface Person {
  slug: string;
  name: string;
  role: "pi" | "member" | "alumni";
  title: string;
  photo: string | null;
  bio: string;
  interests: string[];
  links: { label: string; url: string }[];
  /** placeholder profile, labelled as such on the site and left out of the stats */
  sample?: boolean;
  /** research area slugs from src/data/research.ts */
  areas?: string[];
}

const sample = (slug: string, name: string, title: string, bio: string, interests: string[], areas: string[]): Person => ({
  slug,
  name,
  role: "member",
  title,
  photo: null,
  bio,
  interests,
  links: [],
  sample: true,
  areas,
});

export const people: Person[] = [
  {
    slug: "tran-tuan-dung",
    name: "Tran Tuan Dung",
    role: "pi",
    title: "M.Sc. · Lecturer · Principal Investigator",
    photo: "/people/tran-tuan-dung.jpg",
    bio: "Leads Blockchainist. His research spans blockchain and smart contracts, network security, IoT and edge computing with digital twins, and AI for security and privacy.",
    interests: ["Blockchain & Smart Contracts", "Network Security", "IoT & Digital Twins", "AI Security & Privacy"],
    links: [
      { label: "Google Scholar", url: "https://scholar.google.com/citations?user=zaJ7ZE4AAAAJ" },
      { label: "ORCID", url: "https://orcid.org/0000-0003-1156-7072" },
    ],
  },
  sample("minh-anh-le", "Le Minh Anh", "PhD student", "Works on privacy-preserving atomic swaps and their formal verification.", ["Cross-chain", "Formal methods"], ["cross-chain"]),
  sample("quoc-huy-pham", "Pham Quoc Huy", "M.Sc. student", "Builds zk-SNARK circuits for private credentials and measures their cost on-chain.", ["Zero-knowledge", "Circom"], ["zero-knowledge", "identity"]),
  sample("thu-ha-nguyen", "Nguyen Thu Ha", "M.Sc. student", "Studies self-sovereign identity wallets and selective disclosure for university records.", ["Decentralized identity", "Verifiable credentials"], ["identity"]),
  sample("gia-khang-vo", "Vo Gia Khang", "Research assistant", "Finds and reproduces smart contract vulnerabilities with fuzzing and symbolic execution.", ["Smart contract security", "Fuzzing"], ["smart-contract-security"]),
  sample("bao-ngoc-tran", "Tran Bao Ngoc", "Undergraduate researcher", "Compares BFT consensus protocols under network faults in a small testbed.", ["Consensus", "Distributed systems"], ["consensus"]),
  sample("duc-tri-hoang", "Hoang Duc Tri", "Undergraduate researcher", "Connects IoT sensors to a permissioned ledger with a digital twin of the lab.", ["IoT", "Digital twins"], ["iot-ai"]),
  sample("khanh-linh-dang", "Dang Khanh Linh", "Undergraduate researcher", "Trains anomaly detectors on blockchain transaction graphs.", ["AI for security", "Graph learning"], ["iot-ai", "smart-contract-security"]),
  sample("tuan-kiet-bui", "Bui Tuan Kiet", "Undergraduate researcher", "Implements light-client bridges and benchmarks relay costs across EVM chains.", ["Bridges", "Light clients"], ["cross-chain"]),
  sample("mai-phuong-do", "Do Mai Phuong", "Undergraduate researcher", "Writes Tamarin models for key-exchange steps in cross-chain protocols.", ["Protocol verification", "Tamarin"], ["cross-chain", "zero-knowledge"]),
  sample("hai-dang-ngo", "Ngo Hai Dang", "Undergraduate researcher", "Audits DeFi lending contracts and writes invariant tests.", ["DeFi", "Auditing"], ["smart-contract-security"]),
];
