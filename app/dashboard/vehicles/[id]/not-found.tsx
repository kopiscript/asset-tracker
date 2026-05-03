/**
 * app/dashboard/vehicles/[id]/not-found.tsx
 * Shown when a vehicle is not found or the user doesn't have access.
 */
import Link from "next/link";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VehicleNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <Car className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">
        Vehicle not found
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        This vehicle doesn&apos;t exist or you don&apos;t have permission to
        view it.
      </p>
      <Button render={<Link href="/dashboard/vehicles" />}>Back to Vehicles</Button>
    </div>
  );
}
