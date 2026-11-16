/**
 * Cross-App Supabase Shared State Bridge
 * Synchronizes shared operational JSON stores across isolated deployments
 * (Guest :3000, Host :3001, CMS :3002, Admin :3003) using Supabase REST
 * (`platform_shared_state` table with automatic fallback to private Storage bucket
 * `qafnest-private-state/shared-state/`).
 */

const PRIVATE_STATE_BUCKET = "qafnest-private-state";
let tableAvailable: boolean | null = null;
let bucketEnsured = false;

function getSupabaseServiceEnv(): { url: string; serviceKey: string } | null {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const env = proc?.env;
  if (!env) return null;
  const url = (env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || "").trim();
  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

function normalizeRemoteKey(fileName: string): string {
  return String(fileName || "state")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function serviceHeaders(serviceKey: string, extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    ...(extra || {}),
  };
}

async function ensurePrivateBucket(url: string, serviceKey: string): Promise<void> {
  if (bucketEnsured) return;
  try {
    const res = await fetch(`${url}/storage/v1/bucket/${PRIVATE_STATE_BUCKET}`, {
      headers: serviceHeaders(serviceKey),
      cache: "no-store",
    });
    if (res.ok) {
      bucketEnsured = true;
      return;
    }
    const createRes = await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: serviceHeaders(serviceKey, { "Content-Type": "application/json" }),
      body: JSON.stringify({ id: PRIVATE_STATE_BUCKET, name: PRIVATE_STATE_BUCKET, public: false }),
    });
    if (createRes.ok || createRes.status === 409) {
      bucketEnsured = true;
    }
  } catch {
    // non-fatal during build / offline test scripts
  }
}

export async function fetchRemoteSharedState<T = unknown>(keyName: string): Promise<T | null> {
  const cfg = getSupabaseServiceEnv();
  if (!cfg) return null;
  const key = normalizeRemoteKey(keyName);

  if (tableAvailable !== false) {
    try {
      const res = await fetch(
        `${cfg.url}/rest/v1/platform_shared_state?select=value&key=eq.${encodeURIComponent(key)}&limit=1`,
        {
          headers: serviceHeaders(cfg.serviceKey, { Accept: "application/json" }),
          cache: "no-store",
        }
      );
      if (res.ok) {
        tableAvailable = true;
        const rows = (await res.json()) as Array<{ value?: T }>;
        if (Array.isArray(rows) && rows[0] && rows[0].value !== undefined) {
          return rows[0].value;
        }
      } else if (res.status === 404 || res.status === 400) {
        tableAvailable = false;
      }
    } catch {
      // fall through to storage bucket
    }
  }

  try {
    const res = await fetch(
      `${cfg.url}/storage/v1/object/authenticated/${PRIVATE_STATE_BUCKET}/shared-state/${encodeURIComponent(key)}`,
      {
        headers: serviceHeaders(cfg.serviceKey),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function pushRemoteSharedState(keyName: string, data: unknown): Promise<boolean> {
  const cfg = getSupabaseServiceEnv();
  if (!cfg) return false;
  const key = normalizeRemoteKey(keyName);
  let synced = false;

  if (tableAvailable !== false) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/platform_shared_state?on_conflict=key`, {
        method: "POST",
        headers: serviceHeaders(cfg.serviceKey, {
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        }),
        body: JSON.stringify({
          key,
          value: data,
          updated_at: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        tableAvailable = true;
        synced = true;
      } else if (res.status === 404 || res.status === 400) {
        tableAvailable = false;
      }
    } catch {
      // fall through
    }
  }

  try {
    await ensurePrivateBucket(cfg.url, cfg.serviceKey);
    const storageRes = await fetch(
      `${cfg.url}/storage/v1/object/${PRIVATE_STATE_BUCKET}/shared-state/${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: serviceHeaders(cfg.serviceKey, {
          "Content-Type": "application/json",
          "x-upsert": "true",
        }),
        body: JSON.stringify(data),
      }
    );
    if (storageRes.ok) synced = true;
  } catch {
    // non-fatal
  }

  return synced;
}
