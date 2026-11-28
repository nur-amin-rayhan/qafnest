"use client";

import React from "react";
import Link from "next/link";
import { ECOSYSTEM_URLS } from "@qafnest/shared";
import type { User } from "@supabase/supabase-js";
import type { HostProfile } from "@/context/HostAuthContext";
import {
  Building2,
  Globe,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Plus,
  Sun,
  X,
} from "lucide-react";

interface HostNavbarProps {
  lang: "ar" | "en";
  setLang: (lang: "ar" | "en") => void;
  mobileMenu: boolean;
  setMobileMenu: (open: boolean) => void;
  mounted: boolean;
  user: User | null;
  profile: HostProfile | null;
  signOut: () => void | Promise<void>;
  openHostAuthModal: (mode: "signin" | "signup", returnUrl?: string) => void;
  t: (en: string, ar: string) => string;
  theme?: "light" | "dark";
  toggleTheme?: () => void;
}

export function HostNavbar({
  lang,
  setLang,
  mobileMenu,
  setMobileMenu,
  mounted,
  user,
  profile,
  signOut,
  openHostAuthModal,
  t,
  theme = "light",
  toggleTheme,
}: HostNavbarProps) {
  const homeHref = mounted && user ? `/${lang}/app` : `/${lang}`;

  React.useEffect(() => {
    if (!mobileMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenu(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenu, setMobileMenu]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0c0d1b]/95 text-slate-900 dark:text-slate-100 shadow-xs backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex h-[72px] sm:h-[80px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
        {/* Left: Brand Logo + Exactly 2 Simple Nav Links (Hosts & Visitors) */}
        <div className="flex items-center gap-6 lg:gap-10">
          <Link href={homeHref} className="inline-flex items-center gap-2 select-none">
            <span className="text-[26px] sm:text-[30px] font-black tracking-[-0.04em] text-slate-900 dark:text-white">
              Qaf<span className="text-[#4F2396] dark:text-purple-400">Nest</span>
              <span className="text-[#FF9750]">.</span>
            </span>
            <span className="rounded-full bg-purple-100 dark:bg-purple-950/60 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-[#4F2396] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
              {t("BUSINESS", "أعمال")}
            </span>
          </Link>

          {/* Exactly 2 Clean Nav Links: Hosts (Active) & Visitors (Guest site) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
            <Link
              href={homeHref}
              className="relative py-1 text-[#4F2396] dark:text-purple-300 after:absolute after:-bottom-1 after:left-1/2 after:h-[2.5px] after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-[#4F2396] dark:after:bg-purple-400"
            >
              {t("Hosts", "المضيفين")}
            </Link>
            <a
              href={`${ECOSYSTEM_URLS.guest}/${lang}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 dark:text-slate-400 hover:text-[#4F2396] dark:hover:text-purple-300 transition"
            >
              {t("Visitors", "الزوار")}
            </a>
          </nav>
        </div>

        {/* Right: Theme Toggle + Language Switch + Host Login + Register Your Property */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 hover:bg-violet-50 dark:hover:bg-purple-950/40 hover:border-violet-200 dark:hover:border-purple-800/60 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              title={theme === "dark" ? t("Switch to Light Mode", "تفعيل الوضع الفاتح") : t("Switch to Dark Mode", "تفعيل الوضع الداكن")}
              aria-label={theme === "dark" ? t("Switch to Light Mode", "تفعيل الوضع الفاتح") : t("Switch to Dark Mode", "تفعيل الوضع الداكن")}
            >
              {theme === "dark" ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} className="text-slate-600 dark:text-slate-300" />
              )}
            </button>
          )}

          {/* Language Switch Button */}
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-purple-950/40 hover:border-violet-200 dark:hover:border-purple-800/60 hover:text-[#4F2396] dark:hover:text-purple-300 transition-all cursor-pointer shrink-0"
            title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Globe size={15} className="text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="leading-none">{lang === "ar" ? "English" : "العربية"}</span>
          </button>

          {mounted && user ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/${lang}/app`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 px-4 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-purple-950/40 hover:text-[#4F2396] dark:hover:text-purple-300 transition"
              >
                <Building2 size={16} className="text-[#4F2396] dark:text-purple-300" />
                <span>
                  {profile?.full_name ||
                    user.user_metadata?.full_name ||
                    user.phone ||
                    user.email?.split("@")[0] ||
                    t("Host Dashboard", "لوحة التحكم")}
                </span>
              </Link>

              <Link
                href={`/${lang}/properties/new?mode=new`}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] px-4 text-xs sm:text-sm font-bold text-white shadow-sm shadow-[#4F2396]/20 transition active:scale-[0.98]"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span>{t("Add Property", "إضافة عقار")}</span>
              </Link>

              <button
                type="button"
                onClick={() => signOut()}
                title={t("Sign Out", "تسجيل الخروج")}
                className="grid h-10 w-10 place-items-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              {/* Host Login */}
              <Link
                href={`/${lang}/login`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 px-4 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-purple-950/40 hover:text-[#4F2396] dark:hover:text-purple-300 transition cursor-pointer"
              >
                <LogIn size={16} />
                <span>{t("Host Login", "تسجيل الدخول")}</span>
              </Link>

              {/* Register Property (Primary CTA) */}
              <button
                type="button"
                onClick={() => openHostAuthModal("signup", `/${lang}/properties/new?mode=new`)}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] px-5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-[#4F2396]/20 transition active:scale-[0.98] cursor-pointer"
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span>{t("Register Your Property", "سجل عقارك")}</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button + Theme Toggle for Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300"
              title={theme === "dark" ? t("Light Mode", "فاتح") : t("Dark Mode", "داكن")}
            >
              {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600 dark:text-slate-300" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300"
            aria-label="Open menu"
          >
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenu && (
        <div className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c0d1b] px-5 py-4 text-slate-900 dark:text-white shadow-xl md:hidden space-y-2.5">
          <Link
            href={homeHref}
            onClick={() => setMobileMenu(false)}
            className="block rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#4F2396] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40"
          >
            {t("Hosts", "المضيفين")}
          </Link>
          <a
            href={`${ECOSYSTEM_URLS.guest}/${lang}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenu(false)}
            className="block rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t("Visitors", "الزوار")}
          </a>
          <div className="pt-2 flex flex-col gap-2">
            {mounted && user ? (
              <>
                <Link
                  href={`/${lang}/app`}
                  onClick={() => setMobileMenu(false)}
                  className="w-full rounded-xl bg-purple-100 dark:bg-purple-950/60 py-3 text-center text-sm font-bold text-[#4F2396] dark:text-purple-300"
                >
                  {t("Host Dashboard", "لوحة تحكم المضيف")}
                </Link>
                <Link
                  href={`/${lang}/properties/new?mode=new`}
                  onClick={() => setMobileMenu(false)}
                  className="w-full rounded-xl bg-[#4F2396] py-3 text-center text-sm font-bold text-white shadow-sm"
                >
                  {t("Register Your Property", "سجل عقارك")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenu(false);
                    signOut();
                  }}
                  className="w-full rounded-xl border border-rose-200 dark:border-rose-900/50 py-2.5 text-center text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  {t("Sign Out", "تسجيل الخروج")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${lang}/login`}
                  onClick={() => setMobileMenu(false)}
                  className="w-full block rounded-xl border border-slate-200 dark:border-slate-800 py-3 text-center text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t("Host Login", "تسجيل الدخول")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenu(false);
                    openHostAuthModal("signup", `/${lang}/properties/new?mode=new`);
                  }}
                  className="w-full rounded-xl bg-[#4F2396] py-3 text-center text-sm font-bold text-white shadow-sm cursor-pointer"
                >
                  {t("Register Your Property", "سجل عقارك")}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenu(false);
                setLang(lang === "ar" ? "en" : "ar");
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 py-2.5 text-center text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {lang === "ar" ? "Switch to English" : "التحويل إلى العربية"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
