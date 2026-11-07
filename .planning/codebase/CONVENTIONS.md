---
last_mapped_commit: f62f18aee89ccd314b75a485cdfbb35d4af6f397
last_mapped_at: 2026-11-07
---
# Coding Conventions

**Analysis Date:** 2026-11-07

## Naming Patterns

**Files:**
- React Components: PascalCase (`PropertyCard.tsx`, `GuestReviewsPanel.tsx`, `PricingBreakdownModule.tsx`).
- Services & Helper Modules: camelCase (`pricing.ts`, `couponService.ts`, `smartLockPinService.ts`, `mapsUrlParser.ts`).
- Route Handlers & Next.js Files: lowercase standard (`page.tsx`, `layout.tsx`, `route.ts`, `middleware.ts`).
- Configuration Files: kebab-case with standard extensions (`tailwind.config.ts`, `next.config.mjs`, `postcss.config.mjs`).

**Functions:**
- camelCase for all standard functions and methods (`calculatePlatformFee`, `validateAuthoritativeCoupon`, `verifyFirebaseIdToken`, `detectSaudiBank`, `generateSecurePin`).
- Descriptive verb-noun structure (`getPlatformFeeConfig`, `executePayment`, `normalizeSaudiPhone`, `reverseGeocodePin`).
- Boolean predicates prefixed with `is`, `has`, or `can` (`isValidLatLng`, `isShortGoogleMapsUrl`, `isRepeatedDigits`).

**Variables:**
- camelCase for local variables and object properties (`grossAmount`, `discountAmount`, `taxableAmount`, `customerMobile`).
- UPPER_SNAKE_CASE for global constants, configuration defaults, and enums (`VAT_RATE`, `DEFAULT_FEE_CONFIG`, `SAUDI_BANKS`, `ACTIVE_COUPONS`, `ADMIN_COOKIE_NAME`).

**Types & Interfaces:**
- PascalCase for all interfaces, type aliases, and enums (`PlatformFeeConfig`, `ZatcaPhase2InvoiceData`, `CouponDefinition`, `MyFatoorahTransaction`, `VerifiedHostUser`).
- Props interfaces suffixed with `Props` (`PropertyCardProps`, `FilterModalProps`).

## Code Style

**Formatting:**
- Indentation: 2 spaces.
- Semicolons: Required.
- Quotes: Double quotes or single quotes with consistent formatting per module.
- Trailing commas: Multiline ES5 standard.

**Linting:**
- Tool: ESLint with `eslint-config-next` (14.2.35).
- TypeScript: Strict compiler options enabled in `tsconfig.json`:
  - `"strict": true`
  - `"noEmit": true`
  - `"skipLibCheck": true`
  - `"isolatedModules": true`

**Design System & Anti-Slop Guidelines (`IMPECCABLE.md`):**
- Strict compliance with the 59 Anti-Slop Rules enforced via `scripts/design-audit.mjs`:
  - **No Gradient Headline Slop:** Never use purple-to-cyan text gradients for titles; use crisp solid white (`#FFFFFF`) with brand accents.
  - **No Raw Emoji Icons:** Use Lucide React icons with uniform `strokeWidth={1.75}` instead of emojis (🚀, 🏖️, 💎).
  - **Touch Targets:** Every interactive element must be at least 44 × 44 pixels (`min-h-[44px] min-w-[44px]`).
  - **Focus States:** Never write `outline-none` without an immediate `focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2`.
  - **Financial Currency Formatting:** All amounts in Saudi Riyals (SAR) must use tabular numbers (`tabular-nums` or `font-mono`) to prevent visual layout shifts.
  - **Bilingual Baselines:** Arabic and English typography must optically share the same vertical baseline with adequate `line-height` for Arabic ascenders.

## Import Organization

**Order:**
1. Node.js built-ins with `node:` protocol prefix (`import crypto from "node:crypto"`, `import path from "node:path"`).
2. React & core framework libraries (`import React, { useState, useEffect } from "react"`, `import Link from "next/link"`).
3. External UI & utility libraries (`import { motion } from "framer-motion"`, `import { ShieldCheck, MapPin } from "lucide-react"`).
4. Monorepo shared package (`import { calculatePlatformFee, SAUDI_CITIES } from "@qafnest/shared"`).
5. Internal absolute path aliases (`import { createClient } from "@/lib/supabase/client"`, `import { Button } from "@/components/ui/button"`).
6. Local relative imports (`import { ChildComponent } from "./ChildComponent"`).

**Path Aliases:**
Configured in `tsconfig.json`:
- `@/*` → `./src/*`
- Packages linked via npm workspaces (`@qafnest/shared` resolves directly to `packages/shared/index.ts`).

## Error Handling

**Patterns:**
- Route Handlers return standardized JSON error objects:
  ```typescript
  return NextResponse.json(
    {
      success: false,
      error: "invalid_credentials",
      messageEn: "The mobile number or password provided is incorrect.",
      messageAr: "رقم الجوال أو كلمة المرور غير صحيحة.",
    },
    { status: 401 }
  );
  ```
- Catch blocks must log errors with contextual metadata and avoid leaking raw stack traces to end users.
- Network and DB operations implement fallback degradation in local dev when Supabase is not reachable.

## Logging

**Framework:**
- Structured `console.log` / `console.error` with bracketed category tags (`[CHECKOUT]`, `[WEBHOOK]`, `[ZATCA]`, `[HOST_FINANCIALS]`).

**Patterns:**
- Always sanitize sensitive parameters before logging (never log plain passwords, full payment card numbers, or raw ZATCA private keys).
- In development runners (`scripts/dev-all.mjs`, `scripts/e2e-finance-test.mjs`), colored terminal output is used for test verdicts (`\x1b[32m✔ PASS\x1b[0m`, `\x1b[31m✖ FAIL\x1b[0m`).

## Comments

**When to Comment:**
- Critical financial calculations (e.g. ZATCA VAT, host commission tiers, IBAN validation).
- Cryptographic serialization and hashing logic (e.g. 9-tag TLV encoding in `packages/shared/zatcaPhase2.ts`).
- Architectural rationale (e.g. why fallback memory stores are used when DB is disconnected).

**JSDoc/TSDoc:**
- Used on public utility and service exports:
  ```typescript
  /**
   * Calculates platform fee, commission, and ZATCA VAT deductions.
   * @param grossAmount Gross booking total in SAR
   * @param customConfig Optional override configuration
   * @param category Optional property category
   */
  ```

## Function Design

**Size:**
- Single responsibility. Large multi-step flows (like reservation checkout) are broken down into discrete helpers (`validateCoupon`, `calculatePricing`, `createPaymentInvoice`).

**Parameters:**
- Functions with more than 3 arguments use a typed options parameter object (`ExecutePaymentInput`, `AuthoritativeCouponParams`).

**Return Values:**
- Explicit return types on public domain APIs.
- Results often include boolean success flag alongside detailed error or payload (`{ valid: boolean; errorEn?: string; errorAr?: string }`).

## Module Design

**Exports:**
- Named exports preferred over default exports for services, helpers, and utilities.
- Default exports used for Next.js App Router route segments (`export default function Page() { ... }`).

**Barrel Files:**
- `packages/shared/index.ts` acts as the primary barrel export for common utilities, design system tokens, and regulatory engines.

---

*Convention analysis: 2026-11-07*
