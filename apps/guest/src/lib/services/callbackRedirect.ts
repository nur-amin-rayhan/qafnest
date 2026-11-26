import { NextRequest, NextResponse } from "next/server";

function buildAllowedOriginHosts(): Set<string> {
  const hosts = new Set<string>(["qafnest.com", "www.qafnest.com"]);
  if (process.env.NODE_ENV !== "production") {
    hosts.add("localhost:3000");
    hosts.add("localhost:3001");
    hosts.add("localhost:3002");
    hosts.add("localhost:3003");
    hosts.add("127.0.0.1:3000");
    hosts.add("localhost");
  }
  const envList = [
    process.env.NEXT_PUBLIC_GUEST_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    ...(process.env.ALLOWED_APP_ORIGINS || "").split(","),
  ];
  for (const item of envList) {
    if (!item || typeof item !== "string") continue;
    const trimmed = item.trim().replace(/\/+$/, "");
    if (!trimmed) continue;
    try {
      const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      if (parsed.host) hosts.add(parsed.host.toLowerCase());
    } catch {}
  }
  return hosts;
}

/**
 * Resolves the canonical, trusted origin for the guest application against an explicit allowlist.
 * Prevents open redirects via spoofed Origin / Host / X-Forwarded-Host headers.
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

  const allowedHosts = buildAllowedOriginHosts();

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") === "http" && process.env.NODE_ENV !== "production" ? "http" : "https";
  if (forwardedHost && typeof forwardedHost === "string") {
    const cleanHost = forwardedHost.split(",")[0].trim().toLowerCase();
    if (allowedHosts.has(cleanHost)) {
      const proto = cleanHost.startsWith("localhost") || cleanHost.startsWith("127.0.0.1") ? forwardedProto : "https";
      return `${proto}://${cleanHost}`;
    }
  }

  const host = request.headers.get("host");
  if (host && typeof host === "string") {
    const cleanHost = host.trim().toLowerCase();
    if (allowedHosts.has(cleanHost)) {
      const proto = cleanHost.startsWith("localhost") || cleanHost.startsWith("127.0.0.1") ? "http" : "https";
      return `${proto}://${cleanHost}`;
    }
  }

  try {
    const nextUrlOrigin = "nextUrl" in request && request.nextUrl ? request.nextUrl.origin : new URL(request.url).origin;
    const parsed = new URL(nextUrlOrigin);
    if (allowedHosts.has(parsed.host.toLowerCase())) {
      return parsed.origin;
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

