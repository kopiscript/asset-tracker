/**
 * lib/email.ts
 * Transactional email via Resend. Used for org invitations.
 *
 * Requires RESEND_API_KEY in the environment. From address is the verified
 * Mirae Fleet sender. Emails are plain, professional HTML — no external assets.
 */
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = "Mirae Fleet <noreply@ticki.azmiproductions.com>";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  viewer: "Viewer",
};

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Shared shell — dark, minimal, inline-styled for email-client compatibility.
function shell(bodyHtml: string): string {
  return `
  <div style="background:#1c1c1e;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#2c2c2e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;color:#f5f5f7;">
      <div style="font-size:13px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#ff453a;margin-bottom:24px;">
        Mirae Fleet
      </div>
      ${bodyHtml}
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);font-size:12px;color:#86868b;">
        Mirae Fleet — real-time GPS fleet tracking for Malaysian businesses.
      </div>
    </div>
  </div>`;
}

/**
 * Sent to an email that has no account yet. Contains the action link to the
 * invite acceptance page.
 */
export async function sendInviteEmail(opts: {
  to: string;
  orgName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}) {
  const role = roleLabel(opts.role);
  const orgName = esc(opts.orgName);
  const inviterName = esc(opts.inviterName);
  const inviteUrl = esc(opts.inviteUrl);
  const html = shell(`
    <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;color:#f5f5f7;">
      You've been invited to ${orgName}
    </h1>
    <p style="font-size:14px;line-height:1.6;color:#c7c7cc;margin:0 0 8px;">
      <strong style="color:#f5f5f7;">${inviterName}</strong> has invited you to join
      <strong style="color:#f5f5f7;">${orgName}</strong> on Mirae Fleet as a
      <strong style="color:#ff453a;">${role}</strong>.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#c7c7cc;margin:0 0 24px;">
      Click below to create your account and join the fleet. This link expires in 7 days.
    </p>
    <a href="${inviteUrl}"
       style="display:inline-block;background:#ff453a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;">
      Accept invite &rarr;
    </a>
    <p style="font-size:12px;line-height:1.5;color:#86868b;margin:24px 0 0;">
      If the button doesn't work, copy and paste this link:<br/>
      <span style="color:#c7c7cc;word-break:break-all;">${inviteUrl}</span>
    </p>
  `);

  return getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `You've been invited to ${opts.orgName} on Mirae Fleet`,
    html,
  });
}

/**
 * Sent to an email that already has an account — they were added directly to the
 * org, so there's nothing to accept. Just a heads-up notification.
 */
export async function sendInviteNotificationEmail(opts: {
  to: string;
  orgName: string;
  inviterName: string;
  role: string;
}) {
  const role = roleLabel(opts.role);
  const orgName = esc(opts.orgName);
  const inviterName = esc(opts.inviterName);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mirae.azmiproductions.com";
  const html = shell(`
    <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;color:#f5f5f7;">
      You've been added to ${orgName}
    </h1>
    <p style="font-size:14px;line-height:1.6;color:#c7c7cc;margin:0 0 8px;">
      <strong style="color:#f5f5f7;">${inviterName}</strong> has added you to
      <strong style="color:#f5f5f7;">${orgName}</strong> on Mirae Fleet as a
      <strong style="color:#ff453a;">${role}</strong>.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#c7c7cc;margin:0 0 24px;">
      Sign in with your existing account to see the fleet.
    </p>
    <a href="${appUrl}/dashboard"
       style="display:inline-block;background:#ff453a;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;">
      Go to dashboard &rarr;
    </a>
  `);

  return getResend().emails.send({
    from: FROM,
    to: opts.to,
    subject: `You've been added to ${opts.orgName} on Mirae Fleet`,
    html,
  });
}
