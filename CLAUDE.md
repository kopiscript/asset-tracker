# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

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

### Clerk v7
- `SignedIn` / `SignedOut` components do not exist. Use `<Show when="signed-in">` / `<Show when="signed-out">` from `@clerk/nextjs` (client-only).
- Server-side auth: `import { auth, currentUser } from "@clerk/nextjs/server"` and `await auth()`.

## Architecture

**Auth flow**: `proxy.ts` protects `/dashboard/*`. On any authenticated request, `lib/user-sync.ts:getOrCreateDbUser()` upserts a `User` row keyed on Clerk's `userId` as `clerkId`. Every API route and server component that touches the DB calls this first.

**Permission model**: Three roles (`owner`, `editor`, `viewer`) stored in `VehicleAccess`. All access checks go through `lib/permissions.ts` (`canView`, `canEdit`, `canShare`, `canDelete`). Checks must be applied in both API routes (return 403) and UI (hide buttons). The `@@unique([vehicleId, userId])` constraint means one row per user-vehicle pair.

**Map**: Leaflet cannot run on the server. `components/map/VehicleMap.tsx` is the real map component (client-only). Always import it through `components/map/DynamicMap.tsx`, which wraps it with `next/dynamic` and `ssr: false`.

**Translations**: `lib/translations.ts` exports a `t` object with `en` and `bm` keys. The active language is stored in `localStorage` and managed by `components/LanguageProvider.tsx` (a React context). Dashboard pages access it via the `useLang()` hook. The provider is mounted in `app/dashboard/layout.tsx`.

**API shape**: All route handlers return `{ data: ..., error: null }` on success or `{ data: null, error: "message" }` on failure, with appropriate HTTP status codes.

**Database URL routing**:
- `.env` → read by `prisma.config.ts` via `dotenv/config` → used by Prisma CLI
- `.env.local` → read by Next.js → used by `lib/prisma.ts` at runtime
