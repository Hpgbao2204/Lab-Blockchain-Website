import { researchAreas } from "@/data/research";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "./section";

const accent = {
  a: "bg-chain-a",
  b: "bg-chain-b",
  relay: "bg-relay",
  proof: "bg-proof",
} as const;

export function Research() {
  return (
    <section id="research" className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
      <SectionHeading eyebrow="01 — Hướng nghiên cứu" title={<>Những bài toán chúng tôi <span className="serif-accent whitespace-nowrap text-chain-a">theo đuổi</span></>}>
        Từ giao thức liên chuỗi đến bằng chứng không tiết lộ tri thức — mỗi hướng đều có công bố quốc tế và hệ thống thử nghiệm đi kèm.
      </SectionHeading>
      <div className="grid gap-5 md:grid-cols-6">
        {researchAreas.map((r, i) => (
          <Reveal key={r.id} delay={i * 70} className={i < 2 ? "md:col-span-3" : "md:col-span-2"}>
            <article className="group relative h-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgb(11_20_55/0.45)]">
              <div className={`absolute inset-x-0 top-0 h-1.5 ${accent[r.accent]}`} />
              <span className="mono text-muted">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="display mt-3 text-[1.7rem]">{r.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-2">{r.blurb}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {r.keywords.map((k) => (
                  <li key={k} className="mono rounded-full border border-line bg-bg px-3 py-1 text-ink-2">
                    {k}
                  </li>
                ))}
              </ul>
              <span aria-hidden className={`pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rotate-12 rounded-3xl opacity-[0.08] transition duration-500 group-hover:rotate-45 group-hover:opacity-[0.16] ${accent[r.accent]}`} />
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
