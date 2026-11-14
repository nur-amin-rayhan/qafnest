"use client";

import React from "react";
import { AdminCoupon } from "../PromotionsTab";

interface CouponTableRowProps {
  c: AdminCoupon;
  lang: string;
  t: (ar: string, en: string) => string;
  handleCopyCode: (code: string) => void;
  handleToggleCouponStatus: (c: AdminCoupon) => void;
  handleOpenEditModal: (c: AdminCoupon) => void;
  handleDeleteCoupon: (c: AdminCoupon) => void;
}

export function CouponTableRow({
  c,
  lang,
  t,
  handleCopyCode,
  handleToggleCouponStatus,
  handleOpenEditModal,
  handleDeleteCoupon,
}: CouponTableRowProps) {
  const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
  const usagePercent = c.usage_limit ? Math.min(100, Math.round((c.used_count / c.usage_limit) * 100)) : 0;

  return (
    <tr className="hover:bg-surface-desert-sand/40 transition-colors group">
      {/* Code & Badges */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyCode(c.code)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-mono font-black text-xs hover:bg-primary/20 transition-colors cursor-pointer group-hover:border-primary/40"
            title={t("Click to copy coupon code", "اضغط لنسخ كود الخصم")}
          >
            <span>{c.code}</span>
            <span className="material-symbols-outlined text-[13px] opacity-70">content_copy</span>
          </button>
        </div>
      </td>

      {/* Discount Type & Value */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex flex-col">
          <span className="font-bold text-xs text-on-surface">
            {c.type === "percentage" ? `${c.value}% OFF` : `SAR ${c.value} OFF`}
          </span>
          <span className="text-[11px] text-outline">
            {c.type === "percentage" ? t("Percentage discount", "نسبة مئوية") : t("Fixed cash deduction", "خصم نقدي مباشر")}
          </span>
        </div>
      </td>

      {/* Rules & Caps */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex flex-col text-xs gap-0.5">
          <span className="text-on-surface font-medium">
            {t("Min spend: ", "الحد الأدنى: ")}
            <span className="font-bold">SAR {c.min_spend || 0}</span>
          </span>
          {c.max_discount && (
            <span className="text-[11px] text-outline">
              {t("Max cap: ", "السقف الأقصى: ")}SAR {c.max_discount}
            </span>
          )}
          {c.min_nights && c.min_nights > 1 && (
            <span className="text-[10px] text-primary font-semibold">
              {c.min_nights} {t("nights min", "ليال كحد أدنى")}
            </span>
          )}
        </div>
      </td>

      {/* Description */}
      <td className="py-3.5 px-4 align-middle max-w-xs">
        <span className="text-xs text-on-surface-variant line-clamp-2 font-medium">
          {lang === "ar" ? c.description_ar : c.description_en}
        </span>
      </td>

      {/* Redemptions & Progress */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex flex-col gap-1 w-32">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-on-surface">{c.used_count || 0}</span>
            <span className="text-[11px] text-outline">{c.usage_limit ? `/ ${c.usage_limit}` : t("Unlimited", "مفتوح")}</span>
          </div>
          {c.usage_limit && (
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  usagePercent > 80 ? "bg-status-sand" : "bg-primary"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
        </div>
      </td>

      {/* Expiry */}
      <td className="py-3.5 px-4 align-middle whitespace-nowrap">
        {isExpired ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-status-terracotta bg-error/10 px-2 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[13px]">history</span>
            {t("Expired", "منتهي")}
          </span>
        ) : c.expires_at ? (
          <div className="flex flex-col">
            <span className="text-xs text-on-surface font-semibold">{c.expires_at.slice(0, 10)}</span>
            <span className="text-[10px] text-outline">{t("Valid until 23:59", "صالح حتى 23:59")}</span>
          </div>
        ) : (
          <span className="text-xs text-outline">{t("Never expires", "دائم بدون انتهاء")}</span>
        )}
      </td>

      {/* Status & Action Buttons */}
      <td className="py-3.5 px-4 align-middle text-end">
        <div className="flex items-center justify-end gap-1.5">
          {/* Status Switch */}
          <button
            type="button"
            onClick={() => handleToggleCouponStatus(c)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors focus:outline-none ${
              c.is_active ? "bg-status-emerald" : "bg-outline-variant"
            }`}
            title={c.is_active ? t("Pause Promo", "إيقاف الكود") : t("Activate Promo", "تفعيل الكود")}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface-container-lowest shadow ring-0 transition duration-200 ${
                c.is_active ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
              }`}
            />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => handleOpenEditModal(c)}
            className="w-7 h-7 rounded-lg text-outline hover:text-primary hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
            title={t("Edit Coupon Rules", "تعديل بيانات الكود")}
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => handleDeleteCoupon(c)}
            className="w-7 h-7 rounded-lg text-outline hover:text-status-terracotta hover:bg-error/10 flex items-center justify-center transition-colors cursor-pointer"
            title={t("Delete Coupon", "حذف الكود")}
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

