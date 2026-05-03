# FleetTrack — Vehicle Asset Tracker

> Real-time vehicle tracking dashboard for Malaysian fleets. Monitor your vehicles, manage access, and stay in control.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Neon (PostgreSQL) |
| ORM | Prisma 7 |
| Auth | Clerk |
| Map | Leaflet + OpenStreetMap (free, no API key) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |

---

## Step-by-Step Setup (Beginner Guide)

### 1. Get a free Neon database

1. Go to **https://neon.tech** and sign up for free
2. Create a new project (any name, choose `Singapore` region for Malaysia)
3. Click **Connection string** → copy the string that starts with `postgresql://`
4. You'll paste this into `.env.local` in step 4

### 2. Get free Clerk auth keys

1. Go to **https://clerk.com** and sign up for free
2. Create a new application (any name)
3. In your Clerk dashboard → **API Keys**
4. Copy the **Publishable Key** (starts with `pk_test_`) and **Secret Key** (starts with `sk_test_`)
5. You'll paste these into `.env.local` in step 4

### 3. Clone and install

```bash
# Clone the project
git clone https://github.com/YOUR_USERNAME/asset-tracker.git
cd asset-tracker

# Install all dependencies
npm install
```

### 4. Set up environment variables

Open the file `.env.local` and fill in your keys:

```env
# From Clerk Dashboard → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE

# From Neon → Connection String (with ?sslmode=require at the end)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

Also open `.env` and add the same `DATABASE_URL` (this is used by Prisma CLI tools):

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### 5. Run database migration

This creates all the tables in your Neon database:

```bash
npx prisma migrate dev --name init
```

### 6. (Optional) Add sample data

This adds 5 demo vehicles so you can see the map immediately:

1. Open `prisma/seed.ts`
2. Find `DEMO_CLERK_ID` and replace it with your real Clerk user ID
   - Find your Clerk user ID in: Clerk Dashboard → Users → click your user → **User ID**
3. Run: `npm run db:seed`

### 7. Start the development server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. Sign up for an account and you'll be redirected to the dashboard.

---

## Where to Edit Placeholders

Every file with a `✏️ EDIT:` comment needs your attention. Here's a summary:

| File | What to change |
|---|---|
| `.env.local` | Clerk API keys, Neon database URL |
| `.env` | Neon database URL (for Prisma CLI) |
| `app/layout.tsx` | App title and description |
| `app/page.tsx` | Company name, hero text, announcement text |
| `app/dashboard/settings/page.tsx` | Support email address |
| `app/dashboard/settings/SettingsClient.tsx` | Support email address |
| `components/dashboard/DashboardSidebar.tsx` | Product name in sidebar |
| `prisma/seed.ts` | Your Clerk user ID and email for demo data |
| `app/globals.css` | Brand accent colour (`#00c2cc`) |

Search for `✏️ EDIT:` across all files to find every placeholder:

```powershell
# Windows (PowerShell)
Select-String -Path "app\**\*.tsx","app\**\*.ts","components\**\*.tsx","lib\**\*.ts" -Pattern "EDIT:" -Recurse
```

---

## Useful Commands

```bash
# Start development server
npm run dev

# Run database migration (after changing prisma/schema.prisma)
npm run db:migrate

# Open Prisma Studio (visual database browser)
npm run db:studio

# Add seed data
npm run db:seed

# Build for production
npm run build
```

---

## GitHub Basics for Beginners

### First time setup
```bash
# Tell Git who you are (do this once on your computer)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### Save your changes
```bash
# See what files you've changed
git status

# Stage all your changes
git add .

# Save them with a message
git commit -m "describe what you changed here"
```

### Push to GitHub
```bash
# First push (creates the branch on GitHub)
git push -u origin main

# After that, just:
git push
```

### Get latest changes from GitHub
```bash
git pull
```

### Full workflow (pull → change → commit → push)
```bash
git pull                    # 1. Get latest version
# ... make your changes ...
git add .                   # 2. Stage changes
git commit -m "my changes"  # 3. Save locally
git push                    # 4. Upload to GitHub
```

---

## Project Structure

```
asset-tracker/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (ClerkProvider)
│   ├── sign-in/                    # Clerk sign-in
│   ├── sign-up/                    # Clerk sign-up
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
│       └── vehicles/               # REST API routes
├── components/
│   ├── dashboard/                  # Dashboard-specific components
│   ├── map/                        # Leaflet map components
│   ├── ui/                         # shadcn/ui components
│   ├── Placeholder.tsx             # Yellow highlight for editable text
│   ├── StatusBadge.tsx             # Green/yellow/red status indicator
│   ├── FuelBar.tsx                 # Fuel level progress bar
│   └── LanguageProvider.tsx        # EN/BM language context
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── permissions.ts              # Role-based access control helpers
│   ├── translations.ts             # EN + BM translations
│   ├── user-sync.ts                # Sync Clerk user to database
│   └── format.ts                   # Date/number formatting utilities
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Sample data
└── middleware.ts                   # Protects /dashboard routes
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

The map uses **OpenStreetMap** tiles via **Leaflet** — 100% free, no API key required.

Markers are colour-coded:
- 🟢 Green = Active (GPS recently updated)
- 🟡 Yellow = Idle
- 🔴 Red = Offline

To connect real GPS hardware, send `PATCH /api/vehicles/[id]/location` with `{ latitude, longitude }`.
