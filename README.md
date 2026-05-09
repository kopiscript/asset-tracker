# FleetTrack — Vehicle Asset Tracker

> Real-time vehicle tracking dashboard for Malaysian fleets. Monitor your vehicles, manage access, and stay in control.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Neon (PostgreSQL) |
| ORM | Prisma 7 |
| Auth | NextAuth v5 (credentials) |
| Map | Leaflet + OpenStreetMap (free, no API key) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |

---

## Setup

### 1. Get a free Neon database

1. Go to **https://neon.tech** and sign up for free
2. Create a new project (choose `Singapore` region for Malaysia)
3. Copy the connection string (starts with `postgresql://`)

### 2. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/asset-tracker.git
cd asset-tracker
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
AUTH_SECRET="run: openssl rand -base64 32"
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### 4. Run database migration

```bash
npm run db:migrate
```

### 5. (Optional) Add sample data

```bash
npm run db:seed
```

### 6. Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000**, sign up, and you'll land on the dashboard.

---

## Useful Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:seed      # Add demo data
```

---

## Project Structure

```
asset-tracker/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── sign-in/                    # Sign-in page
│   ├── sign-up/                    # Sign-up page
│   ├── dashboard/
│   │   ├── layout.tsx              # Dashboard layout (sidebar + header)
│   │   ├── page.tsx                # Main dashboard (map + stats)
│   │   ├── vehicles/
│   │   │   ├── page.tsx            # Vehicle list
│   │   │   ├── new/page.tsx        # Add vehicle form
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Vehicle detail + map
│   │   │       ├── edit/page.tsx   # Edit vehicle
│   │   │       └── share/page.tsx  # Manage access
│   │   └── settings/page.tsx       # User settings
│   └── api/
│       ├── auth/                   # NextAuth + register endpoint
│       └── vehicles/               # REST API routes
├── components/
│   ├── dashboard/                  # Dashboard-specific components
│   ├── map/                        # Leaflet map components
│   ├── ui/                         # shadcn/ui components
│   ├── StatusBadge.tsx
│   ├── FuelBar.tsx
│   └── LanguageProvider.tsx        # EN/BM language context
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── permissions.ts              # Role-based access control
│   ├── translations.ts             # EN + BM translations
│   ├── user-sync.ts                # DB user lookup by session ID
│   └── format.ts                   # Date/number formatting utilities
├── auth.ts                         # NextAuth full config (server)
├── auth.config.ts                  # NextAuth edge-safe config (proxy)
├── proxy.ts                        # Protects /dashboard routes
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

---

## Roles & Permissions

| Action | Viewer | Editor | Owner |
|---|---|---|---|
| View vehicle details + map | ✅ | ✅ | ✅ |
| Edit vehicle info | ❌ | ✅ | ✅ |
| Add/remove team members | ❌ | ❌ | ✅ |
| Delete vehicle | ❌ | ❌ | ✅ |

---

## Map

Uses **OpenStreetMap** via **Leaflet** — free, no API key needed.

- Green = Active
- Yellow = Idle
- Red = Offline

To push GPS updates from hardware: `PATCH /api/vehicles/[id]/location` with `{ latitude, longitude }`.
