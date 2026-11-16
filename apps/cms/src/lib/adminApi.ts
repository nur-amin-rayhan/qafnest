import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/adminAuth";

export function isAdminRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const rawToken = bearerToken || cookieToken;
  const payload = rawToken ? verifyAdminToken(rawToken) : null;
  return Boolean(payload && payload.role === "admin");
}

export function createAdminDataClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) return null;
  const { url } = getSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
