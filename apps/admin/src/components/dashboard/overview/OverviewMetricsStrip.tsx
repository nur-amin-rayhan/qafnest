"use client";

import React from "react";
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
      <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-surface-container/60 flex flex-col justify-between min-h-[128px]">
        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline font-bold">
          {t("Gross Platform Revenue", "إجمالي إيرادات المنصة")}
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="font-display-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            {metrics.grossRevenue.toLocaleString()} {t("SAR", "ر.س")}
          </span>
        </div>
        <span className="text-[11px] text-status-emerald font-semibold mt-1 flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[14px]">
            {metrics.grossRevenue > 0 ? "trending_up" : "remove"}
          </span>
          {metrics.grossRevenue > 0
            ? t("Paid confirmed bookings", "الحجوزات المؤكدة والمدفوعة")
            : t("No revenue recorded yet", "لا توجد إيرادات بعد")}
        </span>
      </div>

      {/* KPI 2: Completed Bookings */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-surface-container/60 flex flex-col justify-between min-h-[128px]">
        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline font-bold">
          {t("Completed Bookings", "الحجوزات المكتملة")}
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="font-display-md text-2xl sm:text-3xl font-extrabold text-on-surface">
            {metrics.totalBookings}
          </span>
          <span className="font-body-sm text-xs text-outline font-medium">
            {t("stays", "إقامة")}
          </span>
        </div>
        <span className="text-[11px] text-status-emerald font-semibold mt-1">
          {metrics.totalBookings > 0
            ? t("Live synced reservations", "حجوزات متزامنة")
            : t("No bookings recorded yet", "لا توجد حجوزات بعد")}
        </span>
      </div>

      {/* KPI 3: Active Approved Units */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-surface-container/60 flex flex-col justify-between min-h-[128px]">
        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline font-bold">
          {t("Active Approved Units", "العقارات المعتمدة")}
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="font-display-md text-2xl sm:text-3xl font-extrabold text-primary">
            {metrics.activeListings}
          </span>
          <span className="font-body-sm text-xs text-outline font-medium">
            {t("live on app", "متاحة للضيوف")}
          </span>
        </div>
        <span className="text-[11px] text-primary font-semibold mt-1">
          {metrics.activeListings > 0
            ? t("MOT Certified", "مرخصة من وزارة السياحة")
            : t("No active listings yet", "لا توجد عقارات نشطة بعد")}
        </span>
      </div>

      {/* KPI 4: Average Occupancy */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-surface-container/60 flex flex-col justify-between min-h-[128px]">
        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline font-bold">
          {t("Average Occupancy", "متوسط نسبة الإشغال")}
        </span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="font-display-md text-2xl sm:text-3xl font-extrabold text-status-emerald">
            {metrics.avgOccupancy}%
          </span>
        </div>
        <span className="text-[11px] text-outline font-semibold mt-1 truncate">
          {t("Kingdom-wide Stays", "على مستوى المملكة")}
        </span>
      </div>

      {/* KPI 5: Pending Approvals */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border-s-4 border-status-sand border-y border-e border-surface-container/60 flex flex-col justify-between min-h-[128px]">
        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline font-bold">
          {t("Pending Approvals", "بانتظار الاعتماد")}
        </span>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="font-display-md text-2xl sm:text-3xl font-extrabold text-status-sand">
            {metrics.pendingVerification}
          </span>
          <span className="font-body-sm text-xs text-outline font-medium">
            {t("needs review", "يتطلب مراجعة")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab("properties-management")}
          className="mt-2 h-7 px-2.5 rounded-lg bg-status-sand/15 text-status-sand hover:bg-status-sand/25 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer w-fit"
        >
          <span>{t("Open Queue", "فتح قائمة المراجعة")}</span>
          <span className="material-symbols-outlined text-[14px]">
            {dir === "rtl" ? "arrow_back" : "arrow_forward"}
          </span>
        </button>
      </div>
    </div>
  );
}

