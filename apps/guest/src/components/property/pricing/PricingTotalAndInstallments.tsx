"use client";

import React from "react";
import { PricingBreakdown, formatCurrency } from "@/lib/services/pricing";

interface PricingTotalAndInstallmentsProps {
  pricing: PricingBreakdown;
  language: "en" | "ar";
  showInstallments: boolean;
  t: (en: string, ar: string) => string;
}

export function PricingTotalAndInstallments({
  pricing,
  language,
  showInstallments,
  t,
}: PricingTotalAndInstallmentsProps) {
  return (
    <div className="border-t border-gray-200 dark:border-white/10 pt-3.5">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-sm font-extrabold text-gray-950 dark:text-white block">
            {t("Total Amount Due", "المبلغ الإجمالي المستحق")}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {t(
              "Includes VAT & all service fees",
              "شامل ضريبة القيمة المضافة وكافة الرسوم"
            )}
          </span>
        </div>
        <div className="text-end">
          <span className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white tracking-tight">
            {formatCurrency(pricing.total, language)}
          </span>
        </div>
      </div>

      {/* Installments Split Callout (Tabby / Tamara 4 interest-free payments) */}
      {showInstallments && (
        <div className="mt-3 p-3 rounded-xl border border-slate-200/85 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
            <span className="font-medium">
              {t("Or 4 interest-free payments of", "أو قسّمها على 4 دفعات بدون فوائد بقيمة")}
            </span>
            <strong className="font-bold text-[#4F2396] dark:text-purple-300 font-mono">
              {formatCurrency(pricing.installmentAmount, language)}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-[#3EFEAB] text-gray-950 shadow-2xs">
              tabby
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-[#FCEFD7] border border-[#F2D7B3] text-[#8A4A0B] shadow-2xs">
              tamara
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

