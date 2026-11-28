"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  X,
  Plus,
  LayoutDashboard,
  Building2,
  CalendarCheck2,
  Calendar,
  Receipt,
  BarChart3,
  Star,
  Settings,
  Globe,
  MessageSquareText,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { Module } from "../HostTopNav";

interface HostMobileNavDrawerProps {
  isOpen: boolean;
  active: Module;
  setActive: (module: Module) => void;
  onClose: () => void;
  lang: "ar" | "en";
  setLang?: (lang: "ar" | "en") => void;
  t: (en: string, ar: string) => string;
  user?: {
    id?: string;
    email?: string | null;
    phone?: string | null;
    user_metadata?: { full_name?: string; name?: string };
  } | null;
  profile?: {
    full_name?: string | null;
    phone?: string | null;
  } | null;
  signOut?: () => Promise<void>;
  submittedPropertiesCount?: number;
  bookingsCount?: number;
  hasPropertyIssues?: boolean;
  theme?: "light" | "dark";
  toggleTheme?: () => void;
}

export function HostMobileNavDrawer({
  isOpen,
  active,
  setActive,
  onClose,
  lang,
  setLang,
  t,
  user,
  profile,
  signOut,
  submittedPropertiesCount = 0,
  bookingsCount = 0,
  hasPropertyIssues = false,
  theme = "light",
  toggleTheme,
}: HostMobileNavDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling while mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

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

  return createPortal(
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 xl:hidden"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className={`fixed inset-y-0 start-0 z-50 w-[300px] sm:w-[320px] max-w-[85vw] bg-white dark:bg-[#0c0d1b] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out animate-in border-e border-slate-200/90 dark:border-slate-800/80 ${
          lang === "ar" ? "slide-in-from-right" : "slide-in-from-left"
        }`}
      >
        {/* Drawer Header & Profile Card */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/${lang}/app/overview`}
              onClick={(e) => {
                e.preventDefault();
                setActive("overview");
                onClose();
              }}
              className="inline-flex items-center gap-2 select-none"
            >
              <span className="text-[25px] sm:text-[27px] font-black tracking-[-0.04em] text-slate-900 dark:text-white">
                Qaf<span className="text-[#4F2396] dark:text-purple-400">Nest</span>
                <span className="text-[#FF9750]">.</span>
              </span>
              <span className="rounded-full bg-purple-100 dark:bg-purple-950/60 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-[#4F2396] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                {t("HOST", "مضيف")}
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 hover:bg-violet-50 dark:hover:bg-purple-950/40 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              aria-label={t("Close Menu", "إغلاق القائمة")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Host Profile Info */}
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-100 dark:border-slate-800/80">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#4F2396] text-white font-black text-sm shadow-xs">
              {hostInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                {hostName}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={12} className="shrink-0" />
                <span className="truncate">{t("Verified Host", "مضيف موثق")}</span>
              </div>
            </div>
          </div>

          {/* Quick Primary Action: Add Property */}
          <Link
            href={`/${lang}/properties/new?mode=new`}
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] text-white py-2.5 px-4 text-sm font-bold shadow-sm shadow-[#4F2396]/20 transition active:scale-[0.99] cursor-pointer"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>{t("Add New Property", "إضافة عقار جديد")}</span>
          </Link>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = active === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActive(item.key);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition cursor-pointer text-start ${
                  isCurrent
                    ? "bg-[#4F2396] text-white shadow-sm shadow-[#4F2396]/20 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-[#F5F1FC] dark:hover:bg-purple-950/30 hover:text-[#4F2396] dark:hover:text-purple-300 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={
                      isCurrent
                        ? "text-white"
                        : "text-slate-400 dark:text-slate-500"
                    }
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.hasAlert && (
                    <span className="rounded-full bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 animate-pulse">
                      !
                    </span>
                  )}
                  {typeof item.count === "number" && item.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                        isCurrent
                          ? "bg-white/20 text-white dark:bg-slate-900/15 dark:text-slate-950"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  <ChevronRight
                    size={13}
                    className={`text-slate-300 dark:text-slate-600 ${
                      lang === "ar" ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="grid grid-cols-3 gap-1.5">
            {/* Theme Toggle */}
            {toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                title={theme === "dark" ? t("Light Mode", "الوضع الفاتح") : t("Dark Mode", "الوضع الداكن")}
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
            )}

            {/* Language Switcher */}
            {setLang && (
              <button
                type="button"
                onClick={() => {
                  setLang(lang === "ar" ? "en" : "ar");
                  onClose();
                }}
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <Globe size={13} className="text-slate-500 dark:text-slate-400" />
                <span>{lang === "ar" ? "EN" : "العربية"}</span>
              </button>
            )}

            {/* Support Link */}
            <a
              href="https://wa.me/966576707709"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <MessageSquareText size={13} className="text-emerald-500" />
              <span>{t("Support", "الدعم")}</span>
            </a>
          </div>

          {signOut && (
            <button
              type="button"
              onClick={async () => {
                onClose();
                await signOut();
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              <LogOut size={14} />
              <span>{t("Sign Out", "تسجيل الخروج")}</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
