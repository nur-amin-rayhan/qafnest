"use client";

import React from "react";
import { Copy, Edit2, Trash2 } from "lucide-react";
import { AdminCoupon } from "../PromotionsTab";

interface CouponMobileCardProps {
  c: AdminCoupon;
  lang: string;
  t: (ar: string, en: string) => string;
  handleCopyCode: (code: string) => void;
  handleToggleCouponStatus: (c: AdminCoupon) => void;
  handleOpenEditModal: (c: AdminCoupon) => void;
  handleDeleteCoupon: (c: AdminCoupon) => void;
}

export function CouponMobileCard({
  c,
  lang,
  t,
  handleCopyCode,
  handleToggleCouponStatus,
  handleOpenEditModal,
  handleDeleteCoupon,
}: CouponMobileCardProps) {
  const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;

  return (
    <div className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-mono font-semibold text-xs">
            {c.code}
          </span>
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {c.type === "percentage" ? `${c.value}% OFF` : `SAR ${c.value} OFF`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleToggleCouponStatus(c)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors focus:outline-none ${
            c.is_active ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
          }`}
          aria-label={c.is_active ? "Pause Promo" : "Activate Promo"}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              c.is_active ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 font-normal">
        {lang === "ar" ? c.description_ar : c.description_en}
      </p>

      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
        <div>
          <span className="text-slate-400 dark:text-slate-500">{t("Min spend: ", "الحد الأدنى: ")}</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">SAR {c.min_spend || 0}</span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500">{t("Used: ", "الاستخدام: ")}</span>
          <span className="font-semibold text-[#4F2396] dark:text-purple-300">{c.used_count || 0}</span>
          {c.usage_limit && <span className="text-slate-400 dark:text-slate-500"> / {c.usage_limit}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {isExpired
            ? t("Expired", "منتهي")
            : c.expires_at
            ? `${t("Expires: ", "ينتهي: ")}${c.expires_at.slice(0, 10)}`
            : t("No expiry", "دائم")}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleCopyCode(c.code)}
            className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <Copy size={12} />
            <span>{t("Copy", "نسخ")}</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenEditModal(c)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
            aria-label="Edit coupon"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteCoupon(c)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center cursor-pointer"
            aria-label="Delete coupon"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

