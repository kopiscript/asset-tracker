import { LegalLayout } from "@/components/LegalLayout";

export const metadata = { title: "Refund Policy — Mirae Fleet" };

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" lastUpdated="1 June 2026">
      <p>
        This Refund Policy applies to all subscription payments made to{" "}
        <strong>[COMPANY NAME]</strong> (SSM No. <strong>[SSM NUMBER]</strong>) for the Mirae Fleet
        platform (&ldquo;Service&rdquo;). Please read this policy carefully before subscribing.
      </p>

      <h2>1. Subscription Payments Are Non-Refundable</h2>
      <p>
        All subscription fees paid to Mirae Fleet are <strong>non-refundable</strong>. Once a
        payment is processed, we do not issue refunds for any portion of the current billing period,
        including in cases of:
      </p>
      <ul>
        <li>Early cancellation of a subscription</li>
        <li>Unused days remaining in the billing cycle</li>
        <li>Downgrade to a lower-tier plan mid-cycle</li>
        <li>Failure to use the Service after payment</li>
      </ul>
      <p>
        This policy is consistent with the non-refundable nature of FPX transactions as governed
        by Billplz&rsquo;s payment platform terms.
      </p>

      <h2>2. Free Trial and Evaluation</h2>
      <p>
        We encourage you to evaluate the Service during any available free or trial period before
        committing to a paid subscription. If no trial is available, please contact us at{" "}
        <a href="mailto:support@miraefleet.app">support@miraefleet.app</a> before purchasing to
        arrange a demonstration.
      </p>

      <h2>3. Service Outages</h2>
      <p>
        In the event of a significant and prolonged service outage (defined as greater than 72
        consecutive hours of total unavailability caused solely by our systems), we may, at our
        sole discretion, issue a pro-rated credit to your Mirae Fleet account for the affected
        period. Credits are applied to future billing cycles and are not redeemable as cash.
      </p>

      <h2>4. Duplicate or Erroneous Payments</h2>
      <p>
        If you have been charged more than once for the same billing period due to a system error,
        please contact us within 14 days at{" "}
        <a href="mailto:support@miraefleet.app">support@miraefleet.app</a> with your payment
        reference number. We will investigate and refund any confirmed duplicate charge within
        10 business days.
      </p>

      <h2>5. How to Cancel</h2>
      <p>
        You may cancel your subscription at any time by contacting{" "}
        <a href="mailto:support@miraefleet.app">support@miraefleet.app</a>. Cancellation stops
        future billing but does not entitle you to a refund for the current period. Your access will
        continue until the end of the paid period.
      </p>

      <h2>6. Contact</h2>
      <p>
        For questions about this policy, email us at{" "}
        <a href="mailto:support@miraefleet.app">support@miraefleet.app</a> or visit our{" "}
        <a href="/contact">Contact page</a>.
      </p>
    </LegalLayout>
  );
}
