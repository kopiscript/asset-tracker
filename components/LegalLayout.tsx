import Link from "next/link";
import { MapPin } from "lucide-react";

export function LegalLayout({ title, lastUpdated, children }: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-[0.15em] text-foreground uppercase">
                Mirae
              </span>
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <div className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-3">{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>
        <div className="prose prose-sm prose-slate max-w-none [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:text-base [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:text-muted-foreground [&_ul]:leading-relaxed [&_li]:mb-1 [&_a]:text-primary [&_a]:underline-offset-2">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-primary flex items-center justify-center shrink-0">
              <MapPin className="h-3 w-3 text-white" />
            </div>
            <span>© 2026 Mirae. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/privacy" className="py-2 px-2 hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="py-2 px-2 hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/refund" className="py-2 px-2 hover:text-foreground transition-colors">Refund Policy</Link>
            <Link href="/contact" className="py-2 px-2 hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
