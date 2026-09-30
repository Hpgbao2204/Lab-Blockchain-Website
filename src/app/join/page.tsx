import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = { title: "Gia nhập" };

export default function JoinPage() {
  return <ComingSoon title="Gia nhập nhóm" note="Biểu mẫu ứng tuyển sẽ sớm có mặt. Trong lúc chờ, hãy theo dõi công bố mới của nhóm." />;
}
