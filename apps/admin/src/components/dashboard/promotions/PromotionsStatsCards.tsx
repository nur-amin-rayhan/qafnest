"use client";

import React from "react";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs flex flex-col justify-between">
        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline font-bold">
          {t("Active Promo Codes", "الأكواد النشطة")}
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display-sm text-2xl sm:text-3xl font-extrabold text-on-surface">
            {totalActive}
          </span>
          <span className="text-xs text-status-emerald font-bold">
            {t("of", "من")} {coupons.length} {t("campaigns", "حملة")}
          </span>
        </div>
        <span className="text-[11px] text-outline mt-1">
          {promotionsEnabled
            ? t("Redemptions enabled", "الاستخدام متاح للنزلاء")
            : t("Engine currently paused", "النظام موقوف حالياً")}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs flex flex-col justify-between">
        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline font-bold">
          {t("Total Redemptions", "إجمالي مرات الاستخدام")}
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display-sm text-2xl sm:text-3xl font-extrabold text-on-surface">
            {totalRedemptions}
          </span>
          <span className="text-xs text-primary font-bold">{t("Bookings", "حجوزات")}</span>
        </div>
        <span className="text-[11px] text-outline font-semibold mt-1 flex items-center gap-0.5">
          {totalRedemptions > 0
            ? t("Verified promo redemptions", "عمليات استخدام موثقة للأكواد")
            : t("No coupon redemptions yet", "لا توجد استخدامات للأكواد بعد")}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs flex flex-col justify-between">
        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline font-bold">
          {t("Total Guest Discounts", "إجمالي الخصومات الممنوحة")}
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display-sm text-2xl sm:text-3xl font-extrabold text-status-sand">
            SAR {totalEstSavings.toLocaleString()}
          </span>
        </div>
        <span className="text-[11px] text-outline mt-1">
          {coupons.length > 0
            ? t(`${totalActive} active campaign(s)`, `${totalActive} حملة ترويجية نشطة`)
            : t("No promotional campaigns configured", "لم يتم إعداد حملات ترويجية بعد")}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container/60 shadow-xs flex flex-col justify-between">
        <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline font-bold">
          {t("Avg Discount Value", "متوسط قيمة الخصم")}
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display-sm text-2xl sm:text-3xl font-extrabold text-on-surface">
            SAR {avgDiscountPerRedemption.toLocaleString()}
          </span>
        </div>
        <span className="text-[11px] text-outline font-semibold mt-1">
          {totalRedemptions > 0
            ? t("Per redeemed reservation", "لكل حجز استخدم كوبون")
            : t("Per redeemed reservation", "لكل استخدام للكوبون")}
        </span>
      </div>
    </div>
  );
}

