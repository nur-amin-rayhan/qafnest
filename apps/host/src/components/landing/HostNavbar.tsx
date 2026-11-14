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
  Plus,
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
}: HostNavbarProps) {
  const homeHref = mounted && user ? `/${lang}/app` : `/${lang}`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-violet-100 bg-white/95 text-slate-900 shadow-xs backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex h-[80px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8">
        {/* Left: Brand Logo + Exactly 2 Simple Nav Links (Hosts & Visitors) */}
        <div className="flex items-center gap-8 lg:gap-12">
          <Link href={homeHref} className="inline-flex items-center gap-1.5 select-none">
            <span className="text-[28px] sm:text-[32px] font-black tracking-[-0.05em] text-[#4F2396]">
              Qaf<span className="text-[#7c3aed]">Nest</span>
              <span className="text-[#FF9750]">.</span>
            </span>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase text-[#4F2396]">
              {t("BUSINESS", "أعمال")}
            </span>
          </Link>

          {/* Exactly 2 Clean Nav Links: Hosts (Active) & Visitors (Guest site) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-extrabold">
            <Link
              href={homeHref}
              className="relative py-1 text-[#4F2396] after:absolute after:-bottom-1 after:left-1/2 after:h-[2.5px] after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-[#FF9750]"
            >
              {t("Hosts", "المضيفين")}
            </Link>
            <a
              href={`${ECOSYSTEM_URLS.guest}/${lang}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-[#4F2396] transition"
            >
              {t("Visitors", "الزوار")}
            </a>
          </nav>
        </div>

        {/* Right: Language Switch + Host Login + Register Your Property (Exactly 2 CTAs) */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/70 px-3.5 py-2 text-xs font-extrabold text-[#4F2396] hover:bg-violet-100 transition cursor-pointer"
          >
            <Globe size={14} />
            <span>{lang === "ar" ? "English" : "العربية"}</span>
          </button>

          {mounted && user ? (
            <div className="flex items-center gap-2.5">
              <Link
                href={`/${lang}/app`}
                className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-4 py-2 text-xs sm:text-sm font-extrabold text-[#4F2396] hover:bg-violet-100 transition"
              >
                <Building2 size={15} className="text-[#4F2396]" />
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
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FF9750] hover:bg-[#f58438] px-4 py-2 text-xs sm:text-sm font-black text-[#2d1259] shadow-sm transition active:scale-[0.98]"
              >
                <Plus size={15} />
                <span>{t("Add Property", "إضافة عقار")}</span>
              </Link>

              <button
                type="button"
                onClick={() => signOut()}
                title={t("Sign Out", "تسجيل الخروج")}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-extrabold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
              >
                <LogOut size={14} />
                <span className="hidden lg:inline">{t("Logout", "خروج")}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Option 3: Host Login */}
              <Link
                href={`/${lang}/login`}
                className="inline-flex items-center gap-2 rounded-full border border-violet-300 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#4F2396] hover:bg-violet-50 transition cursor-pointer"
              >
                <LogIn size={15} />
                <span>{t("Host Login", "تسجيل الدخول")}</span>
              </Link>

              {/* Option 4: Register Property (Primary CTA) */}
              <button
                type="button"
                onClick={() => openHostAuthModal("signup", `/${lang}/properties/new?mode=new`)}
                className="inline-flex items-center gap-2 rounded-full bg-[#FF9750] hover:bg-[#f58438] px-6 py-2.5 text-xs sm:text-sm font-black text-[#2d1259] shadow-lg shadow-black/15 transition active:scale-[0.98] cursor-pointer"
              >
                <Plus size={16} />
                <span>{t("Register Your Property", "سجل عقارك")}</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenu(!mobileMenu)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-800 md:hidden"
          aria-label="Open menu"
        >
          {mobileMenu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenu && (
        <div className="border-t border-violet-100 bg-white px-5 py-4 text-slate-900 shadow-xl md:hidden space-y-2">
          <Link
            href={homeHref}
            onClick={() => setMobileMenu(false)}
            className="block rounded-xl px-3 py-2.5 text-sm font-extrabold text-[#4F2396] bg-violet-50"
          >
            {t("Hosts", "المضيفين")}
          </Link>
          <a
            href={`${ECOSYSTEM_URLS.guest}/${lang}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenu(false)}
            className="block rounded-xl px-3 py-2.5 text-sm font-extrabold text-slate-700 hover:bg-violet-50"
          >
            {t("Visitors", "الزوار")}
          </a>
          <div className="pt-2 flex flex-col gap-2">
            {mounted && user ? (
              <>
                <Link
                  href={`/${lang}/app`}
                  onClick={() => setMobileMenu(false)}
                  className="w-full rounded-full bg-violet-100 py-3 text-center text-sm font-black text-[#4F2396]"
                >
                  {t("Host Dashboard", "لوحة تحكم المضيف")}
                </Link>
                <Link
                  href={`/${lang}/properties/new?mode=new`}
                  onClick={() => setMobileMenu(false)}
                  className="w-full rounded-full bg-[#FF9750] py-3 text-center text-sm font-black text-[#2d1259]"
                >
                  {t("Register Your Property", "سجل عقارك")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenu(false);
                    signOut();
                  }}
                  className="w-full rounded-full border border-rose-200 py-2.5 text-center text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  {t("Sign Out", "تسجيل الخروج")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${lang}/login`}
                  onClick={() => setMobileMenu(false)}
                  className="w-full block rounded-full border border-violet-300 py-3 text-center text-sm font-extrabold text-[#4F2396] cursor-pointer"
                >
                  {t("Host Login", "تسجيل الدخول")}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenu(false);
                    openHostAuthModal("signup", `/${lang}/properties/new?mode=new`);
                  }}
                  className="w-full rounded-full bg-[#FF9750] py-3 text-center text-sm font-black text-[#2d1259] cursor-pointer"
                >
                  {t("Register Your Property", "سجل عقارك")}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="w-full rounded-full border border-slate-200 py-2.5 text-center text-xs font-bold text-slate-600"
            >
              {lang === "ar" ? "Switch to English" : "التحويل إلى العربية"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
