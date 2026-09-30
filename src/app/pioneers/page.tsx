import type { Metadata } from "next";
import { PageHead } from "@/components/site/page-head";
import { Reveal } from "@/components/site/reveal";
import { listPioneers, type Pioneer } from "@/lib/content";

export const metadata: Metadata = { title: "Pioneers", description: "The cryptographers and engineers whose ideas made blockchains possible." };

const tint: Record<Pioneer["tint"], string> = { blue: "var(--color-blue)", violet: "var(--color-violet)", amber: "var(--color-yellow)" };

function Silhouette() {
  return (
    <svg viewBox="0 0 280 340" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="280" height="340" fill="#ffe08a" />
      <circle cx="140" cy="128" r="58" fill="#16140f" />
      <ellipse cx="140" cy="360" rx="120" ry="135" fill="#16140f" />
      <text x="140" y="154" textAnchor="middle" fontSize="70" fontWeight="800" fill="#ffc730" fontFamily="Unbounded, sans-serif">
        ?
      </text>
    </svg>
  );
}

export default function PioneersPage() {
  const pioneers = listPioneers();
  return (
    <div className="wrap page">
      <PageHead eyebrow="Standing on the shoulders of giants" title={<>The <span className="hl">pioneers</span></>}>
        Blockchains did not appear out of nowhere. Public keys, Merkle trees, proof-of-work and zero knowledge came first. These are some of the people behind them.
      </PageHead>
      <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pioneers.map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 4) * 60}>
            <figure className="card group flex h-full flex-col overflow-hidden" style={{ boxShadow: "var(--shadow)" }}>
              <div className="relative aspect-[4/5] overflow-hidden border-b-2 border-ink" style={{ background: tint[p.tint] }}>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt={`Portrait of ${p.name}`}
                    loading="lazy"
                    className="h-full w-full object-cover object-top mix-blend-multiply grayscale contrast-110 transition duration-500 group-hover:scale-105 group-hover:mix-blend-normal group-hover:grayscale-0"
                  />
                ) : (
                  <Silhouette />
                )}
                <span className="tag absolute left-3 top-3" style={{ "--c": "var(--color-card)" } as React.CSSProperties}>
                  {p.year}
                </span>
              </div>
              <figcaption className="flex flex-1 flex-col gap-2 p-4">
                <h2 className="text-[17px] font-bold [font-family:var(--font-display)]">{p.name}</h2>
                <p className="text-sm leading-snug text-ink-2">{p.contribution}</p>
                <p className="mono mt-auto pt-2 text-[10.5px] leading-snug text-muted">
                  {p.credit ? (
                    <>
                      Photo: {p.credit.author} ·{" "}
                      <a href={p.credit.licenseUrl ?? p.credit.source} className="underline underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
                        {p.credit.license}
                      </a>{" "}
                      ·{" "}
                      <a href={p.credit.source} className="underline underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
                        Wikimedia Commons
                      </a>
                    </>
                  ) : (
                    "Illustration: identity unknown"
                  )}
                </p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
