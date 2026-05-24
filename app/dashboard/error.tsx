"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
        <AlertTriangle className="h-5 w-5 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-1.5">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground max-w-[40ch] leading-relaxed mb-7">
        An unexpected error occurred. Try again, or contact support if the issue persists.
      </p>
      <Button
        onClick={reset}
        variant="outline"
        className="gap-2 active:scale-[0.98] transition-transform"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Try Again
      </Button>
      {error.digest && (
        <p className="text-[10px] text-muted-foreground/40 mt-5 font-mono">
          {error.digest}
        </p>
      )}
    </div>
  );
}
