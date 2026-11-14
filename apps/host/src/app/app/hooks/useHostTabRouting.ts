"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Module } from "@/components/dashboard/HostTopNav";

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
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "app" && segments[1]) {
    const candidate = segments[1].toLowerCase();
    if (isValidModule(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function getPathForModule(module: Module): string {
  return `/app/${module}`;
}

export function useHostTabRouting(initialTab?: string) {
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

  // Sync state on mount and handle deep-link or root /app persistence
  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathTab = parseTabFromPathname(window.location.pathname);
    if (pathTab) {
      setActiveTabState(pathTab);
      try {
        localStorage.setItem(HOST_ACTIVE_TAB_STORAGE_KEY, pathTab);
      } catch {}
      return;
    }

    if (window.location.pathname === "/app") {
      try {
        const stored = localStorage.getItem(HOST_ACTIVE_TAB_STORAGE_KEY);
        if (isValidModule(stored)) {
          setActiveTabState(stored);
          window.history.replaceState({ tab: stored }, "", getPathForModule(stored));
          return;
        }
      } catch {}

      setActiveTabState("overview");
      window.history.replaceState({ tab: "overview" }, "", "/app/overview");
    }
  }, []);

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

  // Client-side tab navigation with URL path update and local persistence
  const setActiveTab = useCallback((newTab: Module) => {
    setActiveTabState(newTab);
    try {
      localStorage.setItem(HOST_ACTIVE_TAB_STORAGE_KEY, newTab);
    } catch {}

    if (typeof window !== "undefined") {
      const targetUrl = getPathForModule(newTab);
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ tab: newTab }, "", targetUrl);
      }
    }
  }, []);

  return {
    activeTab,
    setActiveTab,
  };
}

