import type { Metadata, Viewport } from "next";
// Self-hosted fonts, imported here so Next.js resolves them (not the Tailwind CSS pipeline).
import "@fontsource/unbounded/latin-600.css";
import "@fontsource/unbounded/latin-800.css";
import "@fontsource/space-grotesk/latin-400.css";
import "@fontsource/space-grotesk/latin-500.css";
import "@fontsource/space-grotesk/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "./globals.css";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
