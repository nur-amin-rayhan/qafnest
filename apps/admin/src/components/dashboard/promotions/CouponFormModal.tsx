"use client";

import React from "react";
import { AdminCoupon } from "../PromotionsTab";

interface CouponFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCoupon: AdminCoupon | null;
  formCode: string;
  setFormCode: (v: string) => void;
  formType: "percentage" | "fixed";
  setFormType: (v: "percentage" | "fixed") => void;
  formValue: string;
  setFormValue: (v: string) => void;
  formMinSpend: string;
  setFormMinSpend: (v: string) => void;
  formMaxDiscount: string;
  setFormMaxDiscount: (v: string) => void;
  formMinNights: string;
  setFormMinNights: (v: string) => void;
  formUsageLimit: string;
  setFormUsageLimit: (v: string) => void;
  formDescEn: string;
  setFormDescEn: (v: string) => void;
  formDescAr: string;
  setFormDescAr: (v: string) => void;
  formExpiresAt: string;
  setFormExpiresAt: (v: string) => void;
  formIsActive: boolean;
  setFormIsActive: (v: boolean) => void;
  isSaving: boolean;
  onSave: (e: React.FormEvent) => void;
  dir: string;
  t: (ar: string, en: string) => string;
}

export function CouponFormModal({
  isOpen,
  onClose,
  editingCoupon,
  formCode,
  setFormCode,
  formType,
  setFormType,
  formValue,
  setFormValue,
  formMinSpend,
  setFormMinSpend,
  formMaxDiscount,
  setFormMaxDiscount,
  formMinNights,
  setFormMinNights,
  formUsageLimit,
  setFormUsageLimit,
  formDescEn,
  setFormDescEn,
  formDescAr,
  setFormDescAr,
  formExpiresAt,
  setFormExpiresAt,
  formIsActive,
  setFormIsActive,
  isSaving,
  onSave,
  dir,
  t,
}: CouponFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-surface-container shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        <div className="flex items-center justify-between border-b border-surface-container/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">loyalty</span>
            <h3 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
              {editingCoupon
                ? t(`Edit Coupon (${editingCoupon.code})`, `تعديل كود الخصم (${editingCoupon.code})`)
                : t("Create New Promo Code", "إضافة كود خصم جديد")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4 text-xs sm:text-sm">
          {/* Promo Code & Discount Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                {t("Promo Code *", "كود الخصم *")}
              </label>
              <input
                type="text"
                required
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder={t("e.g. SUMMER2026", "مثال: SUMMER2026")}
                className="w-full h-10 px-3 rounded-lg border border-surface-container bg-surface-container-low font-mono font-bold uppercase text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                {t("Discount Type *", "نوع الخصم *")}
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as "percentage" | "fixed")}
                className="w-full h-10 px-3 rounded-lg border border-surface-container bg-surface-container-low font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="percentage">{t("Percentage Discount (%)", "نسبة مئوية (%)")}</option>
                <option value="fixed">{t("Fixed Amount (SAR)", "مبلغ ثابت (ر.س)")}</option>
              </select>
            </div>
          </div>

          {/* Value & Minimum Spend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                {formType === "percentage"
                  ? t("Discount Percentage (%) *", "نسبة الخصم (%) *")
                  : t("Discount Amount (SAR) *", "مبلغ الخصم (ر.س) *")}
              </label>
              <input
                type="number"
                required
                min="1"
                max={formType === "percentage" ? "90" : "5000"}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-surface-container bg-surface-container-low font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                {t("Minimum Booking Spend (SAR)", "الحد الأدنى لقيمة الحجز (ر.س)")}
              </label>
              <input
                type="number"
                min="0"
                value={formMinSpend}
                onChange={(e) => setFormMinSpend(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Max Discount Cap & Min Nights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                {t("Max Discount Cap (SAR)", "الحد الأقصى للخصم (ر.س)")}
              </label>
              <input
                type="number"
                min="0"
                value={formMaxDiscount}
                onChange={(e) => setFormMaxDiscount(e.target.value)}
                placeholder={t("Optional", "اختياري")}
                className="w-full h-10 px-3 rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                {t("Minimum Nights Required", "الحد الأدنى لعدد الليالي")}
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formMinNights}
                onChange={(e) => setFormMinNights(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Usage Limit & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                {t("Total Usage Limit", "الحد الأقصى لمرات الاستخدام")}
              </label>
              <input
                type="number"
                min="1"
                value={formUsageLimit}
                onChange={(e) => setFormUsageLimit(e.target.value)}
                placeholder={t("Unlimited", "غير محدود")}
                className="w-full h-10 px-3 rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                {t("Expiration Date", "تاريخ انتهاء الصلاحية")}
              </label>
              <input
                type="date"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              {t("Campaign Description (English)", "وصف الحملة (بالإنجليزية)")}
            </label>
            <input
              type="text"
              value={formDescEn}
              onChange={(e) => setFormDescEn(e.target.value)}
              placeholder={t("e.g. 15% off luxury chalets and private villas", "مثال: خصم 15% على الشاليهات والفلل الفاخرة")}
              className="w-full h-10 px-3 rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              {t("Campaign Description (Arabic)", "وصف الحملة (بالعربية)")}
            </label>
            <input
              type="text"
              dir="rtl"
              value={formDescAr}
              onChange={(e) => setFormDescAr(e.target.value)}
              placeholder="مثال: خصم 15% على الشاليهات والفلل الفاخرة"
              className="w-full h-10 px-3 rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface">
                {t("Activate Code Immediately", "تفعيل الكود فوراً")}
              </span>
              <span className="text-[11px] text-outline">
                {t("Guests can apply this code right away during checkout.", "سيتمكن النزلاء من استخدام الكود فوراً أثناء الدفع.")}
              </span>
            </div>
            <input
              type="checkbox"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container/60">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-on-surface-variant hover:bg-surface-container font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              {t("Cancel", "إلغاء")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <span>{t("Saving...", "جارٍ الحفظ...")}</span>
              ) : (
                <span>{editingCoupon ? t("Update Coupon", "تحديث الكود") : t("Create Coupon", "حفظ وتفعيل")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

