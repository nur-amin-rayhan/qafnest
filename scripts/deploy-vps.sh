#!/usr/bin/env bash
set -euo pipefail

# QafNest Hetzner VPS Deployment Script (Safe for shared VPS with existing sites & PM2 apps)
# Usage (on VPS):
#   bash scripts/deploy-vps.sh
# Optional custom ports if 3000-3003 are used by an existing site on the same VPS:
#   QAFNEST_GUEST_PORT=3100 QAFNEST_HOST_PORT=3101 QAFNEST_CMS_PORT=3102 QAFNEST_ADMIN_PORT=3103 bash scripts/deploy-vps.sh

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$APP_DIR"

export QAFNEST_GUEST_PORT="${QAFNEST_GUEST_PORT:-3000}"
export QAFNEST_HOST_PORT="${QAFNEST_HOST_PORT:-3001}"
export QAFNEST_CMS_PORT="${QAFNEST_CMS_PORT:-3002}"
export QAFNEST_ADMIN_PORT="${QAFNEST_ADMIN_PORT:-3003}"

echo "==> [1/5] Updating source from git (origin/main)..."
git fetch origin main
git pull --ff-only origin main

# Ensure per-app .env.local / .env.production.local files exist (keep Host isolated from admin/service secrets).
for app in guest host cms admin; do
  if [ ! -f "$APP_DIR/apps/$app/.env.local" ] && [ ! -f "$APP_DIR/apps/$app/.env.production.local" ]; then
    echo "WARN: Missing apps/$app/.env.local or apps/$app/.env.production.local"
  fi
done

echo "==> [2/5] Checking port availability ($QAFNEST_GUEST_PORT, $QAFNEST_HOST_PORT, $QAFNEST_CMS_PORT, $QAFNEST_ADMIN_PORT)..."
if command -v ss >/dev/null 2>&1; then
  for port in "$QAFNEST_GUEST_PORT" "$QAFNEST_HOST_PORT" "$QAFNEST_CMS_PORT" "$QAFNEST_ADMIN_PORT"; do
    if ss -tln "( sport = :$port )" 2>/dev/null | grep -q ":$port"; then
      echo "INFO: Port $port is already listening (expected if reloading an existing qafnest-* PM2 process; verify no conflict with other sites)."
    fi
  done
fi

echo "==> [3/5] Installing workspace dependencies..."
npm ci

echo "==> [4/5] Building all 4 Next.js applications sequentially (memory-safe for shared VPS)..."
export NEXT_PUBLIC_GUEST_URL="${NEXT_PUBLIC_GUEST_URL:-https://qafnest.com}"
export NEXT_PUBLIC_HOST_PORTAL_URL="${NEXT_PUBLIC_HOST_PORTAL_URL:-https://business.qafnest.com}"
export NEXT_PUBLIC_CMS_PORTAL_URL="${NEXT_PUBLIC_CMS_PORTAL_URL:-https://cms.qafnest.com}"
export NEXT_PUBLIC_ADMIN_PORTAL_URL="${NEXT_PUBLIC_ADMIN_PORTAL_URL:-https://admin.qafnest.com}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1536}"

for app in guest host cms admin; do
  echo "  -> Building @qafnest/$app..."
  npm --prefix "apps/$app" run build
done

echo "==> [5/5] Starting/reloading only QafNest PM2 processes (preserving any other PM2 apps on this VPS)..."
pm2 startOrReload "$APP_DIR/ecosystem.config.cjs" --update-env
pm2 save

echo "==> Deployment complete! Checking QafNest & existing PM2 status:"
pm2 status
