import { PageHeroSkeleton } from "@/components/site/page-hero-skeleton";
import { AnimatedSkeleton } from "@/components/ui/skeleton";

export function MembersSkeleton() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="mx-auto max-w-7xl px-6 py-12">
        {/* Members Grid Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-4">
                <AnimatedSkeleton className="h-16 w-16 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <AnimatedSkeleton className="h-5 w-2/3" />
                  <AnimatedSkeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <AnimatedSkeleton className="h-3.5 w-full" />
                <AnimatedSkeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
