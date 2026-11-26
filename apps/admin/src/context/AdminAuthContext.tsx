"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

import { adminPath } from "@/lib/adminUrl";
export interface AdminUser {
  email: string;
  name: string;
  role: "admin";
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  lang: "ar" | "en";
  setLang: (lang: "ar" | "en") => void;
  toggleLang: () => void;
  dir: "rtl" | "ltr";
  t: (en: string, ar: string) => string;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: "ar" | "en";
}) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<"ar" | "en">(initialLang);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("qafnest_admin_theme");
      const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const activeDark = stored === "dark" || (!stored && prefersDark);
      setIsDark(activeDark);
      if (activeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        const themeVal = next ? "dark" : "light";
        localStorage.setItem("qafnest_admin_theme", themeVal);
        document.cookie = `qafnest_admin_theme=${themeVal}; path=/; max-age=31536000; SameSite=Lax`;
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("qafnest_admin_lang") as "ar" | "en" | null;
      if (stored === "ar" || stored === "en") {
        setLangState(stored);
        document.documentElement.lang = stored;
        document.documentElement.dir = stored === "ar" ? "rtl" : "ltr";
      }
    } catch {}
  }, []);

  const setLang = (newLang: "ar" | "en") => {
    setLangState(newLang);
    try {
      localStorage.setItem("qafnest_admin_lang", newLang);
      document.cookie = `qafnest_admin_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    } catch {}
  };

  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");
  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
  const t = useCallback((en: string, ar: string) => (lang === "ar" ? ar : en), [lang]);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(adminPath("/api/admin/auth"), { method: "GET" });
      if (res.ok) {
        const data = (await res.json()) as { authenticated: boolean; user: AdminUser };
        if (data.authenticated && data.user) {
          setUser(data.user);
          return true;
        }
      }
      setUser(null);
      return false;
    } catch {
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(adminPath("/api/admin/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string; user?: AdminUser };

      if (!res.ok || !data.success) {
        return { success: false, error: data.message || "Invalid credentials." };
      }

      if (data.user) {
        setUser(data.user);
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Connection error." };
    }
  };

  const signOut = async () => {
    try {
      await fetch(adminPath("/api/admin/auth"), { method: "DELETE" });
    } catch {}
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.replace(adminPath("/login"));
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        checkAuth,
        lang,
        setLang,
        toggleLang,
        dir,
        t,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        isDark,
        toggleTheme,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

