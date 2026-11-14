# QafNest Hetzner VPS Deployment Guide (GitHub -> Cloudflare -> Ubuntu VPS)

This repository deploys **all 4 QafNest apps** on a single Hetzner VPS using PM2 behind **Nginx** (or **Caddy**), with **Cloudflare DNS & SSL** in front. Each app runs on its own isolated subdomain with root `/` routing — **no `/admin` or `/cms` path prefixes**, preventing cross-app cookie or localStorage leakage:

| Portal | Public Subdomain | Internal Port | Next.js `basePath` |
| --- | --- | --- | --- |
| Guest Storefront | `https://qafnest.com` (`www` -> apex) | `127.0.0.1:3000` | `/` |
| Host Business Portal | `https://business.qafnest.com` | `127.0.0.1:3001` | `/` |
| CMS Editorial Portal | `https://cms.qafnest.com` | `127.0.0.1:3002` | `/` |
| Super Admin Portal | `https://admin.qafnest.com` | `127.0.0.1:3003` | `/` |

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
2. In **Cloudflare Dashboard -> SSL/TLS -> Overview**, set encryption mode to **Full (strict)** once Nginx/Certbot or Caddy is active on the Hetzner server. *(Tip: during initial Certbot issuance, either use DNS-01 / temporarily grey-cloud or let Certbot HTTP-01 run cleanly before switching to Strict.)*
3. *(Optional hardening)* In **Cloudflare Security -> WAF / Access**, you can restrict `admin.qafnest.com` and `cms.qafnest.com` by IP allowlist or Cloudflare Zero Trust Access.

---

## 2. Initial Hetzner Ubuntu 24.04 Setup

```bash
# Install Node.js 20 LTS, Git, build tools, PM2, and Nginx + Certbot
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get update && sudo apt-get install -y nodejs git nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# Clone from GitHub
sudo mkdir -p /var/www/qafnest
sudo chown -R "$USER:$USER" /var/www/qafnest
git clone https://github.com/nur-amin-rayhan/qafnest.git /var/www/qafnest
cd /var/www/qafnest
```

*(Note on cookies: keep `admin.qafnest.com` and `cms.qafnest.com` session cookies host-only — never set `Domain=.qafnest.com` on admin cookies — so Guest scripts on `qafnest.com` never receive admin credentials.)*

---

## 3. Environment Configuration (Per-App `.env.local`)

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

## 4. Build & Start PM2 Processes

```bash
cd /var/www/qafnest
bash scripts/deploy-vps.sh

# Enable PM2 startup on reboot
pm2 startup systemd -u "$USER" --hp "$HOME"
# Run the sudo command printed by pm2 startup, then:
pm2 save
```

PM2 processes managed by `ecosystem.config.cjs`:
- `qafnest-guest` (`PORT=3000`, `qafnest.com`)
- `qafnest-host` (`PORT=3001`, `business.qafnest.com`)
- `qafnest-cms` (`PORT=3002`, `cms.qafnest.com`)
- `qafnest-admin` (`PORT=3003`, `admin.qafnest.com`)

---

## 5. Reverse Proxy + Origin SSL on Hetzner

### Option A: Nginx + Certbot (Recommended)
```bash
sudo cp /var/www/qafnest/deploy/nginx/qafnest.conf /etc/nginx/sites-available/qafnest
sudo ln -sf /etc/nginx/sites-available/qafnest /etc/nginx/sites-enabled/qafnest
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Issue SSL certificates for apex + all 4 subdomains
sudo certbot --nginx -d qafnest.com -d www.qafnest.com -d business.qafnest.com -d cms.qafnest.com -d admin.qafnest.com
```
*(In Cloudflare Proxy mode, if HTTP-01 fails, either install a free 15-year Cloudflare Origin Certificate into Nginx or temporarily grey-cloud during `certbot --nginx` and re-enable Orange Cloud + `Full (strict)` right after.)*

### Option B: Caddy (Auto-HTTPS)
```bash
sudo cp /var/www/qafnest/deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

---

## 6. Future Updates (Git Push -> Hetzner Redeploy)

Whenever you push new commits to `main` on GitHub, deploy cleanly on your Hetzner VPS with:

```bash
cd /var/www/qafnest && bash scripts/deploy-vps.sh
```
