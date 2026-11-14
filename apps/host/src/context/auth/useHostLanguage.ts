"use client";

import { useState, useEffect, useCallback } from "react";

export function useHostLanguage(initialLang: "ar" | "en" = "ar") {
  const [lang, setLangState] = useState<"ar" | "en">(initialLang);

  const applyLang = useCallback((newLang: "ar" | "en") => {
    setLangState(newLang);
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
      try {
        localStorage.setItem("qafnest_host_lang", newLang);
        document.cookie = `qafnest_host_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("lang", newLang);
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get("lang");
      if (urlLang === "en" || urlLang === "ar") {
        applyLang(urlLang);
        return;
      }
      const stored = localStorage.getItem("qafnest_host_lang");
      if (stored === "en" || stored === "ar") {
        applyLang(stored);
      } else {
        applyLang(initialLang);
      }
    } catch {}
  }, [applyLang, initialLang]);

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

