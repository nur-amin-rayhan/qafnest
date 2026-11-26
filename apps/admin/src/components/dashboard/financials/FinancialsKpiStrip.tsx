"use client";

import React from "react";
import { DollarSign, Percent, Receipt, CheckCircle2, Clock } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { AdminFinancialMetrics } from "./useAdminFinancials";

interface FinancialsKpiStripProps {
  metrics: AdminFinancialMetrics;
  loading?: boolean;
}

export function FinancialsKpiStrip({ metrics, loading = false }: FinancialsKpiStripProps) {
  const { dir, t } = useAdminAuth();

  const isInitialLoading = loading && metrics.totalGrossVolume === 0;

  return (
    <div dir={dir} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* 1. Total GMV */}
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("Gross volume (GMV)", "إجمالي المبيعات (GMV)")}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              {isInitialLoading ? (
                <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {metrics.totalGrossVolume.toLocaleString()} {t("SAR", "ر.س")}
                </span>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <DollarSign size={18} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("100% of guest payments collected", "١٠٠٪ من مدفوعات الضيوف المحصّلة")}
        </div>
      </div>

      {/* 2. Platform Revenue */}
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("Platform net revenue", "صافي إيراد المنصة")}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              {isInitialLoading ? (
                <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {metrics.platformCommission.toLocaleString()} {t("SAR", "ر.س")}
                </span>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Percent size={18} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t(
            `Guest fee + ${metrics.commissionRate}% host comm - bonus`,
            `رسوم الضيف + ${metrics.commissionRate}% عمولة المضيف`
          )}
        </div>
      </div>

      {/* 3. ZATCA VAT (15% Full Booking) */}
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("ZATCA VAT (15% Gov)", "ضريبة زاتكا (١٥٪)")}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              {isInitialLoading ? (
                <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {metrics.vatCollected.toLocaleString()} {t("SAR", "ر.س")}
                </span>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <Receipt size={18} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("100% owed to government (ZATCA)", "مستحق بالكامل لهيئة الزكاة والضريبة")}
        </div>
      </div>

      {/* 4. Disbursed Host Remittances */}
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("Disbursed remittances", "التحويلات المصروفة")}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              {isInitialLoading ? (
                <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {metrics.disbursedTotal.toLocaleString()} {t("SAR", "ر.س")}
                </span>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 size={18} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {t("Paid directly via SARIE", "محولة مباشرة عبر نظام سريع")}
        </div>
      </div>

      {/* 5. Pending Disbursements */}
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("Pending payouts (24h)", "دفعات بانتظار الصرف (٢٤س)")}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              {isInitialLoading ? (
                <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {metrics.pendingTotal.toLocaleString()} {t("SAR", "ر.س")}
                </span>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
            <Clock size={18} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-amber-600 dark:text-amber-400">
          {t("24-hour SARIE SLA window", "نافذة التحويل المجدول خلال ٢٤ ساعة")}
        </div>
      </div>
    </div>
  );
}
