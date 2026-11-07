---
last_mapped_commit: f62f18aee89ccd314b75a485cdfbb35d4af6f397
last_mapped_at: 2026-11-07
---
# Technology Stack

**Analysis Date:** 2026-11-07

## Languages

**Primary:**
- TypeScript 5.x - All applications (`apps/guest`, `apps/host`, `apps/admin`, `apps/cms`), packages (`packages/shared`), and type declarations.
- JavaScript / ECMAScript (ES2022+ / Node ESM) - Build scripts (`scripts/dev-all.mjs`, `scripts/design-audit.mjs`, `scripts/e2e-finance-test.mjs`), Next.js configs (`next.config.mjs`).

**Secondary:**
- SQL (PostgreSQL PL/pgSQL) - Database migrations, table schemas, triggers, functions, and RLS policies in `supabase/migrations/` and `supabase/schema.sql`.
- HTML/CSS (Tailwind CSS 3.4.1) - Utility-first styling across all 4 frontend portals.

## Runtime

**Environment:**
- Node.js >= 20.x (LTS recommended)

**Package Manager:**
- npm (using npm workspaces configured in root `package.json`)
- Lockfile: `package-lock.json` (present)
- Monorepo workspaces: `apps/*`, `packages/*`

## Frameworks

**Core:**
- Next.js 14.2.35 - App Router framework for all 4 micro-frontends:
  - `apps/guest` (Port 3000): Guest catalog, stay discovery, reservations, reviews
  - `apps/host` (Port 3001): Host business portal, listing submission wizard, financial remittances
  - `apps/cms` (Port 3002): Content & marketing management portal
  - `apps/admin` (Port 3003): Operations, listing moderation, platform commission fees, ZATCA e-invoices
- React 18.x - Component library and client state management
- React-DOM 18.x - DOM rendering engine

**Testing:**
- Custom E2E / Integration Suite: Node ESM test runner in `scripts/e2e-finance-test.mjs`
- Design Quality Linter: Custom AST/Regex rule auditor in `scripts/design-audit.mjs`
- Note: Jest/Vitest/Playwright test runners are not currently installed in `package.json`.

**Build/Dev:**
- Tailwind CSS 3.4.1 - Styling system configured via `tailwind.config.ts` per app
- PostCSS 8.x - CSS post-processing (`postcss.config.mjs`)
- ESLint 8.x - Linting with `eslint-config-next` (14.2.35)
- TypeScript 5.x - Static typing (`tsconfig.json`)
- SWC (via Next.js built-in compiler) - High performance JS/TS compilation and minification

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` (^2.118.0) & `@supabase/ssr` (^0.12.7) - Core PostgreSQL client, real-time subscriptions, session handling, and server-side authentication (`apps/guest/src/lib/supabase/`, `apps/host/src/lib/supabase/`, `apps/admin/src/lib/supabase/`).
- `firebase` (^13.1.0) - Client-side Firebase SDK for Saudi phone number OTP verification via Firebase Auth (`apps/guest/src/lib/firebase/client.ts`, `apps/host/src/lib/firebase/client.ts`).
- `framer-motion` (^14.7.1) - Fluid animations, modal transitions, and interactive UI micro-interactions across guest and host portals.
- `lucide-react` (^1.63.0) - Standard icon library strictly enforced across cards, buttons, and navigation (per `IMPECCABLE.md` anti-emoji rules).
- `lenis` (^1.3.27) - Smooth scrolling library integrated in Guest app layout (`apps/guest/src/components/providers/ClientProviders.tsx`).

**Infrastructure & Internal Packages:**
- `@qafnest/shared` (`packages/shared/`) - Internal shared package providing:
  - `packages/shared/platformFee.ts`: Central platform fee and commission calculations
  - `packages/shared/zatcaPhase2.ts`: ZATCA Phase 2 e-invoicing TLV encoding and cryptographic hashing
  - `packages/shared/phone.ts`: Saudi phone number normalization (+966 validation)
  - `packages/shared/design-system.ts`: Shared design tokens, color palette, typography scales
  - `packages/shared/taste.ts`: Quality guidelines and UI taste enforcement

## Configuration

**Environment:**
- Configured using `.env.local` files per app, with `.env.example` templates in root and each app directory:
  - Root: `.env.example`
  - Guest: `apps/guest/.env.example`
  - Host: `apps/host/.env.example`
  - CMS: `apps/cms/.env.example`
  - Admin: `apps/admin/.env.example`
- Key environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Public client access token
  - `SUPABASE_SERVICE_ROLE_KEY`: Privileged backend service role key
  - `NEXT_PUBLIC_FIREBASE_*`: Firebase project configuration for phone authentication
  - `MYFATOORAH_API_KEY`, `MYFATOORAH_BASE_URL`: Payment gateway credentials
  - `ADMIN_SECRET_KEY`: Minimum 32-character HMAC secret for Admin JWT session signing
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Client Google Maps loader
  - `ZATCA_*`: E-invoicing keys and CSID secrets

**Build:**
- Root `package.json` coordinates workspace builds:
  - `npm run dev`: Runs `scripts/dev-all.mjs` concurrently launching ports 3000, 3001, 3002, 3003
  - `npm run build`: Executes `npm run build` in each sub-app
  - `npm run lint`: Executes Next.js lint across all sub-apps
  - `npm run design:audit`: Runs `scripts/design-audit.mjs`
  - `npm run test:e2e`: Runs `scripts/e2e-finance-test.mjs`

## Platform Requirements

**Development:**
- Node.js 20+
- npm 9+
- Ports 3000 (Guest), 3001 (Host), 3002 (CMS), 3003 (Admin) available locally

**Production:**
- Vercel (Independent project deployment for each app: `apps/guest`, `apps/host`, `apps/cms`, `apps/admin`)
- Supabase Cloud (Managed PostgreSQL with Auth, Storage, Edge Functions, and Row Level Security)
- MyFatoorah Live Gateway (Saudi Mada, Apple Pay, Visa/Mastercard payment processing)

---

*Stack analysis: 2026-11-07*
