"use client";

import React from "react";

interface ReservationPricingHeaderProps {
  hasDiscount: boolean;
  originalNightly: number;
  basePrice: number;
  effectiveNightlyRate?: number;
  riyalLabel: string;
  nights: number;
  estimatedTotal: number;
  discountPercent: number;
  language: string;
}

export function ReservationPricingHeader({
  hasDiscount,
  originalNightly,
  basePrice,
  effectiveNightlyRate,
  riyalLabel,
  nights,
  estimatedTotal,
  discountPercent,
  language,
}: ReservationPricingHeaderProps) {
  const displayPrice = effectiveNightlyRate || basePrice;

  return (
    <div className="flex items-start justify-between gap-3 pb-5">
      <div>
        {hasDiscount && (
          <div className="text-[15px] font-extrabold text-rose-500 line-through dark:text-rose-400">
            {originalNightly} {riyalLabel}
          </div>
        )}

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {displayPrice}
          </span>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {language === "ar" ? "ر.س / ليلة" : "SAR / Night"}
          </span>
        </div>

        <p className="mt-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          {language === "ar" ? (
            <>
              الإجمالي لـ {nights} {nights === 1 ? "ليلة" : "ليال"}:{" "}
              <strong className="font-extrabold text-gray-950 dark:text-white">
                {estimatedTotal.toFixed(2)}
              </strong>{" "}
              ر.س
            </>
          ) : (
            <>
              Total for {nights} {nights === 1 ? "night" : "nights"}:{" "}
              <strong className="font-extrabold text-gray-950 dark:text-white">
                {estimatedTotal.toFixed(2)}
              </strong>{" "}
              SAR
            </>
          )}
        </p>
      </div>

      {discountPercent > 0 && (
        <span className="shrink-0 rounded-xl border border-rose-200/80 bg-rose-50 px-3.5 py-1.5 text-xs font-extrabold tracking-tight text-rose-600 shadow-xs dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
          {discountPercent}% OFF
        </span>
      )}
    </div>
  );
}

