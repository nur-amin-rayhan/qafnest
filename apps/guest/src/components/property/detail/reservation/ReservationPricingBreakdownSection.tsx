"use client";

import React from "react";
import { PricingBreakdown } from "@/lib/services/pricing";

interface ReservationPricingBreakdownSectionProps {
  language: string;
  nights: number;
  isTwelveHourStay?: boolean;
  originalNightly: number;
  originalSubtotal: number;
  offerDiscountAmount: number;
  previewPricing: PricingBreakdown;
  riyalLabel: string;
}

export function ReservationPricingBreakdownSection({
  language,
  nights,
  isTwelveHourStay = false,
  originalNightly,
  originalSubtotal,
  offerDiscountAmount,
  previewPricing,
  riyalLabel,
}: ReservationPricingBreakdownSectionProps) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2.5 text-xs sm:text-[13px] dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between text-gray-700 dark:text-gray-200">
        <span>
          {isTwelveHourStay
            ? language === "ar"
              ? `فترة 12 ساعة (12 ص – 12 م) × ${Number(originalNightly).toFixed(2)} ${riyalLabel}`
              : `12-Hour Slot (12 AM – 12 PM) × ${Number(originalNightly).toFixed(2)} ${riyalLabel}`
            : `${nights} ${language === "ar" ? (nights === 1 ? "ليلة" : "ليال") : nights === 1 ? "night" : "nights"} × ${Number(originalNightly).toFixed(2)} ${riyalLabel}`}
        </span>
        <span className="font-semibold text-gray-900 dark:text-white">
          {Number(originalSubtotal).toFixed(2)} {riyalLabel}
        </span>
      </div>

      {offerDiscountAmount > 0 && (
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-white">
            {language === "ar" ? "خصم العرض" : "Offer Discount"}
          </span>
          <span className="font-bold text-rose-600 dark:text-rose-400">
            -{Number(offerDiscountAmount).toFixed(2)} {riyalLabel}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
          {language === "ar" ? "رسوم الخدمة" : "Service Fees"}
        </span>
        <span className="font-semibold text-gray-950 dark:text-white">
          +{previewPricing.serviceFee.toFixed(2)} {riyalLabel}
        </span>
      </div>

      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
          {language === "ar" ? "ضريبة القيمة المضافة" : "VAT"}
        </span>
        <span className="font-semibold text-gray-950 dark:text-white">
          +{previewPricing.vatAmount.toFixed(2)} {riyalLabel}
        </span>
      </div>

      <div className="border-t border-slate-200/80 pt-3 flex items-center justify-between font-black text-sm text-gray-950 dark:border-white/10 dark:text-white">
        <span>{language === "ar" ? "السعر الإجمالي" : "Total Price"}</span>
        <span className="text-[#4F2396] dark:text-violet-300">
          {previewPricing.total.toFixed(2)} {riyalLabel}
        </span>
      </div>
    </div>
  );
}

