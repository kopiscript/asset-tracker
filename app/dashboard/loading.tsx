/**
 * app/dashboard/loading.tsx
 * Shown while any /dashboard page is loading.
 * Next.js automatically shows this while the server component is rendering.
 */
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <Skeleton className="h-8 w-48 bg-white/5" />
      <Skeleton className="h-4 w-32 bg-white/5" />
      <div className="grid grid-cols-4 gap-3 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 bg-white/5 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 w-full bg-white/5 rounded-xl mt-4" />
    </div>
  );
}
