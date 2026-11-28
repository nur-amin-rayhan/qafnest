"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck2,
  Calendar,
  Receipt,
  BarChart3,
  Star,
  Settings,
  Plus,
  Moon,
  Sun,
  Globe,
  LogOut,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { HostProfile } from "@/context/HostAuthContext";
import type { Module } from "../HostTopNav";

interface HostSidebarProps {
  active: Module;
  setActive: (module: Module) => void;
  lang: "ar" | "en";
  setLang?: (lang: "ar" | "en") => void;
  t: (en: string, ar: string) => string;
  user?: User | null;
  profile?: HostProfile | null;
  signOut?: () => Promise<void>;
  submittedPropertiesCount?: number;
  hasPropertyIssues?: boolean;
  bookingsCount?: number;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export function HostSidebar({
  active,
  setActive,
  lang,
  setLang,
  t,
  user,
  profile,
  signOut,
  submittedPropertiesCount = 0,
  hasPropertyIssues = false,
  bookingsCount = 0,
  theme,
  toggleTheme,
}: HostSidebarProps) {
  const hostName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    t("Host Partner", "شريك مضيف");
  const hostInitial = hostName.charAt(0).toUpperCase() || "H";

  const navItems: Array<{
    key: Module;
    label: string;
    icon: LucideIcon;
    count?: number;
    hasAlert?: boolean;
  }> = [
    {
      key: "overview",
      label: t("Overview", "الرئيسية"),
      icon: LayoutDashboard,
    },
    {
      key: "properties",
      label: t("Properties", "العقارات"),
      icon: Building2,
      count: submittedPropertiesCount,
      hasAlert: hasPropertyIssues,
    },
    {
      key: "reservations",
      label: t("Reservations", "الحجوزات"),
      icon: CalendarCheck2,
      count: bookingsCount,
    },
    {
      key: "calendar",
      label: t("Calendar & Pricing", "التقويم والأسعار"),
      icon: Calendar,
    },
    {
      key: "finance",
      label: t("Financials", "المالية والتحويلات"),
      icon: Receipt,
    },
    {
      key: "analytics",
      label: t("Sales & Analytics", "التحليلات والمبيعات"),
      icon: BarChart3,
    },
    {
      key: "reviews",
      label: t("Guest Reviews", "تقييمات النزلاء"),
      icon: Star,
    },
    {
      key: "settings",
      label: t("Settings", "الإعدادات"),
      icon: Settings,
    },
  ];

  return (
    <aside
      className="hidden xl:flex flex-col justify-between w-64 xl:w-72 shrink-0 h-screen sticky top-0 border-e border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0c0d1b] p-5 z-30 transition-colors select-none"
      aria-label={t("Host Navigation Sidebar", "الشريط الجانبي للمضيف")}
    >
      {/* Top Header & Navigation Links */}
      <div className="flex flex-col min-h-0">
        {/* Brand Logo */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800/70">
          <Link
            href={`/${lang}/app/overview`}
            onClick={(e) => {
              e.preventDefault();
              setActive("overview");
            }}
            className="inline-flex items-center gap-2"
          >
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Qaf<span className="text-violet-600 dark:text-violet-400">Nest</span>
              <span className="text-[#FF9750]">.</span>
            </span>
            <span className="rounded-full bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 text-[10px] font-black tracking-wider uppercase text-violet-800 dark:text-violet-300">
              {t("HOST", "مضيف")}
            </span>
          </Link>
        </div>

        {/* Primary Action Button */}
        <div className="pt-4 pb-3">
          <Link
            href={`/${lang}/properties/new?mode=new`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] text-white py-2.5 px-4 text-sm font-bold shadow-sm shadow-[#4F2396]/20 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>{t("Add Property", "إضافة عقار جديد")}</span>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActive(item.key)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all cursor-pointer text-start ${
                  isActive
                    ? "bg-[#4F2396] text-white shadow-sm shadow-[#4F2396]/25 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#4F2396] dark:hover:text-purple-300 hover:bg-[#F5F1FC] dark:hover:bg-purple-950/30 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    size={18}
                    className={`shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-[#4F2396]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.hasAlert && (
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  {typeof item.count === "number" && item.count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-purple-50 text-[#4F2396] dark:bg-purple-950/60 dark:text-purple-300"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Controls */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/70 space-y-3">
        {/* Theme and Language Controls */}
        <div className="grid grid-cols-2 gap-2">
          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 py-2 px-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={theme === "dark" ? t("Switch to Light Mode", "تفعيل الوضع الفاتح") : t("Switch to Dark Mode", "تفعيل الوضع الداكن")}
            aria-label={theme === "dark" ? t("Switch to Light Mode", "تفعيل الوضع الفاتح") : t("Switch to Dark Mode", "تفعيل الوضع الداكن")}
          >
            {theme === "dark" ? (
              <>
                <Sun size={13} className="text-amber-400" />
                <span>{t("Light", "فاتح")}</span>
              </>
            ) : (
              <>
                <Moon size={13} className="text-slate-500" />
                <span>{t("Dark", "داكن")}</span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          {setLang && (
            <button
              type="button"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 py-2 px-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Globe size={13} className="text-slate-500 dark:text-slate-400" />
              <span>{lang === "ar" ? "English" : "العربية"}</span>
            </button>
          )}
        </div>

        {/* Host Profile Info & Sign Out */}
        <div className="flex items-center justify-between gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-lg bg-[#4F2396] text-white text-xs font-black shadow-xs">
              {hostInitial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {hostName}
                </span>
                <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
              </div>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-400 truncate block">
                {user?.email || t("Verified Host", "مضيف موثق")}
              </span>
            </div>
          </div>

          {signOut && (
            <button
              type="button"
              onClick={signOut}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title={t("Sign Out", "تسجيل الخروج")}
              aria-label={t("Sign Out", "تسجيل الخروج")}
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
