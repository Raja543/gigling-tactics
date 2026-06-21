import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

// Shown instantly by Next.js while the collection route loads.
export default function CollectionLoading() {
  return (
    <div className="container mx-auto px-6 sm:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-56 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface border border-white/10 rounded-xl p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-surface/50 border border-white/10 rounded-xl p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <Skeleton className="h-9 w-full md:w-96 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6">
        {[...Array(12)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}
