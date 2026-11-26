"use client";

import React from "react";
import { Copy, Edit2, Trash2, Clock } from "lucide-react";
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
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
      {/* Code & Badges */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyCode(c.code)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-mono font-semibold text-sm hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
            title={t("Click to copy coupon code", "اضغط لنسخ كود الخصم")}
          >
            <span>{c.code}</span>
            <Copy size={13} className="opacity-70" />
          </button>
        </div>
      </td>

      {/* Discount Type & Value */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex flex-col">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {c.type === "percentage" ? `${c.value}% OFF` : `SAR ${c.value} OFF`}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {c.type === "percentage" ? t("Percentage discount", "نسبة مئوية") : t("Fixed cash deduction", "خصم نقدي مباشر")}
          </span>
        </div>
      </td>

      {/* Rules & Caps */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex flex-col text-xs sm:text-sm gap-0.5">
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {t("Min spend: ", "الحد الأدنى: ")}
            <span className="font-semibold text-slate-900 dark:text-slate-100">SAR {c.min_spend || 0}</span>
          </span>
          {c.max_discount && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("Max cap: ", "السقف الأقصى: ")}SAR {c.max_discount}
            </span>
          )}
          {c.min_nights && c.min_nights > 1 && (
            <span className="text-xs text-[#4F2396] dark:text-purple-300 font-semibold">
              {c.min_nights} {t("nights min", "ليال كحد أدنى")}
            </span>
          )}
        </div>
      </td>

      {/* Description */}
      <td className="py-3.5 px-4 align-middle max-w-xs">
        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 font-normal">
          {lang === "ar" ? c.description_ar : c.description_en}
        </span>
      </td>

      {/* Redemptions & Progress */}
      <td className="py-3.5 px-4 align-middle">
        <div className="flex flex-col gap-1 w-32">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{c.used_count || 0}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{c.usage_limit ? `/ ${c.usage_limit}` : t("Unlimited", "مفتوح")}</span>
          </div>
          {c.usage_limit && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  usagePercent > 80 ? "bg-amber-500" : "bg-[#4F2396]"
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
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
            <Clock size={11} />
            <span>{t("Expired", "منتهي")}</span>
          </span>
        ) : c.expires_at ? (
          <div className="flex flex-col">
            <span className="text-xs text-slate-900 dark:text-slate-100 font-semibold">{c.expires_at.slice(0, 10)}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">{t("Valid until 23:59", "صالح حتى 23:59")}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">{t("Never expires", "دائم بدون انتهاء")}</span>
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
              c.is_active ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
            title={c.is_active ? t("Pause Promo", "إيقاف الكود") : t("Activate Promo", "تفعيل الكود")}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                c.is_active ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
              }`}
            />
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => handleOpenEditModal(c)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title={t("Edit Coupon Rules", "تعديل بيانات الكود")}
          >
            <Edit2 size={14} />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => handleDeleteCoupon(c)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors cursor-pointer"
            title={t("Delete Coupon", "حذف الكود")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

