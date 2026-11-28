"use client";

import React from "react";
import Link from "next/link";
import { Building2, LogOut, Settings, User } from "lucide-react";
import { Module } from "../HostTopNav";

interface HostProfileDropdownProps {
  showProfile: boolean;
  setShowProfile: (val: boolean) => void;
  setActive: (module: Module) => void;
  signOut: () => Promise<void>;
  user: {
    id?: string;
    email?: string | null;
    phone?: string | null;
    user_metadata?: { full_name?: string; name?: string };
  } | null;
  profile: {
    full_name?: string | null;
    phone?: string | null;
  } | null;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export const HostProfileDropdown = React.forwardRef<
  HTMLDivElement,
  HostProfileDropdownProps
>(function HostProfileDropdown(
  {
    showProfile,
    setShowProfile,
    setActive,
    signOut,
    user,
    profile,
    lang,
    t,
  },
  ref
) {
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setShowProfile(!showProfile)}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 hover:bg-violet-50 dark:hover:bg-purple-950/40 hover:border-violet-200 dark:hover:border-purple-800/60 hover:text-[#4F2396] dark:hover:text-purple-300 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
        title={t("Host Profile", "الملف الشخصي")}
        aria-label={t("Host Profile", "الملف الشخصي")}
      >
        <User size={18} />
      </button>

      {showProfile && (
        <div
          className={`absolute top-12 z-50 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121324] p-2 shadow-xl ${
            lang === "ar" ? "left-0" : "right-0"
          }`}
        >
          <div className="border-b border-slate-100 dark:border-slate-800/80 px-3 py-2">
            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
              {profile?.full_name ||
                user?.user_metadata?.full_name ||
                user?.email?.split("@")[0] ||
                user?.phone ||
                t("Partner Host", "مضيف شريك")}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate" dir="ltr">
              {user?.phone || user?.email || t("Verified Host Partner", "مضيف شريك موثق")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowProfile(false);
              setActive("settings");
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
          >
            <Settings size={14} />
            <span>{t("Settings", "الإعدادات")}</span>
          </button>
          <Link
            href={`/${lang}`}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          >
            <Building2 size={14} />
            <span>{t("Business Landing Page", "صفحة الأعمال الرئيسية")}</span>
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
          >
            <LogOut size={14} />
            <span>{t("Sign Out", "تسجيل الخروج")}</span>
          </button>
        </div>
      )}
    </div>
  );
});

