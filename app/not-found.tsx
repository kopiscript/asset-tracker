import Link from "next/link";
import { MapPin, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-background flex items-center px-6 py-20">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-16 items-center">
          {/* Content */}
          <div>
            <div className="flex items-center gap-2.5 mb-12">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">Mirae</span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              404 — Route not found
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-foreground leading-tight tracking-tight mb-5 max-w-[22ch]">
              This page went offline.
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-[46ch] mb-10">
              The route you navigated to doesn't exist or you don't have access.
              Head back to the dashboard to get back on track.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold active:scale-[0.98] transition-transform"
                render={<Link href="/dashboard" />}
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                className="gap-2 active:scale-[0.98] transition-transform"
                render={<Link href="/" />}
              >
                <ArrowLeft className="h-4 w-4" />
                Home
              </Button>
            </div>
          </div>

          {/* Visual typographic element */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <span className="text-[11rem] font-bold text-foreground/[0.04] leading-none tracking-tighter select-none tabular-nums">
                404
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                  <MapPin className="h-7 w-7 text-primary/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
