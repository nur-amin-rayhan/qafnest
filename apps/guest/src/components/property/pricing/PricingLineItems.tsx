"use client";

import React, { useState } from "react";
import { Tag, X, Info, Sparkles } from "lucide-react";
import { PricingBreakdown, formatCurrency } from "@/lib/services/pricing";

interface PricingLineItemsProps {
  pricing: PricingBreakdown;
  nights: number;
  language: "en" | "ar";
  onRemoveCoupon: () => void;
  t: (en: string, ar: string) => string;
  isTwelveHourStay?: boolean;
}

export function PricingLineItems({
  pricing,
  nights,
  language,
  onRemoveCoupon,
  t,
  isTwelveHourStay = false,
}: PricingLineItemsProps) {
  const [showServiceFeeTooltip, setShowServiceFeeTooltip] = useState(false);
  const [showVatTooltip, setShowVatTooltip] = useState(false);

  const hasListingDiscount = pricing.listingDiscount > 0;
  const originalSubtotal = hasListingDiscount
    ? pricing.baseRate + pricing.listingDiscount
    : pricing.baseRate;
  const displayedNightly = hasListingDiscount
    ? Math.round((originalSubtotal / nights) * 100) / 100
    : pricing.nightlyRate;

  return (
    <div className="space-y-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200">
      {/* Base Stay */}
      <div className="flex items-center justify-between">
        <span className="text-gray-600 dark:text-gray-300">
          {isTwelveHourStay ? (
            t("12-Hour stay (12:00 AM – 12:00 PM)", "إقامة 12 ساعة (12:00 ص – 12:00 م)")
          ) : (
            <>
              {formatCurrency(displayedNightly, language)} × {nights}{" "}
              {nights === 1 ? t("night", "ليلة") : t("nights", "ليال")}
            </>
          )}
        </span>
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(originalSubtotal, language)}
        </span>
      </div>

      {/* Listing Discount (if applicable) */}
      {hasListingDiscount && (
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-medium">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            {t("Special property discount", "خصم الإقامة الخاص")}
          </span>
          <span>-{formatCurrency(pricing.listingDiscount, language)}</span>
        </div>
      )}

      {/* Applied Coupon Discount */}
      {pricing.couponDiscount > 0 && (
        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50/80 dark:bg-emerald-950/30 p-2 rounded-xl border border-emerald-200/60 dark:border-emerald-500/20">
          <div className="flex items-center gap-1.5 min-w-0">
            <Tag className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">
              {t("Promo discount", "خصم الكوبون")} (
              <span className="font-mono font-bold">{pricing.couponCode}</span>)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold">-{formatCurrency(pricing.couponDiscount, language)}</span>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="text-gray-400 hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              title={t("Remove coupon", "إزالة كود الخصم")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Platform Service Fee */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <span>{t("Platform service fee", "رسوم خدمة المنصة")}</span>
          <button
            type="button"
            onClick={() => setShowServiceFeeTooltip(!showServiceFeeTooltip)}
            onMouseEnter={() => setShowServiceFeeTooltip(true)}
            onMouseLeave={() => setShowServiceFeeTooltip(false)}
            className="text-gray-400 hover:text-violet-600 cursor-pointer"
            aria-label={t("Service fee details", "تفاصيل رسوم الخدمة")}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(pricing.serviceFee, language)}
        </span>

        {showServiceFeeTooltip && (
          <div className="absolute top-6 start-0 z-30 w-64 p-2.5 rounded-xl bg-gray-900 text-white text-[11px] leading-relaxed shadow-xl border border-gray-800">
            {t(
              "Covers 24/7 guest support, smart lock keypad IoT synchronization, and secure Escrow payment protection.",
              "تغطي رسوم الخدمة دعم النزلاء 24/7، وأتمتة الأقفال الذكية، وحماية الضمان المالي حتى تسجيل الوصول."
            )}
          </div>
        )}
      </div>

      {/* VAT */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <span>{t("VAT", "ضريبة القيمة المضافة")}</span>
          <button
            type="button"
            onClick={() => setShowVatTooltip(!showVatTooltip)}
            onMouseEnter={() => setShowVatTooltip(true)}
            onMouseLeave={() => setShowVatTooltip(false)}
            className="text-gray-400 hover:text-violet-600 cursor-pointer"
            aria-label={t("VAT info", "معلومات ضريبة القيمة المضافة")}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(pricing.vatAmount, language)}
        </span>

        {showVatTooltip && (
          <div className="absolute top-6 start-0 z-30 w-64 p-2.5 rounded-xl bg-gray-900 text-white text-[11px] leading-relaxed shadow-xl border border-gray-800">
            {t(
              "Applicable Value Added Tax included in accordance with Saudi regulatory requirements.",
              "ضريبة القيمة المضافة المطبقة وفقاً للأنظمة المعمول بها في المملكة العربية السعودية."
            )}
          </div>
        )}
      </div>
    </div>
  );
}

