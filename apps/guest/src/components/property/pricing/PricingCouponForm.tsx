"use client";

import React, { useEffect, useState } from "react";
import {
  Tag,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
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
    <div className="pt-2 space-y-2">
      {/* Sleek Minimalist Form Group */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onApplyCoupon();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <div className="absolute inset-y-0 start-3 flex items-center pointer-events-none text-slate-400">
            <Tag className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={couponInput}
            onChange={(e) => {
              setCouponInput(e.target.value.toUpperCase());
              setCouponError(null);
            }}
            placeholder={t("Promo code (e.g. QAF10)", "كود الخصم (مثال: QAF10)")}
            className="w-full h-9 ps-8 pe-3 rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-700/80 dark:bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none focus:border-[#4F2396] focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isApplying || !couponInput.trim()}
          className="h-9 px-3.5 rounded-xl bg-[#4F2396] hover:bg-[#3d1979] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          {isApplying ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <span>{t("Apply", "تطبيق")}</span>
          )}
        </button>
      </form>

      {/* Feedback Messages */}
      {couponSuccess && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span className="truncate">{couponSuccess}</span>
        </div>
      )}

      {couponError && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-500/20 text-xs font-medium text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{couponError}</span>
        </div>
      )}

      {/* Elegant Collapsible Quick Promo Codes */}
      <div>
        <button
          type="button"
          onClick={() => setShowQuickCoupons(!showQuickCoupons)}
          className="group inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-[#4F2396] dark:hover:text-purple-300 transition-colors cursor-pointer"
        >
          <Sparkles className="h-3 w-3 text-amber-500 group-hover:scale-110 transition-transform" />
          <span className="font-semibold underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2">
            {t("View available promo codes", "عرض أكواد الخصم المتاحة")}
          </span>
          {showQuickCoupons ? (
            <ChevronUp className="h-3 w-3 opacity-70" />
          ) : (
            <ChevronDown className="h-3 w-3 opacity-70" />
          )}
        </button>

        {showQuickCoupons && (
          <div className="mt-2 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {t("Tap any code to apply:", "اضغط على أي كود للتطبيق المباشر:")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {liveCoupons.length === 0 ? (
                <span className="text-[11px] text-slate-400">
                  {t(
                    "No public promo codes active right now.",
                    "لا توجد أكواد عامة حالياً."
                  )}
                </span>
              ) : (
                liveCoupons.map((c) => {
                  const isCurrent = appliedCoupon === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCouponInput(c.code);
                        void onApplyCoupon(c.code);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#4F2396] hover:text-[#4F2396] dark:hover:border-purple-400 dark:hover:text-purple-300"
                      }`}
                    >
                      <Tag className="h-3 w-3 opacity-60" />
                      <span className="font-mono font-bold">{c.code}</span>
                      <span className="text-[10px] opacity-75">
                        · {c.type === "percentage" ? `${c.value}% OFF` : `SAR ${c.value}`}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

