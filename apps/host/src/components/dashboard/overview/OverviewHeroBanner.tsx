"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Plus, CalendarDays } from "lucide-react";
import type { OverviewNavigateTab } from "./types";

interface OverviewHeroBannerProps {
  hostName: string;
  todayFormatted: string;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onNavigateTab: (tab: OverviewNavigateTab) => void;
}

export function OverviewHeroBanner({
  hostName,
  todayFormatted,
  lang,
  t,
  onNavigateTab,
}: OverviewHeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#121324] p-5 sm:p-7 shadow-xs transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t("Verified Host Partner", "شريك مضيف موثق")}</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {todayFormatted}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {hostName
              ? t(`Welcome, ${hostName}`, `مرحباً، ${hostName}`)
              : t("Operations Overview", "نظرة عامة على العمليات")}
          </h1>

          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
            {t(
              "Monitor your active properties, track guest reservations in real time, and analyze daily revenue.",
              "تابع عقاراتك النشطة، وتحكم بحجوزات الضيوف والتقويم فوريًا، واطلع على إيراداتك بكل شفافية."
            )}
          </p>
        </div>

        {/* Quick Actions Cluster */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            href={`/${lang}/properties/new?mode=new`}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-violet-600 dark:hover:bg-violet-500 hover:bg-slate-800 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>{t("Add Property", "إضافة عقار")}</span>
          </Link>

          <button
            type="button"
            onClick={() => onNavigateTab("calendar")}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
          >
            <CalendarDays size={16} className="text-slate-500 dark:text-slate-400" />
            <span>{t("Calendar & Rates", "التقويم والأسعار")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

