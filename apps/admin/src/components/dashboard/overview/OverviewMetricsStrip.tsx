"use client";

import React from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AdminMetrics, NavTab } from "../types";

interface OverviewMetricsStripProps {
  metrics: AdminMetrics;
  setActiveTab: (tab: NavTab) => void;
  t: (en: string, ar: string) => string;
}

export function OverviewMetricsStrip({
  metrics,
  setActiveTab,
  t,
}: OverviewMetricsStripProps) {
  const { dir } = useAdminAuth();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* KPI 1: Gross Revenue */}
      <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between min-h-[128px]">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t("Gross platform revenue", "إجمالي إيرادات المنصة")}
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {metrics.grossRevenue.toLocaleString()} {t("SAR", "ر.س")}
          </span>
        </div>
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
          {metrics.grossRevenue > 0
            ? t("Paid confirmed bookings", "الحجوزات المؤكدة والمدفوعة")
            : t("No revenue recorded yet", "لا توجد إيرادات بعد")}
        </span>
      </div>

      {/* KPI 2: Completed Bookings */}
      <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between min-h-[128px]">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t("Completed bookings", "الحجوزات المكتملة")}
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {metrics.totalBookings}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {t("stays", "إقامة")}
          </span>
        </div>
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
          {metrics.totalBookings > 0
            ? t("Live synced reservations", "حجوزات متزامنة")
            : t("No bookings recorded yet", "لا توجد حجوزات بعد")}
        </span>
      </div>

      {/* KPI 3: Active Approved Units */}
      <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between min-h-[128px]">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t("Active approved units", "العقارات المعتمدة")}
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {metrics.activeListings}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {t("live on app", "متاحة للضيوف")}
          </span>
        </div>
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
          {metrics.activeListings > 0
            ? t("MOT Certified", "مرخصة من وزارة السياحة")
            : t("No active listings yet", "لا توجد عقارات نشطة بعد")}
        </span>
      </div>

      {/* KPI 4: Average Occupancy */}
      <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between min-h-[128px]">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t("Average occupancy", "متوسط نسبة الإشغال")}
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {metrics.avgOccupancy}%
          </span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1 truncate">
          {t("Kingdom-wide stays", "على مستوى المملكة")}
        </span>
      </div>

      {/* KPI 5: Pending Approvals */}
      <div className="bg-white dark:bg-[#0E0D16] p-5 rounded-xl shadow-xs border-s-4 border-amber-500 border-y border-e border-slate-200/90 dark:border-slate-800 flex flex-col justify-between min-h-[128px]">
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {t("Pending approvals", "بانتظار الاعتماد")}
        </span>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            {metrics.pendingVerification}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {t("needs review", "يتطلب مراجعة")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab("properties-management")}
          className="mt-2 h-7 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer w-fit border border-amber-200 dark:border-amber-800/60"
        >
          <span>{t("Open queue", "فتح قائمة المراجعة")}</span>
          {dir === "rtl" ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
        </button>
      </div>
    </div>
  );
}

