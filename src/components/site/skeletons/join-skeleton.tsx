import { PageHeroSkeleton } from "@/components/site/page-hero-skeleton";
import { AnimatedSkeleton } from "@/components/ui/skeleton";

export function JoinSkeleton() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-8 shadow-sm space-y-6">
          <AnimatedSkeleton className="h-8 w-2/3" />
          <AnimatedSkeleton className="h-4 w-full" />
          <AnimatedSkeleton className="h-4 w-4/5" />
          <div className="space-y-4 pt-4">
            <AnimatedSkeleton className="h-11 w-full rounded-xl" />
            <AnimatedSkeleton className="h-11 w-full rounded-xl" />
            <AnimatedSkeleton className="h-11 w-full rounded-xl" />
            <AnimatedSkeleton className="h-32 w-full rounded-xl" />
            <AnimatedSkeleton className="h-12 w-44 rounded-xl" />
          </div>
        </div>
      </section>
    </>
  );
}
