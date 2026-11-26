"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Module } from "@/components/dashboard/HostTopNav";
import {
  getHostLocaleFromPathname,
  localizeHostPath,
  stripHostLocaleFromPathname,
  type HostLocale,
} from "@/lib/hostLocale";

export const HOST_ACTIVE_TAB_STORAGE_KEY = "qafnest_host_active_tab";

export const VALID_MODULES: readonly Module[] = [
  "overview",
  "properties",
  "reservations",
  "calendar",
  "analytics",
  "reviews",
  "finance",
  "pricing",
  "settings",
] as const;

export function isValidModule(val: unknown): val is Module {
  return typeof val === "string" && VALID_MODULES.includes(val as Module);
}

export function parseTabFromPathname(pathname?: string | null): Module | null {
  if (!pathname) return null;
  const cleanPath = stripHostLocaleFromPathname(pathname);
  const segments = cleanPath.split("/").filter(Boolean);
  if (segments[0] === "app" && segments[1]) {
    const rawCandidate = segments[1].toLowerCase();
    const candidate = rawCandidate === "bookings" ? "reservations" : rawCandidate;
    if (isValidModule(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function getPathForModule(module: Module, locale: HostLocale = "ar"): string {
  return localizeHostPath(`/app/${module}`, locale);
}

export function useHostTabRouting(initialTab?: string, lang: HostLocale = "ar") {
  const pathname = usePathname();

  const getInitialTab = (): Module => {
    if (isValidModule(initialTab)) {
      return initialTab;
    }
    const pathTab = parseTabFromPathname(pathname);
    if (pathTab) {
      return pathTab;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(HOST_ACTIVE_TAB_STORAGE_KEY);
        if (isValidModule(stored)) {
          return stored;
        }
      } catch {}
    }
    return "overview";
  };

  const [activeTab, setActiveTabState] = useState<Module>(getInitialTab);

  // Sync state on mount and handle deep-link or root /[lang]/app persistence
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = window.location.pathname;
    const activeLocale = getHostLocaleFromPathname(currentPath) ?? lang;
    const pathTab = parseTabFromPathname(currentPath);

    if (pathTab) {
      setActiveTabState(pathTab);
      try {
        localStorage.setItem(HOST_ACTIVE_TAB_STORAGE_KEY, pathTab);
      } catch {}
      return;
    }

    if (stripHostLocaleFromPathname(currentPath) === "/app") {
      const search = window.location.search || "";
      try {
        const stored = localStorage.getItem(HOST_ACTIVE_TAB_STORAGE_KEY);
        if (isValidModule(stored)) {
          setActiveTabState(stored);
          window.history.replaceState(
            { tab: stored },
            "",
            `${getPathForModule(stored, activeLocale)}${search}`
          );
          return;
        }
      } catch {}

      setActiveTabState("overview");
      window.history.replaceState(
        { tab: "overview" },
        "",
        `${getPathForModule("overview", activeLocale)}${search}`
      );
    }
  }, [lang]);

  // Listen to browser Back / Forward buttons (popstate)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = (e: PopStateEvent) => {
      const stateTab = e.state?.tab;
      if (isValidModule(stateTab)) {
        setActiveTabState(stateTab);
        try {
          localStorage.setItem(HOST_ACTIVE_TAB_STORAGE_KEY, stateTab);
        } catch {}
        return;
      }

      const pathTab = parseTabFromPathname(window.location.pathname);
      if (pathTab) {
        setActiveTabState(pathTab);
        try {
          localStorage.setItem(HOST_ACTIVE_TAB_STORAGE_KEY, pathTab);
        } catch {}
      } else {
        setActiveTabState("overview");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Client-side tab navigation with locale-prefixed URL path update and local persistence
  const setActiveTab = useCallback(
    (newTab: Module) => {
      setActiveTabState(newTab);
      try {
        localStorage.setItem(HOST_ACTIVE_TAB_STORAGE_KEY, newTab);
      } catch {}

      if (typeof window !== "undefined") {
        const activeLocale = getHostLocaleFromPathname(window.location.pathname) ?? lang;
        const targetUrl = getPathForModule(newTab, activeLocale);
        if (window.location.pathname !== targetUrl) {
          window.history.pushState({ tab: newTab }, "", targetUrl);
        }
      }
    },
    [lang]
  );

  return {
    activeTab,
    setActiveTab,
  };
}
