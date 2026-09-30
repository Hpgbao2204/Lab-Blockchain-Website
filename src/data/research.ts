export interface ResearchArea {
  id: string;
  title: string;
  blurb: string;
  keywords: string[];
  accent: "a" | "b" | "relay" | "proof";
}

export const researchAreas: ResearchArea[] = [
  {
    id: "cross-chain",
    title: "Liên chuỗi (Cross-chain)",
    blurb: "Giao thức truyền tải giá trị và thông điệp giữa các blockchain mà không cần tin vào bên trung gian.",
    keywords: ["HTLC", "Light client", "Relay", "Bridge"],
    accent: "relay",
  },
  {
    id: "zk",
    title: "Zero-knowledge & Riêng tư",
    blurb: "Chứng minh một điều đúng mà không lộ dữ liệu: giao dịch riêng tư, định danh có chọn lọc, xác minh hình thức.",
    keywords: ["zk-SNARK", "Commitment", "Linkability"],
    accent: "a",
  },
  {
    id: "identity",
    title: "Định danh & Uy tín phi tập trung",
    blurb: "Danh tính tự chủ, chứng chỉ học thuật có thể kiểm chứng, và mô hình uy tín chống gian lận.",
    keywords: ["DID", "Verifiable credentials", "Soulbound"],
    accent: "proof",
  },
  {
    id: "security",
    title: "An toàn hợp đồng thông minh",
    blurb: "Phân tích, kiểm chứng và chống khai thác lỗ hổng ở tầng hợp đồng và giao thức.",
    keywords: ["Formal verification", "Fuzzing", "MEV"],
    accent: "b",
  },
  {
    id: "consensus",
    title: "Đồng thuận & Mạng",
    blurb: "Cơ chế đồng thuận, quản trị và truyền tin hiệu quả cho mạng blockchain giáo dục và doanh nghiệp.",
    keywords: ["BFT", "PoA / VRF", "P2P"],
    accent: "a",
  },
];
