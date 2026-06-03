# Onboarding Design — Multi-Role Coherent Flows

## Understanding Summary

**What is being built — 7 pieces:**
1. **Invite-any-email** — owner adds member by email (account optional); creates `OrgInvite` record + Resend fires invite email with signed token
2. **`/invite/[token]`** — dedicated invite acceptance page; smart-routes by auth state (logged in → accept; has account → sign-in then accept; no account → create account then accept)
3. **Role-aware welcome screen** — after accepting, invited member sees "You've joined X Fleet as a Viewer/Admin" before landing on dashboard
4. **Owner onboarding checklist** — post-payment 3-step inline checklist: rename org → add first vehicle → invite first team member; any order, skippable
5. **`/sign-up` stays owner-only** — plan picker untouched; invited members never touch it
6. **Landing page — inline disclaimer near CTA** — "Joining someone else's fleet? You'll get an invite link from your fleet owner — no sign-up needed here"
7. **Landing page — roles section** — "Built for your whole team" showing Owner / Admin / Viewer cards with descriptions

**Why it exists:** Current sign-up assumes everyone is a paying owner. Invited members have no clear path.

**Who it is for:** Owners (clearer post-payment setup) + invited admins/viewers (frictionless join with context)

---

## Decision Log

| Decision | Alternatives | Why chosen |
|---|---|---|
| Separate `/invite/[token]` page | Unified `/sign-up` with token detection | Different intent: "starting" vs "joining". Prevents invited viewers from accidentally starting paid plan |
| `OrgInvite` table for pending invites | Signed JWT (stateless) / `pending` flag on OrgMember | Auditable, revocable, resend-friendly |
| Derived onboarding state (steps 2+3) | Explicit tracking table | Steps 2 & 3 map cleanly to existing data; no drift risk |
| `nameSetAt` field for Step 1 | Derive from org name string | Default name detection is fragile (user may have no name, edge cases) |
| `seenWelcomeAt` backfilled for existing members | Check join date | Cleanest zero-pain migration; existing members grandfathered in |
| Invite acceptance via POST (not GET) | GET-based auto-accept | GET triggers prefetch by email scanners/antivirus bots, consuming tokens before real user clicks |
| Activate ALL pending invites on registration | Only activate clicked invite | User may have been invited to multiple orgs before signing up |

---

## Assumptions

- Resend API key available at `RESEND_API_KEY` env var
- From address: `Mirae Fleet <noreply@miraefleet.app>`
- Token: 32-byte cryptographically random hex string (raw token in URL, SHA-256 hash stored in DB)
- Token expiry: 7 days
- One active invite per email per org (`@@unique([email, orgId])` — upsert on resend)
- `seenWelcomeAt` backfilled to `NOW()` for all existing `OrgMember` rows in migration
- Owner checklist shown after payment callback; skippable at any time

---

## Schema Changes

### New model: `OrgInvite`
```prisma
model OrgInvite {
  id          String    @id @default(cuid())
  email       String
  orgId       String    @map("org_id")
  role        String                          // "owner" | "admin" | "viewer"
  token       String    @unique               // SHA-256 hash of raw token
  invitedBy   String    @map("invited_by")
  expiresAt   DateTime  @map("expires_at")
  acceptedAt  DateTime? @map("accepted_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  org     Organization @relation(...)
  inviter User         @relation(...)

  @@unique([email, orgId])
  @@map("org_invites")
}
```

### Updates to existing models
- `OrgMember`: add `seenWelcomeAt DateTime? @map("seen_welcome_at")`
- `Organization`: add `nameSetAt DateTime? @map("name_set_at")` + `onboardingSkippedAt DateTime? @map("onboarding_skipped_at")`
- `User`: add back-relation to `OrgInvite`

### Migration note
After `db push`, backfill: `UPDATE org_members SET seen_welcome_at = NOW() WHERE seen_welcome_at IS NULL`
This grandfathers existing members — they never see the welcome screen.

---

## Five Holes Fixed

1. **Inviting existing member** — pre-check: if already OrgMember, update role directly (no invite)
2. **Multiple pending invites on registration** — after any new user is created, activate ALL `OrgInvite` rows matching their email
3. **`seenWelcomeAt` set on dismiss** — set only when user clicks "Go to dashboard", not on page render
4. **Invite acceptance via POST** — `/invite/[token]` page renders confirmation UI; actual join is a form POST
5. **Step 1 derivation fragility** — tracked via `Organization.nameSetAt`, set when owner submits the rename form

---

## Flows

### Invited member (no account)
```
Owner adds email → OrgInvite created → Resend email sent
  → Invitee clicks link → /invite/[token]
  → No account: shows "Create account to join X Fleet as Viewer"
  → Fills name/email/password → POST /api/auth/register
  → Registration activates ALL pending invites for that email
  → Auto sign-in → POST /api/invite/[token]/accept
  → Redirect → /dashboard/welcome (seenWelcomeAt = null)
  → Clicks "Go to fleet" → seenWelcomeAt = now() → /dashboard
```

### Invited member (has account, not logged in)
```
→ /invite/[token] shows "Sign in to accept"
→ Signs in → POST /api/invite/[token]/accept
→ /dashboard/welcome → /dashboard
```

### Invited member (already logged in)
```
→ /invite/[token] shows "Accept & Join X Fleet as Admin"
→ Clicks accept → POST /api/invite/[token]/accept
→ /dashboard/welcome → /dashboard
```

### Owner post-payment
```
Pay via Billplz → callback → /onboarding/setup
  → Checklist: rename org / add vehicle / invite team
  → Complete all or skip → /dashboard
```
