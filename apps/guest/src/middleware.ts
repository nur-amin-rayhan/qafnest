import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import { verifyPortalSessionTokenEdge } from "@qafnest/shared/portalSessionEdge";

const PROTECTED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/api/admin",
  "/account",
  "/my-bookings",
  "/profile",
  "/settings",
  "/wishlist",
];

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
    } else if (process.env.NODE_ENV === "production") {
      return false;
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

  // 1. Exclude API routes, next internals, and static assets from locale prefixing
  const isApi = pathname.startsWith("/api/");
  const isStatic =
    pathname.startsWith("/_next/") ||
    pathname === "/firebase-messaging-sw.js" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|ico|json|txt|xml|js|css|map)$/i.test(pathname);

  if (isStatic) {
    return NextResponse.next({ request });
  }

  // 2. Strict URL localization for public pages: enforce /ar or /en prefix
  const isAr = pathname === "/ar" || pathname.startsWith("/ar/");
  const isEn = pathname === "/en" || pathname.startsWith("/en/");

  if (!isApi && !isAr && !isEn) {
    const rawLang = request.cookies.get("qafnest_lang")?.value;
    const targetLocale = rawLang === "en" ? "en" : "ar";
    const redirectUrl = new URL(
      `/${targetLocale}${pathname === "/" ? "" : pathname}${request.nextUrl.search}`,
      request.url
    );
    const redirectResponse = NextResponse.redirect(redirectUrl, 307);
    redirectResponse.cookies.set("qafnest_lang", targetLocale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return redirectResponse;
  }

  const activeLocale = isAr ? "ar" : isEn ? "en" : (request.cookies.get("qafnest_lang")?.value === "en" ? "en" : "ar");
  const internalPath = isApi ? pathname : (pathname.replace(/^\/(?:ar|en)(?=\/|$)/, "") || "/");
  const isProtected = PROTECTED_PREFIXES.some((prefix) => internalPath.startsWith(prefix));

  let response = NextResponse.next({ request });
  let isSupabaseVerified = false;
  let verifiedSubject: string | null = null;
  let isAdminUser = false;

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
          name: "sb-qafnest-guest-auth",
        },
      });

      // Cryptographically verify Supabase user session token & enforce guest portal decoupling
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        const devHostId = process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002";
        const isHost =
          user.app_metadata?.role === "host" ||
          user.user_metadata?.role === "host" ||
          user.id === devHostId;
        if (!isHost) {
          isSupabaseVerified = true;
          verifiedSubject = user.id;
          if (user.app_metadata?.role === "admin") {
            isAdminUser = true;
          } else if (internalPath === "/admin" || internalPath.startsWith("/admin/") || internalPath === "/api/admin" || internalPath.startsWith("/api/admin/")) {
            const { data: reviewAdmin } = await supabase
              .from("review_admins")
              .select("auth_subject")
              .eq("auth_subject", user.id)
              .maybeSingle();
            if (reviewAdmin?.auth_subject) {
              isAdminUser = true;
            }
          }
        }
      }
    } catch {}
  }

  if (isProtected) {
    let isSessionCookieVerified = false;
    const sessionCookie = request.cookies.get("qafnest_has_session")?.value;

    if (sessionCookie) {
      const signedGuest = await verifyPortalSessionTokenEdge(sessionCookie, "guest");
      if (signedGuest) {
        isSessionCookieVerified = true;
        if (!verifiedSubject) verifiedSubject = signedGuest.sub;
      } else if (process.env.NODE_ENV !== "production" && sessionCookie === "dev_guest_token") {
        isSessionCookieVerified = true;
        if (!verifiedSubject) {
          verifiedSubject = process.env.NEXT_PUBLIC_DEV_GUEST_ID || "00000000-0000-0000-0000-000000000001";
        }
      } else if (sessionCookie !== "1" && sessionCookie !== "dev_guest_token") {
        const isFbValid = await verifyEdgeFirebaseToken(sessionCookie);
        if (isFbValid) {
          isSessionCookieVerified = true;
          try {
            const payloadBytes = base64UrlToUint8Array(sessionCookie.split(".")[1] || "");
            const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
            if (typeof payload?.sub === "string" && !verifiedSubject) {
              verifiedSubject = payload.sub;
            }
          } catch {}
        }
      }
    }

    // If neither Supabase nor Firebase/portal session passed verification, return 401 for API or redirect for pages
    if (!isSupabaseVerified && !isSessionCookieVerified) {
      if (isApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const redirectUrl = new URL(`/${activeLocale}/?auth=required`, request.url);
      redirectUrl.searchParams.set("returnUrl", `/${activeLocale}${internalPath}`);
      const redirectResponse = NextResponse.redirect(redirectUrl);

      // Strip any forged, dummy, or invalid session cookies
      redirectResponse.cookies.delete("qafnest_has_session");
      redirectResponse.cookies.delete("qafnest_verified_guest");
      return redirectResponse;
    }

    // Enforce admin role / review_admins check on /admin and /api/admin routes
    const isAdminRoute =
      internalPath === "/admin" ||
      internalPath.startsWith("/admin/") ||
      internalPath === "/api/admin" ||
      internalPath.startsWith("/api/admin/");
    if (isAdminRoute && !isAdminUser) {
      if (verifiedSubject && isSupabaseConfigured()) {
        try {
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
          const { url } = getSupabaseConfig();
          if (serviceKey && url) {
            const res = await fetch(
              `${url}/rest/v1/review_admins?auth_subject=eq.${encodeURIComponent(verifiedSubject)}&select=auth_subject&limit=1`,
              {
                headers: {
                  apikey: serviceKey,
                  Authorization: `Bearer ${serviceKey}`,
                },
                cache: "no-store",
              }
            );
            if (res.ok) {
              const rows = (await res.json()) as Array<{ auth_subject?: string }>;
              if (Array.isArray(rows) && rows.length > 0) {
                isAdminUser = true;
              }
            }
          }
        } catch {}
      }

      if (!isAdminUser) {
        if (isApi) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL(`/${activeLocale}/`, request.url));
      }
    }
  }

  // For localized pages, internally rewrite to internalPath with active locale while preserving refreshed Supabase cookies
  if (!isApi) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = internalPath;
    rewriteUrl.searchParams.set("lang", activeLocale);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-qafnest-locale", activeLocale);
    requestHeaders.set("x-qafnest-pathname", internalPath);

    const pendingCookies = response.cookies.getAll();
    const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
    for (const c of pendingCookies) {
      rewriteResponse.cookies.set(c);
    }
    response = rewriteResponse;
  }

  response.cookies.set("qafnest_lang", activeLocale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });

  if (
    process.env.NODE_ENV !== "production" &&
    !isApi &&
    request.headers.get("sec-fetch-dest") === "document"
  ) {
    response.headers.set("Clear-Site-Data", '"cache"');
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|firebase-messaging-sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|eot|js|css)$).*)",
  ],
};
