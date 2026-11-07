---
last_mapped_commit: f62f18aee89ccd314b75a485cdfbb35d4af6f397
last_mapped_at: 2026-11-07
---
# Testing Patterns

**Analysis Date:** 2026-11-07

## Test Framework

**Runner:**
- Custom Node.js ESM Test Runner: `scripts/e2e-finance-test.mjs` (orchestrates end-to-end integration assertions against active dev servers across ports 3000, 3001, 3002, and 3003).
- Custom Design System Auditor: `scripts/design-audit.mjs` (scans JSX/TSX for compliance with the 59 Anti-Slop Rules).
- Note: Automated unit test runner libraries (Vitest / Jest) are not yet configured in root `package.json`.

**Assertion Library:**
- Native Node.js `assert` module and custom test harness with formatted terminal reporting.

**Run Commands:**
```bash
npm run test:e2e       # Run comprehensive E2E verification (requires running servers)
npm run design:audit   # Scan codebase for anti-slop design regressions
npm run design:fix     # Automatically fix trivial design rule violations
npm run lint           # Execute Next.js ESLint across all 4 apps
```

## Test File Organization

**Location:**
- E2E Integration Suite: `scripts/e2e-finance-test.mjs`
- Design Quality Suite: `scripts/design-audit.mjs`
- Scratchpad / Verification Tests: `scratch/test_priority7_verification.ts`, `scratch/test_priority8_migrations.ts`

**Naming:**
- Monorepo scripts: `scripts/*.mjs`
- Temporary verification files: `scratch/test_*.ts`

**Structure:**
```text
scripts/
├── e2e-finance-test.mjs   # API, Port Health, Auth, ZATCA, and Finance verification
└── design-audit.mjs      # Design token & typography AST/regex linter
scratch/
├── test_priority7_verification.ts
└── test_priority8_migrations.ts
```

## Test Structure

**Suite Organization (`scripts/e2e-finance-test.mjs`):**
```javascript
async function runE2ETests() {
  let passedCount = 0;
  let failedCount = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`⏳ ${name}... `);
      await fn();
      console.log(`\x1b[32m✔ PASS\x1b[0m`);
      passedCount++;
    } catch (err) {
      console.log(`\x1b[31m✖ FAIL\x1b[0m`);
      console.error(`   Error: ${err.message}`);
      failedCount++;
    }
  }

  // 1. Port Health Checks
  await test("1.1 Dev Server Guest Port 3000 is Healthy", async () => {
    const res = await fetch(`${GUEST_URL}/`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 2. Security & Auth Verification
  // 3. Platform Financial & Commission Calculations
  // 4. ZATCA Phase 2 E-Invoicing Verification
  // 5. Coupons & Promotional Rules
}
```

**Patterns:**
- Pre-flight server discovery: Checks that all micro-frontend ports (3000, 3001, 3002, 3003) are online before initiating tests.
- Dynamic cryptographic token generation: `generateAdminToken()` computes HMAC-SHA256 signatures for simulated Super Admin sessions.

## Mocking

**Framework:**
- In-memory service stubs and local fallback stores:
  - Promotion Store: `.qafnest-promotions.json` accessed via `apps/guest/src/lib/services/promotionStore.ts`
  - Platform Fee Store: `packages/shared/platformFeeStore.ts`
  - Static Listings Fallback: `apps/guest/src/data/properties.ts` used when Supabase is unreachable

**What to Mock:**
- Remote payment gateway calls in development (`MYFATOORAH_IS_TEST=true` with test tokens).
- Google Maps JS Geocoder during non-browser server execution.
- Third-party bank transfer settlement networks.

**What NOT to Mock:**
- ZATCA Phase 2 TLV Base64 encoding and SHA-256 hash chaining (must execute genuine cryptographic operations).
- Platform commission percentage calculations (must compute exact SAR decimal amounts).
- Saudi IBAN format validation and bank code routing.

## Fixtures and Factories

**Test Data:**
- Simulated Dev Host ID: `00000000-0000-0000-0000-000000000002`
- Simulated Admin Email: `admin@qafnest.com`
- Default Test IBAN: `SA4480000418608010049262` (Al Rajhi Bank)
- Sample Properties: `apps/guest/src/data/properties.ts` (Chalets, Villas, Farms in Riyadh, AlUla, and Jeddah)

**Location:**
- Shared constants: `packages/shared/index.ts`
- Static data fixtures: `apps/guest/src/data/`

## Coverage

**Requirements:**
- No automated code coverage thresholds enforced in CI at present.
- Quality gate currently governed by `scripts/design-audit.mjs` (zero error tolerance for the 59 Anti-Slop Rules) and `scripts/e2e-finance-test.mjs` pass rate.

**View Coverage:**
- Currently not configured (requires adding Vitest or Jest with `@vitest/coverage-v8`).

## Test Types

**Unit Tests:**
- Status: Gap. Need dedicated unit test suites for `packages/shared/platformFee.ts`, `packages/shared/zatcaPhase2.ts`, and `apps/host/src/lib/geo/mapsUrlParser.ts`.

**Integration Tests:**
- Status: Active via `scripts/e2e-finance-test.mjs`. Tests interaction between Admin commission fee updates, Guest pricing synchronization, and ZATCA invoice generation.

**E2E Tests:**
- Status: API-level E2E coverage is functional via `scripts/e2e-finance-test.mjs`. Browser UI automated testing (Playwright) is not yet set up.

## Common Patterns

**Async Testing:**
- Promises with async/await and timeouts for HTTP fetch requests:
  ```javascript
  const res = await fetch(`${ADMIN_URL}/api/admin/financials`, {
    headers: { Cookie: `qafnest_admin_session=${adminToken}` },
  });
  assert(res.status === 200);
  ```

**Error Testing:**
- Asserting rejected HTTP status codes when invoking protected endpoints without credentials:
  ```javascript
  const res = await fetch(`${ADMIN_URL}/api/admin/metrics`);
  assert(res.status === 401 || res.status === 403, "Unauthenticated access must be blocked");
  ```

---

*Testing analysis: 2026-11-07*
