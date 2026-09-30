import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getStats } from "@/lib/content";
import { HeroShell } from "./hero-shell";
import { Rotator } from "./rotator";

const letters = (word: string, offset = 0) =>
  [...word].map((ch, i) => (
    <span key={i} className="ch" style={{ animationDelay: `${(offset + i) * 45}ms` }}>
      {ch}
    </span>
  ));

export function Hero() {
  const stats = getStats();
  return (
    <HeroShell>
      <p className="eyebrow">
        <span className="dot" />
        Blockchain research group · UIT – VNU-HCM
      </p>
      <h1 id="hero-title" className="hero-name" aria-label="Blockchainist">
        <span className="line" aria-hidden>
          {letters("BLOCK")}
        </span>
        <span className="line line-2" aria-hidden>
          {letters("CHAINIST", 5)}
        </span>
      </h1>
      <p className="hero-tagline">
        Researching <Rotator words={["cross-chain interoperability", "zero-knowledge proofs", "decentralized identity", "smart contract security"]} />
        <br />
        so independent chains can trust each other without trusting a middleman.
      </p>
      <div className="flex flex-wrap gap-3.5">
        <Link href="/research" className="btn btn-ink">
          Explore research <ArrowRight size={17} aria-hidden />
        </Link>
        <Link href="/join" className="btn btn-yellow">
          Join the lab
        </Link>
      </div>
      <dl className="stats">
        <div>
          <dt>Papers</dt>
          <dd>{stats.publications}</dd>
        </div>
        <div>
          <dt>Journals</dt>
          <dd>{stats.journals}</dd>
        </div>
        <div>
          <dt>Directions</dt>
          <dd>{stats.researchAreas}</dd>
        </div>
        <div>
          <dt>Since</dt>
          <dd>{stats.since}</dd>
        </div>
      </dl>
    </HeroShell>
  );
}
