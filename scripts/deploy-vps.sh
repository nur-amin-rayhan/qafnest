#!/usr/bin/env bash
set -euo pipefail

# QafNest Hetzner VPS Deployment Script
# Usage (on VPS):
#   bash scripts/deploy-vps.sh

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

echo "==> [1/4] Updating source from git (origin/main)..."
git fetch origin main
git pull --ff-only origin main

# Ensure per-app .env.production.local files exist (keep Host isolated from admin/service secrets).
for app in guest host cms admin; do
  if [ ! -f "$APP_DIR/apps/$app/.env.local" ] && [ ! -f "$APP_DIR/apps/$app/.env.production.local" ]; then
    echo "WARN: Missing apps/$app/.env.local or apps/$app/.env.production.local"
  fi
done

echo "==> [2/4] Installing workspace dependencies..."
npm ci

echo "==> [3/4] Building all 4 Next.js applications..."
export NEXT_PUBLIC_GUEST_URL="${NEXT_PUBLIC_GUEST_URL:-https://qafnest.com}"
export NEXT_PUBLIC_HOST_PORTAL_URL="${NEXT_PUBLIC_HOST_PORTAL_URL:-https://business.qafnest.com}"
export NEXT_PUBLIC_CMS_PORTAL_URL="${NEXT_PUBLIC_CMS_PORTAL_URL:-https://cms.qafnest.com}"
export NEXT_PUBLIC_ADMIN_PORTAL_URL="${NEXT_PUBLIC_ADMIN_PORTAL_URL:-https://admin.qafnest.com}"
npm run build

echo "==> [4/4] Starting/reloading PM2 processes..."
pm2 startOrReload "$APP_DIR/ecosystem.config.cjs" --update-env
pm2 save

echo "==> Deployment complete! Checking status:"
pm2 status
