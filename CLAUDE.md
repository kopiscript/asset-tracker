# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Session Management

### On session start
At the start of every developer session, read these two files before doing anything else:
1. `docs/TODO.md` — current task status, what is open and what is done
2. `docs/PRD.md` — product requirements and scope

After reading, greet the developer with:
- How many tasks are open vs complete, grouped by phase
- Any unresolved decision gates (marked ⚠️ in the TODO)
- Then ask: **"What are you working on today?"**

### On session end
When the developer says **"session end"**, do all of the following:
1. Update `docs/TODO.md` — mark completed tasks `[x]`, add a one-line note beneath any task where implementation diverged from the plan
2. Update `docs/PRD.md` — record any design decisions made or open questions resolved during the session
3. Update this file (`CLAUDE.md`) — if any new stack conventions, gotchas, or architectural patterns were established
4. Print a 3–5 bullet summary of what was accomplished this session

> All `.md` files must be up to date at all times. Never end a session without running the above checklist.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (also runs TypeScript check)
npm run lint         # ESLint
npm run db:migrate   # Run Prisma migrations (requires DATABASE_URL in .env)
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio (visual DB browser)
```

## Breaking changes in this stack

### Next.js 16
- **`params` and `searchParams` are Promises** — always `await props.params` and `await props.params` in pages/layouts.
- **Middleware is renamed to Proxy** — the protection file is `proxy.ts` (not `middleware.ts`), and the exported function must be named `proxy` or be a default export.
- **Route handler context** — use the globally-available `RouteContext<'/path/[param]'>` helper to type `ctx.params`; `params` is also a Promise inside handlers.
- **`PageProps` / `LayoutProps`** — globally available type helpers; no import needed.
- Read `node_modules/next/dist/docs/` before writing any Next.js code.

### Prisma 7
- **No `url` in `schema.prisma`** — the connection URL lives in `prisma.config.ts` (for the CLI) and is passed via the adapter in `lib/prisma.ts` (for runtime). Adding `url = env(...)` to the datasource block is a hard error.
- **Requires a driver adapter** — `new PrismaClient()` with no arguments is an error. The client is always constructed as `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`.
- Generated client output is `lib/generated/prisma/client.ts` — import from `@/lib/generated/prisma/client`, not `@prisma/client`.
- Two env files are needed: `.env` (Prisma CLI reads this via `dotenv/config` in `prisma.config.ts`) and `.env.local` (Next.js reads this at runtime).

### shadcn/ui (Base UI edition)
- Components are backed by `@base-ui/react`, **not Radix**. The `asChild` prop does not exist.
- To render a Button as a link: `<Button render={<Link href="..." />}>text</Button>`.
- To use a trigger (Dialog, Sheet, Tooltip) with a custom element: `<DialogTrigger render={<Button variant="outline" />}>text</DialogTrigger>`.
- `Select.onValueChange` receives `string | null` — always guard: `onValueChange={(v) => v && setState(v)}`.

### NextAuth v5 (Auth.js v5 — `next-auth@5.0.0-beta.31`)
- **Import from `@/auth`, not from `next-auth`** — `auth`, `handlers`, `signIn`, `signOut` are all exported from `auth.ts` at the project root.
- **Server-side auth**: `const session = await auth()` — returns `null` when not signed in. The session carries `session.user.id` (database primary key).
- **Client-side auth**: `useSession()` from `next-auth/react`; `signIn()`/`signOut()` also from `next-auth/react`.
- **Two config files**: `auth.config.ts` (edge-safe, no Node.js imports — used by `proxy.ts`) and `auth.ts` (full config with Prisma + bcrypt — used everywhere else).
- **`AUTH_SECRET` env var is required** — add to `.env`: generate with `openssl rand -base64 32`.
- **User creation**: users are created at sign-up via `POST /api/auth/register`. `getOrCreateDbUser()` in `lib/user-sync.ts` now only does a DB lookup (no Clerk sync).

## Environment variables

A single `.env` file is sufficient — Next.js reads `.env` in addition to `.env.local`, and `prisma.config.ts` loads it via `dotenv/config`.

`.env`:
```
AUTH_SECRET="run: openssl rand -base64 32"
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

> Do not create `.env.local` unless you specifically need to override `.env` values per environment.

## Architecture

**Auth flow**: `proxy.ts` (edge-safe) uses `auth.config.ts` to protect `/dashboard/*` — redirects to `/sign-in` when unauthenticated. Sign-up POSTs to `/api/auth/register` (creates user + hashes password), then auto-signs in via NextAuth credentials. The NextAuth JWT stores the database `User.id`, so every API route and server component calls `getOrCreateDbUser()` which looks up the user by `session.user.id`.

**Permission model**: Three roles (`owner`, `editor`, `viewer`) stored in `VehicleAccess`. All access checks go through `lib/permissions.ts` (`canView`, `canEdit`, `canShare`, `canDelete`). Checks must be applied in both API routes (return 403) and UI (hide buttons). The `@@unique([vehicleId, userId])` constraint means one row per user-vehicle pair.

**Map**: Leaflet cannot run on the server. `components/map/VehicleMap.tsx` is the real map component (client-only). Always import it through `components/map/DynamicMap.tsx`, which wraps it with `next/dynamic` and `ssr: false`.

**Translations**: `lib/translations.ts` exports a `t` object with `en` and `bm` keys. The active language is stored in `localStorage` and managed by `components/LanguageProvider.tsx` (a React context). Dashboard pages access it via the `useLang()` hook. The provider is mounted in `app/dashboard/layout.tsx`.

**API shape**: All route handlers return `{ data: ..., error: null }` on success or `{ data: null, error: "message" }` on failure, with appropriate HTTP status codes.

**Database URL routing**:
- `.env` → read by `prisma.config.ts` via `dotenv/config` → used by Prisma CLI
- `.env` → also read by Next.js at runtime → used by `lib/prisma.ts`

**IoT location endpoint**: `PATCH /api/vehicles/[id]/location` is for GPS hardware only. It authenticates via API key (`Authorization: Bearer <key>`) — not session auth. The key is stored as `apiKey` on the `Vehicle` model and set manually via Prisma Studio for v1. The endpoint writes atomically to both `Vehicle` (last position) and `LocationHistory` (append-only) using `prisma.$transaction()`. See `docs/TODO.md` Phase 2 for the full implementation.

**Trip history endpoint**: `GET /api/vehicles/[id]/history?from=ISO&to=ISO` returns GPS pings grouped into trips by a 10-minute gap threshold. Max query window is 30 days. Uses cursor-based batching (500 rows at a time) to avoid loading all pings into memory. See `docs/TODO.md` Phase 3 for the full implementation.

**LocationHistory**: Append-only table storing every GPS ping. Indexed on `[vehicleId, recordedAt]`. Never update or delete rows — only insert. Cascade-deleted when a Vehicle is deleted.

**Dark mode**: The app is always dark. `"dark"` is hard-coded as a class on `<html>` in `app/layout.tsx`. There is no light mode.

**Tailwind v4**: Theme customization lives in `app/globals.css` (CSS variables), not in `tailwind.config.ts`. The accent color is `--color-accent: #00c2cc`.

**Shared utilities**: `lib/format.ts` exports `timeAgo(date)`, `formatNumber(n)`, and `clamp(n, min, max)` — use these before writing new formatting logic.
