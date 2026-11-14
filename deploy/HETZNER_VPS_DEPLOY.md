# QafNest Hetzner VPS Deployment Guide (GitHub -> Cloudflare -> Ubuntu VPS)

> **Why this file was created:** This guide gives you the exact, repeatable steps to deploy QafNest's 4 isolated Next.js applications from GitHub onto an Ubuntu Hetzner VPS using PM2 and Nginx/Caddy behind Cloudflare — including safe configuration when your VPS **already hosts another live website under PM2**.

| Portal | Public Subdomain | Default Internal Port | Next.js `basePath` |
| --- | --- | --- | --- |
| Guest Storefront | `https://qafnest.com` (`www` -> apex) | `127.0.0.1:3000` (configurable) | `/` |
| Host Business Portal | `https://business.qafnest.com` | `127.0.0.1:3001` (configurable) | `/` |
| CMS Editorial Portal | `https://cms.qafnest.com` | `127.0.0.1:3002` (configurable) | `/` |
| Super Admin Portal | `https://admin.qafnest.com` | `127.0.0.1:3003` (configurable) | `/` |

> **Local dev equivalents:** Guest `http://localhost:3000`, Host `http://localhost:3001`, CMS `http://localhost:3002` (or `http://cms.localhost:3002` in browser), Admin `http://localhost:3003` (or `http://admin.localhost:3003` in browser).

---

## 1. Cloudflare DNS & SSL Setup (Done in Cloudflare — NOT CMS)

Subdomains are configured in **Cloudflare DNS** pointing to your Hetzner VPS public IP, while the Hetzner reverse proxy (`Nginx` or `Caddy`) routes each subdomain hostname to its PM2 port:

1. In **Cloudflare Dashboard -> DNS -> Records**, add these `A` records pointing to your Hetzner VPS IPv4 address (`<VPS_IP>`):
   - Type `A`, Name `@` (`qafnest.com`), Content `<VPS_IP>`, Proxy status: **Proxied (Orange Cloud)**
   - Type `A`, Name `www` (`www.qafnest.com`), Content `<VPS_IP>`, Proxy status: **Proxied (Orange Cloud)**
   - Type `A`, Name `business` (`business.qafnest.com`), Content `<VPS_IP>`, Proxy status: **Proxied (Orange Cloud)**
   - Type `A`, Name `cms` (`cms.qafnest.com`), Content `<VPS_IP>`, Proxy status: **Proxied (Orange Cloud)**
   - Type `A`, Name `admin` (`admin.qafnest.com`), Content `<VPS_IP>`, Proxy status: **Proxied (Orange Cloud)**
2. In **Cloudflare Dashboard -> SSL/TLS -> Overview**, set encryption mode to **Full (strict)** once Nginx/Certbot or Caddy is active on the Hetzner server.
3. *(Optional hardening)* In **Cloudflare Security -> WAF / Access**, you can restrict `admin.qafnest.com` and `cms.qafnest.com` by IP allowlist or Cloudflare Zero Trust Access.

*(Note on cookies: keep `admin.qafnest.com` and `cms.qafnest.com` session cookies host-only — never set `Domain=.qafnest.com` on admin cookies — so Guest scripts on `qafnest.com` never receive admin credentials.)*

---

## 2. Co-hosting on a Hetzner VPS With an Existing Website & PM2

If your Hetzner VPS **already runs another website under PM2**, follow these checks before starting QafNest so you do not break or collide with your existing site:

1. **Check occupied ports first:**
   ```bash
   sudo ss -tulpn | grep LISTEN
   ```
   Many Node/Next sites already use port `3000` (or `3001`). If any of `3000..3003` are taken by your other site, choose free ports (for example `3100..3103`) using environment variables — **do not edit app `package.json` files**, because [`ecosystem.config.cjs`](file:///d:/qafnest-next/ecosystem.config.cjs) passes the port directly to Next.js:
   ```bash
   export QAFNEST_GUEST_PORT=3100
   export QAFNEST_HOST_PORT=3101
   export QAFNEST_CMS_PORT=3102
   export QAFNEST_ADMIN_PORT=3103
   ```
   If you override ports, update the 4 matching `server 127.0.0.1:<PORT>;` lines in your Nginx site file (`/etc/nginx/sites-available/qafnest`) or Caddy block to match `3100..3103`.
2. **Use the same Linux user that owns the existing PM2 daemon:**
   ```bash
   pm2 list
   ```
   Running `pm2 startOrReload` as that same user keeps **one unified PM2 process list** saved in `~/.pm2/dump.pm2` across server reboots (creating a second root-owned PM2 daemon conflicts with `pm2 startup`).
3. **Never run global destructive PM2 commands:**
   - NEVER run `pm2 delete all`, `pm2 kill`, or `pm2 restart all`.
   - Always scope commands to QafNest's ecosystem or app names:
     ```bash
     pm2 startOrReload /var/www/qafnest/ecosystem.config.cjs --update-env
     pm2 restart qafnest-guest qafnest-host qafnest-cms qafnest-admin
     pm2 logs qafnest-admin
     pm2 save
     ```
4. **Memory safety during builds:** `scripts/deploy-vps.sh` builds all 4 Next.js apps sequentially with `NODE_OPTIONS="--max-old-space-size=1536"` so Next compilation does not OOM your existing site. On a 2 GB RAM VPS, ensure a 2 GB–4 GB swap file exists (`swapon --show`).

---

## 3. Initial Hetzner Ubuntu 24.04 Directory & Clone Setup

*(On a fresh VPS, install Node 20 LTS, Git, Nginx, Certbot, and `npm install -g pm2` first; on an existing VPS skip anything already installed.)*

```bash
sudo mkdir -p /var/www/qafnest
sudo chown -R "$USER:$USER" /var/www/qafnest
git clone https://github.com/nur-amin-rayhan/qafnest.git /var/www/qafnest
cd /var/www/qafnest
```

---

## 4. Environment Configuration (Per-App `.env.local`)

Copy each app's own `.env.example` into its ignored `.env.local` (or `.env.production.local`):

```bash
cp apps/guest/.env.example apps/guest/.env.local
cp apps/host/.env.example apps/host/.env.local
cp apps/cms/.env.example apps/cms/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

Populate production keys per app (keep `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET_KEY`, and payment secrets **out of `apps/host/.env.local`**):

- **Shared public URLs (all 4 apps):**
  - `NEXT_PUBLIC_GUEST_URL=https://qafnest.com`
  - `NEXT_PUBLIC_HOST_PORTAL_URL=https://business.qafnest.com`
  - `NEXT_PUBLIC_CMS_PORTAL_URL=https://cms.qafnest.com`
  - `NEXT_PUBLIC_ADMIN_PORTAL_URL=https://admin.qafnest.com`
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...`
- **Guest (`apps/guest/.env.local`):** `NEXT_PUBLIC_SITE_URL=https://qafnest.com`, Supabase keys, MyFatoorah keys, Google Maps key, and Gmail SMTP:
  ```env
  # Generate a 16-character App Password at https://myaccount.google.com/apppasswords (requires 2FA)
  GMAIL_USER=qafnest@gmail.com
  GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
  CONTACT_FROM_EMAIL=qafnest@gmail.com
  ```
- **Host (`apps/host/.env.local`):** `NEXT_PUBLIC_SITE_URL=https://business.qafnest.com`, public Supabase + Firebase + Google Maps keys only.
- **CMS (`apps/cms/.env.local`):** `NEXT_PUBLIC_SITE_URL=https://cms.qafnest.com`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY`, and `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `CONTACT_FROM_EMAIL`.
- **Admin (`apps/admin/.env.local`):** `NEXT_PUBLIC_SITE_URL=https://admin.qafnest.com`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY`.

---

## 5. Build & Start PM2 Processes

```bash
cd /var/www/qafnest
# If 3000-3003 are free:
bash scripts/deploy-vps.sh

# OR if your existing site already uses port 3000:
QAFNEST_GUEST_PORT=3100 QAFNEST_HOST_PORT=3101 QAFNEST_CMS_PORT=3102 QAFNEST_ADMIN_PORT=3103 bash scripts/deploy-vps.sh
```

If this is the first time configuring PM2 reboot persistence for this user, run `pm2 startup` (skip if already enabled for your existing site), then `pm2 save`.

PM2 process names in `ecosystem.config.cjs`:
- `qafnest-guest` (default `:3000`, `qafnest.com`)
- `qafnest-host` (default `:3001`, `business.qafnest.com`)
- `qafnest-cms` (default `:3002`, `cms.qafnest.com`)
- `qafnest-admin` (default `:3003`, `admin.qafnest.com`)

---

## 6. Reverse Proxy + Origin SSL on Hetzner (Non-Destructive Side-by-Side)

### Option A: Nginx + Certbot (Recommended alongside existing sites)

Add QafNest as a separate vhost file so your existing site's Nginx config stays completely untouched:

```bash
sudo cp /var/www/qafnest/deploy/nginx/qafnest.conf /etc/nginx/sites-available/qafnest
# If you changed QAFNEST_*_PORT away from 3000..3003, update upstream ports inside /etc/nginx/sites-available/qafnest:
# sudo nano /etc/nginx/sites-available/qafnest

sudo ln -sf /etc/nginx/sites-available/qafnest /etc/nginx/sites-enabled/qafnest
# WARNING: Do NOT delete your existing site's symlink inside /etc/nginx/sites-enabled/!
sudo nginx -t && sudo systemctl reload nginx

# Issue SSL certificates only for QafNest domains
sudo certbot --nginx -d qafnest.com -d www.qafnest.com -d business.qafnest.com -d cms.qafnest.com -d admin.qafnest.com
```
*(In Cloudflare Proxy mode, if HTTP-01 fails, either install a free 15-year Cloudflare Origin Certificate into Nginx or temporarily grey-cloud during `certbot --nginx` and re-enable Orange Cloud + `Full (strict)` right after.)*

### Option B: Caddy (Side-by-Side Append — Never Overwrite Existing Caddyfile)

If Caddy already serves another website on this VPS, **append** QafNest's blocks instead of replacing `/etc/caddy/Caddyfile`:

```bash
# Append QafNest site blocks to your existing Caddyfile (verify ports match QAFNEST_*_PORT first):
cat /var/www/qafnest/deploy/Caddyfile | sudo tee -a /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

---

## 7. Future Updates (Git Push -> Hetzner Redeploy)

Whenever you push new commits to `main` on GitHub, redeploy safely (including if custom `QAFNEST_*_PORT` vars were chosen — keep them exported in `~/.bashrc` or pass inline):

```bash
cd /var/www/qafnest && bash scripts/deploy-vps.sh
```
