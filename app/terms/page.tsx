import { LegalLayout } from "@/components/LegalLayout";

export const metadata = { title: "Terms of Service — Mirae Fleet" };

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="1 June 2026">
      <p>
        These Terms of Service govern your use of the Mirae Fleet vehicle tracking platform
        (&ldquo;Service&rdquo;) operated by <strong>AZP Group Sdn Bhd</strong> (1654709-U) (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
        By accessing or using the Service, you agree to be bound by these Terms.
      </p>

      <h2>1. Description of Service</h2>
      <p>
        Mirae Fleet is a Software-as-a-Service (SaaS) platform that provides real-time GPS vehicle
        tracking, fleet management, and access control for Malaysian businesses. The Service is
        accessed via the web application at miraefleet.app and its associated APIs.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old and have authority to enter into binding contracts on
        behalf of your organisation to use this Service. By registering, you represent and warrant
        that you meet these requirements.
      </p>

      <h2>3. Subscription Plans and Billing</h2>
      <p>
        The Service is offered on a subscription basis. Plans and their limits are:
      </p>
      <ul>
        <li><strong>Personal</strong> — RM 29/month, up to 3 vehicles, 1 GPS ping per minute per vehicle</li>
        <li><strong>Growth</strong> — RM 149/month, up to 20 vehicles, 1 GPS ping per 10 seconds per vehicle</li>
        <li><strong>Fleet</strong> — contact us for pricing, up to 50 vehicles, 1 GPS ping per 10 seconds per vehicle</li>
        <li><strong>Enterprise</strong> — custom pricing and limits, contact us</li>
      </ul>
      <p>
        Subscriptions are billed monthly. Payment is processed via Billplz using FPX online banking,
        debit/credit card, or supported e-wallets. A subscription remains active for 31 days from
        the date of payment. Failure to renew within a 7-day grace period will result in suspension
        of your organisation&rsquo;s dashboard access. GPS hardware will continue to submit data
        during the grace period. We do not store your full card or bank account details — payment
        credentials are handled exclusively by Billplz.
      </p>

      <h2>4. Account Security</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials. You agree
        to notify us immediately at{" "}
        <a href="mailto:support@miraefleet.app">support@miraefleet.app</a> if you suspect any
        unauthorised access to your account. We are not liable for any loss arising from unauthorised
        use of your account where you have failed to take reasonable steps to protect your credentials.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service to track individuals without their knowledge or consent</li>
        <li>Exceed the vehicle or API rate limits of your subscription plan</li>
        <li>Attempt to circumvent, reverse-engineer, or disrupt the Service</li>
        <li>Resell or sublicense the Service without written permission</li>
        <li>Submit false, misleading, or unlawful data through the Service</li>
      </ul>

      <h2>6. Data and Privacy</h2>
      <p>
        Your use of the Service is also governed by our{" "}
        <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference.
        You retain ownership of the GPS and vehicle data you submit. You grant us a limited licence
        to store and process that data solely to provide the Service.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        All software, designs, and content comprising the Mirae Fleet platform are owned by
        AZP Group Sdn Bhd or its licensors. Nothing in these Terms transfers any intellectual property
        rights to you.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by Malaysian law, we shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages, including loss of profits or data,
        arising from your use of or inability to use the Service. Our total aggregate liability for
        any claim shall not exceed the total fees paid by you in the three months preceding the claim.
      </p>

      <h2>9. Service Availability</h2>
      <p>
        We aim to maintain high availability but do not guarantee uninterrupted service. Scheduled
        maintenance will be communicated in advance where possible. We are not liable for downtime
        caused by third-party providers (including Neon or Vercel).
      </p>

      <h2>10. Termination</h2>
      <p>
        You may cancel your subscription at any time by contacting us at{" "}
        <a href="mailto:support@miraefleet.app">support@miraefleet.app</a>. We reserve the right
        to suspend or terminate accounts that violate these Terms. Upon termination, your data will
        be retained for 30 days before deletion.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These Terms are governed by the laws of Malaysia. Any disputes shall be subject to the
        exclusive jurisdiction of the courts of Malaysia.
      </p>

      <h2>12. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of material changes via
        email or a notice within the platform. Continued use of the Service after changes take
        effect constitutes acceptance of the revised Terms.
      </p>

      <h2>13. Contact</h2>
      <p>
        For questions about these Terms, contact us at{" "}
        <a href="mailto:support@miraefleet.app">support@miraefleet.app</a> or visit our{" "}
        <a href="/contact">Contact page</a>.
      </p>
    </LegalLayout>
  );
}
