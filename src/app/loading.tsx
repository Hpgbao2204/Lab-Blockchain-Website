import { PageHeroSkeleton } from "@/components/site/page-hero-skeleton";
import { AnimatedSkeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-4">
                <AnimatedSkeleton className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <AnimatedSkeleton className="h-4 w-3/4" />
                  <AnimatedSkeleton className="h-3.5 w-1/2" />
                </div>
              </div>
              <AnimatedSkeleton className="h-3.5 w-full" />
              <AnimatedSkeleton className="h-3.5 w-4/5" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
