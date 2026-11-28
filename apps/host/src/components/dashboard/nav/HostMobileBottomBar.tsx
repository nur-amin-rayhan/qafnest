"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck2,
  Calendar,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { Module } from "../HostTopNav";

interface HostMobileBottomBarProps {
  active: Module;
  setActive: (module: Module) => void;
  onOpenMenu: () => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  propertiesCount?: number;
  bookingsCount?: number;
  hasPropertyIssues?: boolean;
}

export function HostMobileBottomBar({
  active,
  setActive,
  onOpenMenu,
  lang,
  t,
  propertiesCount = 0,
  bookingsCount = 0,
  hasPropertyIssues = false,
}: HostMobileBottomBarProps) {
  const bottomTabs: Array<{
    key: Module | "menu";
    label: string;
    icon: LucideIcon;
    count?: number;
    hasAlert?: boolean;
    isAction?: boolean;
  }> = [
    {
      key: "overview",
      label: t("Home", "الرئيسية"),
      icon: LayoutDashboard,
    },
    {
      key: "properties",
      label: t("Properties", "العقارات"),
      icon: Building2,
      count: propertiesCount,
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
      label: t("Calendar", "التقويم"),
      icon: Calendar,
    },
    {
      key: "menu",
      label: t("Menu", "القائمة"),
      icon: Menu,
      isAction: true,
    },
  ];

  return (
    <nav
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="xl:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0c0d1b]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)] transition-colors"
      aria-label={t("Mobile Navigation", "التنقل عبر الجوال")}
    >
      <div className="flex items-center justify-around h-15 max-w-lg mx-auto px-2">
        {bottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isCurrent = active === tab.key;

          if (tab.isAction) {
            return (
              <button
                key={tab.key}
                type="button"
                onClick={onOpenMenu}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition active:scale-95 cursor-pointer"
              >
                <div className="relative">
                  <Icon size={20} className="text-slate-500 dark:text-slate-400" />
                </div>
                <span className="mt-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-none">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.key}
              href={`/${lang}/app/${tab.key === "overview" ? "overview" : tab.key}`}
              onClick={(e) => {
                e.preventDefault();
                setActive(tab.key as Module);
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition active:scale-95 cursor-pointer ${
                isCurrent ? "text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className={isCurrent ? "text-slate-900 dark:text-white stroke-[2.4]" : "text-slate-400 dark:text-slate-500"}
                />
                {tab.hasAlert ? (
                  <span className="absolute -top-1 -end-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                ) : typeof tab.count === "number" && tab.count > 0 ? (
                  <span className="absolute -top-1.5 -end-2.5 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 text-[8px] font-black px-1 leading-tight border border-violet-200 dark:border-violet-800">
                    {tab.count}
                  </span>
                ) : null}
              </div>
              <span
                className={`mt-1 text-[10px] leading-none ${
                  isCurrent ? "font-black text-slate-900 dark:text-white" : "font-medium text-slate-500 dark:text-slate-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
