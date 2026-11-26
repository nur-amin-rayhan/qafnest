import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import { verifyPortalSessionTokenEdge } from "@qafnest/shared/portalSessionEdge";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    pathname === "/firebase-messaging-sw.js"
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
        const devGuestId =
          process.env.NEXT_PUBLIC_DEV_GUEST_ID || "00000000-0000-0000-0000-000000000001";
        const isGuest =
          user.app_metadata?.role === "guest" ||
          user.app_metadata?.role === "admin" ||
          user.user_metadata?.role === "guest" ||
          user.id === devGuestId;
        if (!isGuest) {
          isSupabaseVerified = true;
        }
      }
    } catch {}
  }

  if (isProtected) {
    let isHostPortalVerified = false;
    const sessionCookie = request.cookies.get("qafnest_has_host_session")?.value;

    // Local dev host bypass in non-production
    if (process.env.NODE_ENV !== "production") {
      const isDevHost =
        sessionCookie === "dev_host_token" ||
        request.cookies.get("qafnest_host_dev")?.value === "1";
      if (isDevHost) {
        isHostPortalVerified = true;
      }
    }

    // Cryptographically verify signed HttpOnly host portal cookie
    if (!isHostPortalVerified && sessionCookie) {
      const verifiedHostToken = await verifyPortalSessionTokenEdge(sessionCookie, "host");
      if (verifiedHostToken) {
        isHostPortalVerified = true;
      }
    }

    // If neither Supabase nor signed host portal cookie passed verification, redirect to login
    if (!isSupabaseVerified && !isHostPortalVerified) {
      const redirectUrl = new URL(localizeHostPath("/login", routeLocale), request.url);
      redirectUrl.searchParams.set("returnUrl", `${pathname}${request.nextUrl.search}`);
      const redirectResponse = NextResponse.redirect(redirectUrl);

      // Strip any forged or invalid session cookies
      redirectResponse.cookies.delete("qafnest_has_host_session");
      redirectResponse.cookies.delete("qafnest_host_dev");
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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|firebase-messaging-sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|eot|js|css)$).*)",
  ],
};
