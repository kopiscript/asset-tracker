/**
 * app/dashboard/vehicles/loading.tsx
 * Loading skeleton for the vehicles list page.
 */
import { Skeleton } from "@/components/ui/skeleton";

export default function VehiclesLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-32 bg-white/5 mb-2" />
          <Skeleton className="h-4 w-24 bg-white/5" />
        </div>
        <Skeleton className="h-9 w-32 bg-white/5 rounded-md" />
      </div>

      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 flex-1 bg-white/5 rounded-md" />
        <Skeleton className="h-10 w-40 bg-white/5 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 bg-white/5 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
