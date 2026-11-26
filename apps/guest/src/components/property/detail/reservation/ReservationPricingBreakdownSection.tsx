"use client";

import React, { useState, useEffect } from "react";
import { Tag, Sparkles, X, LoaderCircle } from "lucide-react";
import { PricingBreakdown, ACTIVE_COUPONS, type PromoCoupon } from "@/lib/services/pricing";

interface ReservationPricingBreakdownSectionProps {
  language: string;
  nights: number;
  isTwelveHourStay?: boolean;
  originalNightly: number;
  originalSubtotal: number;
  offerDiscountAmount: number;
  previewPricing: PricingBreakdown;
  riyalLabel: string;
  appliedCoupon?: string | null;
  couponDiscount?: number;
  onApplyCoupon?: (code: string) => Promise<{ valid: boolean; message: string }>;
  onRemoveCoupon?: () => void;
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
  appliedCoupon,
  couponDiscount = 0,
  onApplyCoupon,
  onRemoveCoupon,
}: ReservationPricingBreakdownSectionProps) {
  const [showPromoDrawer, setShowPromoDrawer] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<PromoCoupon[]>(ACTIVE_COUPONS);

  useEffect(() => {
    let active = true;
    fetch("/api/coupons/active", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.coupons)) {
          setAvailableCoupons(data.coupons);
        }
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const handleApply = async (codeToUse?: string) => {
    const code = (codeToUse || promoInput).trim().toUpperCase();
    if (!code || !onApplyCoupon) return;
    setIsApplying(true);
    setFeedback(null);
    try {
      const result = await onApplyCoupon(code);
      if (result.valid) {
        setFeedback({ type: "success", text: result.message });
        setPromoInput("");
      } else {
        setFeedback({ type: "error", text: result.message });
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5 text-xs sm:text-[13px] dark:border-slate-800 dark:bg-slate-900/40">
      {/* Base Rate */}
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

      {/* Offer Discount */}
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

      {/* Service Fee */}
      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
          {language === "ar" ? "رسوم الخدمة" : "Service Fees"}
        </span>
        <span className="font-semibold text-gray-950 dark:text-white">
          +{previewPricing.serviceFee.toFixed(2)} {riyalLabel}
        </span>
      </div>

      {/* VAT */}
      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
          {language === "ar" ? "ضريبة القيمة المضافة" : "VAT"}
        </span>
        <span className="font-semibold text-gray-950 dark:text-white">
          +{previewPricing.vatAmount.toFixed(2)} {riyalLabel}
        </span>
      </div>

      {/* Applied Promo Code Pill */}
      {appliedCoupon && couponDiscount > 0 && (
        <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-xl border border-emerald-200/70 dark:border-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-semibold">
          <div className="flex items-center gap-1.5 min-w-0">
            <Tag className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">
              {language === "ar" ? "خصم الكوبون" : "Promo discount"} (
              <span className="font-mono font-bold">{appliedCoupon}</span>)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold">
              -{Number(couponDiscount).toFixed(2)} {riyalLabel}
            </span>
            {onRemoveCoupon && (
              <button
                type="button"
                onClick={onRemoveCoupon}
                className="text-gray-400 hover:text-rose-500 transition-colors p-0.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                title={language === "ar" ? "إزالة الكود" : "Remove promo code"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Promo Code & Promotion View Section */}
      {onApplyCoupon && (
        <div className="pt-1 border-t border-slate-200/60 dark:border-slate-800">
          {!appliedCoupon && !showPromoDrawer ? (
            <button
              type="button"
              onClick={() => setShowPromoDrawer(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#4F2396] dark:text-purple-300 hover:underline cursor-pointer"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>
                {language === "ar"
                  ? "لديك كود خصم أو عرض ترويجي؟"
                  : "Have a promo code or offer?"}
              </span>
            </button>
          ) : !appliedCoupon && showPromoDrawer ? (
            <div className="space-y-2 pt-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {language === "ar" ? "كود الخصم" : "Promo Code"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowPromoDrawer(false);
                    setFeedback(null);
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value.toUpperCase());
                    setFeedback(null);
                  }}
                  placeholder={language === "ar" ? "مثال: QAF10" : "e.g. QAF10"}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none focus:border-[#4F2396]"
                />
                <button
                  type="button"
                  onClick={() => handleApply()}
                  disabled={isApplying || !promoInput.trim()}
                  className="h-8 px-3 rounded-lg bg-[#4F2396] hover:bg-[#3d1979] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shrink-0"
                >
                  {isApplying ? (
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                  ) : (
                    language === "ar" ? "تطبيق" : "Apply"
                  )}
                </button>
              </div>

              {feedback && (
                <p
                  className={`text-[11px] font-semibold ${
                    feedback.type === "success"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {feedback.text}
                </p>
              )}

              {/* Minimal quick-tap promo chips */}
              {availableCoupons.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {language === "ar" ? "الكوبونات المتاحة:" : "Available codes:"}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {availableCoupons.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleApply(c.code)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#4F2396] hover:text-[#4F2396] transition cursor-pointer"
                      >
                        <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                        <span className="font-mono font-bold">{c.code}</span>
                        <span className="opacity-75">
                          ({c.type === "percentage" ? `${c.value}%` : `${c.value} SAR`})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Total Price */}
      <div className="border-t border-slate-200/80 pt-3 flex items-center justify-between font-black text-sm text-gray-950 dark:border-white/10 dark:text-white">
        <span>{language === "ar" ? "السعر الإجمالي" : "Total Price"}</span>
        <span className="text-[#4F2396] dark:text-purple-300 text-base">
          {previewPricing.total.toFixed(2)} {riyalLabel}
        </span>
      </div>
    </div>
  );
}

