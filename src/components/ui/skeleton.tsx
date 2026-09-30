import React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-[#D9D9D9] dark:bg-slate-800/80 rounded-md", className)}
      {...props}
    />
  );
}

function AnimatedSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn("animate-pulse", className)} {...props} />;
}

export { Skeleton, AnimatedSkeleton };
