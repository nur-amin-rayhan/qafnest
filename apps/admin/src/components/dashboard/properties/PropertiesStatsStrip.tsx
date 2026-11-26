"use client";

import React from "react";
import { Building2, TrendingUp, ShieldAlert } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { PropertyItem } from "../types";

interface PropertiesStatsStripProps {
  properties: PropertyItem[];
}

export function PropertiesStatsStrip({ properties }: PropertiesStatsStripProps) {
  const { dir, t } = useAdminAuth();

  const approvedList = properties.filter((p) => p.status === "approved" || p.is_approved);
  const approvedCount = approvedList.length;
  const pendingCount = properties.filter(
    (p) => p.status === "pending" || (!p.is_approved && p.status !== "rejected")
  ).length;
  const totalCount = properties.length || 1;
  const approvedPercentage =
    properties.length > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const avgNightlyRate =
    properties.length > 0
      ? Math.round(
          properties.reduce((sum, p) => sum + Number(p.base_price || 0), 0) / properties.length
        )
      : 0;
  const activeNightlyCapacity = approvedList.reduce(
    (sum, p) => sum + Number(p.base_price || 0),
    0
  );

  return (
    <div dir={dir} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Metric 1: Total fleet & live ratio */}
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("Total available units", "إجمالي الوحدات المتاحة")}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {approvedCount}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                / {properties.length} {t("listed", "مدرج")}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <Building2 size={18} strokeWidth={1.5} />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>
              {approvedPercentage}% {t("live & bookable", "نشط ومتاح")}
            </span>
          </div>
          <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${approvedPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metric 2: Active inventory capacity */}
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("Active nightly capacity", "القيمة الليلية النشطة")}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {activeNightlyCapacity.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("SAR / night", "ر.س / ليلة")}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <TrendingUp size={18} strokeWidth={1.5} />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t("Average nightly rate", "متوسط السعر الليلي")}</span>
          <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
            {avgNightlyRate.toLocaleString()} {t("SAR", "ر.س")}
          </span>
        </div>
      </div>

      {/* Metric 3: Verification queue */}
      <div className="sm:col-span-2 lg:col-span-1 bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("Verification queue", "بانتظار التحقق")}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl font-semibold font-mono tabular-nums ${
                  pendingCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"
                }`}
              >
                {pendingCount}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {t("units pending review", "وحدات بانتظار المراجعة")}
              </span>
            </div>
          </div>
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              pendingCount > 0
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400"
            }`}
          >
            <ShieldAlert size={18} strokeWidth={1.5} />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t("Tourism license & ID verification", "تراخيص السياحة والهوية")}</span>
          <span
            className={`font-medium ${
              pendingCount > 0 ? "text-amber-700 dark:text-amber-400 font-semibold" : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {pendingCount > 0
              ? t("Action required", "يتطلب إجراء")
              : t("All verified", "تم التحقق")}
          </span>
        </div>
      </div>
    </div>
  );
}
