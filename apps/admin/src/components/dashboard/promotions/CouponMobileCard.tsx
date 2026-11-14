"use client";

import React from "react";
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
    <div className="p-4 hover:bg-surface-desert-sand/40 transition-colors flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-mono font-black text-xs">
            {c.code}
          </span>
          <span className="text-xs font-bold text-on-surface">
            {c.type === "percentage" ? `${c.value}% OFF` : `SAR ${c.value} OFF`}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleToggleCouponStatus(c)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors focus:outline-none ${
            c.is_active ? "bg-status-emerald" : "bg-outline-variant"
          }`}
          aria-label={c.is_active ? "Pause Promo" : "Activate Promo"}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface-container-lowest shadow ring-0 transition duration-200 ${
              c.is_active ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <p className="text-xs text-on-surface-variant font-medium">
        {lang === "ar" ? c.description_ar : c.description_en}
      </p>

      <div className="p-2.5 rounded-lg bg-surface-container-low/70 flex flex-wrap items-center justify-between text-xs gap-2">
        <div>
          <span className="text-outline">{t("Min spend: ", "الحد الأدنى: ")}</span>
          <span className="font-bold text-on-surface">SAR {c.min_spend || 0}</span>
        </div>
        <div>
          <span className="text-outline">{t("Used: ", "الاستخدام: ")}</span>
          <span className="font-bold text-primary">{c.used_count || 0}</span>
          {c.usage_limit && <span className="text-outline"> / {c.usage_limit}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-outline">
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
            className="h-7 px-2 rounded-lg border border-outline/20 text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            <span>{t("Copy", "نسخ")}</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenEditModal(c)}
            className="w-7 h-7 rounded-lg text-outline hover:text-primary hover:bg-surface-container flex items-center justify-center cursor-pointer"
            aria-label="Edit coupon"
          >
            <span className="material-symbols-outlined text-[15px]">edit</span>
          </button>
          <button
            type="button"
            onClick={() => handleDeleteCoupon(c)}
            className="w-7 h-7 rounded-lg text-outline hover:text-status-terracotta hover:bg-error/10 flex items-center justify-center cursor-pointer"
            aria-label="Delete coupon"
          >
            <span className="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

