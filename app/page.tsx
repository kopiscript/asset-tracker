/**
 * app/page.tsx
 * Public landing page — the first thing visitors see.
 * Shows the hero, feature grid, and call-to-action section.
 * Uses the Placeholder component to highlight text that needs editing.
 */
import { Placeholder } from "@/components/Placeholder";
import {
  LandingAuthButtons,
  LandingCtaButton,
} from "@/components/LandingAuthButtons";
import {
  MapPin,
  Users,
  Gauge,
  Globe,
  Activity,
  Shield,
  Zap,
} from "lucide-react";

// ✏️ EDIT: Replace with your company/product name
const PRODUCT_NAME = "FleetTrack";

// ✏️ EDIT: Update feature descriptions to match your use case
const features = [
  {
    icon: <Activity className="h-6 w-6 text-[#00c2cc]" />, // ✏️ EDIT: brand accent colour
    title: "Real-Time Tracking",
    desc: "See exactly where each vehicle is on a live map, updated as location data arrives from your GPS hardware.",
  },
  {
    icon: <Shield className="h-6 w-6 text-[#00c2cc]" />,
    title: "Access Control",
    desc: "Share vehicles with drivers and managers. Choose Viewer, Editor, or Owner roles per person.",
  },
  {
    icon: <Gauge className="h-6 w-6 text-[#00c2cc]" />,
    title: "Vehicle Health",
    desc: "Monitor fuel levels, mileage, and driver assignments from one clean dashboard.",
  },
  {
    icon: <Globe className="h-6 w-6 text-[#00c2cc]" />,
    title: "Malaysian-First",
    desc: "Built for Malaysian roads. Full Bahasa Malaysia support and Malaysian plate number format.",
  },
  {
    icon: <MapPin className="h-6 w-6 text-[#00c2cc]" />,
    title: "No API Keys Needed",
    desc: "Uses free OpenStreetMap tiles — no expensive Google Maps billing surprises.",
  },
  {
    icon: <Users className="h-6 w-6 text-[#00c2cc]" />,
    title: "Team-Friendly",
    desc: "Invite your whole operations team. Each member sees only what they need.",
  },
  {
    icon: <Zap className="h-6 w-6 text-[#00c2cc]" />,
    title: "Fast & Lightweight",
    desc: "Built on Next.js 16 — pages load instantly even on mobile networks.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation Bar ───────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-[#00c2cc]" />
              {/* ✏️ EDIT: Replace with your product name */}
              <span className="text-xl font-bold text-white">
                {PRODUCT_NAME}
              </span>
            </div>

            {/* Nav auth buttons (client component handles signed-in/out state) */}
            <LandingAuthButtons variant="nav" size="sm" />
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#00c2cc]/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-[#00c2cc]/10 text-[#00c2cc] text-sm font-medium px-3 py-1 rounded-full border border-[#00c2cc]/20 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00c2cc] animate-pulse" />
            {/* ✏️ EDIT: Change this announcement text */}
            <Placeholder>Now in Beta — Free for all Malaysian fleets</Placeholder>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {/* ✏️ EDIT: Change the hero headline */}
            <Placeholder>Track Your Fleet,</Placeholder>
            <br />
            <span className="text-[#00c2cc]">Anywhere in Malaysia</span>{" "}
            {/* ✏️ EDIT: brand accent colour */}
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {/* ✏️ EDIT: Change the hero subtitle */}
            Real-time GPS tracking, fuel monitoring, and access control for your
            entire vehicle fleet — free to start.
          </p>

          {/* Auth-aware hero buttons */}
          <LandingAuthButtons variant="hero" size="lg" />
        </div>
      </section>

      {/* ── Fake dashboard preview ───────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border/50 overflow-hidden shadow-2xl bg-[#1a2535]">
            {/* Mock browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#131f2e] border-b border-border/50">
              <span className="h-3 w-3 rounded-full bg-red-500/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <span className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-4 text-xs text-muted-foreground font-mono">
                {/* ✏️ EDIT: Change this URL to your real domain */}
                fleettrack.app/dashboard
              </span>
            </div>
            {/* Mock dashboard content */}
            <div className="grid grid-cols-3 h-64">
              {/* Sidebar mock */}
              <div className="col-span-1 bg-[#131f2e] border-r border-border/50 p-4 space-y-3">
                {["Dashboard", "Vehicles", "Settings"].map((item) => (
                  <div
                    key={item}
                    className={`h-8 rounded-md flex items-center px-3 text-xs ${
                      item === "Dashboard"
                        ? "bg-[#00c2cc]/20 text-[#00c2cc]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              {/* Map area mock */}
              <div className="col-span-2 bg-[#1e3040] relative flex items-center justify-center">
                <div className="absolute inset-0 opacity-20">
                  {Array.from({ length: 6 }).map((_, r) =>
                    Array.from({ length: 10 }).map((_, c) => (
                      <div
                        key={`${r}-${c}`}
                        className="absolute border border-white/5"
                        style={{
                          top: `${r * 16.6}%`,
                          left: `${c * 10}%`,
                          width: "10%",
                          height: "16.6%",
                        }}
                      />
                    ))
                  )}
                </div>
                {[
                  { top: "30%", left: "40%", color: "bg-green-500" },
                  { top: "55%", left: "65%", color: "bg-yellow-500" },
                  { top: "45%", left: "25%", color: "bg-red-500" },
                ].map((pin, i) => (
                  <div
                    key={i}
                    className={`absolute h-4 w-4 ${pin.color} rounded-full shadow-lg ring-2 ring-white/30`}
                    style={{ top: pin.top, left: pin.left }}
                  />
                ))}
                <span className="relative text-sm text-white/60 z-10">
                  Live map preview
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to manage your fleet
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {/* ✏️ EDIT: Update this subtitle */}
              Built for Malaysian businesses of all sizes — from single vans to
              large logistics fleets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border/50 rounded-xl p-6 hover:border-[#00c2cc]/30 hover:shadow-[0_0_20px_rgba(0,194,204,0.05)] transition-all duration-300"
              >
                <div className="mb-4 p-2 bg-[#00c2cc]/10 rounded-lg w-fit">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-[#00c2cc]/10 to-transparent border border-[#00c2cc]/20 rounded-2xl p-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {/* ✏️ EDIT: CTA headline */}
              Ready to take control of your fleet?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {/* ✏️ EDIT: CTA subtitle */}
              Sign up in seconds — no credit card required. Cancel anytime.
            </p>
            <LandingCtaButton />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#00c2cc]" />
            {/* ✏️ EDIT: Replace with your company name */}
            <span>
              © 2026 <Placeholder>Your Company Name</Placeholder>. All rights
              reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* ✏️ EDIT: Add your real privacy/terms URLs */}
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            {/* ✏️ EDIT: Replace with your support email */}
            <a
              href="mailto:support@yourcompany.com"
              className="hover:text-white transition-colors"
            >
              <Placeholder>support@yourcompany.com</Placeholder>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
