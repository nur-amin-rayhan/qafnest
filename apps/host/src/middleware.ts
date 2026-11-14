import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

import {
  DEFAULT_HOST_LOCALE,
  HOST_LANG_COOKIE,
  HOST_LOCALE_HEADER,
  HOST_PATHNAME_HEADER,
  getHostLocaleFromPathname,
  localizeHostPath,
  normalizeHostLocale,
  stripHostLocaleFromPathname,
} from "@/lib/hostLocale";

const PROTECTED_PREFIXES = ["/app", "/properties/new"];

interface JwkCache {
  keys: Array<Record<string, unknown>>;
  expiresAt: number;
}
let jwkCache: JwkCache | null = null;

async function getGoogleJwksKeys(): Promise<Array<Record<string, unknown>>> {
  if (jwkCache && Date.now() < jwkCache.expiresAt) {
    return jwkCache.keys;
  }
  try {
    const res = await fetch(
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
      { cache: "no-store" }
    );
    if (!res.ok) return jwkCache?.keys || [];

    let maxAge = 3600;
    const cc = res.headers.get("cache-control");
    if (cc) {
      const match = cc.match(/max-age=(\d+)/i);
      if (match && match[1]) maxAge = parseInt(match[1], 10);
    }

    const data = (await res.json()) as { keys?: Array<Record<string, unknown>> };
    const keys = Array.isArray(data.keys) ? data.keys : [];
    jwkCache = {
      keys,
      expiresAt: Date.now() + Math.max(300, maxAge) * 1000,
    };
    return keys;
  } catch {
    return jwkCache?.keys || [];
  }
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyEdgeFirebaseToken(token?: string | null): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;
    const headerBytes = base64UrlToUint8Array(headerB64);
    const payloadBytes = base64UrlToUint8Array(payloadB64);

    const header = JSON.parse(new TextDecoder().decode(headerBytes));
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));

    if (header.alg !== "RS256" || !header.kid) return false;

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < nowSec - 60) return false;
    if (typeof payload.auth_time !== "number" || payload.auth_time > nowSec + 300) return false;

    const expectedProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (expectedProjectId) {
      if (payload.aud !== expectedProjectId) return false;
      if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) return false;
    } else if (!payload.iss?.startsWith("https://securetoken.google.com/")) {
      return false;
    }

    if (!payload.sub || typeof payload.sub !== "string") return false;

    const keys = await getGoogleJwksKeys();
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) return false;

    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const dataToVerify = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlToUint8Array(signatureB64);

    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signatureBytes as BufferSource,
      dataToVerify as BufferSource
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const routeLocale = getHostLocaleFromPathname(pathname);
  const langParam = normalizeHostLocale(request.nextUrl.searchParams.get("lang"));
  const cookieLocale = normalizeHostLocale(request.cookies.get(HOST_LANG_COOKIE)?.value);

  // Enforce explicit /ar or /en path prefixes and eliminate ?lang= duplicate URLs
  if (!routeLocale) {
    const preferredLocale = langParam ?? cookieLocale ?? DEFAULT_HOST_LOCALE;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete("lang");
    redirectUrl.pathname = localizeHostPath(pathname, preferredLocale);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.set(HOST_LANG_COOKIE, preferredLocale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return redirectResponse;
  }

  if (langParam) {
    const cleanTargetUrl = request.nextUrl.clone();
    cleanTargetUrl.searchParams.delete("lang");
    cleanTargetUrl.pathname = localizeHostPath(pathname, langParam);
    const redirectResponse = NextResponse.redirect(cleanTargetUrl);
    redirectResponse.cookies.set(HOST_LANG_COOKIE, langParam, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return redirectResponse;
  }

  const internalPathname = stripHostLocaleFromPathname(pathname);
  const isProtected = PROTECTED_PREFIXES.some((prefix) => internalPathname.startsWith(prefix));

  let response = NextResponse.next({ request });
  let isSupabaseVerified = false;

  if (isSupabaseConfigured()) {
    try {
      const { url, key } = getSupabaseConfig();
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
        cookieOptions: {
          name: "sb-qafnest-host-auth",
        },
      });

      // Cryptographically verify Supabase host user session (strictly exclude guests)
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        const isGuest = user.user_metadata?.role === "guest" || user.id === "00000000-0000-0000-0000-000000000001";
        if (!isGuest) {
          isSupabaseVerified = true;
        }
      }
    } catch {}
  }

  if (isProtected) {
    let isFirebaseVerified = false;
    const sessionCookie = request.cookies.get("qafnest_has_host_session")?.value;

    // Local dev host bypass in non-production
    if (process.env.NODE_ENV !== "production") {
      const isDevHost =
        sessionCookie === "dev_host_token" ||
        request.cookies.get("qafnest_host_dev")?.value === "1";
      if (isDevHost) {
        isFirebaseVerified = true;
      }
    }

    // Cryptographically verify token value (never accept plain "1" or arbitrary strings)
    if (!isFirebaseVerified && sessionCookie && sessionCookie !== "1") {
      isFirebaseVerified = await verifyEdgeFirebaseToken(sessionCookie);
    }

    // If neither Supabase nor Firebase token passed cryptographic verification, redirect to login
    if (!isSupabaseVerified && !isFirebaseVerified) {
      const redirectUrl = new URL(localizeHostPath("/login", routeLocale), request.url);
      redirectUrl.searchParams.set("returnUrl", `${pathname}${request.nextUrl.search}`);
      const redirectResponse = NextResponse.redirect(redirectUrl);

      // Strip any forged or invalid session cookies
      redirectResponse.cookies.delete("qafnest_has_host_session");
      return redirectResponse;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HOST_LOCALE_HEADER, routeLocale);
  requestHeaders.set(HOST_PATHNAME_HEADER, internalPathname);

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = internalPathname;

  const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });

  for (const cookie of response.cookies.getAll()) {
    rewriteResponse.cookies.set(cookie);
  }

  rewriteResponse.cookies.set(HOST_LANG_COOKIE, routeLocale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });

  if (isProtected) {
    rewriteResponse.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return rewriteResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
