/**
 * app/dashboard/vehicles/[id]/loading.tsx
 * Loading skeleton for the single vehicle detail page.
 */
import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleDetailLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center gap-3">
        <Skeleton className="h-8 w-8 bg-white/5 rounded-md" />
        <div>
          <Skeleton className="h-6 w-40 bg-white/5 mb-1" />
          <Skeleton className="h-4 w-32 bg-white/5" />
        </div>
      </div>
      <div className="px-4 sm:px-6 pb-4">
        <Skeleton className="h-80 w-full bg-white/5 rounded-xl" />
      </div>
      <div className="px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48 bg-white/5 rounded-xl" />
        <Skeleton className="h-48 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}
