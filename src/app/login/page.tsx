import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/coming-soon";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return <ComingSoon title="Đăng nhập" note="Khu vực thành viên (tường nhóm, giao việc) sẽ mở ở giai đoạn tiếp theo. Tài khoản do quản trị viên cấp." />;
}
