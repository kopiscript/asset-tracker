import { LegalLayout } from "@/components/LegalLayout";
import { Mail, MapPin } from "lucide-react";

export const metadata = { title: "Contact — Mirae Fleet" };

export default function ContactPage() {
  return (
    <LegalLayout title="Contact Us" lastUpdated="1 June 2026">
      <p>
        We&rsquo;re here to help. Reach out via any of the channels below and we&rsquo;ll get back
        to you as soon as possible (typically within 1 business day).
      </p>

      <div className="not-prose mt-8 grid gap-5">
        <ContactCard
          icon={<Mail className="h-5 w-5 text-primary" />}
          label="Email"
          value="support@miraefleet.app"
          href="mailto:support@miraefleet.app"
        />
        <ContactCard
          icon={<MapPin className="h-5 w-5 text-primary" />}
          label="Registered Business Address"
          value={`AZP Group Sdn Bhd (1654709-U)\nE2 Ground Floor, Kulliyyah Of Engineering\nInternational Islamic University Malaysia (IIUM)\nKuala Lumpur, 53100\nWilayah Persekutuan, Malaysia`}
        />
      </div>

      <h2>Support Hours</h2>
      <p>Monday – Friday, 9:00 AM – 6:00 PM (MYT, UTC+8). Closed on Malaysian public holidays.</p>

      <h2>Billing &amp; Payments</h2>
      <p>
        For subscription and payment enquiries, email{" "}
        <a href="mailto:support@miraefleet.app">support@miraefleet.app</a> with your account email
        and Billplz payment reference number.
      </p>

      <h2>Technical Support</h2>
      <p>
        For GPS hardware integration, API key setup, or dashboard issues, email the same address
        with your vehicle IMEI and a description of the issue.
      </p>
    </LegalLayout>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-foreground whitespace-pre-line">{value}</p>
        )}
      </div>
    </div>
  );
}
