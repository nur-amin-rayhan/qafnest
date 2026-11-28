"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  HOST_LANG_COOKIE,
  getHostLocaleFromPathname,
  localizeHostPath,
  type HostLocale,
} from "@/lib/hostLocale";

function persistLocaleDomAndStorage(locale: HostLocale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  try {
    localStorage.setItem(HOST_LANG_COOKIE, locale);
    document.cookie = `${HOST_LANG_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

export function useHostLanguage(initialLang: HostLocale = "ar") {
  const router = useRouter();
  const [lang, setLangState] = useState<HostLocale>(initialLang);

  const applyLang = useCallback((newLang: HostLocale) => {
    setLangState(newLang);
    persistLocaleDomAndStorage(newLang);

    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("lang");
        const targetPathname = localizeHostPath(url.pathname, newLang);
        if (url.pathname !== targetPathname) {
          router.replace(`${targetPathname}${url.search}${url.hash}`);
        } else if (window.location.search !== url.search) {
          window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }
      } catch {}
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pathLocale = getHostLocaleFromPathname(window.location.pathname) ?? initialLang;
    setLangState(pathLocale);
    persistLocaleDomAndStorage(pathLocale);
  }, [initialLang]);

  const toggleLang = useCallback(() => {
    applyLang(lang === "ar" ? "en" : "ar");
  }, [applyLang, lang]);

  const t = useCallback((en: string, ar: string) => (lang === "ar" ? ar : en), [lang]);

  return {
    lang,
    applyLang,
    toggleLang,
    t,
  };
}
