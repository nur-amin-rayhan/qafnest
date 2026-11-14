import { ECOSYSTEM_URLS } from "@qafnest/shared";

export type HostLocale = "ar" | "en";

export const DEFAULT_HOST_LOCALE: HostLocale = "ar";
export const HOST_LOCALES: readonly HostLocale[] = ["ar", "en"] as const;
export const HOST_LANG_COOKIE = "qafnest_host_lang";

export const HOST_LOCALE_HEADER = "x-qafnest-host-locale";
export const HOST_PATHNAME_HEADER = "x-qafnest-host-pathname";

export function normalizeHostLocale(value?: string | null): HostLocale | null {
  if (value === "ar" || value === "en") return value;
  return null;
}

export function getHostLocaleFromPathname(pathname?: string | null): HostLocale | null {
  if (!pathname) return null;
  const cleanPath = pathname.split("?")[0]?.split("#")[0] || "/";
  const firstSegment = cleanPath.split("/").filter(Boolean)[0];
  return normalizeHostLocale(firstSegment);
}

export function stripHostLocaleFromPathname(pathname?: string | null): string {
  if (!pathname) return "/";
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = cleanPath.split("/");
  const maybeLocale = segments[1];
  if (maybeLocale === "ar" || maybeLocale === "en") {
    const rest = `/${segments.slice(2).join("/")}`;
    return rest === "/" ? "/" : rest.replace(/\/+$/, "") || "/";
  }
  return cleanPath === "/" ? "/" : cleanPath.replace(/\/+$/, "") || "/";
}

/**
 * Formats an internal Host portal path with an explicit `/ar` or `/en` prefix.
 * Preserves query strings and hash fragments while leaving external URLs and API routes untouched.
 */
export function localizeHostPath(targetPath: string, locale: HostLocale): string {
  if (!targetPath) return `/${locale}`;
  if (/^(?:https?:|mailto:|tel:)/i.test(targetPath) || targetPath.startsWith("#")) {
    return targetPath;
  }

  const hashIdx = targetPath.indexOf("#");
  const hashPart = hashIdx >= 0 ? targetPath.slice(hashIdx) : "";
  const withoutHash = hashIdx >= 0 ? targetPath.slice(0, hashIdx) : targetPath;

  const queryIdx = withoutHash.indexOf("?");
  const queryPart = queryIdx >= 0 ? withoutHash.slice(queryIdx) : "";
  const rawPathname = queryIdx >= 0 ? withoutHash.slice(0, queryIdx) : withoutHash;

  const normalizedPathname = rawPathname.startsWith("/") ? rawPathname : `/${rawPathname}`;
  if (normalizedPathname.startsWith("/api/") || normalizedPathname.startsWith("/_next/")) {
    return targetPath;
  }

  const strippedPathname = stripHostLocaleFromPathname(normalizedPathname);
  const localizedPathname = strippedPathname === "/" ? `/${locale}` : `/${locale}${strippedPathname}`;
  return `${localizedPathname}${queryPart}${hashPart}`;
}

export function getHostBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_HOST_URL ||
    ECOSYSTEM_URLS.host ||
    "https://business.qafnest.com";
  return raw.replace(/\/+$/, "");
}

export function isPrivateHostPath(pathname?: string | null): boolean {
  const stripped = stripHostLocaleFromPathname(pathname);
  return stripped.startsWith("/app") || stripped.startsWith("/properties/new");
}

/**
 * Builds canonical and hreflang alternate URLs for public Host portal routes.
 */
export function getHostSeoAlternates(
  pathname: string,
  locale: HostLocale,
  customBaseUrl?: string,
) {
  const baseUrl = (customBaseUrl || getHostBaseUrl()).replace(/\/+$/, "");
  const cleanPathname = stripHostLocaleFromPathname(pathname.split("?")[0] || "/");
  const canonicalPath = localizeHostPath(cleanPathname, locale);
  const arPath = localizeHostPath(cleanPathname, "ar");
  const enPath = localizeHostPath(cleanPathname, "en");

  return {
    canonical: `${baseUrl}${canonicalPath}`,
    languages: {
      ar: `${baseUrl}${arPath}`,
      en: `${baseUrl}${enPath}`,
      "x-default": `${baseUrl}${arPath}`,
    },
  };
}
