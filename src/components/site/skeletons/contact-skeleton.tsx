import { PageHeroSkeleton } from "@/components/site/page-hero-skeleton";
import { AnimatedSkeleton } from "@/components/ui/skeleton";

export function ContactSkeleton() {
  return (
    <>
      <PageHeroSkeleton />
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Contact Info Skeleton */}
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm space-y-6">
            <AnimatedSkeleton className="h-7 w-1/2" />
            <AnimatedSkeleton className="h-4 w-5/6" />
            <div className="space-y-4 pt-4">
              <AnimatedSkeleton className="h-12 w-full rounded-xl" />
              <AnimatedSkeleton className="h-12 w-full rounded-xl" />
              <AnimatedSkeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>

          {/* Right: Contact Form Skeleton */}
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm space-y-5">
            <AnimatedSkeleton className="h-7 w-1/3" />
            <div className="space-y-4">
              <AnimatedSkeleton className="h-11 w-full rounded-xl" />
              <AnimatedSkeleton className="h-11 w-full rounded-xl" />
              <AnimatedSkeleton className="h-28 w-full rounded-xl" />
              <AnimatedSkeleton className="h-11 w-36 rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
