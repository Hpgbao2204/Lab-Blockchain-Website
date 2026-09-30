import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/site/nav";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Blockchainist — Nhóm nghiên cứu Blockchain", template: "%s · Blockchainist" },
  description: "Nhóm nghiên cứu Blockchain, Mạng & Bảo mật: liên chuỗi, zero-knowledge, định danh phi tập trung.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#eef2f9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Bỏ qua điều hướng
        </a>
        <Nav />
        {children}
      </body>
    </html>
  );
}
