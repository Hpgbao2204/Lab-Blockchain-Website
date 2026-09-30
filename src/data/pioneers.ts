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
  { id: "diffie", name: "Whitfield Diffie", year: "1976", tint: "blue", contribution: "Mật mã khoá công khai và trao đổi khoá Diffie–Hellman — nền tảng của chữ ký số." },
  { id: "hellman", name: "Martin Hellman", year: "1976", tint: "violet", contribution: "Đồng tác giả “New Directions in Cryptography”, mở ra kỷ nguyên mật mã khoá công khai." },
  { id: "merkle", name: "Ralph Merkle", year: "1979", tint: "amber", contribution: "Cây Merkle — cách tóm tắt và chứng minh dữ liệu khối với chi phí log n." },
  { id: "rivest", name: "Ron Rivest", year: "1977", tint: "blue", contribution: "Đồng tác giả RSA, hệ mật và chữ ký số được dùng rộng rãi nhất." },
  { id: "shamir", name: "Adi Shamir", year: "1979", tint: "violet", contribution: "Chia sẻ bí mật Shamir và RSA — nền cho ví đa chữ ký, khôi phục khoá." },
  { id: "chaum", name: "David Chaum", year: "1982", tint: "blue", contribution: "Tiền mặt điện tử (eCash) và mix network; ý tưởng tiền thân của tiền số riêng tư." },
  { id: "goldwasser", name: "Shafi Goldwasser", year: "1985", tint: "amber", contribution: "Chứng minh không tiết lộ tri thức (ZK) cùng Micali và Rackoff — nền của zk-SNARK." },
  { id: "micali", name: "Silvio Micali", year: "1985", tint: "violet", contribution: "Zero-knowledge, hàm ngẫu nhiên kiểm chứng được (VRF) và đồng thuận Algorand." },
  { id: "back", name: "Adam Back", year: "1997", tint: "blue", contribution: "Hashcash — proof-of-work, được trích dẫn trong bài báo Bitcoin." },
  { id: "satoshi", name: "Satoshi Nakamoto", year: "2008", tint: "amber", contribution: "Bitcoin: hệ thống tiền điện tử ngang hàng — blockchain đầu tiên chạy thật. Danh tính vẫn chưa được biết." },
  { id: "buterin", name: "Vitalik Buterin", year: "2013", tint: "violet", contribution: "Ethereum — hợp đồng thông minh và máy ảo tổng quát trên blockchain." },
  { id: "wood", name: "Gavin Wood", year: "2016", tint: "blue", contribution: "Đồng sáng lập Ethereum, tác giả Solidity; Polkadot — kiến trúc relay chain cho liên chuỗi." },
];

export const pioneers: Pioneer[] = editorial.map((e) => {
  const p = photos.get(e.id);
  return p
    ? { ...e, image: p.image, credit: { license: p.license, licenseUrl: p.licenseUrl, author: p.author, source: p.source } }
    : e;
});

/** Pioneers that have a portrait we may legally show (Satoshi gets a generated silhouette). */
export const pioneersWithPortrait = pioneers.filter((p) => p.image);
