import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-surface border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center gap-8 justify-between">
        <div className="flex items-center gap-5">
          <Skeleton className="w-20 h-20 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2 text-center">
              <Skeleton className="h-7 w-12 mx-auto" />
              <Skeleton className="h-3 w-14 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Top cards */}
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
        {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}
