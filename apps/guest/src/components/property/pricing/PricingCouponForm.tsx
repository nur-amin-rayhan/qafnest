"use client";

import React, { useEffect, useState } from "react";
import {
  Tag,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Percent,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ACTIVE_COUPONS, type PromoCoupon } from "@/lib/services/pricing";

interface PricingCouponFormProps {
  couponInput: string;
  setCouponInput: (val: string) => void;
  appliedCoupon: string | null;
  onApplyCoupon: (code?: string) => Promise<void>;
  isApplying: boolean;
  couponSuccess: string | null;
  couponError: string | null;
  setCouponError: (err: string | null) => void;
  t: (en: string, ar: string) => string;
}

export function PricingCouponForm({
  couponInput,
  setCouponInput,
  appliedCoupon,
  onApplyCoupon,
  isApplying,
  couponSuccess,
  couponError,
  setCouponError,
  t,
}: PricingCouponFormProps) {
  const [showQuickCoupons, setShowQuickCoupons] = useState(false);
  const [liveCoupons, setLiveCoupons] = useState<PromoCoupon[]>(ACTIVE_COUPONS);
  const [loadedCoupons, setLoadedCoupons] = useState(false);

  useEffect(() => {
    if (loadedCoupons) return;
    let active = true;
    fetch("/api/coupons/active", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.coupons)) {
          setLiveCoupons(data.coupons);
          setLoadedCoupons(true);
        }
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, [loadedCoupons]);

  return (
    <div className="pt-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onApplyCoupon();
        }}
        className="flex items-stretch gap-2"
      >
        <div className="relative flex-1">
          <div className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-gray-400">
            <Tag className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={couponInput}
            onChange={(e) => {
              setCouponInput(e.target.value.toUpperCase());
              setCouponError(null);
            }}
            placeholder={t("Promo code (e.g. QAF10)", "كود الخصم (مثال: QAF10)")}
            className="w-full h-10 ps-9 pe-3 rounded-xl border border-violet-200/80 bg-violet-50/20 dark:border-violet-500/25 dark:bg-violet-950/20 text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isApplying || !couponInput.trim()}
          className="h-10 px-4 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-sm shadow-violet-900/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          {isApplying ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <span>{t("Apply", "تطبيق")}</span>
          )}
        </button>
      </form>

      {/* Feedback Messages */}
      {couponSuccess && (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{couponSuccess}</span>
        </div>
      )}

      {couponError && (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{couponError}</span>
        </div>
      )}

      {/* Quick Suggest Coupons Drawer */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setShowQuickCoupons(!showQuickCoupons)}
          className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Percent className="h-3 w-3" />
          <span>{t("View available promo codes", "عرض أكواد الخصم المتاحة")}</span>
          {showQuickCoupons ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {showQuickCoupons && (
          <div className="mt-2 p-2.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-500/20 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider block">
              {t("Click any code to apply instantly:", "اضغط على أي كود للتطبيق الفوري:")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {liveCoupons.length === 0 ? (
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t(
                    "No public promo codes active right now. Enter a private code above.",
                    "لا توجد أكواد عامة حالياً — أدخل الكود الخاص بك أعلاه."
                  )}
                </span>
              ) : (
                liveCoupons.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCouponInput(c.code);
                      void onApplyCoupon(c.code);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      appliedCoupon === c.code
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white dark:bg-white/5 border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-200 hover:bg-violet-100/60"
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    <span className="font-mono">{c.code}</span>
                    <span className="text-[10px] opacity-80">
                      ({c.type === "percentage" ? `${c.value}% OFF` : `SAR ${c.value}`})
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

