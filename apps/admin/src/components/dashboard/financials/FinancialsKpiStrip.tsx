"use client";

import React from "react";
import { DollarSign, Percent, Receipt, CheckCircle2, Clock } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { AdminFinancialMetrics } from "./useAdminFinancials";

interface FinancialsKpiStripProps {
  metrics: AdminFinancialMetrics;
}

export function FinancialsKpiStrip({ metrics }: FinancialsKpiStripProps) {
  const { dir, t } = useAdminAuth();

  return (
    <div dir={dir} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* 1. Total GMV */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-outline uppercase tracking-wider">
          <span>{t("Gross Volume (GMV)", "إجمالي المبيعات (GMV)")}</span>
          <DollarSign size={16} className="text-primary shrink-0" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-on-surface mt-2 font-mono">
          {metrics.totalGrossVolume.toLocaleString()} {t("SAR", "ر.س")}
        </div>
        <p className="text-[11px] text-on-surface-variant mt-1">
          {t("100% of guest payments collected", "١٠٠٪ من مدفوعات الضيوف المحصّلة")}
        </p>
      </div>

      {/* 2. Platform Revenue */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-outline uppercase tracking-wider">
          <span>{t("Platform Net Revenue", "صافي إيراد المنصة")}</span>
          <Percent size={16} className="text-emerald-500 shrink-0" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-status-emerald mt-2 font-mono">
          {metrics.platformCommission.toLocaleString()} {t("SAR", "ر.س")}
        </div>
        <p className="text-[11px] text-on-surface-variant mt-1">
          {t(
            `Guest fee + ${metrics.commissionRate}% host comm - bonus`,
            `رسوم الضيف + ${metrics.commissionRate}% عمولة المضيف`
          )}
        </p>
      </div>

      {/* 3. ZATCA VAT (15% Full Booking) */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-outline uppercase tracking-wider">
          <span>{t("ZATCA VAT (15% Gov)", "ضريبة زاتكا (١٥٪)")}</span>
          <Receipt size={16} className="text-violet-500 shrink-0" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-on-surface mt-2 font-mono">
          {metrics.vatCollected.toLocaleString()} {t("SAR", "ر.س")}
        </div>
        <p className="text-[11px] text-on-surface-variant mt-1">
          {t("100% owed to government (ZATCA)", "مستحق بالكامل لهيئة الزكاة والضريبة")}
        </p>
      </div>

      {/* 4. Disbursed Host Remittances */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-outline uppercase tracking-wider">
          <span>{t("Disbursed Remittances", "التحويلات المصروفة")}</span>
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-on-surface mt-2 font-mono">
          {metrics.disbursedTotal.toLocaleString()} {t("SAR", "ر.س")}
        </div>
        <p className="text-[11px] text-emerald-600 font-bold mt-1">
          {t("Paid directly via SARIE", "محولة مباشرة عبر نظام سريع")}
        </p>
      </div>

      {/* 5. Pending Disbursements */}
      <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-outline uppercase tracking-wider">
          <span>{t("Pending Payouts (24h)", "دفعات بانتظار الصرف (٢٤س)")}</span>
          <Clock size={16} className="text-amber-500 shrink-0" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-primary mt-2 font-mono">
          {metrics.pendingTotal.toLocaleString()} {t("SAR", "ر.س")}
        </div>
        <p className="text-[11px] text-amber-700 font-bold mt-1">
          {t("24-hour SARIE SLA window", "نافذة التحويل المجدول خلال ٢٤ ساعة")}
        </p>
      </div>
    </div>
  );
}
