import Link from "next/link";
import { Mail, MapPin, UserPlus } from "lucide-react";
import { Brand } from "./brand";
import { siteLinks } from "./links";

/** The lab's public contact: the principal investigator's university address. */
export const CONTACT = {
  name: "Tran Tuan Dung",
  role: "Principal investigator",
  email: "dungtrt@uit.edu.vn",
  place: "University of Information Technology – VNU-HCM, Thu Duc, Ho Chi Minh City, Vietnam",
};

export function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="wrap grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1.2fr_1fr]">
        <div>
          <Brand />
          <p className="motto mt-5">building trust in a trustless world</p>
          <p className="max-w-sm text-sm text-muted">Blockchainist researches cross-chain interoperability, zero-knowledge proofs and decentralized identity.</p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-1.5 text-sm">
          <p className="eyebrow mb-1">Explore</p>
          {siteLinks.map((l) => (
            <Link key={l.href} href={l.href} className="w-fit underline-offset-4 hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <address className="grid content-start gap-2.5 text-sm not-italic">
          <p className="eyebrow mb-1">Contact</p>
          <p>
            <b>{CONTACT.name}</b>
            <span className="block text-muted">{CONTACT.role}</span>
          </p>
          <a href={`mailto:${CONTACT.email}`} className="flex w-fit items-center gap-2 font-bold underline-offset-4 hover:underline">
            <Mail size={15} aria-hidden /> {CONTACT.email}
          </a>
          <p className="flex gap-2 text-muted">
            <MapPin size={15} className="mt-1 shrink-0" aria-hidden /> {CONTACT.place}
          </p>
          <Link href="/join" className="btn btn-yellow btn-sm mt-1 w-fit">
            <UserPlus size={15} aria-hidden /> Apply to join
          </Link>
        </address>
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
