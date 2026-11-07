---
last_mapped_commit: f62f18aee89ccd314b75a485cdfbb35d4af6f397
last_mapped_at: 2026-11-07
---
<!-- refreshed: 2026-11-07 -->
# Architecture

**Analysis Date:** 2026-11-07

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client Presentation Layer                         │
├───────────────────┬───────────────────┬───────────────────┬─────────────────┤
│    Guest App      │     Host App      │     Admin App     │     CMS App     │
│   (Port 3000)     │   (Port 3001)     │   (Port 3003)     │   (Port 3002)   │
│  `apps/guest/`    │   `apps/host/`    │   `apps/admin/`   │   `apps/cms/`   │
└─────────┬─────────┴─────────┬─────────┴─────────┬─────────┴────────┬────────┘
          │                   │                   │                  │
          ▼                   ▼                   ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Next.js App Router & API Route Handlers                 │
│  `apps/*/src/app/api/` (Checkout, Webhooks, Moderation, Financials, Geo)    │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Universal Shared Domain Logic Engine                   │
│  `packages/shared/` (PlatformFee, ZATCA Phase 2, Phone, Design System)      │
│  `apps/*/src/lib/services/` (Pricing, Coupons, Smart Lock PINs, Geocoding)   │
└───────────────────┬─────────────────────────────────────┬───────────────────┘
                    │                                     │
                    ▼                                     ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────┐
│        Supabase PostgreSQL & RLS      │ │     External Third-Party APIs     │
│  `supabase/migrations/`               │ │  - MyFatoorah (Payments)          │
│  - Properties, Bookings, Profiles     │ │  - Google Maps (Geocoding)        │
│  - Coupons, Reviews, ZATCA Invoices   │ │  - Firebase Auth (Phone OTP)      │
└───────────────────────────────────────┘ └───────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Dynamic Pricing Engine | Calculates stay cost, platform service fee, coupon deductions, and ZATCA 15% VAT | `apps/guest/src/lib/services/pricing.ts` |
| Authoritative Coupon Service | Validates discount codes across DB, shared promotion store, and in-memory catalog | `apps/guest/src/lib/services/couponService.ts` |
| MyFatoorah Payment Gateway | Interfaces with MyFatoorah API for checkout initiation, webhooks, and payment status | `apps/guest/src/lib/services/myfatoorah.ts` |
| Smart Lock PIN Engine | Generates cryptographically secure, non-sequential keypad passcodes for bookings | `apps/guest/src/lib/services/smartLockPinService.ts` |
| Universal Platform Fee Engine | Computes host commissions, net payouts, category fee overrides, and VAT deductions | `packages/shared/platformFee.ts` |
| ZATCA Phase 2 Engine | Generates 9-Tag TLV Base64 QR code, UBL 2.1 XML, SHA-256 invoice hashes, and signatures | `packages/shared/zatcaPhase2.ts` |
| Host Geo & Maps Parser | Resolves Google Maps links, geocodes addresses, and extracts coordinate pins | `apps/host/src/lib/geo/mapsUrlParser.ts` |
| Host Financials Service | Manages host payout records, IBAN validation, settlement summaries, and remittances | `apps/host/src/lib/services/hostFinancialsService.ts` |
| Admin Auth & Session | Issues and cryptographically verifies HMAC-SHA256 signed session cookies for Super Admin | `apps/admin/src/lib/adminAuth.ts` |
| Supabase Multi-Client Bridge | Provides typed browser, server, and service-role database client instances | `apps/guest/src/lib/supabase/` |

## Pattern Overview

**Overall:** Monorepo Multi-App Architecture (Micro-Frontends) with Shared Domain Core and Backend-as-a-Service (Supabase PostgreSQL + RLS).

**Key Characteristics:**
- Separation of Concerns: Distinct Next.js applications for distinct actor personas (Guest, Host, Admin, CMS) running on dedicated ports in local dev (3000, 3001, 3003, 3002).
- Zero-Trust Backend Verification: Server-side validation of JWTs, RBAC roles, and object ownership before database mutations (per `SECURITY_MASTER_PLAN.md`).
- Offline-Resilient Domain Calculations: Core calculations (pricing, commission deductions, ZATCA Phase 2 TLV serialization, phone normalization) exist in pure, testable TypeScript modules without external network dependencies (`packages/shared/`).

## Layers

**Presentation Layer:**
- Purpose: Render accessible, localized (Arabic RTL & English LTR) interfaces conforming to `IMPECCABLE.md`.
- Location: `apps/*/src/app/`, `apps/*/src/components/`
- Contains: React Server & Client Components, interactive search modals, date-range pickers, review cards, admin tables.
- Depends on: Context providers, UI hooks, `@qafnest/shared`.
- Used by: End users in web browsers.

**Route & Controller Layer:**
- Purpose: Handle HTTP requests, authenticate callers, validate payloads, and coordinate mutations.
- Location: `apps/*/src/app/api/`
- Contains: Next.js Route Handlers (`route.ts`).
- Depends on: Domain service layer, Supabase clients.
- Used by: Frontend clients and external webhook callers (MyFatoorah).

**Domain & Service Layer:**
- Purpose: Encapsulate core business rules, financial formulas, and security logic.
- Location: `packages/shared/`, `apps/*/src/lib/services/`
- Contains: Pricing calculators, coupon validation, ZATCA crypto, banking/IBAN rules, smart lock generator.
- Depends on: Standard Node crypto and pure utilities.
- Used by: Route handlers and Server Components.

**Data Access Layer:**
- Purpose: Direct communication with PostgreSQL tables and storage buckets with Row Level Security.
- Location: `apps/*/src/lib/supabase/`, `supabase/migrations/`
- Contains: Typed Supabase clients, database schema definitions, RLS policies.
- Depends on: `@supabase/supabase-js`, PostgreSQL.
- Used by: Server route handlers and service functions.

## Data Flow

### Primary Request Path: Guest Checkout & Instant Booking

1. Guest selects property dates and applies coupon on property page (`apps/guest/src/app/property/[id]/reserve/page.tsx:40`).
2. Pricing calculated authoritatively on server (`apps/guest/src/lib/services/pricing.ts:120`).
3. Checkout request sent to `/api/payments/checkout` (`apps/guest/src/app/api/payments/checkout/route.ts:50`).
4. Server invokes MyFatoorah `ExecutePayment` to generate payment gateway URL (`apps/guest/src/lib/services/myfatoorah.ts:110`).
5. Guest completes 3D-Secure payment via Mada/Apple Pay and is redirected to callback handler (`apps/guest/src/app/api/payments/myfatoorah/callback/route.ts:25`).
6. MyFatoorah webhook triggers asynchronous verification (`apps/guest/src/app/api/payments/myfatoorah/webhook/route.ts:30`).
7. Booking status transitions to `confirmed`; smart lock PIN generated (`apps/guest/src/lib/services/smartLockPinService.ts:45`).
8. ZATCA Phase 2 Simplified Tax Invoice created with TLV QR code (`packages/shared/zatcaPhase2.ts:140`).

### Secondary Flow: Host Listing Creation & Admin Moderation

1. Host inputs property specifications, amenities, and location via Google Maps in `apps/host/src/app/properties/new/page.tsx`.
2. Coordinates parsed and verified in `apps/host/src/lib/geo/mapsUrlParser.ts`.
3. Listing draft submitted to `properties` table with `status = 'pending'`.
4. Super Admin inspects pending listing in `apps/admin/src/app/page.tsx`.
5. Admin clicks Approve/Reject which calls `/api/admin/properties` (`apps/admin/src/app/api/admin/properties/route.ts`).
6. Listing is published into active catalog and becomes visible to guests (`apps/guest/src/app/page.tsx`).

**State Management:**
- Client State: React `useState`, `useReducer`, and Context (`AppContext.tsx`, `AuthContext.tsx`).
- Server Session State: HTTP-only cookies (`sb-*` for Supabase, `qafnest_admin_session` for Admin).
- Database State: PostgreSQL authoritative records governed by RLS.

## Key Abstractions

**Authoritative Pricing Breakdown (`PricingBreakdown`):**
- Purpose: Immutable representation of reservation financial breakdown (base rate, nights, service fee, VAT, discounts, total).
- Examples: `apps/guest/src/lib/services/pricing.ts`, `apps/guest/src/components/property/PricingBreakdownModule.tsx`.
- Pattern: Value Object / Pure Functional Calculation.

**Platform Fee Config (`PlatformFeeConfig`):**
- Purpose: Configurable commission rates, category overrides, and new-host introductory rules.
- Examples: `packages/shared/platformFee.ts`, `packages/shared/data/platform-fee-config.json`.
- Pattern: Strategy & In-Memory Config Store with File Fallback.

**ZATCA Phase 2 Invoice Generator (`ZatcaPhase2InvoiceData`):**
- Purpose: Enforces Saudi Tax Authority Phase 2 standard (9-tag TLV, UBL XML, SHA-256 chaining).
- Examples: `packages/shared/zatcaPhase2.ts`, `apps/admin/src/lib/services/zatcaPhase2Service.ts`.
- Pattern: Builder / Cryptographic Serialization Pipeline.

## Entry Points

**Guest Portal (`apps/guest`):**
- Location: `apps/guest/src/app/page.tsx`
- Triggers: Browser request to `http://localhost:3000/` or production root.
- Responsibilities: Render hero search, curated property categories, recently viewed stays, and verified reviews.

**Host Business Portal (`apps/host`):**
- Location: `apps/host/src/app/page.tsx`
- Triggers: Browser request to `http://localhost:3001/`.
- Responsibilities: Render host dashboard, booking metrics, listing wizard, calendar, and payout settings.

**Admin Operations Portal (`apps/admin`):**
- Location: `apps/admin/src/app/page.tsx`
- Triggers: Browser request to `http://localhost:3003/`.
- Responsibilities: Display property approval queues, platform commission sliders, coupon toggles, and ZATCA compliance logs.

**CMS Portal (`apps/cms`):**
- Location: `apps/cms/src/app/page.tsx`
- Triggers: Browser request to `http://localhost:3002/`.
- Responsibilities: Manage editorial content, blog articles, and SEO metadata.

## Architectural Constraints

- **Multi-Tenant Authentication Separation:** Admin and Host authentication MUST remain isolated from standard Guest session contexts to prevent privilege escalation.
- **Financial Immutability:** Booking financial records must never be calculated on the client side; all amounts, fees, and VAT must be recomputed authoritatively by server route handlers.
- **Bilingual Layout & RTL Support:** All components must optically support both Arabic (RTL) and English (LTR) with appropriate font baseline alignments.
- **ZATCA Cryptographic Chaining:** Each ZATCA tax invoice must reference the hash of the preceding invoice (`PIH`), requiring sequential invoice counter value (`ICV`) tracking.

## Anti-Patterns

### Trusting Client-Supplied Price or Discount Amounts
**What happens:** Client sends `totalPrice: 100` or `discount: 500` in the POST body to checkout.
**Why it's wrong:** Attackers can intercept or modify the JSON payload in DevTools and complete bookings for 0 SAR.
**Do this instead:** Client sends only `propertyId`, `checkIn`, `checkOut`, and optional `couponCode`. The server fetches property rates from Supabase, validates dates against availability records, and calculates totals authoritatively in `apps/guest/src/lib/services/pricing.ts`.

### Relying solely on UI Conditional Rendering for Access Control
**What happens:** Rendering an Admin button only if `user.role === 'admin'`, but leaving the underlying API route unprotected.
**Why it's wrong:** Attackers can invoke `POST /api/admin/...` directly using curl or Postman.
**Do this instead:** Validate session cookies and user roles inside every server route handler via `apps/admin/src/lib/adminAuth.ts` or `apps/host/src/lib/auth/serverAuth.ts`.

## Error Handling

**Strategy:** Structured error responses with HTTP status codes, machine-readable error codes (`error: "invalid_iban"`), and user-friendly bilingual descriptions (`messageEn`, `messageAr`).

**Patterns:**
- Try/catch blocks around database queries and third-party API invocations.
- Fallback degradation: When Supabase is unreachable in local dev, graceful fallback to static fixtures with explicit console warnings (`apps/guest/src/lib/services/properties.ts`).

## Cross-Cutting Concerns

**Logging:** Standardized console logging with ISO timestamps and event tags `[CHECKOUT]`, `[WEBHOOK]`, `[FINANCIALS]`.
**Validation:** Regex validation for Saudi IBANs (`SA\d{22}`), Saudi phone numbers (`+9665...`), and ISO-8601 date strings.
**Authentication:** Layered defense with Next.js edge middleware checking sessions before route dispatch, followed by cryptographically verified server-side identity checks.

---

*Architecture analysis: 2026-11-07*
