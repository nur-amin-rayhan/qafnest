# QafNest

QafNest is a Next.js monorepo for the guest marketplace, host business portal, and staff CMS. The Host and CMS apps are currently prototypes; their screens are not production workflows and must not be used with real guest, identity, banking, or booking data.

## Apps

| App | Directory | Local URL | Purpose |
| --- | --- | --- | --- |
| Guest | `apps/guest` | `http://localhost:3000` | Browse stays and make bookings |
| Host | `apps/host` | `http://localhost:3001` | Host Business Platform prototype |
| CMS | `apps/cms` | `http://localhost:3002` | Content & SEO management portal |
| Admin | `apps/admin` | `http://localhost:3003` | Operations, property approvals & finance |

## Local development

Use the repository's npm workspace and install dependencies from the repository root:

```bash
npm install
```

Copy the relevant example file into each app's ignored local environment file, then add development credentials there:

```bash
cp apps/guest/.env.example apps/guest/.env.local
cp apps/host/.env.example apps/host/.env.local
cp apps/cms/.env.example apps/cms/.env.local
```

Never commit `.env.local`, service-role keys, payment secrets, OTP provider credentials, or private identity documents. Browser-exposed variables must contain public keys only. Keep local/dev and production credentials separate.

Run one app at a time while working on it:

```bash
npm run dev:guest
npm run dev:host
npm run dev:cms
```

`npm run dev` starts all three apps together. The root scripts also provide `npm run build:guest`, `npm run build:host`, `npm run build:cms`, and `npm run build`.

## Host Platform direction

The first real Host milestone is the secure listing workflow:

1. Host signs in and saves a listing draft.
2. Host submits the listing and sees its persisted status.
3. Authorized staff review the listing and record a reasoned decision.
4. Only an approved listing is published to the Guest catalog.

Do not treat the current mock data or local-only actions as live listings, bookings, payouts, guest details, or credentials. Read [MASTER_PLAN.md](./MASTER_PLAN.md) before starting a Host Platform task; it defines the connection-first setup, security boundaries, page map, phases, and release gates.

## Deployment shape

The apps stay in this repository but deploy as separate Vercel projects. Set each project's Root Directory to its app directory (`apps/guest`, `apps/host`, or `apps/cms`). Host domain, environment variables, authentication redirects, and DNS must be configured per environment before production use.

## Collaboration

Use one issue per outcome and one pull request per focused change. Add the user outcome, acceptance criteria, affected app, migrations/access-policy changes, EN/AR and RTL impact, preview link, and verification notes. Do not put secrets or personal guest data in issues or pull requests.
