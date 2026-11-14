"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  getHostBaseUrl,
  getHostLocaleFromPathname,
  getHostSeoAlternates,
  isPrivateHostPath,
  type HostLocale,
} from "@/lib/hostLocale";

interface DynamicHostSeoTagsProps {
  lang: HostLocale;
}

function upsertHeadLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    if (hreflang) {
      el.hreflang = hreflang;
    }
    document.head.appendChild(el);
  }
  el.href = href;
}

export function DynamicHostSeoTags({ lang }: DynamicHostSeoTagsProps) {
  const pathname = usePathname() || `/${lang}`;
  const resolvedLocale = getHostLocaleFromPathname(pathname) ?? lang;

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (isPrivateHostPath(pathname)) {
      document.head
        .querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]')
        .forEach((node) => node.remove());
      return;
    }

    const baseUrl = typeof window !== "undefined" ? window.location.origin : getHostBaseUrl();
    const { canonical, languages } = getHostSeoAlternates(pathname, resolvedLocale, baseUrl);

    upsertHeadLink("canonical", canonical);
    upsertHeadLink("alternate", languages.ar, "ar");
    upsertHeadLink("alternate", languages.en, "en");
    upsertHeadLink("alternate", languages["x-default"], "x-default");
  }, [pathname, resolvedLocale]);

  return null;
}
