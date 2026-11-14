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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#31135E] via-[#4F2396] to-[#6A32B8] p-6 sm:p-8 text-white shadow-lg">
      {/* Decorative backdrop elements */}
      <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-[#FF9750]/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-black backdrop-blur-md text-white">
              <ShieldCheck size={14} className="text-[#FF9750]" />
              <span>{t("Verified QafNest Host Partner", "شريك مضيف موثق في قاف نست")}</span>
            </span>
            <span className="text-xs font-semibold text-violet-200">
              {todayFormatted}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {t("Welcome back, ", "مرحباً بك، ")}
            <span className="text-[#FFB380]">{hostName || t("Host Partner", "شريكنا المضيف")}</span>
            <span> 👋</span>
          </h1>

          <p className="text-xs sm:text-sm text-violet-100/90 max-w-2xl font-medium leading-relaxed">
            {t(
              "Monitor your properties, track real-time bookings, analyze earnings, and keep your guest hospitality at the highest standard.",
              "تابع أداء عقاراتك، وتحكم بحجوزات الضيوف وأسعارك اليومية، واطلع على تقارير مبيعاتك بكل سهولة ووضوح."
            )}
          </p>
        </div>

        {/* Quick Actions Cluster */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${lang}/properties/new?mode=new`}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#FF9750] px-5 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-md hover:bg-[#ff8a38] transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>{t("Add New Property", "إضافة عقار جديد")}</span>
          </Link>

          <button
            type="button"
            onClick={() => onNavigateTab("calendar")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 text-xs sm:text-sm font-bold text-white transition backdrop-blur-md cursor-pointer"
          >
            <CalendarDays size={16} />
            <span>{t("Manage Availability", "التقويم والأسعار")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

