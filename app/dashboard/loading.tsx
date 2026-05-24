import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 rounded-lg bg-muted" />
          <Skeleton className="h-4 w-52 rounded-md bg-muted" />
        </div>
        <Skeleton className="h-8 w-28 rounded-lg bg-muted" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>

      {/* Map + sidebar */}
      <div className="flex gap-4 min-h-0" style={{ height: 460 }}>
        <Skeleton className="flex-1 rounded-xl bg-muted" />
        <div className="hidden xl:flex flex-col w-68 gap-2">
          <div className="flex items-center justify-between mb-0.5">
            <Skeleton className="h-3.5 w-16 rounded-md bg-muted" />
            <Skeleton className="h-3.5 w-12 rounded-md bg-muted" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
