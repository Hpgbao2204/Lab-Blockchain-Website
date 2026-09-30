import { pioneers, type Pioneer } from "@/data/pioneers";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "./section";

const tintBg: Record<Pioneer["tint"], string> = {
  blue: "bg-[#cfdcff]",
  violet: "bg-[#ddd0ff]",
  amber: "bg-[#ffdfbf]",
};

function Silhouette() {
  return (
    <svg viewBox="0 0 280 340" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="280" height="340" fill="#b9c8f5" />
      <circle cx="140" cy="128" r="58" fill="#0b1437" />
      <ellipse cx="140" cy="360" rx="120" ry="135" fill="#0b1437" />
      <text x="140" y="152" textAnchor="middle" fontSize="76" fontWeight="700" fill="#eef2f9" fontFamily="var(--font-display)">?</text>
    </svg>
  );
}

export function Pioneers() {
  return (
    <section id="pioneers" className="relative overflow-hidden bg-white/45 py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <SectionHeading eyebrow="02 — Tiền nhân" title={<>Đứng trên vai những <span className="serif-accent whitespace-nowrap text-relay">người khổng lồ</span></>}>
          Blockchain không xuất hiện từ hư không. Đây là những nhà mật mã học và kỹ sư đặt từng viên gạch — từ khoá công khai, cây Merkle, proof-of-work đến hợp đồng thông minh và liên chuỗi.
        </SectionHeading>
      </div>

      <div className="rail flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 pt-2 [scrollbar-width:thin]" tabIndex={0} aria-label="Danh sách tiền nhân, cuộn ngang">
        {pioneers.map((p) => (
          <Reveal key={p.id} className="snap-start">
            <figure className="group w-[250px] shrink-0 sm:w-[270px]">
              <div className={`relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-line ${tintBg[p.tint]}`}>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt={`Chân dung ${p.name}`}
                    loading="lazy"
                    className="h-full w-full object-cover object-top mix-blend-multiply grayscale contrast-110 transition duration-500 group-hover:scale-105 group-hover:mix-blend-normal group-hover:grayscale-0"
                  />
                ) : (
                  <Silhouette />
                )}
                <span className="mono absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-ink backdrop-blur">{p.year}</span>
              </div>
              <figcaption className="mt-4">
                <h3 className="display text-xl">{p.name}</h3>
                <p className="mt-1.5 text-sm leading-snug text-ink-2">{p.contribution}</p>
                {p.credit ? (
                  <p className="mono mt-3 text-[10.5px] leading-snug text-muted">
                    Ảnh: {p.credit.author} ·{" "}
                    <a href={p.credit.licenseUrl ?? p.credit.source} className="underline decoration-line underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
                      {p.credit.license}
                    </a>{" "}
                    ·{" "}
                    <a href={p.credit.source} className="underline decoration-line underline-offset-2 hover:text-ink" target="_blank" rel="noreferrer">
                      Commons
                    </a>
                  </p>
                ) : (
                  <p className="mono mt-3 text-[10.5px] text-muted">Hình minh hoạ — danh tính chưa được biết</p>
                )}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
