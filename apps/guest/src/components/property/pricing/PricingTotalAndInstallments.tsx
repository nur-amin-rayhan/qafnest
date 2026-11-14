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
        <div className="mt-3 p-2.5 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50/60 via-white to-fuchsia-50/40 dark:border-violet-500/20 dark:from-violet-950/20 dark:to-transparent flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
            <span className="font-semibold">
              {t("Or 4 interest-free payments of", "أو قسّمها على 4 دفعات بدون فوائد بقيمة")}
            </span>
            <strong className="font-black text-violet-700 dark:text-violet-300 font-mono">
              {formatCurrency(pricing.installmentAmount, language)}
            </strong>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-[#3EFEAB] text-gray-950 shadow-2xs">
              tabby
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black bg-gradient-to-r from-[#FBD3A7] to-[#D4B5FD] text-gray-950 shadow-2xs">
              tamara
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

