# Session Handout — Auth Migration: Clerk → NextAuth

**Date**: 2026-05-04
**Branch**: main
**Scope**: Replace `@clerk/nextjs` with `next-auth` v5 (credentials provider)

---

## What changed

### Packages
| Removed | Added |
|---------|-------|
| `@clerk/nextjs@^7.3.0` | `next-auth@5.0.0-beta.31` |
| | `bcryptjs@^2.4.3` |
| | `@types/bcryptjs@^2.4.6` (dev) |

---

### New files

| File | Purpose |
|------|---------|
| `auth.config.ts` | Edge-safe NextAuth config (no Node.js imports). Used by `proxy.ts`. |
| `auth.ts` | Full NextAuth config with Credentials provider, Prisma, bcrypt. |
| `types/next-auth.d.ts` | TypeScript augmentation — adds `id` to `session.user`. |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth catch-all handler (`GET`/`POST`). |
| `app/api/auth/register/route.ts` | `POST` — creates a new user (hashes password with bcrypt). |
| `app/sign-in/page.tsx` | Custom credentials sign-in form. |
| `app/sign-up/page.tsx` | Custom registration form (calls `/api/auth/register` then signs in). |
| `components/providers/AuthProvider.tsx` | Client-side `SessionProvider` wrapper (required for `useSession()`). |

### Deleted files
- `app/sign-in/[[...sign-in]]/page.tsx` — Clerk catch-all
- `app/sign-up/[[...sign-up]]/page.tsx` — Clerk catch-all

---

### Modified files

| File | What changed |
|------|-------------|
| `proxy.ts` | Now imports `NextAuth(authConfig)` from `auth.config.ts` (edge-safe). `export const proxy = auth`. |
| `app/layout.tsx` | `ClerkProvider` replaced with `<AuthProvider>` (client `SessionProvider`). |
| `lib/user-sync.ts` | `getOrCreateDbUser()` now reads `session.user.id` from NextAuth (no more Clerk sync). |
| `prisma/schema.prisma` | `User.clerkId String @unique` → `User.password String?` |
| `prisma/seed.ts` | Hashes password with bcrypt; seeds user with `demo@fleettrack.my` / `fleettrack123`. |
| `components/LandingAuthButtons.tsx` | `<Show>` / `SignInButton` / `SignUpButton` (Clerk) → `useSession()` + `<Link>` to `/sign-in` `/sign-up`. |
| `components/dashboard/DashboardHeader.tsx` | `<UserButton>` (Clerk) → `UserAvatar` component showing initials from `useSession()`. |
| `components/dashboard/DashboardSidebar.tsx` | `useClerk().signOut` → `signOut({ callbackUrl: "/" })` from `next-auth/react`. |
| `app/dashboard/settings/page.tsx` | `currentUser()` (Clerk) → `await auth()` from `@/auth`. |
| `app/dashboard/settings/SettingsClient.tsx` | Removed `<UserProfile>` (Clerk hosted UI); now shows static name/email. |
| All 5 API routes | `import { auth } from "@clerk/nextjs/server"` + `const { userId } = await auth()` → `import { auth } from "@/auth"` + `const session = await auth(); const userId = session?.user?.id`. |
| `CLAUDE.md` | Clerk v7 section replaced with NextAuth v5 section; env vars updated. |

---

## Database migration required

The schema dropped `clerkId` and added `password`. **You must run the migration before the app works:**

```bash
# 1. Make sure .env and .env.local exist with DATABASE_URL (see below)
npm run db:migrate    # creates the migration and applies it
npm run db:seed       # seeds demo@fleettrack.my / fleettrack123
```

---

## New environment variables

`.env` (for Prisma CLI):
```
DATABASE_URL="postgresql://..."
```

`.env.local` (for Next.js runtime):
```
AUTH_SECRET="<run: openssl rand -base64 32>"
DATABASE_URL="postgresql://..."
```

`AUTH_SECRET` is **required** — NextAuth will refuse to start without it.

---

## Auth flow (new)

```
Sign up:
  POST /api/auth/register  →  creates User{email, password: bcrypt(pw)}
  signIn("credentials")    →  NextAuth verifies bcrypt, issues JWT
  JWT contains: { id: dbUser.id, email, name }

Sign in:
  signIn("credentials", { email, password })
  NextAuth authorize() → prisma lookup → bcrypt.compare → return user
  JWT stored in cookie

Session:
  Server: const session = await auth()   // from @/auth
  Client: const { data: session } = useSession()  // from next-auth/react
  session.user.id === database User.id

Protected routes:
  proxy.ts (edge) → auth.config.ts → authorized() callback
  Returns false for /dashboard/* when not signed in → redirect to /sign-in
```

---

## What's intentionally NOT implemented

- Password reset / forgot-password flow
- Email verification
- OAuth providers (Google, GitHub, etc.) — easy to add in `auth.ts`
- Profile edit UI (the settings page now shows read-only name/email)

---

## How to add an OAuth provider (future)

1. Install the provider package (e.g., `npm install @auth/google-provider` — not needed for built-ins).
2. Add to `auth.ts` providers array:
   ```ts
   import Google from "next-auth/providers/google";
   providers: [Credentials({...}), Google()]
   ```
3. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`.
4. The `User.password` field stays nullable — OAuth users have no password.

---

## Quick smoke-test checklist

- [ ] `npm run dev` starts without errors
- [ ] `/sign-up` creates an account and redirects to `/dashboard`
- [ ] `/sign-in` signs in and redirects to `/dashboard`
- [ ] Sidebar "Sign out" button redirects to `/`
- [ ] `/dashboard` redirects to `/sign-in` when not logged in
- [ ] User avatar in header shows correct initials
- [ ] Creating and editing a vehicle works
- [ ] Sharing a vehicle works
