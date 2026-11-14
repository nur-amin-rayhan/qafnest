# QafNest Step-by-Step Vercel Deployment Guide (4-App Monorepo + Cloudflare Subdomains)

This repository is an **npm workspaces monorepo** containing 4 independent Next.js applications (`apps/guest`, `apps/host`, `apps/cms`, `apps/admin`) sharing `packages/shared` (`@qafnest/shared`). On Vercel, each portal is deployed as its **own separate Vercel Project** connected to the same GitHub repository (`nur-amin-rayhan/qafnest`), giving each app an isolated origin, build, and subdomain:

| Vercel Project Name | Root Directory | Production Subdomain |
| --- | --- | --- |
| `qafnest-guest` | `apps/guest` | `https://qafnest.com` (`www` redirects to apex) |
| `qafnest-host` | `apps/host` | `https://business.qafnest.com` |
| `qafnest-cms` | `apps/cms` | `https://cms.qafnest.com` |
| `qafnest-admin` | `apps/admin` | `https://admin.qafnest.com` |

> [!IMPORTANT]
> **Read Before Choosing Vercel vs. Hetzner VPS (File-Backed Stores):**
> Vercel serverless functions run on an ephemeral, read-only deployment filesystem (`/var/task`). While primary bookings/listings/auth use Supabase, several shared stores under `packages/shared/` (such as `cmsPagesStore.ts`, `blogStore.ts`, `platformFeeStore.ts`, `bookingFinancialsStore.ts`, `contactInquiriesStore.ts`, and `zatcaStore.ts`) currently write fallback JSON files via `fs.writeFileSync`. Those local JSON edits **will not persist across Vercel cold starts or serverless instances** unless backed by Supabase tables.
> - **Use Vercel** if you rely on Supabase tables/storage and want managed edge hosting with zero VPS maintenance.
> - **Use [`deploy/HETZNER_VPS_DEPLOY.md`](file:///d:/qafnest-next/deploy/HETZNER_VPS_DEPLOY.md)** if you want CMS page edits (`cmsPagesStore`) and file-backed admin configs (`platformFeeStore`, `zatcaStore`, etc.) to persist on disk right away.

---

## Step 1: Prepare External Services (Supabase, Firebase, Mail, Payments)

Before importing projects into Vercel, verify your production credentials exist:
1. **Supabase:** Production project URL (`NEXT_PUBLIC_SUPABASE_URL`), publishable anon key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), and server-only `SUPABASE_SERVICE_ROLE_KEY`.
2. **Firebase (Phone OTP Auth):** Public Firebase Web config (`NEXT_PUBLIC_FIREBASE_*`) for Guest and Host.
3. **MyFatoorah & Google Maps:** Payment token/keys (Guest only) and Google Maps API key (Guest & Host).
4. **Gmail SMTP (Contact & Notifications):** `GMAIL_USER=qafnest@gmail.com`, 16-character Google App Password (`GMAIL_APP_PASSWORD`), and `CONTACT_FROM_EMAIL=qafnest@gmail.com` (Guest & CMS).

---

## Step 2: Import All 4 Projects in Vercel

> [!WARNING]
> **Do NOT use `Root Directory: ./` with `Application Preset: Services`!**
> When importing `nur-amin-rayhan/qafnest` at repo root `./`, Vercel defaults to multi-service **Services** mode (asking for a `vercel.json`, showing `cms`/`guest`/`host` as `Internal` or auto-mapping `/admin`). QafNest uses **4 separate subdomains**, NOT path mounts. If you see the **Services** list:
> 1. Click **`Refresh`** at the bottom right if you just pulled recent commits (root `package.json` no longer lists `next`, so no bogus root `app` is detected).
> 2. Click **`Import single project ->`** next to each of the 4 apps (`apps/guest`, `apps/host`, `apps/cms`, `apps/admin`) **one by one** instead of importing `./` as a single multi-service project.
> *(Note: This monorepo uses **npm workspaces** in `package.json`, not Turborepo/`turbo.json`, which is why Vercel does not display a Turborepo preset — each app builds cleanly as a standard Next.js project when imported via **`Import single project ->`** or **Edit -> Root Directory**.)*

Repeat this single-project import flow **4 times** in **Vercel Dashboard -> Add New... -> Project** selecting `nur-amin-rayhan/qafnest` from GitHub (`main` branch):

1. Click **`Import single project ->`** next to each app under `apps/` (or click **Edit** next to **Root Directory** and pick the exact folder):
   - Project 1 (`qafnest-guest`): `apps/guest`
   - Project 2 (`qafnest-host`): `apps/host`
   - Project 3 (`qafnest-cms`): `apps/cms`
   - Project 4 (`qafnest-admin`): `apps/admin`
2. Keep **Framework Preset** as `Next.js` and **Node.js Version** as `20.x`.
3. Under **Build and Deployment Settings** (or **Project Settings -> General -> Root Directory** right after import):
   - Turn **ON** **"Include source files outside of the Root Directory in the Build Step"** so each app can compile `@qafnest/shared` from `packages/shared`.
   - Leave default workspace **Install Command** (`npm install` from monorepo root when detected) and **Build Command** (`next build`), or if Vercel fails to locate root workspaces for a project, set:
     - **Install Command:** `cd ../.. && npm ci`
     - **Build Command:** `npm run build` (runs `next build` inside that app's Root Directory)
     - **Output Directory:** `.next`

---

## Step 3: Add Environment Variables Per Project

Do **NOT** put Admin/CMS server secrets into `qafnest-host` or `qafnest-guest` unnecessarily. Add these under **Project Settings -> Environment Variables** (`Production` + `Preview`):

### A. Shared Variables (All 4 Vercel Projects)
```env
NEXT_PUBLIC_GUEST_URL=https://qafnest.com
NEXT_PUBLIC_HOST_PORTAL_URL=https://business.qafnest.com
NEXT_PUBLIC_CMS_PORTAL_URL=https://cms.qafnest.com
NEXT_PUBLIC_ADMIN_PORTAL_URL=https://admin.qafnest.com
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>
```

### B. `qafnest-guest` (`apps/guest`) Additional Env Vars
- `NEXT_PUBLIC_SITE_URL=https://qafnest.com`
- `SUPABASE_SERVICE_ROLE_KEY`
- Public Firebase config (`NEXT_PUBLIC_FIREBASE_*`) & Google Maps key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- MyFatoorah keys (`MYFATOORAH_API_KEY`, `MYFATOORAH_BASE_URL`, `MYFATOORAH_IS_TEST`, `MYFATOORAH_WEBHOOK_SECRET`)
- `GMAIL_USER=qafnest@gmail.com`
- `GMAIL_APP_PASSWORD=<16-char-app-password>`
- `CONTACT_FROM_EMAIL=qafnest@gmail.com`

### C. `qafnest-host` (`apps/host`) Additional Env Vars
- `NEXT_PUBLIC_SITE_URL=https://business.qafnest.com`
- Public Firebase config (`NEXT_PUBLIC_FIREBASE_*`) & Google Maps key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
- *(Keep `ADMIN_SECRET_KEY`, `ADMIN_PASSWORD`, and MyFatoorah secrets out of Host.)*

### D. `qafnest-cms` (`apps/cms`) Additional Env Vars
- `NEXT_PUBLIC_SITE_URL=https://cms.qafnest.com`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY`
- `GMAIL_USER=qafnest@gmail.com`, `GMAIL_APP_PASSWORD`, `CONTACT_FROM_EMAIL=qafnest@gmail.com`

### E. `qafnest-admin` (`apps/admin`) Additional Env Vars
- `NEXT_PUBLIC_SITE_URL=https://admin.qafnest.com`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY`

Click **Deploy** (or **Redeploy** once env vars are saved) on each of the 4 projects and confirm green builds.

---

## Step 4: Connect Subdomains in Vercel & Cloudflare DNS

In each Vercel project, go to **Settings -> Domains** and add its domain:

1. **`qafnest-guest`**: add `qafnest.com` and `www.qafnest.com` (set `www` to redirect to `qafnest.com`).
2. **`qafnest-host`**: add `business.qafnest.com`.
3. **`qafnest-cms`**: add `cms.qafnest.com`.
4. **`qafnest-admin`**: add `admin.qafnest.com`.

Vercel will show exact DNS targets for each domain. In **Cloudflare Dashboard -> DNS -> Records**, create matching records:

| Type | Name | Target shown by Vercel | Proxy Note |
| --- | --- | --- | --- |
| `A` | `@` (`qafnest.com`) | Vercel apex IP shown in Domains UI (e.g., `76.76.21.21` or project-specific IP) | Use **DNS Only** during initial TLS issuance, then enable Proxy if desired |
| `CNAME` | `www` | `cname.vercel-dns.com` (or project-specific `.verceldns.com` target) | Must allow ACME verification |
| `CNAME` | `business` | Project-specific Vercel CNAME target | Isolated Host origin |
| `CNAME` | `cms` | Project-specific Vercel CNAME target | Isolated CMS origin |
| `CNAME` | `admin` | Project-specific Vercel CNAME target | Isolated Admin origin |

*(In Cloudflare SSL/TLS -> Overview, keep encryption mode at **Full (strict)** — never **Flexible** — so Cloudflare does not cause redirect loops with Vercel HTTPS.)*

---

## Step 5: Configure Auth Redirect Allowlists & Verify Live URLs

1. **Supabase Auth -> URL Configuration:** Add `https://qafnest.com/**` and `https://business.qafnest.com/**` to Redirect URLs.
2. **Firebase Console -> Authentication -> Settings -> Authorized domains:** Add `qafnest.com` and `business.qafnest.com`.
3. Verify each live subdomain:
   - `https://qafnest.com/` -> redirects cleanly to `/ar` or `/en`, `Contact Us` shows `qafnest@gmail.com` & aligned dropdown.
   - `https://business.qafnest.com/` -> redirects cleanly to `/ar` (and `/en` for English), Host dashboard navigates under `/ar/app/...` & `/en/app/...`, `robots.txt` blocks private `/app/` & `/properties/` paths.
   - `https://cms.qafnest.com/` -> opens CMS login at `/login` (no `/cms` prefix, zero 404).
   - `https://admin.qafnest.com/` -> opens Admin login at `/login` (no `/admin` prefix, zero 404).

Once connected to GitHub `main`, every `git push origin main` automatically rebuilds and deploys affected apps on Vercel.
