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
      className="fixed inset-0 z-50 lg:hidden"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        className={`fixed inset-y-0 start-0 z-50 w-[300px] sm:w-[320px] max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out animate-in ${
          lang === "ar" ? "slide-in-from-right" : "slide-in-from-left"
        }`}
      >
        {/* Drawer Header & Profile Card */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/${lang}/app/overview`}
              onClick={(e) => {
                e.preventDefault();
                setActive("overview");
                onClose();
              }}
              className="inline-flex items-center gap-1.5 select-none"
            >
              <span className="text-[22px] font-black tracking-[-0.05em] text-[#4F2396]">
                Qaf<span className="text-[#7c3aed]">Nest</span>
                <span className="text-[#FF9750]">.</span>
              </span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase text-[#4F2396]">
                {t("HOST", "مضيف")}
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
              aria-label={t("Close Menu", "إغلاق القائمة")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Host Profile Info */}
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#4F2396] text-white font-black text-sm shadow-xs">
              {hostInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-slate-900 leading-tight">
                {hostName}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <ShieldCheck size={12} className="shrink-0 text-emerald-600" />
                <span className="truncate">{t("Verified Host", "مضيف موثق")}</span>
              </div>
            </div>
          </div>

          {/* Quick Primary Action: Add Property */}
          <Link
            href={`/${lang}/properties/new?mode=new`}
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F2396] hover:bg-[#3D1A78] text-white py-2.5 px-4 text-xs font-black shadow-xs transition active:scale-[0.99] cursor-pointer"
          >
            <Plus size={15} className="stroke-[3]" />
            <span>{t("Add New Property", "إضافة عقار جديد")}</span>
          </Link>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = active === item.key;

            return (
              <Link
                key={item.key}
                href={`/${lang}/app/${item.key === "overview" ? "overview" : item.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActive(item.key);
                  onClose();
                }}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                  isCurrent
                    ? "bg-violet-50 text-[#4F2396] font-extrabold border-s-4 border-[#4F2396]"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={17}
                    className={isCurrent ? "text-[#4F2396]" : "text-slate-400"}
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
                          ? "bg-violet-200 text-[#4F2396]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  <ChevronRight
                    size={13}
                    className={`text-slate-300 ${
                      lang === "ar" ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/60">
          <div className="grid grid-cols-2 gap-2">
            {setLang && (
              <button
                type="button"
                onClick={() => {
                  setLang(lang === "ar" ? "en" : "ar");
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <Globe size={14} className="text-[#4F2396]" />
                <span>{lang === "ar" ? "English" : "العربية"}</span>
              </button>
            )}

            <a
              href="https://wa.me/966576707709"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <MessageSquareText size={14} className="text-emerald-600" />
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
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
