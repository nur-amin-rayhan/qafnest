---
last_mapped_commit: f62f18aee89ccd314b75a485cdfbb35d4af6f397
last_mapped_at: 2026-11-07
---
# External Integrations

**Analysis Date:** 2026-11-07

## APIs & External Services

**Payments & Financial Processing:**
- MyFatoorah Payment Gateway v2
  - Purpose: Processes all guest rental payments in Saudi Riyals (SAR), supporting Mada, Visa/Mastercard, Apple Pay, and KNET.
  - SDK/Client: Direct REST integration in `apps/guest/src/lib/services/myfatoorah.ts`.
  - Auth / Config: `MYFATOORAH_API_KEY`, `MYFATOORAH_BASE_URL`, `MYFATOORAH_CALLBACK_URL`, `MYFATOORAH_ERROR_URL`, `MYFATOORAH_IS_TEST`.
  - Endpoints:
    - Checkout Initiation: `apps/guest/src/app/api/payments/checkout/route.ts`
    - Gateway Return Callback: `apps/guest/src/app/api/payments/myfatoorah/callback/route.ts`
    - Asynchronous Webhook: `apps/guest/src/app/api/payments/myfatoorah/webhook/route.ts`
    - Abandonment Recovery: `apps/guest/src/app/api/payments/checkout/abandon/route.ts`

**Location & Geocoding:**
- Google Maps Platform (JavaScript API & Geocoding REST API)
  - Purpose: Forward and reverse geocoding of Saudi property locations, interactive map pins, and Google Maps URL parsing.
  - Client Implementation:
    - Dynamic JS Loader: `apps/host/src/lib/geo/googleMapsLoader.ts`
    - Hybrid Geocoder: `apps/host/src/lib/geo/googleGeocoder.ts`
    - URL & Coordinates Parser: `apps/host/src/lib/geo/mapsUrlParser.ts`
    - Server URL Redirect Resolver: `apps/host/src/app/api/host/geo/resolve-maps-url/route.ts`
  - Auth: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**Tax & Regulatory Compliance:**
- ZATCA Phase 2 E-Invoicing Engine (Zakat, Tax and Customs Authority - Saudi Arabia)
  - Purpose: Mandatory B2C and B2B electronic tax invoice generation with 9-Tag TLV Base64 QR code encoding, SHA-256 cryptographic invoice hashing, and ECDSA digital signatures.
  - Implementation:
    - Core Cryptographic Engine: `packages/shared/zatcaPhase2.ts`
    - Phase 1 & Simplified Invoicing: `packages/shared/zatca.ts`
    - Admin Invoice Management: `apps/admin/src/lib/services/zatcaPhase2Service.ts`
    - Admin ZATCA API Route: `apps/admin/src/app/api/admin/zatca/route.ts`
  - Auth / Config: `ZATCA_API_URL`, `ZATCA_CSID_TOKEN`, `ZATCA_CSID_SECRET`, `ZATCA_PRIVATE_KEY`

**IoT Smart Lock Integration:**
- Smart Lock Keypad PIN Generation Service
  - Purpose: Cryptographically secure 4-to-6 digit non-sequential, non-repeating access code generation for confirmed bookings.
  - Implementation: `apps/guest/src/lib/services/smartLockPinService.ts`, `apps/guest/src/app/api/bookings/[ref]/pin/route.ts`.

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Client Libraries: `@supabase/supabase-js`, `@supabase/ssr`
  - Architecture: Multi-client setup:
    - Browser Client: `apps/guest/src/lib/supabase/client.ts`, `apps/host/src/lib/supabase/client.ts`, `apps/admin/src/lib/supabase/client.ts`
    - Server Client: `apps/guest/src/lib/supabase/server.ts`, `apps/host/src/lib/supabase/server.ts`, `apps/admin/src/lib/supabase/server.ts`
    - Privileged Service Role Client: `apps/guest/src/lib/supabase/service.ts`, `apps/host/src/lib/supabase/service.ts`
  - Key Tables: `properties`, `bookings`, `profiles`, `reviews`, `coupons`, `zatca_invoices`, `host_payouts`, `property_availability`
  - Security: Row Level Security (RLS) policies configured in `supabase/schema.sql` and `supabase/migrations/`.

**File Storage:**
- Supabase Storage Buckets
  - Buckets: `property-images` (public), `host-documents` (private KYC/licenses), `avatars` (public)
  - Upload Bridge: `apps/host/src/lib/storage/uploadBridge.ts`, `apps/host/src/app/api/host/upload/route.ts`

**Local & In-Memory Stores:**
- File-Based Promotion Store: `.qafnest-promotions.json` in project root (provides persistent emergency toggle and coupon state across dev instances via `apps/guest/src/lib/services/promotionStore.ts` and `apps/admin/src/lib/promotionStore.ts`).
- In-Memory Platform Fee Store: `packages/shared/platformFeeStore.ts` and `packages/shared/data/platform-fee-config.json` (synchronizes platform commission rules across ports).

## Authentication & Identity

**Auth Providers:**
- Dual-Provider Hybrid Identity:
  1. Supabase Auth:
     - Handles email magic links, standard user accounts, and session cookies via `@supabase/ssr`.
     - Middleware session refresh: `apps/guest/src/middleware.ts`, `apps/host/src/middleware.ts`.
  2. Firebase Authentication:
     - Handles Saudi phone number (+966) SMS OTP verification.
     - Client configuration: `apps/guest/src/lib/firebase/client.ts`, `apps/host/src/lib/firebase/client.ts`.
  3. Server-Side Firebase Token Verifier:
     - Custom cryptographic verification in `apps/host/src/lib/auth/serverAuth.ts` validating Firebase JWTs against Google public x509 certs without requiring heavy `firebase-admin` dependencies.
  4. Super Admin Session Auth:
     - Cryptographic HMAC-SHA256 signed session cookie (`qafnest_admin_session`) validated against `ADMIN_SECRET_KEY` in `apps/admin/src/lib/adminAuth.ts` and `apps/cms/src/lib/adminAuth.ts`.

## Monitoring & Observability

**Error Tracking:**
- Structured error logging with error codes and descriptive bilingual messages (`messageEn`, `messageAr`).
- No external APM agent (e.g. Sentry/Datadog) currently bundled in `package.json`.

**Logs:**
- Console logger standard across Next.js API route handlers with sanitized audit summaries (no raw credentials or full PAN card numbers).

## CI/CD & Deployment

**Hosting:**
- Vercel (Independent project deployment for each micro-app):
  - `apps/guest` → `qafnest.com` (or preview domain)
  - `apps/host` → `business.qafnest.com`
  - `apps/admin` → `admin.qafnest.com`
  - `apps/cms` → `cms.qafnest.com`

**CI Pipeline:**
- GitHub Actions configured in `.github/workflows/` (standard linting and build checks).

## Environment Configuration

**Required Environment Variables:**
- Core Database:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Firebase Auth:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
- Payments (MyFatoorah):
  - `MYFATOORAH_API_KEY`
  - `MYFATOORAH_BASE_URL`
  - `MYFATOORAH_CALLBACK_URL`
  - `MYFATOORAH_ERROR_URL`
- Admin Security:
  - `ADMIN_SECRET_KEY` (minimum 32 characters)
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
- Maps:
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- ZATCA E-Invoicing:
  - `ZATCA_API_URL`
  - `ZATCA_CSID_TOKEN`
  - `ZATCA_CSID_SECRET`
  - `ZATCA_PRIVATE_KEY`

**Secrets Location:**
- Local development: `.env.local` files inside each app directory (never committed to git).
- Production: Vercel Project Environment Variables and Supabase Vault.

## Webhooks & Callbacks

**Incoming:**
- `/api/payments/myfatoorah/webhook` (`apps/guest/src/app/api/payments/myfatoorah/webhook/route.ts`): Receives asynchronous payment event notifications from MyFatoorah, updates booking status to `confirmed`, and provisions smart lock PINs.
- `/api/payments/myfatoorah/callback` (`apps/guest/src/app/api/payments/myfatoorah/callback/route.ts`): Handles user browser return from MyFatoorah hosted payment page.
- `/api/payments/checkout/abandon` (`apps/guest/src/app/api/payments/checkout/abandon/route.ts`): Records abandoned checkout telemetry.

**Outgoing:**
- MyFatoorah `/v2/ExecutePayment`: Generates hosted invoice URL for guest checkout.
- MyFatoorah `/v2/GetPaymentStatus`: Verifies payment authorization and capture status.
- Google Maps Geocoding API: Forward and reverse geocoding requests.

---

*Integration audit: 2026-11-07*
