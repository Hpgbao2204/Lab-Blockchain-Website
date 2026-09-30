/**
 * People shown on /people. Until M3 imports the roster from the advisor's CSV, only the
 * principal investigator is listed (same public details as the portfolio site).
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
}

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
];
