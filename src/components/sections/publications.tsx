import { ArrowUpRight } from "lucide-react";
import { samplePublications } from "@/data/publications.sample";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "./section";

export function Publications() {
  return (
    <section id="publications" className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
      <SectionHeading eyebrow="03 — Công bố" title={<>Kết quả đã <span className="serif-accent whitespace-nowrap text-chain-b">được công bố</span></>}>
        Một số công bố tiêu biểu của nhóm trên tạp chí và hội nghị quốc tế.
      </SectionHeading>
      <ul className="divide-y divide-line border-y border-line">
        {samplePublications.map((p, i) => (
          <Reveal key={p.doi} delay={i * 60}>
            <li>
              <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" className="group grid grid-cols-[auto_1fr_auto] items-start gap-x-6 gap-y-2 py-7 transition hover:bg-white/70 sm:px-4">
                <span className="display text-3xl text-muted/70 transition group-hover:text-chain-a">{p.year}</span>
                <div>
                  <h3 className="text-lg font-semibold leading-snug sm:text-xl">{p.title}</h3>
                  <p className="mono mt-2 text-muted">
                    {p.kind} · doi:{p.doi}
                  </p>
                </div>
                <ArrowUpRight className="mt-2 h-5 w-5 text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-chain-a" aria-hidden />
              </a>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
