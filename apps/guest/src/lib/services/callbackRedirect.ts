import { NextRequest, NextResponse } from "next/server";

/**
 * Resolves the canonical, trusted origin for the guest application.
 * Prevents redirection to non-existent domains, placeholders, or invalid strings.
 */
export function getCanonicalOrigin(request: NextRequest | Request): string {
  const envCandidates = [
    process.env.NEXT_PUBLIC_GUEST_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];

  for (const candidate of envCandidates) {
    if (candidate && typeof candidate === "string") {
      const trimmed = candidate.trim().replace(/\/+$/, "");
      if (
        !trimmed.includes(" ") &&
        !trimmed.includes("relative") &&
        (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
      ) {
        try {
          const parsed = new URL(trimmed);
          if (parsed.hostname && !parsed.hostname.includes(" ")) {
            return parsed.origin;
          }
        } catch {}
      }
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost && typeof forwardedHost === "string") {
    const cleanHost = forwardedHost.split(",")[0].trim();
    if (!cleanHost.includes(" ") && !cleanHost.includes("relative")) {
      return `${forwardedProto}://${cleanHost}`.replace(/\/+$/, "");
    }
  }

  const host = request.headers.get("host");
  if (host && typeof host === "string") {
    const cleanHost = host.trim();
    if (!cleanHost.includes(" ") && !cleanHost.includes("relative")) {
      const proto = cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1") ? "http" : "https";
      return `${proto}://${cleanHost}`.replace(/\/+$/, "");
    }
  }

  try {
    const nextOrigin = "nextUrl" in request && request.nextUrl ? request.nextUrl.origin : new URL(request.url).origin;
    if (nextOrigin && nextOrigin.startsWith("http") && !nextOrigin.includes(" ") && !nextOrigin.includes("relative")) {
      return nextOrigin.replace(/\/+$/, "");
    }
  } catch {}

  return process.env.NODE_ENV === "production" ? "https://qafnest.com" : "http://localhost:3000";
}

/**
 * Builds a secure, fully-qualified redirect URL strictly rooted on the canonical guest origin.
 */
export function buildSafeCallbackRedirect(
  origin: string,
  propertyId: string | null | undefined,
  params: Record<string, string | number | null | undefined>,
  locale: "ar" | "en" = "ar"
): NextResponse {
  const safeLocale: "ar" | "en" = locale === "en" ? "en" : "ar";
  let targetPath = `/${safeLocale}/my-bookings`;

  if (propertyId && typeof propertyId === "string") {
    const cleanId = propertyId.trim();
    if (cleanId && !cleanId.includes(" ") && !cleanId.includes("relative") && !cleanId.includes("/")) {
      targetPath = `/${safeLocale}/property/${cleanId}/reserve`;
    }
  }

  const redirectUrl = new URL(targetPath, origin);
  for (const [key, val] of Object.entries(params)) {
    if (val !== null && val !== undefined && val !== "") {
      redirectUrl.searchParams.set(key, String(val));
    }
  }

  const response = NextResponse.redirect(redirectUrl.toString(), 303);
  response.cookies.set("qafnest_lang", safeLocale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
  return response;
}

