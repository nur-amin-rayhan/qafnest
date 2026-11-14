export type AppLocale = "ar" | "en";

export function normalizeAppLocale(value: unknown): AppLocale | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().toLowerCase();
  if (clean === "en" || clean.startsWith("en-") || clean.startsWith("en_")) {
    return "en";
  }
  if (clean === "ar" || clean.startsWith("ar-") || clean.startsWith("ar_")) {
    return "ar";
  }
  return null;
}

function readCookieFromHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(eqIdx + 1).trim());
    }
  }
  return null;
}

export function resolveRequestLocale(
  request: Request,
  explicitLocale?: unknown
): AppLocale {
  const direct = normalizeAppLocale(explicitLocale);
  if (direct) return direct;

  try {
    const url = new URL(request.url);
    const fromQuery =
      normalizeAppLocale(url.searchParams.get("locale")) ||
      normalizeAppLocale(url.searchParams.get("lang"));
    if (fromQuery) return fromQuery;
  } catch {}

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refPath = new URL(referer).pathname;
      if (refPath === "/en" || refPath.startsWith("/en/")) return "en";
      if (refPath === "/ar" || refPath.startsWith("/ar/")) return "ar";
    } catch {}
  }

  const fromCookie = normalizeAppLocale(
    readCookieFromHeader(request.headers.get("cookie"), "qafnest_lang")
  );
  if (fromCookie) return fromCookie;

  return "ar";
}
