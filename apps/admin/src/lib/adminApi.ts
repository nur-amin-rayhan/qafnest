import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/adminAuth";

export function getAdminTokenFromRequest(request: NextRequest | Request): string | null {
  if ("cookies" in request && typeof request.cookies?.get === "function") {
    const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (cookieToken) return cookieToken;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader && /^Bearer\s+/i.test(authHeader)) {
    return authHeader.replace(/^Bearer\s+/i, "").trim();
  }

  const rawCookie = request.headers.get("cookie");
  if (rawCookie) {
    const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`));
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return null;
}

export function getAdminSession(request: NextRequest | Request) {
  const token = getAdminTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyAdminToken(token);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

export function isAdminRequest(request: NextRequest | Request): boolean {
  return Boolean(getAdminSession(request));
}

export function createAdminDataClient() {
  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ""
  ).trim();

  if (!serviceRoleKey) {
    console.warn("Notice: SUPABASE_SERVICE_ROLE_KEY not configured for admin data operations.");
    return null;
  }

  const { url } = getSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
