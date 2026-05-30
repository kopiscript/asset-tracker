import { LegalLayout } from "@/components/LegalLayout";

export const metadata = { title: "Privacy Policy — Mirae Fleet" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="1 June 2026">
      <p>
        This Privacy Policy describes how <strong>AZP Group Sdn Bhd</strong> (1654709-U) collects, uses, and protects your personal data when you use
        the Mirae Fleet platform (&ldquo;Service&rdquo;). We are committed to complying with the
        Personal Data Protection Act 2010 (PDPA) of Malaysia.
      </p>

      <h2>1. Data We Collect</h2>
      <p>We collect the following categories of data:</p>
      <ul>
        <li>
          <strong>Account data</strong> — name, email address, and password (hashed) provided at
          registration
        </li>
        <li>
          <strong>Organisation data</strong> — organisation name and subscription plan details
        </li>
        <li>
          <strong>Vehicle data</strong> — vehicle name, plate number, IMEI, driver assignment, and
          current subscription plan
        </li>
        <li>
          <strong>GPS and telemetry data</strong> — location coordinates, speed, altitude, heading,
          ignition state, and other telemetry submitted by GPS hardware devices assigned to your
          vehicles
        </li>
        <li>
          <strong>Payment data</strong> — subscription status and billing reference numbers.
          Payment card details are processed directly by Billplz and are never stored on our servers
        </li>
        <li>
          <strong>Usage data</strong> — browser type, IP address, pages visited, and session
          duration collected via server logs
        </li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <p>We use your data to:</p>
      <ul>
        <li>Provide, operate, and improve the Service</li>
        <li>Authenticate your account and enforce access controls</li>
        <li>Display real-time and historical vehicle location and telemetry</li>
        <li>Process subscription payments and enforce plan limits</li>
        <li>Send transactional emails (account confirmation, payment receipts, service notices)</li>
        <li>Diagnose technical issues and maintain service security</li>
      </ul>
      <p>We do not sell your personal data to third parties.</p>

      <h2>3. Data Sharing</h2>
      <p>
        We share data only with the following categories of third-party service providers, strictly
        to operate the Service:
      </p>
      <ul>
        <li><strong>Neon</strong> — managed PostgreSQL database hosting (data stored in AWS Singapore region)</li>
        <li><strong>Vercel</strong> — application hosting and CDN</li>
        <li><strong>Upstash</strong> — Redis-based rate limiting (no personally identifiable data stored)</li>
        <li><strong>Billplz</strong> — payment processing (subject to Billplz&rsquo;s own Privacy Policy)</li>
      </ul>
      <p>
        All providers are required to process data only as instructed and to maintain appropriate
        security measures.
      </p>

      <h2>4. GPS and Location Data</h2>
      <p>
        GPS data is submitted by hardware devices installed in vehicles. This data is associated
        with a vehicle record, not with an individual person. You are responsible for ensuring that
        drivers and other individuals whose location may be captured are informed and have provided
        any consent required under applicable law.
      </p>

      <h2>5. Data Retention</h2>
      <ul>
        <li>Account and vehicle data — retained while your account is active and for 30 days after termination</li>
        <li>GPS telemetry records — retained indefinitely while your account is active; deleted 30 days after account termination</li>
        <li>Payment references — retained for 7 years as required by Malaysian tax law</li>
      </ul>

      <h2>6. Security</h2>
      <p>
        We implement industry-standard security measures including TLS encryption in transit,
        bcrypt password hashing, API key hashing, HTTP security headers, and rate limiting on all
        inbound endpoints. Access to production data is restricted to authorised personnel only.
      </p>

      <h2>7. Your Rights (PDPA)</h2>
      <p>Under the Personal Data Protection Act 2010, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Correct inaccurate personal data</li>
        <li>Withdraw consent for processing, subject to legal and contractual obligations</li>
      </ul>
      <p>
        To exercise these rights, contact us at{" "}
        <a href="mailto:support@miraefleet.app">support@miraefleet.app</a>.
      </p>

      <h2>8. Cookies</h2>
      <p>
        We use session cookies for authentication (via NextAuth). We do not use third-party
        advertising cookies or tracking pixels. You may disable cookies in your browser settings,
        but this will prevent you from logging in.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be notified via
        email or an in-app notice. The date at the top of this page reflects the most recent revision.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy-related enquiries, contact our data protection contact at{" "}
        <a href="mailto:support@miraefleet.app">support@miraefleet.app</a> or visit our{" "}
        <a href="/contact">Contact page</a>.
      </p>
    </LegalLayout>
  );
}
