import { PageHeroSkeleton } from "@/components/site/page-hero-skeleton";
import { AnimatedSkeleton } from "@/components/ui/skeleton";

export function PublicationsSkeleton() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="mx-auto max-w-7xl px-6 py-12">
        {/* Search & Filter Bar Skeleton */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <AnimatedSkeleton className="h-10 w-64 rounded-xl" />
          <AnimatedSkeleton className="h-10 w-28 rounded-full" />
          <AnimatedSkeleton className="h-10 w-28 rounded-full" />
        </div>

        {/* Publication Cards List Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start gap-4">
                <AnimatedSkeleton className="h-6 w-6 shrink-0 rounded" />
                <div className="flex-1 space-y-2.5">
                  <AnimatedSkeleton className="h-5 w-3/4" />
                  <AnimatedSkeleton className="h-4 w-1/2" />
                  <div className="flex gap-2 pt-1">
                    <AnimatedSkeleton className="h-6 w-16 rounded-full" />
                    <AnimatedSkeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
