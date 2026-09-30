import { Reveal } from "@/components/site/reveal";

export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Reveal className="mb-12 max-w-3xl">
      <p className="eyebrow mb-4">{eyebrow}</p>
      <h2 className="display text-[clamp(2.2rem,5vw,4rem)]">{title}</h2>
      {children && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">{children}</p>}
    </Reveal>
  );
}
