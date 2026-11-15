"use client";

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { PropertyItem } from "../types";

interface PropertiesStatsStripProps {
  properties: PropertyItem[];
}

export function PropertiesStatsStrip({ properties }: PropertiesStatsStripProps) {
  const { dir, t } = useAdminAuth();

  const approvedList = properties.filter((p) => p.status === "approved" || p.is_approved);
  const approvedCount = approvedList.length;
  const pendingCount = properties.filter((p) => p.status === "pending" || (!p.is_approved && p.status !== "rejected")).length;
  const totalCount = properties.length || 1;
  const approvedPercentage = properties.length > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const avgNightlyRate =
    properties.length > 0
      ? Math.round(properties.reduce((sum, p) => sum + Number(p.base_price || 0), 0) / properties.length)
      : 0;
  const activeNightlyCapacity = approvedList.reduce((sum, p) => sum + Number(p.base_price || 0), 0);

  return (
    <div dir={dir} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-space-lg">
      {/* Stat 1: Total Active Fleet */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className="absolute -end-6 -bottom-6 w-28 h-28 bg-primary/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-space-xs flex-wrap">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
              {t("Total Available Units", "إجمالي الوحدات المتاحة")}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-emerald/10 text-status-emerald">
              {approvedPercentage}% {t("Live", "نشط")}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-md text-display-md text-on-surface">
              {approvedCount}
            </span>
            <span className="font-body-sm text-body-sm text-outline">
              / {properties.length} {t("Total Listed", "إجمالي المدرج")}
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-status-emerald h-full rounded-full transition-all duration-500"
              style={{ width: `${approvedPercentage}%` }}
            />
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-primary z-10 shrink-0">
          <span className="material-symbols-outlined text-[26px]">domain</span>
        </div>
      </div>

      {/* Stat 2: Inventory Valuation */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className="absolute -end-6 -bottom-6 w-28 h-28 bg-status-sand/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-space-xs flex-wrap">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
              {t("Active Nightly Capacity", "القيمة الليلية النشطة")}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-sand/20 text-status-sand">
              {approvedCount} {t("Published", "منشور")}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-md text-display-md text-on-surface">
              {activeNightlyCapacity.toLocaleString()} {t("SAR", "ر.س")}
            </span>
            <span className="font-body-sm text-body-sm text-outline">{t("/ night", "/ ليلة")}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[15px] text-status-sand">price_check</span>
            <span>{t("Average nightly rate:", "متوسط السعر الليلي:")} {avgNightlyRate.toLocaleString()} {t("SAR", "ر.س")}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-status-sand z-10 shrink-0">
          <span className="material-symbols-outlined text-[26px]">analytics</span>
        </div>
      </div>

      {/* Stat 3: Maintenance & Offline Attention */}
      <div className="md:col-span-2 xl:col-span-1 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex items-center justify-between relative overflow-hidden group">
        <div className="absolute -end-6 -bottom-6 w-28 h-28 bg-status-terracotta/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-space-xs flex-wrap">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
              {t("Verification Flagged", "بانتظار التحقق")}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-status-terracotta/10 text-status-terracotta">
              {t("Action Req.", "يتطلب مراجعة")}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display-md text-display-md text-status-terracotta">
              {pendingCount}
            </span>
            <span className="font-body-sm text-body-sm text-outline">
              {t("Units pending verification", "وحدات بانتظار المراجعة")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant font-body-sm text-body-sm">
            <span className="material-symbols-outlined text-[15px] text-status-terracotta">fact_check</span>
            <span>{t("Ministry of Tourism & Balady Inspection", "تدقيق تراخيص السياحة والبلدية")}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center text-status-terracotta z-10 shrink-0">
          <span className="material-symbols-outlined text-[26px]">shield</span>
        </div>
      </div>
    </div>
  );
}
