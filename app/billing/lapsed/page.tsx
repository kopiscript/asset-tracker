import { MapPin, AlertTriangle } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata = { title: "Subscription Lapsed — Mirae Fleet" };

export default function LapsedPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/40 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0">
            <MapPin className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-[0.15em] text-foreground uppercase">Mirae</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex items-center justify-center">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl text-foreground">Subscription expired</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your organisation&rsquo;s subscription has lapsed and dashboard access has been
              suspended. Your GPS data is still being collected — renew now to restore access.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5 text-left space-y-3">
            <p className="text-sm font-semibold text-foreground">To renew your subscription:</p>
            <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Email us at <a href="mailto:support@mirae.azmiproductions.com" className="text-primary underline underline-offset-2">support@mirae.azmiproductions.com</a></li>
              <li>Include your account email and organisation name</li>
              <li>We will send you a payment link within 1 business day</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:support@mirae.azmiproductions.com?subject=Subscription Renewal"
              className="inline-flex items-center justify-center rounded-xl bg-primary text-white text-sm font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors"
            >
              Email support
            </a>
            <SignOutButton
              label="Sign out"
              className="inline-flex items-center justify-center rounded-xl border border-border text-sm font-medium px-5 py-2.5 hover:bg-muted transition-colors"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
