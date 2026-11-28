"use client";

import React from "react";
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
      className="xl:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0c0d1b]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)] transition-colors"
      aria-label={t("Mobile Navigation", "التنقل عبر الجوال")}
    >
      <div className="flex items-center justify-center gap-1 sm:gap-3 h-16 max-w-md sm:max-w-lg mx-auto px-3">
        {bottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isCurrent = active === tab.key;

          if (tab.isAction) {
            return (
              <button
                key={tab.key}
                type="button"
                onClick={onOpenMenu}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-500 dark:text-slate-400 hover:text-[#4F2396] dark:hover:text-purple-300 transition active:scale-95 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center w-10 h-7 rounded-xl text-slate-500 dark:text-slate-400 group-hover:text-[#4F2396] dark:group-hover:text-purple-300 transition-colors">
                  <Icon size={21} />
                </div>
                <span className="mt-0.5 text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-[#4F2396] dark:group-hover:text-purple-300 leading-none">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key as Module)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition active:scale-95 cursor-pointer ${
                isCurrent
                  ? "text-[#4F2396] dark:text-purple-300"
                  : "text-slate-500 dark:text-slate-400 hover:text-[#4F2396] dark:hover:text-purple-300"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`flex items-center justify-center w-10 h-7 rounded-xl transition-colors ${
                    isCurrent
                      ? "bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 shadow-2xs"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  <Icon
                    size={20}
                    className={
                      isCurrent
                        ? "text-[#4F2396] dark:text-purple-300 stroke-[2.4]"
                        : "text-slate-400 dark:text-slate-500"
                    }
                  />
                </div>
                {tab.hasAlert ? (
                  <span className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                ) : typeof tab.count === "number" && tab.count > 0 ? (
                  <span
                    className={`absolute -top-1 -end-2 rounded-full px-1.5 py-0.2 text-[9px] font-black leading-tight border ${
                      isCurrent
                        ? "bg-[#4F2396] text-white border-white dark:border-slate-900"
                        : "bg-purple-100 dark:bg-purple-900/60 text-[#4F2396] dark:text-purple-200 border-purple-200 dark:border-purple-800"
                    }`}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </div>
              <span
                className={`mt-0.5 text-[11px] sm:text-xs leading-none ${
                  isCurrent
                    ? "font-black text-[#4F2396] dark:text-purple-300"
                    : "font-semibold text-slate-500 dark:text-slate-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
