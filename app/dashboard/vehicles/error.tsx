/**
 * app/dashboard/vehicles/error.tsx
 * Error boundary for the vehicles section.
 */
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function VehiclesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
      <p className="text-white font-semibold mb-1">Failed to load vehicles</p>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={reset} variant="outline" size="sm">
        Try Again
      </Button>
    </div>
  );
}
