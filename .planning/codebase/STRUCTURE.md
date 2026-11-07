---
last_mapped_commit: f62f18aee89ccd314b75a485cdfbb35d4af6f397
last_mapped_at: 2026-11-07
---
# Codebase Structure

**Analysis Date:** 2026-11-07

## Directory Layout

```text
qafnest-next/
├── apps/
│   ├── guest/               # Guest Marketplace Next.js application (Port 3000)
│   │   ├── src/
│   │   │   ├── app/         # App Router pages and API routes
│   │   │   ├── components/  # React UI components (home, property, search, common)
│   │   │   ├── context/     # AppContext, AuthContext
│   │   │   ├── data/        # Static properties, translations
│   │   │   ├── hooks/       # useProperties, useRecentlyViewed, usePlatformFeeSync
│   │   │   ├── lib/         # Services (pricing, checkout, coupons, smart lock), Supabase, Firebase
│   │   │   └── providers/   # Client providers, Lenis smooth scroll
│   │   ├── package.json
│   │   ├── next.config.mjs
│   │   └── tailwind.config.ts
│   ├── host/                # Host Business Platform Next.js application (Port 3001)
│   │   ├── src/
│   │   │   ├── app/         # App Router (dashboard, listing wizard, API routes)
│   │   │   ├── components/  # Host UI widgets, stats, forms, calendars
│   │   │   ├── context/     # Host portal contexts
│   │   │   ├── hooks/       # Host business hooks
│   │   │   └── lib/         # Financials, Google Maps geocoding, server auth, Supabase
│   │   ├── package.json
│   │   ├── next.config.mjs
│   │   └── tailwind.config.ts
│   ├── admin/               # Super Admin Operations Next.js application (Port 3003)
│   │   ├── src/
│   │   │   ├── app/         # App Router (moderation queue, zatca, finance, coupons)
│   │   │   ├── components/  # Admin tables, metric badges, coupon managers
│   │   │   ├── context/     # Admin auth context
│   │   │   └── lib/         # Admin API clients, HMAC auth, ZATCA service, fee service
│   │   ├── package.json
│   │   ├── next.config.mjs
│   │   └── tailwind.config.ts
│   └── cms/                 # Content Management System Next.js application (Port 3002)
│       ├── src/
│       │   ├── app/         # App Router (blog, properties content, marketing pages)
│       │   ├── components/  # Content editors, preview panes
│       │   ├── context/     # CMS contexts
│       │   ├── data/        # CMS mock data
│       │   ├── lib/         # Admin auth, API helpers
│       │   └── types/       # CMS content types
│       ├── package.json
│       ├── next.config.mjs
│       └── tailwind.config.ts
├── packages/
│   └── shared/              # Monorepo shared library (@qafnest/shared)
│       ├── data/            # Platform fee configuration defaults
│       ├── design-system.ts # Unified design tokens and colors
│       ├── index.ts         # Central package exports
│       ├── phone.ts         # Saudi phone normalization (+966)
│       ├── platformFee.ts   # Pure commission and deduction calculation engine
│       ├── platformFeeStore.ts # Synchronized platform fee state
│       ├── taste.ts         # Taste guidelines and rules
│       ├── zatca.ts         # ZATCA Phase 1 invoicing logic
│       └── zatcaPhase2.ts   # ZATCA Phase 2 9-Tag TLV, UBL XML, SHA-256 hashing
├── scripts/                 # Monorepo maintenance and verification scripts
│   ├── dev-all.mjs          # Concurrently starts ports 3000, 3001, 3002, 3003
│   ├── design-audit.mjs     # Automated linter for the 59 Anti-Slop Rules
│   ├── e2e-finance-test.mjs # Full E2E verification across all 4 server ports
│   └── analyze-files.mjs    # File statistics utility
├── supabase/                # PostgreSQL schema and migration history
│   ├── migrations/          # Versioned SQL migrations (reviews, ZATCA, Saudi ID, coupons)
│   ├── COMPLETE_DATABASE_SETUP.sql # Consolidated database initialization script
│   └── schema.sql           # Canonical Supabase schema definition
├── .github/                 # GitHub Actions workflows and issue templates
├── .planning/               # GSD project plans and codebase documentation
│   └── codebase/            # Codebase map documents (STACK.md, ARCHITECTURE.md, etc.)
├── DESIGN.md                # Design system specification and color harmony rules
├── IMPECCABLE.md            # The 59 Anti-Slop UI & UX rules
├── MASTER_PLAN.md           # Host platform roadmap and milestone specifications
├── SECURITY_MASTER_PLAN.md  # OWASP API Top 10 security rules for QafNest
├── TASTE.md                 # Product craftsmanship principles
└── package.json             # Root monorepo workspace configuration
```

## Directory Purposes

**`apps/guest/`:**
- Purpose: Consumer-facing marketplace where travelers search stays, view details, check availability, apply coupons, and book.
- Contains: Next.js pages, reservation checkout flow, MyFatoorah payment routes, verified guest reviews system.
- Key files: `apps/guest/src/app/page.tsx`, `apps/guest/src/app/property/[id]/page.tsx`, `apps/guest/src/lib/services/pricing.ts`, `apps/guest/src/lib/services/myfatoorah.ts`.

**`apps/host/`:**
- Purpose: Business portal for property owners to onboard properties, manage calendars, view financial balances, and configure Saudi payout IBANs.
- Contains: Listing submission multi-step wizard, Google Maps geocoder, financial settlement analytics.
- Key files: `apps/host/src/app/page.tsx`, `apps/host/src/app/properties/new/page.tsx`, `apps/host/src/lib/geo/mapsUrlParser.ts`, `apps/host/src/lib/services/hostFinancialsService.ts`.

**`apps/admin/`:**
- Purpose: Internal operations portal for platform administrators to review and approve listings, configure commission fees, manage coupons, and audit ZATCA e-invoices.
- Contains: Secure authentication via HMAC signed cookies, listing review queue, dynamic commission rate slider, ZATCA compliance viewer.
- Key files: `apps/admin/src/app/page.tsx`, `apps/admin/src/lib/adminAuth.ts`, `apps/admin/src/lib/services/zatcaPhase2Service.ts`.

**`apps/cms/`:**
- Purpose: Editorial portal for marketing and static property copy management.
- Contains: Blog management, property listing descriptions editor.
- Key files: `apps/cms/src/app/page.tsx`, `apps/cms/src/lib/adminAuth.ts`.

**`packages/shared/`:**
- Purpose: Dependency-free shared logic used across all applications and server environments.
- Contains: ZATCA Phase 2 XML/TLV cryptographic hashing, platform fee math, Saudi IBAN/phone helpers, design tokens.
- Key files: `packages/shared/index.ts`, `packages/shared/platformFee.ts`, `packages/shared/zatcaPhase2.ts`, `packages/shared/phone.ts`.

**`supabase/migrations/`:**
- Purpose: Version-controlled database schema migrations.
- Contains: SQL DDL scripts, RLS policies, table definitions, foreign keys, and indexes.
- Key files: `supabase/migrations/20261102000000_production_ready_guest_engine.sql`, `supabase/migrations/20261104040000_promotions_and_coupons.sql`.

## Key File Locations

**Entry Points:**
- Guest Application: `apps/guest/src/app/page.tsx`
- Host Application: `apps/host/src/app/page.tsx`
- Admin Application: `apps/admin/src/app/page.tsx`
- CMS Application: `apps/cms/src/app/page.tsx`
- Monorepo Dev Runner: `scripts/dev-all.mjs`

**Configuration:**
- Root Workspaces: `package.json`
- Guest Next.js Config: `apps/guest/next.config.mjs`
- Host Next.js Config: `apps/host/next.config.mjs`
- Admin Next.js Config: `apps/admin/next.config.mjs`
- CMS Next.js Config: `apps/cms/next.config.mjs`
- Shared Platform Fee Defaults: `packages/shared/data/platform-fee-config.json`
- Emergency Promotion Store: `.qafnest-promotions.json`

**Core Logic:**
- Pricing & Tax: `apps/guest/src/lib/services/pricing.ts`
- Payments: `apps/guest/src/lib/services/myfatoorah.ts`
- ZATCA Phase 2: `packages/shared/zatcaPhase2.ts`
- Platform Commission: `packages/shared/platformFee.ts`
- Smart Lock PINs: `apps/guest/src/lib/services/smartLockPinService.ts`
- Location & Maps: `apps/host/src/lib/geo/mapsUrlParser.ts`
- Saudi Bank IBAN Routing: `apps/host/src/lib/financials/saudiBanks.ts`

**Testing & Quality:**
- E2E Integration Suite: `scripts/e2e-finance-test.mjs`
- Design Quality Linter: `scripts/design-audit.mjs`

## Naming Conventions

**Files:**
- React Components: PascalCase (`PropertyCard.tsx`, `PricingBreakdownModule.tsx`, `Hero.tsx`)
- Service Utilities & Helpers: camelCase (`pricing.ts`, `couponService.ts`, `mapsUrlParser.ts`)
- Next.js App Router Special Files: lowercase (`page.tsx`, `layout.tsx`, `route.ts`, `middleware.ts`)
- Config Files: kebab-case or standard dotfiles (`next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`)
- SQL Migrations: Timestamped snake_case (`YYYYMMDDHHMMSS_description.sql`)

**Directories:**
- Route Segments: kebab-case (`my-bookings/`, `properties/new/`) or dynamic bracket notation (`[id]/`, `[slug]/`)
- Component Clusters: lowercase (`common/`, `home/`, `property/`, `search/`)
- Libraries & Modules: lowercase (`lib/`, `services/`, `supabase/`, `geo/`)

## Where to Add New Code

**New Feature for Guests (e.g. Saved Payment Cards, Booking Cancellation):**
- UI Components: `apps/guest/src/components/account/` or `apps/guest/src/components/property/`
- Route Handler: `apps/guest/src/app/api/.../route.ts`
- Business Service: `apps/guest/src/lib/services/<featureName>.ts`
- Database Migration: `supabase/migrations/<timestamp>_<feature_name>.sql`

**New Host Feature (e.g. Seasonal Pricing Rules, Instant Payout Requests):**
- UI Screens: `apps/host/src/app/financials/` or `apps/host/src/app/calendar/`
- Backend Handlers: `apps/host/src/app/api/host/.../route.ts`
- Service Logic: `apps/host/src/lib/services/<serviceName>.ts`

**New Shared Domain Formula (e.g. Cancellation Fee Policy, VAT Exemption):**
- Pure Implementation: `packages/shared/<formulaName>.ts`
- Export from: `packages/shared/index.ts`
- Consume in apps via import: `import { ... } from "@qafnest/shared";`

**New System-Wide Maintenance / CI Script:**
- Add executable script to `scripts/<script-name>.mjs`
- Register shorthand command in root `package.json` under `"scripts"`

## Special Directories

**`.planning/`:**
- Purpose: Stores GSD architecture maps, project roadmaps, and execution tracking artifacts.
- Generated: Maintained by GSD CLI and workflows.
- Committed: Yes.

**`scratch/`:**
- Purpose: Temporary verification and scratchpad scripts (`test_priority7_verification.ts`, `test_priority8_migrations.ts`).
- Generated: Ad-hoc developer scripts.
- Committed: Kept for reference.

**`.github/`:**
- Purpose: GitHub workflow automation and pull request templates.
- Generated: Manually created.
- Committed: Yes.

---

*Structure analysis: 2026-11-07*
