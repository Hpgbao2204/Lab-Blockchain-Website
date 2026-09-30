import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Blockchainist · Blockchain Research Group", template: "%s · Blockchainist" },
  description: "Blockchainist is a blockchain research group at UIT – VNU-HCM working on cross-chain interoperability, zero-knowledge proofs, decentralized identity and smart contract security.",
  icons: { icon: "/favicon.svg" },
  openGraph: { siteName: "Blockchainist", type: "website" },
};

export const viewport: Viewport = { themeColor: "#f6f3ec" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
