# QafNest Hetzner VPS Deployment Guide (GitHub -> Ubuntu VPS)

This repository deploys **all 4 QafNest apps** on a single Hetzner VPS using PM2 behind **Nginx** (or **Caddy**):

| Portal | Public URL | Internal Port | Next.js `basePath` |
| --- | --- | --- | --- |
| Guest Storefront | `https://qafnest.com` (`www` -> apex) | `127.0.0.1:3000` | `/` |
| Host Business Portal | `https://business.qafnest.com` | `127.0.0.1:3001` | `/` |
| CMS Portal | `https://qafnest.com/cms` | `127.0.0.1:3002` | `/cms` |
| Admin Portal | `https://qafnest.com/admin` | `127.0.0.1:3003` | `/admin` |

> **Local dev equivalents:** Guest `http://localhost:3000`, Host `http://localhost:3001`, CMS `http://localhost:3002/cms` (or `:3000/cms`), Admin `http://localhost:3003/admin` (or `:3000/admin`).

---

## 1. DNS Records

Point all domain records at your Hetzner VPS public IPv4 address (`A` records, plus `AAAA` if IPv6 is enabled):

- `qafnest.com` (`@`) -> `<VPS_IP>`
- `www.qafnest.com` -> `<VPS_IP>`
- `business.qafnest.com` -> `<VPS_IP>`

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
  - `NEXT_PUBLIC_CMS_PORTAL_URL=https://qafnest.com/cms`
  - `NEXT_PUBLIC_ADMIN_PORTAL_URL=https://qafnest.com/admin`
  - `NEXT_PUBLIC_SUPABASE_URL=...`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...`
- **Guest (`apps/guest/.env.local`):** Supabase keys, MyFatoorah keys, Google Maps key, `ADMIN_INTERNAL_URL=http://127.0.0.1:3003`, `CMS_INTERNAL_URL=http://127.0.0.1:3002`, and Gmail SMTP:
  ```env
  # Generate a 16-character App Password at https://myaccount.google.com/apppasswords (requires 2FA)
  GMAIL_USER=qafnest@gmail.com
  GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
  CONTACT_FROM_EMAIL=qafnest@gmail.com
  ```
- **CMS (`apps/cms/.env.local`):** `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY`, and `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `CONTACT_FROM_EMAIL` (for CMS test email delivery).
- **Admin (`apps/admin/.env.local`):** `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SECRET_KEY`.
- **Host (`apps/host/.env.local`):** Public Supabase + Firebase + Google Maps keys only.

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
- `qafnest-guest` (`PORT=3000`)
- `qafnest-host` (`PORT=3001`)
- `qafnest-cms` (`PORT=3002`, `basePath=/cms`)
- `qafnest-admin` (`PORT=3003`, `basePath=/admin`)

---

## 5. Reverse Proxy + Free Let's Encrypt SSL

### Option A: Nginx + Certbot (Recommended)
```bash
sudo cp /var/www/qafnest/deploy/nginx/qafnest.conf /etc/nginx/sites-available/qafnest
sudo ln -sf /etc/nginx/sites-available/qafnest /etc/nginx/sites-enabled/qafnest
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Issue SSL certificates for all domains
sudo certbot --nginx -d qafnest.com -d www.qafnest.com -d business.qafnest.com
```

### Option B: Caddy (Auto-HTTPS)
```bash
sudo cp /var/www/qafnest/deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

---

## 6. Future Updates (CI / Redeploy)

Whenever you push new commits to `main` on GitHub, deploy cleanly with:

```bash
cd /var/www/qafnest && bash scripts/deploy-vps.sh
```
