import { MapPin, Check } from "lucide-react";
import { AuthMapBackdrop } from "./AuthMapBackdrop";

interface AuthBrandPanelProps {
  eyebrow: string;
  heading: React.ReactNode;
  subtext: string;
  features: string[];
}

/**
 * Shared brand panel for the sign-in / sign-up split screens. Bright red
 * fading to black, a faint decorative map behind the copy, formal (Roboto)
 * type for a more corporate read than the site's default display serif.
 */
export function AuthBrandPanel({ eyebrow, heading, subtext, features }: AuthBrandPanelProps) {
  return (
    <div
      className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 100% at 0% 0%, #ff3b30 0%, #d81f22 32%, #560c0c 68%, #050000 100%)",
      }}
    >
      <AuthMapBackdrop />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      <div className="relative flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <span className="text-white font-bold text-xl tracking-[0.15em] uppercase">Mirae</span>
      </div>

      <div className="relative">
        <p className="text-white/60 text-xs font-medium uppercase tracking-[0.2em] mb-4">{eyebrow}</p>
        <h2 className="text-4xl font-medium text-white leading-tight mb-4 whitespace-pre-line">
          {heading}
        </h2>
        <p className="text-white/70 text-sm leading-relaxed max-w-[38ch]">{subtext}</p>
      </div>

      <div className="relative space-y-3">
        {features.map((text) => (
          <div key={text} className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Check className="h-3 w-3 text-white" />
            </div>
            <span className="text-white/85 text-sm">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
