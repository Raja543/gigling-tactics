import { cn } from "@/lib/utils";

/**
 * Shimmer skeleton block. Uses the global `shimmer` keyframe + a moving gradient
 * so loading states feel alive instead of a flat pulse.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-md bg-white/[0.06] overflow-hidden relative", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s linear infinite",
      }}
    />
  );
}

/** A single card-shaped skeleton matching the explorer/collection grid card. */
export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-surface/60 border border-white/5 overflow-hidden flex flex-col">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-2.5 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-3/4" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-full" />
        </div>
      </div>
    </div>
  );
}
