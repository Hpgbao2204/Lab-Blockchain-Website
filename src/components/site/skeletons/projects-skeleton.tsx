import { PageHeroSkeleton } from "@/components/site/page-hero-skeleton";
import { AnimatedSkeleton } from "@/components/ui/skeleton";

export function ProjectsSkeleton() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="mx-auto max-w-7xl px-6 py-12">
        {/* Projects Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
            >
              <AnimatedSkeleton className="h-44 w-full" />
              <div className="p-6 space-y-3">
                <AnimatedSkeleton className="h-6 w-3/4" />
                <AnimatedSkeleton className="h-4 w-full" />
                <AnimatedSkeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-2">
                  <AnimatedSkeleton className="h-6 w-16 rounded-full" />
                  <AnimatedSkeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
