import { AnimatedSkeleton } from "@/components/ui/skeleton";

export function PageHeroSkeleton() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-surface-muted/40">
      {/* Ambient background — matches PageHero */}
      <div className="academic-grid absolute inset-0 -z-10 opacity-[0.12]" aria-hidden="true" />
      <div className="absolute -top-24 left-1/2 -z-10 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        {/* Eyebrow badge */}
        <AnimatedSkeleton className="h-8 w-40 rounded-full" />

        {/* Title */}
        <AnimatedSkeleton className="mt-5 h-11 w-full max-w-xl rounded-xl sm:h-[3.25rem]" />

        {/* Description lines */}
        <div className="mt-5 space-y-2.5">
          <AnimatedSkeleton className="h-4 w-full max-w-2xl" />
          <AnimatedSkeleton className="h-4 w-3/4 max-w-xl" />
        </div>
      </div>
    </section>
  );
}
