---
last_mapped_commit: f62f18aee89ccd314b75a485cdfbb35d4af6f397
last_mapped_at: 2026-11-07
---
# Codebase Concerns

**Analysis Date:** 2026-11-07

## Tech Debt

**Next.js Webpack Import Aliasing for Auth Providers:**
- Issue: Redundant Webpack resolution aliases and duplicate `.js` / `.ts` files exist to bridge module resolution quirks.
- Files: `apps/guest/next.config.mjs`, `apps/guest/tsconfig.json`, `apps/guest/src/lib/auth-providers.ts`, `apps/guest/src/providers/auth-providers.ts`.
- Impact: Cluttered configuration and confusion over canonical auth provider import paths.
- Fix approach: Consolidate authentication providers into a single canonical TypeScript file under `apps/guest/src/components/providers/ClientProviders.tsx` and remove redundant Webpack alias hacks.

**In-Memory Financial State & IBAN Caches:**
- Issue: Host custom IBAN overrides and payout records are cached in Node process memory variables (`customHostIbans`, `customSettlementSettings`, `pendingPayoutRequests`) when Supabase tables are unavailable or during rapid prototyping.
- Files: `apps/host/src/lib/services/hostFinancialsService.ts:26-28`.
- Impact: State is lost upon serverless function restarts or container recycling on Vercel.
- Fix approach: Persist all host bank accounts, payout preferences, and remittance batches into dedicated Supabase tables (`host_bank_accounts`, `host_payout_batches`) governed by RLS.

**Tri-Fold Authentication Architecture:**
- Issue: Monorepo uses three distinct authentication paradigms: Supabase Auth for guests, Firebase Auth for Saudi phone OTP verification, and custom HMAC-SHA256 signed cookies for Super Admin.
- Files: `apps/guest/src/lib/supabase/`, `apps/guest/src/lib/firebase/`, `apps/admin/src/lib/adminAuth.ts`, `apps/host/src/lib/auth/serverAuth.ts`.
- Impact: Complex token validation bridges and increased surface area for session validation bugs.
- Fix approach: Unify under Supabase Auth custom claims and RBAC roles once phone OTP providers (Twilio / Unifonic) are configured directly in Supabase.

## Known Bugs

**Local File Promotion Store in Serverless Production:**
- Symptoms: Emergency promotion disable toggles and coupon overrides written to `.qafnest-promotions.json` do not synchronize across distributed serverless instances on Vercel.
- Files: `.qafnest-promotions.json`, `apps/guest/src/lib/services/promotionStore.ts`, `apps/admin/src/lib/promotionStore.ts`.
- Trigger: Multi-instance deployment on Vercel where the local filesystem is read-only or ephemeral.
- Workaround: In local dev, file persistence works across ports. In production, Supabase `coupons` table and platform settings must be the authoritative source.

## Security Considerations

**Hardcoded Secrets in Test Scripts:**
- Risk: Development test runner `scripts/e2e-finance-test.mjs` defines a fallback `ADMIN_SECRET_KEY` ("qafnest_secure_admin_jwt_signature_secret_key_2026").
- Files: `scripts/e2e-finance-test.mjs:8`, `apps/admin/src/lib/adminAuth.ts`.
- Current mitigation: Production code throws an explicit error if `ADMIN_SECRET_KEY` is missing or shorter than 32 characters (`apps/admin/src/lib/adminAuth.ts:9`).
- Recommendations: Ensure `.env.local` in production uses a 256-bit randomly generated cryptographic secret and add `scripts/e2e-finance-test.mjs` to security scanning rules.

**SSRF in Google Maps Short Link Redirection Resolver:**
- Risk: Endpoint accepts arbitrary URLs to resolve Google Maps redirections, which could be abused for Server-Side Request Forgery (SSRF) if not strictly restricted.
- Files: `apps/host/src/app/api/host/geo/resolve-maps-url/route.ts`, `apps/host/src/lib/geo/mapsUrlParser.ts`.
- Current mitigation: Domain regex checks enforce `maps.app.goo.gl` and `goo.gl/maps` domains (`mapsUrlParser.ts:57`).
- Recommendations: Maintain strict domain allowlisting and disable following redirects to non-Google origin hosts.

**Git Remote Origin Credential Warning (From MASTER_PLAN.md):**
- Risk: Historical audit in `MASTER_PLAN.md:43` identified that the Git remote origin previously contained an embedded PAT token.
- Files: `MASTER_PLAN.md`, `.git/config`.
- Current mitigation: Local working tree cleaned; credentials must not be stored in URL format.
- Recommendations: Verify GitHub PAT rotation and enforce credential storage via Git Credential Manager or GitHub CLI (`gh auth login`).

## Performance Bottlenecks

**Concurrent Multi-App Dev Runner Resource Usage:**
- Problem: Running `npm run dev` (`scripts/dev-all.mjs`) spawns four distinct Next.js development instances simultaneously (Ports 3000, 3001, 3002, 3003), consuming 2–4 GB of memory and high CPU.
- Files: `scripts/dev-all.mjs`, `package.json`.
- Cause: Webpack/SWC compilers compiling four independent Next.js applications in watch mode.
- Improvement path: Recommend developers run only the specific app they are modifying (e.g., `npm run dev:guest` or `npm run dev:host`) during targeted development tasks.

## Fragile Areas

**ZATCA Phase 2 Cryptographic Invoicing:**
- Files: `packages/shared/zatcaPhase2.ts`, `apps/admin/src/lib/services/zatcaPhase2Service.ts`.
- Why fragile: ZATCA Phase 2 specifies strict byte-level 9-Tag TLV formatting, canonical XML structures, and preceding invoice hash chaining (`PIH`). Any whitespace deviation or formatting mismatch causes instant rejection by the ZATCA compliance gateway.
- Safe modification: Never alter Tag IDs (1–9) or TLV length calculations without validating against the official ZATCA E-Invoicing Technical Specifications.
- Test coverage: Partially tested in `scripts/e2e-finance-test.mjs`; needs dedicated automated unit test vectors.

**Financial Currency & VAT Rounding:**
- Files: `packages/shared/platformFee.ts`, `apps/guest/src/lib/services/pricing.ts`.
- Why fragile: Saudi VAT is strictly 15%. Mismatches between floating-point rounding on line items and overall totals can trigger reconciliation errors during gateway capture or tax reporting.
- Safe modification: Always use standard 2-decimal SAR rounding (`Math.round(val * 100) / 100`) and ensure the guest checkout page and MyFatoorah payload use the exact same calculation function.
- Test coverage: Tested in `scripts/e2e-finance-test.mjs`.

## Scaling Limits

**Supabase Direct Queries vs. Catalog Caching:**
- Current capacity: Direct PostgreSQL queries via `@supabase/supabase-js`.
- Limit: As guest traffic scales, concurrent search queries across filters, amenities, and dates can exhaust PostgreSQL connection pools.
- Scaling path: Introduce Redis / Upstash caching for approved property catalog search results, or leverage Next.js `revalidateTag` / ISR for property detail pages.

## Dependencies at Risk

**ESLint 8:**
- Risk: ESLint 8 reached End of Life in 2024. Next.js 14 still pairs with ESLint 8 by default, but ESLint 9 flat-config migration will be required when upgrading to Next.js 15.
- Impact: Deprecation warnings during linting.
- Migration plan: Upgrade to Next.js 15 and ESLint 9 during future framework modernization phases.

## Missing Critical Features

**Automated Unit & E2E Testing Framework:**
- Problem: The repository lacks Vitest/Jest for unit tests and Playwright/Cypress for browser UI automation.
- Blocks: Automated regression safety in CI pipelines.

**Automated Host Payout Disbursements (SARIE / Bank Rails):**
- Problem: Host settlements and remittances currently generate audited records and IBAN validation, but actual bank money movement requires manual bank transfer or export.
- Blocks: Fully automated end-to-end instant payouts for property owners.

## Test Coverage Gaps

**Shared Platform Fee Engine:**
- What's not tested: Edge cases in category fee overrides, intro rate duration expiration, and minimum commission floor clamping.
- Files: `packages/shared/platformFee.ts`.
- Risk: Potential commission miscalculations on rare edge-case booking amounts.
- Priority: High.

**ZATCA Phase 2 TLV & XML Generator:**
- What's not tested: Full byte-level validation of ECDSA signatures and canonical UBL 2.1 invoice XML strings against ZATCA sandbox validator.
- Files: `packages/shared/zatcaPhase2.ts`.
- Risk: Compliance failure during official Saudi tax authority clearance.
- Priority: High.

**Google Maps Coordinate Parser:**
- What's not tested: Obscure or newly introduced Google Maps short URL formats and international coordinates outside Saudi borders.
- Files: `apps/host/src/lib/geo/mapsUrlParser.ts`.
- Risk: Location pin placement failure for host listings.
- Priority: Medium.

---

*Concerns audit: 2026-11-07*
