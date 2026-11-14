# QafNest Host Business Platform — Audit and Delivery Plan

**Audit date:** 2026-11-01
**Purpose:** establish team and platform connections first, then deliver the Host Business Platform in small, reviewable steps.
**Scope:** this is a roadmap, not a claim that the host/CMS features are production-ready.

**Execution status (2026-11-01): Phase 0 is in progress.** Local repo preparation is complete: monorepo README, app-specific local base URLs, and GitHub task/PR templates are in place. Vercel/Supabase/team access and product-owner decisions still need account access or named owners. Per the user's direction, custom-domain/DNS connection is deferred until the build and Preview are accepted; use Vercel's generated Preview URL during development.

## 1. Executive summary

The repository contains a three-app monorepo scaffold (`apps/guest`, `apps/host`, `apps/cms`) with Supabase client helpers and a small `packages/shared` package. The Host Business Platform has not started as a real, connected product: the Host and CMS screens are prototypes with hardcoded examples and local-only actions, and there is no secure host-to-admin-to-guest workflow. Treat product delivery as new work while reusing this scaffold. Create a separate Vercel project for `apps/host`; a new Git repository is not required. Use the Vercel-issued project URL for the first preview, then attach a domain QafNest controls. Validate whether the requested `business.qafnest.vercel.app` can be assigned; Vercel-generated `.vercel.app` URLs are project-name based and first-come, so an owned custom domain such as `business.qafnest.com` may be needed for that exact branded subdomain. [Vercel domain behavior](https://vercel.com/docs/domains/working-with-domains)

The first product milestone should be one complete, secure vertical slice:

> A host signs in, creates and submits a listing; an authorized admin reviews it; approval publishes it to the guest catalog; the host can see the listing status.

Build the minimum admin review queue alongside this flow. Do not build a full analytics dashboard, payout system, or content CMS before the data model, access rules, and listing workflow exist.

## 2. Current repository audit

### In place

- Monorepo with Guest (`apps/guest`, port 3000), Host (`apps/host`, port 3001), and CMS (`apps/cms`, port 3002) Next.js apps.
- Root scripts start/build/lint the apps; local environment templates exist.
- Supabase browser/server client helpers are scaffolded in each app.
- `packages/shared` currently has common categories, cities, and local app URLs.
- Guest schema includes profiles, approved guest-facing `properties`, availability, bookings, and reviews.
- Guest property service reads approved rows from Supabase and falls back to bundled static listings.

### Blocking gaps found

1. **No Host or staff identity/authorization model.** The Guest `AuthContext` maps users to `guest`/`admin`; it has no host membership model. Host and CMS screens do not have login pages, server route protection, or verified role checks. Supabase helpers exist, but helpers alone do not protect a route.
2. **No host-owned listing model or ownership policy.** The database has no `hosts`, `host_memberships`, `host_listings`, or private verification tables. Guest `properties` is documented as an approved, read-only catalog, but the Host screen queries and attempts to insert directly into it.
3. **Listing submission reports success even when persistence fails.** `apps/host/src/app/page.tsx` catches insert errors, updates local UI state, and displays “submitted successfully” anyway. The current guest schema has no `status` or host owner column for the workflow the UI claims to provide.
4. **Approval is not real.** `apps/cms/src/app/page.tsx` loads from `properties`, then approve/reject changes only React state. It does not persist a decision, require a staff role, record an audit event, or publish/unpublish a listing.
5. **Prototype data can be mistaken for real data.** Host and CMS pages include demo property/host records, guest contact details, lock PINs, a bank IBAN, revenue/booking metrics, and defaults. These must be labelled as fixtures and removed from production paths before launch. Never use demo guest details or PINs as real booking data.
6. **Calendar and payout controls are local-only.** Blocked dates, weekend prices, IBAN changes, and “saved/verified” indicators are component state, not persisted or verified. The 30-day calendar is illustrative, not a date-aware inventory model.
7. **Host data access is not scoped.** Host code selects `*` from `properties` and `bookings` without a host/property ownership filter. Current guest RLS does not give hosts their own booking access. Do not loosen guest RLS to make this UI work; add a correct ownership model and host-specific policies.
8. **Image upload and KYC flow do not exist.** The listing form uses a URL/default image; there is no upload workflow, private document storage, verification status, or retention/access policy.
9. **CMS is much broader than the first release needs.** Global bookings, finance, reviews, blog, payout, and VAT tabs are mostly placeholders. Admin approval and a reasoned decision history are the only CMS capabilities needed for the initial listing pilot.
10. **Integration configuration needs one source of truth.** Host/CMS example configs use the guest local URL as `NEXT_PUBLIC_SITE_URL`; local URLs are hardcoded in app switchers; host domain spelling differs between the Guest UI and the roadmap. Select canonical local/preview/production URLs and set them per app.
11. **Shared package and developer workflow are incomplete.** Shared code is limited to types/constants; app configs and UI are duplicated. The repo has no visible `.github` CI workflow, issue templates, CODEOWNERS, or agreed PR/review workflow. `README.md` is still the default Next.js starter README.
12. **Credential hygiene must be fixed before team access is widened.** The repository’s `origin` remote URL contains an embedded GitHub credential. Treat it as exposed: the owner should revoke/rotate it in GitHub, then configure a clean remote using GitHub CLI/OS credential storage. Do not put token values in remote URLs, source files, chat, or `.env` files. [GitHub token management](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) · [GitHub CLI credential storage](https://cli.github.com/manual/gh_auth_login)

## 3. Minimum scope for a first real host pilot

### Host-facing

- Sign in with the same canonical identity provider used by the Guest Platform, with a host role/membership added to the account.
- Create and edit a draft listing; save partial progress; submit it for review.
- Enter location, category, capacity, bedrooms/bathrooms, amenities, check-in/out times, house rules, license reference, and base price.
- Upload listing photos to a controlled bucket; upload verification documents to a separate private bucket.
- See the listing lifecycle and admin feedback: Draft → Submitted → Changes requested → Approved/Published or Rejected/Suspended.
- See only the host’s own listings and, in the next release gate, bookings for those listings.

### Admin-facing

- Staff-only login and authorization.
- Queue of submitted listings with host, listing, and verification status.
- Approve, reject, or request changes with a required reason and reviewer/time audit record.
- Approval publishes a stable listing ID to the Guest Platform catalog; rejection/suspension removes it from public availability.

### Guest-facing integration

- Guest site reads only approved/published listings and public listing media.
- Host drafts and private documents are never exposed through the guest catalog.
- Guest booking/payment status remains controlled by the trusted booking/payment server flow.
- Do not show a smart-lock PIN unless the booking is paid/confirmed and the allowed disclosure time has arrived.

### Explicitly defer until after the listing pilot

- Automated bank payouts, storing payout IBANs, payout reconciliation, and tax/accounting reports.
- Smart-lock provider integrations and automated PIN generation.
- Full blog/content CMS, promotional campaign tools, complex revenue analytics, and multi-property enterprise reporting.
- Cross-subdomain single sign-on. Shared Supabase users do not automatically mean both browser apps share a session; design SSO only if it is a real requirement.

## 4. Architecture decisions to lock before implementation

1. **Separate apps, common backend per environment.** Keep Guest, Host, and Admin as separate deployable apps. Start with a development Supabase project shared by all three and a separate production Supabase project shared by all three production deployments. This avoids cross-database synchronization for the first release while keeping test data away from production.
2. **One canonical auth provider.** Choose Supabase Auth for all apps, or document a secure Firebase-to-Supabase identity bridge before adding host roles. The current Guest code includes Firebase phone auth and Supabase sessions, so do not introduce another unrelated host identity system. Supabase SSR uses cookie-based sessions for server-rendered apps. [Supabase SSR Auth](https://supabase.com/docs/guides/auth/server-side)
3. **Host data is canonical; Guest catalog is public projection.** Add host-owned draft entities. On approval, a trusted server action/database function publishes the corresponding stable UUID and public fields into the Guest `properties` catalog. Keep the public catalog separate from KYC documents and draft data.
4. **Role and tenant model.** A person may be a guest and a host. Use `host_memberships` (user, host/business, role) rather than making the whole account a single host role. Staff permissions must be separate from host permissions.
5. **RLS is the authorization boundary.** Use owner/membership policies for host rows; staff-only policies for moderation; public read for published catalog only. Do not trust hidden buttons or client-side role state. Supabase RLS applies row-level permissions to database requests. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
6. **Separate media privacy classes.** Public property photos can be public after review. License/identity/bank documents remain private and accessible only to the host and explicitly authorized staff through short-lived access. Storage policies can enforce upload/read rules. [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
7. **Stable integration contract.** Define exact listing fields, status names, owner IDs, and publish behavior in shared types/schema before app work. Database migrations—not dashboard-only edits—are the source of truth.

Suggested new tables (names can be finalized in the schema review):

- `hosts` / `host_memberships`
- `host_verifications` (private/non-public fields only)
- `host_listings` (draft and moderation source of truth)
- `listing_media`
- `property_availability` and date-specific price overrides
- `listing_moderation_events` / `audit_logs`
- `host_payout_profiles` and `payout_requests` only when payouts are in scope

Before using `properties` for publication, change the guest catalog’s current `is_approved DEFAULT true` behavior so new rows fail closed, and add constraints/indexes and idempotent publish behavior. A new listing must never become public by default.

## 5. Connection-first setup (the first work phase)

No feature implementation should start until these connections and owners are confirmed:

### A. Team and source control

- Revoke/rotate the embedded GitHub credential; install GitHub CLI or OS credential storage and verify access using the clean remote.
- Add named team members to the GitHub organization/repository with least-privilege roles. Do not share a personal token.
- Agree on one task board (GitHub Projects or the team’s existing tracker) and one communication channel. Keep decisions/tasks in the board; use chat for coordination, not as the only record.
- Use a protected `main`, one branch per ticket, pull requests, one reviewer, and preview deployment links on PRs.
- Add CODEOWNERS for Guest, Host, CMS, database migrations, and shared packages; add CI for lint/typecheck/build after the repo is stabilized.

### B. Supabase environments

- Identify the existing Supabase project and who owns admin access; never print keys in chat or commit them.
- Create/confirm a development project with test-only data and a separate production project. Host and Guest share the matching project in each environment.
- Decide canonical auth provider and OTP channel; configure allowed redirect URLs for local, Preview, and production.
- Store only public/publishable keys in browser-exposed variables. Keep service-role credentials server-only and limited to privileged server routes/functions.
- Put schema changes in timestamped migrations, review them, apply to development, and record rollback/recovery steps before production.

### C. Vercel and domains

- Connect this monorepo to three Vercel projects with Root Directory `apps/guest`, `apps/host`, and `apps/cms`.
- Configure Preview and Production environment variables separately; use each app’s correct base URL. Vercel supports separate projects from a monorepo and per-environment variables. [Vercel projects](https://vercel.com/docs/projects) · [Vercel environments](https://vercel.com/docs/deployments/environments)
- Use Vercel-generated Preview URLs during development. Do not change registrar DNS during Phase 0; add the purchased custom domain at pre-launch after build/Preview acceptance, then configure production URL and Supabase auth redirects. Vercel domain assignment is managed per project and requires DNS configuration. [Vercel domain setup](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

### D. Team operating rhythm

- Every task has one accountable owner, one reviewer, acceptance criteria, and linked dependencies.
- Async daily update: **Done / Next / Blocked**. A blocker names the person or decision needed.
- Weekly 30-minute demo of the end-to-end flow; record decisions and changed scope in the board.
- A task is “done” only when code, migration, access policy, preview verification, and documentation are complete—not when the screen looks finished.

## 6. Delivery workflow, one milestone at a time

### Phase 0 — Connections and decisions (gate before coding)

**Work:** owner rotates the GitHub credential; connect team access/board/channel; verify repo permissions; configure Vercel projects and Preview environments; identify Supabase dev/prod; select auth; agree on acceptance criteria. Record the purchased domain for later, but defer DNS/domain assignment until pre-launch.
**Exit:** every required owner can reach the right tool; the exposed credential has been rotated and the clean remote verified; Preview deployments are available; dev credentials are distinct from production; architecture decisions are recorded. Custom DNS is explicitly outside this phase.

### Phase 1 — Data model and security foundation

**Work:** schema diagram, migrations, host/business membership, listing drafts, moderation status/events, private verification storage, published catalog projection, RLS policies, safe server-side moderation/publish operation.
**Exit:** anonymous users can read published listing fields only; a host cannot access another host’s rows; host cannot approve or publish; staff can review only through staff access; new rows are not public by default.

### Phase 2 — End-to-end listing vertical slice

**Work:** host login → create draft → submit → admin review → approve/reject/request changes → publish approved listing to Guest. Build a small dashboard showing status and next action.
**Exit:** a test host’s approved listing appears once in Guest with a stable ID; rejected/draft listing never appears; failures show an error and do not claim success; moderation decision has reviewer, time, and reason.

### Phase 3 — Complete listing onboarding

**Work:** multi-step wizard, draft resume, field validation, categorized amenities, Arabic/English fields, photo upload/reorder/remove, private verification documents, revision loop.
**Exit:** incomplete/invalid submissions cannot be sent; uploads obey ownership/privacy rules; host can revise and resubmit without duplicate listings.

### Phase 4 — Availability and booking operations

**Work:** real calendar/time zones, blocked dates, date-level pricing, booking holds/collision prevention, host booking list scoped to owned properties, guest details minimized, permitted check-in instructions.
**Exit:** two guests cannot book the same inventory; host sees only relevant bookings; host cannot change payment state; booking/PIN visibility follows payment and stay rules.

### Phase 5 — Operational admin and dashboard

**Work:** host verification queue, listing support, user support/dispute escalation, review moderation, operational metrics based on real data, bilingual blog CMS if still required.
**Exit:** metrics reconcile with bookings; admin actions have audit history; roles and data access are reviewed.

### Phase 6 — Payouts and external integrations

**Work:** payout policy, host payout profile verification, ledger, fee/tax rules reviewed by the business, payout requests, provider integrations, lock APIs, notifications.
**Exit:** end-to-end reconciliation and failure/refund paths are documented; sensitive values are masked; provider callbacks are authenticated. Do not promise an automatic payout schedule until the provider and policy are configured.

## 7. Definition of ready / done

**Ready:** issue has user outcome, acceptance criteria, dependencies, data fields, permissions, owner, reviewer, and design/reference.
**Done:** migration reviewed and applied in dev; RLS reviewed; API validates inputs and role; error/loading/empty states exist; preview flow verified; no fake money, guest PII, bank data, or lock PIN appears; docs and release notes updated.

## 8. Immediate minimum checklist

- [ ] Rotate exposed GitHub credential and configure clean local Git auth.
- [ ] Confirm team members, roles, project board, and coordination channel.
- [ ] Confirm Supabase project ownership, auth provider, and dev/prod split.
- [ ] Connect three Vercel projects with correct app roots and environment variables.
- [ ] Record the purchased domain; defer DNS/domain assignment until pre-launch Preview acceptance.
- [ ] Approve schema/auth/data ownership decisions and migration plan.
- [ ] Replace demo success/fallback behavior with explicit demo mode or real API errors.
- [ ] Deliver the host-submit → admin-review → guest-publish vertical slice.
- [ ] Expand into calendar and host booking management; leave payouts/lock APIs for a later gated phase.

## 9. Verified local references

- Host prototype: `apps/host/src/app/page.tsx`
- CMS prototype: `apps/cms/src/app/page.tsx`
- Existing guest schema/catalog: `supabase/schema.sql`, `apps/guest/src/lib/services/properties.ts`
- Shared types/constants: `packages/shared/index.ts`
- Monorepo scripts: root `package.json`, `scripts/dev-all.mjs`
- Environment examples: `apps/guest/.env.example`, `apps/host/.env.example`, `apps/cms/.env.example`
- Current worktree contains unrelated Guest changes; do not overwrite them while implementing these phases.

## 10. Reference inspection and QafNest product experience

### What was inspected

The public Gathern Business pages were inspected on 2026-11-01: the business landing page, calculator interactions, seven-step “How to host” explainer, FAQ, protection-program page, and the phone-number sign-in entry. The authenticated host dashboard is behind login/OTP and was not inspected; no private dashboard details should be treated as verified. [Business landing page](https://business.gathern.co/business) · [How to host](https://business.gathern.co/business/how-to-host) · [FAQs](https://business.gathern.co/business/faqs) · [Protection program](https://business.gathern.co/business/protection-program) · [Sign-in](https://business.gathern.co/login)

The public site provides a useful business funnel and host education pattern:

1. Host-first navigation, a host/guest switch, sign-in, and a direct “How hosting works” link.
2. Host success-story carousel with portrait/video-led storytelling and a property-registration CTA.
3. Three clear value propositions: reach/additional income, property protection, and a safe/legal operating process.
4. Expected-income calculator. It asks for property type and city, then shows a monthly estimate. Its explanation says the estimate uses recent local booking prices and is affected by availability, price, demand, and hosting quality.
5. A seven-step host explainer: add property details, set price and rules, get exposure, prepare the property, receive booking messages, receive dues, and earn from hosting.
6. A protection-program summary, a link to the detailed policy, host-app store links, a final registration CTA, and a focused footer with FAQ, policies, contact, and social links.
7. FAQ topics cover eligibility, property types, rented properties, fees, and payment operations. Those are useful questions to answer for QafNest, but Gathern’s rates, timing, eligibility wording, coverage, and legal claims are their own policies and must not be copied.

### QafNest design direction

- Use the Gathern site as a reference for **information order and host tasks**, not as an asset or page-copy source. QafNest gets its own writing, illustrations, photography, logo, component shapes, and interaction details.
- Build a polished bilingual English/Arabic experience from the start. Arabic pages must use correct RTL layout, mirrored navigation and icon placement, Arabic number/date formatting where appropriate, and the bundled Arabic font. Keep language choice consistent across public pages, sign-in, onboarding, dashboard, and email/SMS templates.
- Use QafNest’s existing violet and dark-obsidian design tokens with calm, high-contrast surfaces and restrained accent use. The business portal should feel trustworthy and operational: clear hierarchy, strong whitespace, readable tables/forms, visible statuses, and responsive mobile layouts. Avoid using decorative glass effects on data-entry and operations screens.
- Marketing pages can be more expressive than the dashboard: authentic property photography, a clear headline, one primary CTA per section, simple line illustrations for steps, and real QafNest host stories only after hosts consent. Never leave fake testimonials or success metrics in production.
- Define shared tokens and components once in `packages/shared` (or an agreed shared UI package) so the Guest, Host, and CMS apps do not drift in brand, forms, status chips, typography, and RTL behavior.

### Proposed host-site sitemap

| Route | Purpose and primary interactions | Release |
| --- | --- | --- |
| `/` | Host-focused landing: value proposition, real success stories, benefits, income estimator, hosting steps, protection summary, FAQ preview, final registration CTA | MVP public funnel |
| `/how-it-works` | Seven-step illustrated explanation, readiness checklist, fees/payout-policy links once QafNest terms are approved, registration CTA | MVP |
| `/faqs` | Searchable/accordion answers grouped by eligibility, listing, bookings, payments, safety, and support; CMS-managed later | MVP with curated content |
| `/protection` | QafNest’s own approved policy, claims process, exclusions, evidence, response targets, and support path; publish only after business/legal approval | Before public launch if protection is advertised |
| `/login` | Phone/email identity entry and verification with real Supabase session; preserve redirect to requested onboarding/dashboard destination | MVP |
| `/onboarding` | Saveable host profile and listing wizard with progress, validation, upload state, and review preview | MVP |
| `/dashboard` | Host’s next action, listing/moderation status, bookings snapshot, calendar summary, and support entry | MVP status view; operational modules follow |
| `/properties` and `/properties/[id]` | Host-owned listing list and editor; show draft/revision/published status and preview | MVP |
| `/calendar` and `/bookings` | Availability, date pricing, booking state and permitted guest/arrival information | After the listing vertical slice |
| `/earnings` | Booking ledger, fees, payout status and downloadable statements | After payout rules and provider are decided |

The minimum staff side is a separate protected CMS route/app with a **listing review queue**, listing detail/evidence view, changes-requested/reject/approve actions, required decision reason, and audit timeline. Existing broad CMS placeholders are not part of the first launch.

### Key page behavior and content requirements

**Landing and income estimator**

- Make the audience explicit: property owners/operators in Saudi Arabia who want to list short-stay accommodation.
- Explain the process and the actual QafNest value in plain language; include proof only where it is verified.
- Let visitors choose a supported property type and city, then display an estimate with the period and currency. State the data window, assumptions, and factors that change the result. The estimate is not a guaranteed income quote. Do not hardcode fabricated occupancy, nightly rates, demand, or market-size claims; if there is not enough QafNest data, label the calculator as an illustrative estimate or defer it.
- Each CTA must lead into phone verification and return the host to the intended next step.

**Onboarding and listing review**

- Guided steps: (1) host identity/business profile and contact verification, (2) property type and address/map pin, (3) capacity/rooms/bathrooms/amenities, (4) truthful photo upload and ordering, (5) nightly price and availability rules, (6) check-in/out, house rules, and required license/KYC references, (7) review, save draft, and submit.
- Ask for only fields required for eligibility and operations. Keep ID/license files in private storage, show why they are needed, and record verification status separately from public listing data.
- Support draft autosave, back/next navigation, field-level errors, upload progress, resume after sign-in, and an accessible review summary before submission.
- Show the lifecycle clearly: Draft → Submitted → In review → Changes requested → Approved/Published, or Rejected/Suspended. Explain who must act next and why; do not show a “submitted” success state until the server confirms persistence.

**Host dashboard**

- Default view should answer four questions: what is the status of each property, what needs action, what is coming up, and where can the host get help?
- Prioritize practical cards and lists over vanity metrics. Every number must come from persisted, permission-scoped data and show its time range.
- Use clear empty, loading, error, and success states; responsive navigation; keyboard-accessible controls; and minimal guest PII.
- Do not expose a smart-lock PIN, payment controls, or payout data before the booking and disclosure policy allow it.

**FAQ, protection, and footer**

- The FAQ should answer real QafNest policy questions. Keep fees, cancellation, owner permission, license requirements, damage claims, payout timing, and supported listing types as configuration/content approved by the business; do not invent commitments or reuse Gathern terms.
- Before advertising a protection promise, define eligible incidents, evidence, report window, exclusions, limits, investigation, appeal, and support owner. Link that content from landing, listing onboarding, and dashboard.
- Keep footer small and useful: host support, contact hours, FAQ, host terms, privacy, safety/protection, language, app downloads only when a QafNest host app exists, and official QafNest social links.

## 11. Team connection and build workflow

### Organize the people before code

Assign named owners in the team tracker before Phase 0 exits. One person may cover several roles, but each responsibility must have a single accountable owner:

| Role | Owns |
| --- | --- |
| Product/business owner | Host eligibility, commission/fees, cancellation and protection terms, payout timing, launch cities, acceptance decisions |
| Host product/design | Host interviews, bilingual page map, onboarding usability, dashboard states, design tokens and content review |
| Platform/backend owner | Supabase schema/auth, RLS, storage, server actions/APIs, migrations, logs, integrations |
| Host frontend owner | Landing, auth handoff, onboarding, dashboard, RTL/accessibility/responsive experience |
| Operations/admin owner | Listing review checklist, response SLA, rejection/change reasons, support escalation, moderation audit requirements |
| QA/release owner | Acceptance checklist, test accounts/data, preview review, release notes, rollback readiness |

Create a board with these statuses: **Inbox → Ready → In progress → Review → Preview verified → Done**. Every task contains: user outcome, acceptance criteria, design/API/schema dependencies, owner, reviewer, risk, and preview link. Limit parallel in-progress work to the team’s actual review capacity; do not open multiple partially finished vertical slices.

### One end-to-end workflow for every release

1. Product owner writes a short outcome and acceptance criteria; operations confirms the real-world policy behind it.
2. Design and engineering agree on the screen states, data fields, authorization boundary, and EN/AR behavior before implementation.
3. Backend migration/API/RLS changes land in development first; frontend uses the real contract or an explicitly marked fixture.
4. Work happens in a ticket branch and pull request. Reviewer checks UX, data access, failure paths, migration, and localization—not just the happy path.
5. Deploy Preview; QA verifies with separate host, guest, and staff accounts, including unauthorized access and empty/error cases.
6. Demo the completed flow, record decisions and unresolved issues in the board, then release only after product/operations signoff.
7. After release, review listing submission completion, time to first publish, review turnaround, host support requests, booking/availability errors, and data/security incidents. Use the results to choose the next slice.

### Cadence and team connection

- Use one shared tracker as the source of work and decisions, and one existing team chat/channel for quick coordination. Do not use DMs as the only record for a product decision.
- Async update on workdays: **Done / Next / Blocked** with links to tickets or PRs. A blocker must say which owner or decision is needed.
- Weekly 30-minute demo of the working host-to-admin-to-guest flow; end with decisions, owners, and dates written in the tracker.
- Before implementation starts, have a short kickoff to confirm the roles above, business policies, environments, and definition of MVP. No external invitations or messages are sent as part of this plan.

## 12. Decision gates and measurable MVP completion

### Decisions required from the business before relevant work begins

These are product decisions, not engineering guesses: host identity/eligibility; allowed property types/cities; required tourism or business documentation; whether a tenant can list a rental; commission and taxes; cancellation and no-show rules; guest deposit/payment ownership; payout schedule; damage-protection promise and limits; support hours/SLA; Arabic/English launch scope; and who can approve or suspend a listing. Record each decision, owner, evidence, and effective date in the tracker.

### MVP is complete only when

- A host can sign in, save a draft, upload public photos and private verification documents to the correct access-controlled locations, submit, and resume after a page refresh.
- A staff reviewer can see only the review data they need, return a listing with a reason, approve it, and leave an auditable decision record.
- Only approved/published listings appear in the Guest Platform; drafts, rejected listings, and verification documents do not.
- The host sees current status and next steps, and a real end-to-end preview can be completed in both English and Arabic on mobile and desktop.
- Authorization is verified for anonymous, guest-only, host, another host, and staff roles; failure paths do not falsely report success.
- Business policy pages and operational ownership are approved; all sample data, fake revenue/booking values, placeholder testimonials, default IBANs, and demo lock codes are removed from production paths.

### First planning meeting agenda

1. Confirm product owner, technical owner, listing reviewer, QA/release owner, and team communication channel.
2. Review the decisions list above and assign owners/dates; mark unanswered payment, damage protection, and legal/compliance questions as launch blockers.
3. Agree that this monorepo is the source; connect a separate Vercel project to `apps/host`; configure its Preview URL and matching Supabase environment. Defer custom-domain/DNS changes until pre-launch.
4. Define one pilot city, one or two property categories, required documents, and a small test-host cohort.
5. Approve the host-submit → staff-review → guest-publish flow and its acceptance checklist.
6. Only then create Phase 0 tickets and begin implementation.
