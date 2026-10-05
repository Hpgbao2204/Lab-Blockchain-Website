import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { ApplyForm } from "@/components/join/apply-form";
import { listResearchAreas } from "@/lib/content";

export const metadata: Metadata = { title: "Join", description: "Join the Blockchainist research group." };

const perks = [
  { t: "Real research", d: "Work on problems that end up in journals and conferences, not toy projects.", c: "var(--color-yellow)" },
  { t: "Close mentoring", d: "Monthly groups, clear tasks and regular feedback from the principal investigator.", c: "var(--color-blue)" },
  { t: "Deep skills", d: "Cryptography, protocol design, smart contracts and formal reasoning.", c: "var(--color-teal)" },
];

const steps = [
  { t: "Read a few papers", d: "Pick one or two publications that interest you and read them properly." },
  { t: "Apply below", d: "Alone or as a team: tell us who you are, what caught your eye and what you would like to try." },
  { t: "Have a chat", d: "We talk about your background and agree on a first small task." },
  { t: "Get an account", d: "Once accepted, everyone on the application gets a login by email. There is no public sign-up." },
];

export default function JoinPage() {
  return (
    <div className="wrap page">
      <PageHead eyebrow="Join the lab" title={<>Build trust with <span className="hl">us</span></>}>
        We welcome motivated students who enjoy hard problems in trust, privacy and distributed systems.
      </PageHead>

      <ul className="grid gap-4 md:grid-cols-3">
        {perks.map((p) => (
          <li key={p.t} className="area" style={{ "--c": p.c } as React.CSSProperties}>
            <h3>{p.t}</h3>
            <p>{p.d}</p>
          </li>
        ))}
      </ul>

      <section className="section" aria-labelledby="how">
        <SectionHead id="how" no="01" title="How to apply" />
        <ol className="grid gap-4 md:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.t} className="card flex gap-4 p-5" style={{ boxShadow: "var(--shadow)" }}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-ink bg-yellow font-extrabold [font-family:var(--font-display)]">{i + 1}</span>
              <div>
                <h3 className="font-bold">{s.t}</h3>
                <p className="text-sm text-ink-2">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="apply">
        <SectionHead id="apply" no="02" title="Apply online" />
        <ApplyForm areas={listResearchAreas().map(({ slug, title }) => ({ slug, title }))} captchaSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined} />
      </section>

      <section className="section">
        <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between" style={{ background: "var(--color-yellow)" }}>
          <div>
            <h2 className="display text-[clamp(22px,2.6vw,30px)]">Questions first?</h2>
            <p className="mt-2 text-ink-2">Write to the principal investigator, or read a few of our papers.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:dungtrt@uit.edu.vn?subject=Joining%20Blockchainist" className="btn btn-ink">
              Email the PI <ArrowRight size={17} aria-hidden />
            </a>
            <Link href="/publications" className="btn">
              Read our papers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
