"use client";

import React from "react";
import { Tag, Ticket, Percent, Sparkles } from "lucide-react";
import type { AdminCoupon } from "../PromotionsTab";

interface PromotionsStatsCardsProps {
  coupons: AdminCoupon[];
  promotionsEnabled: boolean;
  totalActive: number;
  totalRedemptions: number;
  totalEstSavings: number;
  t: (en: string, ar: string) => string;
}

export function PromotionsStatsCards({
  coupons,
  promotionsEnabled,
  totalActive,
  totalRedemptions,
  totalEstSavings,
  t,
}: PromotionsStatsCardsProps) {
  const avgDiscountPerRedemption =
    totalRedemptions > 0 ? Math.round(totalEstSavings / totalRedemptions) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Active Promo Codes */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#0E0D16] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("Active Promo Codes", "الأكواد النشطة")}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {totalActive}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {t("of", "من")} {coupons.length} {t("campaigns", "حملة")}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <Tag size={18} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
          {promotionsEnabled
            ? t("Redemptions enabled", "الاستخدام متاح للنزلاء")
            : t("Engine currently paused", "النظام موقوف حالياً")}
        </div>
      </div>

      {/* 2. Total Redemptions */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#0E0D16] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("Total Redemptions", "إجمالي مرات الاستخدام")}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {totalRedemptions}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t("Bookings", "حجوزات")}</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <Ticket size={18} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
          {totalRedemptions > 0
            ? t("Verified promo redemptions", "عمليات استخدام موثقة للأكواد")
            : t("No coupon redemptions yet", "لا توجد استخدامات للأكواد بعد")}
        </div>
      </div>

      {/* 3. Total Guest Discounts */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#0E0D16] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("Total Guest Discounts", "إجمالي الخصومات الممنوحة")}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                SAR {totalEstSavings.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[#4F2396] dark:text-purple-300 shrink-0">
            <Sparkles size={18} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
          {coupons.length > 0
            ? t(`${totalActive} active campaign(s)`, `${totalActive} حملة ترويجية نشطة`)
            : t("No promotional campaigns configured", "لم يتم إعداد حملات ترويجية بعد")}
        </div>
      </div>

      {/* 4. Avg Discount Value */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#0E0D16] border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t("Avg Discount Value", "متوسط قيمة الخصم")}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                SAR {avgDiscountPerRedemption.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <Percent size={18} strokeWidth={1.5} />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
          {totalRedemptions > 0
            ? t("Per redeemed reservation", "لكل حجز استخدم كوبون")
            : t("Per redeemed reservation", "لكل استخدام للكوبون")}
        </div>
      </div>
    </div>
  );
}

