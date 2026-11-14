"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { getSeoAlternates } from "@/lib/localization/localeHelper";

export function DynamicSeoTags() {
  const pathname = usePathname();
  const { language } = useApp();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const { canonical, alternates } = getSeoAlternates(pathname, language);

    // Update or create canonical link tag
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonical);

    // Update or create alternate hreflang tags
    const hreflangEntries: Array<[string, string]> = [
      ["ar", alternates.languages.ar],
      ["en", alternates.languages.en],
      ["x-default", alternates.languages["x-default"]],
    ];

    hreflangEntries.forEach(([lang, href]) => {
      let altLink = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`) as HTMLLinkElement | null;
      if (!altLink) {
        altLink = document.createElement("link");
        altLink.setAttribute("rel", "alternate");
        altLink.setAttribute("hreflang", lang);
        document.head.appendChild(altLink);
      }
      altLink.setAttribute("href", href);
    });
  }, [pathname, language]);

  return null;
}

