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
        className="grid h-10 w-10 place-items-center rounded-xl bg-[#dcd4ef] text-[#4F2396] hover:bg-[#ceC2e8] transition cursor-pointer"
        title={t("Host Profile", "الملف الشخصي")}
      >
        <User size={18} />
      </button>

      {showProfile && (
        <div
          className={`absolute top-12 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ${
            lang === "ar" ? "left-0" : "right-0"
          }`}
        >
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-xs font-black text-slate-900 truncate">
              {profile?.full_name ||
                user?.user_metadata?.full_name ||
                user?.email?.split("@")[0] ||
                user?.phone ||
                t("Partner Host", "مضيف شريك")}
            </p>
            <p className="text-[11px] text-slate-500 font-medium truncate" dir="ltr">
              {user?.phone || user?.email || t("Verified Host Partner", "مضيف شريك موثق")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowProfile(false);
              setActive("settings");
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-violet-50 cursor-pointer"
          >
            <Settings size={14} />
            <span>{t("Settings", "الإعدادات")}</span>
          </button>
          <Link
            href="/"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            <Building2 size={14} />
            <span>{t("Business Landing Page", "صفحة الأعمال الرئيسية")}</span>
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <LogOut size={14} />
            <span>{t("Sign Out", "تسجيل الخروج")}</span>
          </button>
        </div>
      )}
    </div>
  );
});

