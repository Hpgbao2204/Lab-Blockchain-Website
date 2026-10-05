import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { PersonView } from "@/server/services/people";
import { Avatar, accentVar } from "./profile-view";

/**
 * A member's own website shown full screen at /people/[slug], under a slim lab bar, so the
 * lab address keeps the lab's frame around it. The site runs sandboxed: it can open links in
 * new tabs but cannot navigate this page.
 */
export function PortfolioFrame({ person }: { person: PersonView }) {
  const url = person.portfolioUrl!;
  return (
    <div className="portfolio-frame" style={{ "--c": accentVar(person.accent) } as React.CSSProperties}>
      <header className="portfolio-bar">
        <Link href="/" aria-label="Blockchainist home" className="shrink-0">
          <Image src="/brand/logo-mark.svg" alt="" width={28} height={28} unoptimized />
        </Link>
        <Link href="/people" className="btn btn-xs shrink-0" aria-label="All people">
          <ArrowLeft size={13} aria-hidden /> <span className="max-sm:hidden">People</span>
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <Avatar person={person} size={30} />
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-bold">{person.name}</h1>
            {person.headline && <p className="mono truncate text-[11px] text-ink-2 max-sm:hidden">{person.headline}</p>}
          </div>
        </div>
        <a href={url} className="btn btn-xs ml-auto shrink-0" target="_blank" rel="noopener noreferrer" aria-label={`Open ${person.name}'s website in a new tab`}>
          <span className="max-sm:hidden">Open site</span> <ArrowUpRight size={13} aria-hidden />
        </a>
      </header>
      <iframe
        src={url}
        title={`${person.name}'s website`}
        className="portfolio-site"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="fullscreen; clipboard-write"
      />
    </div>
  );
}
