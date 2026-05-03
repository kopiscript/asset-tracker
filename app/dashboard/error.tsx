/**
 * app/dashboard/error.tsx
 * Catches unexpected errors in any /dashboard route and shows a friendly message.
 * Must be a Client Component (Next.js requirement for error boundaries).
 */
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ✏️ EDIT: Log errors to your error tracking service (e.g. Sentry) here
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-red-400 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        An unexpected error occurred. Please try again, or contact support if
        the issue persists.
      </p>
      <Button onClick={reset} variant="outline">
        Try Again
      </Button>
    </div>
  );
}
