import { Skeleton } from "@/components/ui/Skeleton";

export default function LeaderboardsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-2 mb-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* tab row */}
      <div className="flex gap-2 mb-6">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-32 rounded-lg" />)}
      </div>
      {/* rows */}
      <div className="space-y-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 bg-surface/50 border border-white/5 rounded-xl p-3">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 flex-1 max-w-[200px]" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
