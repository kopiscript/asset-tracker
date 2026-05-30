import Link from "next/link";
import { MapPin } from "lucide-react";
import { LegalToc } from "./LegalToc";

export function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/40 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0 transition-opacity group-hover:opacity-80">
              <MapPin className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-[0.15em] text-foreground uppercase">
              Mirae
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Back to home
          </Link>
        </div>
      </nav>

      {/* ── Body: asymmetric split ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto flex pt-14">

        {/* Left: sticky TOC */}
        <aside className="hidden lg:block w-[220px] xl:w-[252px] shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-border/40">
          <LegalToc />
        </aside>

        {/* Right: content */}
        <main className="flex-1 min-w-0 px-6 sm:px-10 lg:px-16 xl:px-20 py-14 pb-28">

          {/* Page header */}
          <header className="mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary mb-3">
              Legal
            </p>
            <h1 className="font-display text-4xl sm:text-5xl text-foreground leading-tight tracking-tight mb-4 max-w-[18ch]">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Last updated {lastUpdated}
              <span className="mx-2 text-border">·</span>
              AZP Group Sdn Bhd (1654709-U)
            </p>
          </header>

          {/* Prose content */}
          <div
            className="
              max-w-[62ch]
              [&_h2]:scroll-mt-20
              [&_h2]:text-[11px] [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-[0.18em]
              [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-4
              [&_h2]:pb-2.5 [&_h2]:border-b [&_h2]:border-border/50
              [&_p]:text-sm [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4
              [&_ul]:my-3 [&_ul]:pl-4 [&_ul]:list-disc [&_ul]:list-outside
              [&_ul]:space-y-1.5 [&_ul]:text-sm [&_ul]:text-muted-foreground [&_ul]:leading-relaxed
              [&_ol]:my-3 [&_ol]:pl-4 [&_ol]:list-decimal [&_ol]:list-outside
              [&_ol]:space-y-1.5 [&_ol]:text-sm [&_ol]:text-muted-foreground [&_ol]:leading-relaxed
              [&_li]:pl-0.5
              [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
              [&_a]:transition-colors [&_a]:duration-150 [&_a]:hover:text-primary/70
              [&_strong]:text-foreground [&_strong]:font-medium
            "
          >
            {children}
          </div>
        </main>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-7 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-5 w-5 rounded bg-primary flex items-center justify-center shrink-0">
              <MapPin className="h-3 w-3 text-white" />
            </div>
            <span>© 2026 Mirae · AZP Group Sdn Bhd</span>
          </div>
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Refund", href: "/refund" },
              { label: "Contact", href: "/contact" },
            ].map((item, i, arr) => (
              <span key={item.href} className="flex items-center">
                <Link
                  href={item.href}
                  className="py-1.5 px-2 hover:text-foreground transition-colors duration-150"
                >
                  {item.label}
                </Link>
                {i < arr.length - 1 && (
                  <span className="text-border select-none">·</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
