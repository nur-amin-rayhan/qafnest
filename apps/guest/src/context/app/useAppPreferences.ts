"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/data/translations";
import { getLocaleFromPathname, localizePath } from "@/lib/localization/localeHelper";

export function getRiyadhDate(offsetDays: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value || 0);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day") + offsetDays))
    .toISOString()
    .slice(0, 10);
}

export function useAppPreferences(initialLang: Language = "en") {
  const [language, setLanguageState] = useState<Language>(initialLang);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);

  // Sync language with route prefix, cookie, localStorage & document attributes
  useEffect(() => {
    try {
      const pathLocale = getLocaleFromPathname(window.location.pathname);
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang") as Language | null;
      const storedLang =
        pathLocale ||
        (urlLang === "ar" || urlLang === "en"
          ? urlLang
          : (localStorage.getItem("qafnest_lang") as Language)) ||
        "ar";

      if (storedLang === "ar" || storedLang === "en") {
        setLanguageState(storedLang);
        document.documentElement.lang = storedLang;
        document.documentElement.dir = storedLang === "ar" ? "rtl" : "ltr";
        if (storedLang === "ar") {
          document.documentElement.classList.add("rtl");
        } else {
          document.documentElement.classList.remove("rtl");
        }
        localStorage.setItem("qafnest_lang", storedLang);
        document.cookie = `qafnest_lang=${storedLang}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    if (lang === "ar") {
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.classList.remove("rtl");
    }
    try {
      localStorage.setItem("qafnest_lang", lang);
      document.cookie = `qafnest_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const targetPath = localizePath(currentPath, lang);
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.delete("lang");
        const nextSearch = searchParams.toString();
        const search = nextSearch ? `?${nextSearch}` : "";
        const nextUrl = targetPath + search;
        if (nextUrl !== window.location.pathname + window.location.search) {
          // Keep language switching client-side so EN <-> AR updates URL, RTL, and copy without a reload flash
          window.history.replaceState(null, "", nextUrl);
        }
      }
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  // Sync theme with localStorage & documentElement
  useEffect(() => {
    try {
      const stored = localStorage.getItem("qafnest_theme");
      if (stored === "light") {
        setIsDarkTheme(false);
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        setIsDarkTheme(true);
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
        try {
          localStorage.setItem("qafnest_theme", "dark");
        } catch {}
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
        try {
          localStorage.setItem("qafnest_theme", "light");
        } catch {}
      }
      return next;
    });
  };

  const formatPrice = (baseSAR: number) => {
    const formatted = Math.round(baseSAR).toLocaleString();
    if (language === "ar") {
      return `${formatted} ر.س`;
    }
    return `${formatted} SAR`;
  };

  const formatTabby = (baseSAR: number) => {
    const split = Math.round(baseSAR / 4).toLocaleString();
    if (language === "ar") {
      return `${split} ر.س / شهر`;
    }
    return `${split} SAR / mo`;
  };

  return {
    language,
    setLanguage,
    toggleLanguage,
    isDarkTheme,
    toggleTheme,
    formatPrice,
    formatTabby,
  };
}

