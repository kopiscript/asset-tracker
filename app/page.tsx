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
  Check,
} from "lucide-react";

const PRODUCT_NAME = "Atlas";

const primaryFeatures = [
  {
    icon: <Activity className="h-5 w-5 text-primary" />,
    title: "Real-Time Tracking",
    desc: "See exactly where each vehicle is on a live map, updated continuously as GPS pings arrive from your hardware over free OpenStreetMap tiles.",
    stat: "Live updates",
    statDetail: "as data arrives from hardware",
    accent: "blue" as const,
  },
  {
    icon: <Shield className="h-5 w-5 text-emerald-600" />,
    title: "Role-Based Access",
    desc: "Share fleet access with drivers and managers. Assign Viewer, Editor, or Owner roles per person — everyone sees only what they need.",
    stat: "3 access levels",
    statDetail: "Owner · Editor · Viewer",
    accent: "green" as const,
  },
];

const secondaryFeatures = [
  { icon: <Gauge className="h-4 w-4" />, title: "Vehicle Health", desc: "Fuel level, mileage, and driver assignments in one view." },
  { icon: <Globe className="h-4 w-4" />, title: "Malaysian-First", desc: "Full Bahasa Malaysia support and local plate formats." },
  { icon: <MapPin className="h-4 w-4" />, title: "No API Keys", desc: "Free OpenStreetMap tiles — no Google Maps billing." },
  { icon: <Users className="h-4 w-4" />, title: "Team-Friendly", desc: "Invite your whole ops team with role-based permissions." },
  { icon: <Zap className="h-4 w-4" />, title: "Fast & Light", desc: "Built on Next.js 16 — loads instantly on mobile networks." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                <MapPin className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-[0.15em] text-foreground uppercase">
                {PRODUCT_NAME}
              </span>
            </div>
            <LandingAuthButtons variant="nav" size="sm" />
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="min-h-dvh flex items-center pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 xl:gap-20 items-center">
            {/* Left: Content */}
            <div>
              <div className="animate-fade-up">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-7 tracking-wide">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Beta · Free for all Malaysian fleets
                </div>
                <h1 className="font-display text-[3rem] sm:text-[3.75rem] lg:text-[4.25rem] text-foreground leading-[1.03] tracking-tight mb-6">
                  Track your fleet.
                  <br />
                  <span className="text-primary">In real time.</span>
                </h1>
              </div>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-[50ch] mb-8 animate-fade-up delay-100">
                GPS tracking, driver management, and role-based access control for Malaysian logistics — no subscription required to start.
              </p>

              <div className="mb-8 animate-fade-up delay-200">
                <LandingAuthButtons variant="hero" size="lg" />
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground animate-fade-up delay-300">
                {["No credit card", "Free OpenStreetMap tiles", "Bahasa Malaysia support"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Dashboard preview */}
            <div className="hidden lg:block animate-fade-in delay-400">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
              What Atlas does
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2 className="font-display text-3xl sm:text-4xl text-foreground max-w-[18ch] leading-tight">
                Everything your operations team needs
              </h2>
              <p className="text-muted-foreground text-sm max-w-[42ch] sm:text-right leading-relaxed">
                Built for Malaysian businesses of all sizes — from single delivery vans to large logistics fleets.
              </p>
            </div>
          </div>

          {/* Primary features: 2-col */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {primaryFeatures.map((f) => (
              <PrimaryFeatureCard key={f.title} {...f} />
            ))}
          </div>

          {/* Secondary features: compact flex list, no card boxes */}
          <div className="border-t border-border/40 pt-8 flex flex-wrap gap-x-8 gap-y-6">
            {secondaryFeatures.map((f) => (
              <div key={f.title} className="flex items-start gap-3 min-w-45 flex-1">
                <div className="mt-0.5 text-muted-foreground shrink-0">{f.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-foreground p-10 sm:p-14 text-center">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-4">
                Get started today
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-white mb-4 leading-tight">
                Ready to see your fleet?
              </h2>
              <p className="text-white/60 text-base mb-8 max-w-[42ch] mx-auto leading-relaxed">
                Sign up in under a minute. No credit card required. Cancel any time.
              </p>
              <LandingCtaButton />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-primary flex items-center justify-center shrink-0">
              <MapPin className="h-3 w-3 text-white" />
            </div>
            <span>© 2026 {PRODUCT_NAME}. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="mailto:support@atlasfleet.app" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Dashboard preview mockup ─────────────────────────────────────────────
function DashboardPreview() {
  const navItems = ["Dashboard", "Vehicles", "Orgs", "Settings"];
  const stats = [
    { label: "Total",   value: "8", color: "#1d1d1f" },
    { label: "Active",  value: "5", color: "#16a34a" },
    { label: "Idle",    value: "2", color: "#d97706" },
    { label: "Offline", value: "1", color: "#dc2626" },
  ];
  const vehicles = [
    { name: "WKE 8812", status: "active" },
    { name: "BJF 4421", status: "active" },
    { name: "KDE 9931", status: "idle" },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-8 bg-primary/8 blur-3xl rounded-full pointer-events-none" />
      <div className="relative rounded-2xl overflow-hidden border border-black/10 shadow-[0_28px_80px_-16px_rgba(0,0,0,0.18)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#f0f0f0] border-b border-black/6">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div className="ml-3 flex-1 bg-white/80 rounded-md h-5 flex items-center px-2.5">
            <span className="text-[10px] text-[#999] font-mono">atlas.app/dashboard</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex bg-[#f8f9fa]" style={{ height: 320 }}>
          {/* Sidebar */}
          <div className="w-30 bg-[#fbfbfd] border-r border-black/5 flex flex-col p-2 gap-0.5 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-2.5 mb-0.5">
              <div className="h-4 w-4 rounded-lg bg-[#0071e3] flex items-center justify-center shrink-0">
                <svg width="7" height="9" viewBox="0 0 7 9" fill="none">
                  <path d="M3.5 0C1.57 0 0 1.57 0 3.5C0 6.125 3.5 9 3.5 9C3.5 9 7 6.125 7 3.5C7 1.57 5.43 0 3.5 0Z" fill="white" />
                </svg>
              </div>
              <span className="text-[9px] font-bold tracking-widest text-[#1d1d1f] uppercase">Atlas</span>
            </div>
            {navItems.map((item, i) => (
              <div
                key={item}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[9px] font-medium ${
                  i === 0
                    ? "bg-[#0071e3]/10 text-[#0071e3] border-l-2 border-[#0071e3] pl-1.5"
                    : "text-[#6e6e73]"
                }`}
              >
                <div className={`h-2 w-2 rounded-md shrink-0 ${i === 0 ? "bg-[#0071e3]" : "bg-[#d1d1d6]"}`} />
                {item}
              </div>
            ))}
          </div>

          {/* Main area */}
          <div className="flex-1 p-3 flex flex-col gap-2.5 min-w-0 overflow-hidden">
            {/* Title row */}
            <div className="flex items-center justify-between shrink-0">
              <div>
                <p className="text-[11px] font-semibold text-[#1d1d1f] leading-none">Dashboard</p>
                <p className="text-[8.5px] text-[#6e6e73] mt-0.5">8 vehicles across 2 orgs</p>
              </div>
              <div className="h-5 px-2 rounded-md bg-[#0071e3] flex items-center">
                <span className="text-[9px] text-white font-medium">+ Add Vehicle</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-1.5 shrink-0">
              {stats.map((s) => (
                <div key={s.label} className="bg-white border border-black/5 rounded-lg p-2">
                  <p className="text-sm font-bold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
                  <div className="h-px bg-black/5 my-1.5" />
                  <p className="text-[7.5px] text-[#6e6e73] uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Map + vehicle list */}
            <div className="flex gap-2 flex-1 min-h-0">
              {/* Map */}
              <div className="flex-1 rounded-lg overflow-hidden relative min-w-0">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 240 160"
                  preserveAspectRatio="xMidYMid slice"
                  className="absolute inset-0"
                >
                  <rect width="240" height="160" fill="#dce8dc" />
                  <path d="M0,80 C40,65 80,75 120,80 S180,90 240,82" stroke="#c2d5c2" strokeWidth="3" fill="none" />
                  <path d="M0,110 C50,105 90,112 140,108 S200,115 240,115" stroke="#c2d5c2" strokeWidth="2" fill="none" />
                  <path d="M120,0 C117,40 120,80 118,120 S120,145 119,160" stroke="#c2d5c2" strokeWidth="2" fill="none" />
                  <path d="M60,0 C58,40 62,80 60,120 S58,145 60,160" stroke="#c2d5c2" strokeWidth="1.5" fill="none" />
                  <path d="M190,0 C188,40 192,80 190,160" stroke="#c2d5c2" strokeWidth="1.5" fill="none" />
                  {/* Active */}
                  <circle cx="88" cy="60" r="5.5" fill="#22c55e" />
                  <circle cx="88" cy="60" r="7.5" fill="none" stroke="white" strokeWidth="1.5" />
                  <circle cx="148" cy="82" r="5.5" fill="#22c55e" />
                  <circle cx="148" cy="82" r="7.5" fill="none" stroke="white" strokeWidth="1.5" />
                  <circle cx="52" cy="95" r="5.5" fill="#22c55e" />
                  <circle cx="52" cy="95" r="7.5" fill="none" stroke="white" strokeWidth="1.5" />
                  {/* Idle */}
                  <circle cx="182" cy="44" r="5.5" fill="#f59e0b" />
                  <circle cx="182" cy="44" r="7.5" fill="none" stroke="white" strokeWidth="1.5" />
                  <circle cx="28" cy="42" r="5.5" fill="#f59e0b" />
                  <circle cx="28" cy="42" r="7.5" fill="none" stroke="white" strokeWidth="1.5" />
                  {/* Offline */}
                  <circle cx="215" cy="118" r="5.5" fill="#ef4444" />
                  <circle cx="215" cy="118" r="7.5" fill="none" stroke="white" strokeWidth="1.5" />
                  <text x="4" y="156" fontSize="6" fill="#6e6e73" opacity="0.7">© OpenStreetMap contributors</text>
                </svg>
              </div>

              {/* Vehicle list */}
              <div className="w-25 flex flex-col gap-1.5 overflow-hidden shrink-0">
                <p className="text-[8px] font-semibold text-[#6e6e73] uppercase tracking-wider shrink-0">Vehicles</p>
                {vehicles.map((v) => (
                  <div key={v.name} className="bg-white border border-black/5 rounded-md p-1.5 shrink-0">
                    <p className="text-[8.5px] font-mono font-semibold text-[#1d1d1f]">{v.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${v.status === "active" ? "bg-green-500" : "bg-amber-500"}`} />
                      <span className={`text-[7.5px] font-medium ${v.status === "active" ? "text-green-700" : "text-amber-700"}`}>
                        {v.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Primary feature card ─────────────────────────────────────────────────
function PrimaryFeatureCard({
  icon,
  title,
  desc,
  stat,
  statDetail,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  stat: string;
  statDetail: string;
  accent: "blue" | "green";
}) {
  const bg = accent === "blue"
    ? "bg-gradient-to-br from-sky-50 to-blue-50/50"
    : "bg-gradient-to-br from-emerald-50 to-teal-50/50";
  const border = accent === "blue" ? "border-blue-100" : "border-emerald-100";

  return (
    <div className={`${bg} border ${border} rounded-2xl p-7 flex flex-col justify-between min-h-55`}>
      <div>
        <div className="mb-4">{icon}</div>
        <h3 className="font-semibold text-foreground text-xl mb-2.5 leading-tight tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <div className="mt-6 pt-5 border-t border-black/6 flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-foreground">{stat}</span>
        <span className="text-xs text-muted-foreground">{statDetail}</span>
      </div>
    </div>
  );
}
