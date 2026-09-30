import Link from "next/link";
import { Brand } from "./brand";
import { siteLinks } from "./links";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Brand />
          <p className="motto mt-5">building trust in a trustless world</p>
          <p className="max-w-sm text-sm text-muted">
            <b className="text-ink">University of Information Technology – VNU-HCM</b>, Ho Chi Minh City, Vietnam.
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted">Blockchainist researches cross-chain interoperability, zero-knowledge proofs and decentralized identity.</p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-1.5 text-sm">
          <p className="eyebrow mb-1">Explore</p>
          {siteLinks.map((l) => (
            <Link key={l.href} href={l.href} className="w-fit underline-offset-4 hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="grid content-start gap-2 text-sm text-muted">
          <p className="eyebrow mb-1">Credits</p>
          <p>
            Pioneer portraits from Wikimedia Commons under open licenses.{" "}
            <Link href="/pioneers" className="font-bold text-ink underline underline-offset-4">
              See credits
            </Link>
          </p>
          <p className="mono text-xs">© {new Date().getFullYear()} Blockchainist Research Group</p>
        </div>
      </div>
    </footer>
  );
}
