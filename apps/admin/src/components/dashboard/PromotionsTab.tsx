"use client";

import React from "react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { CouponFormModal } from "./promotions/CouponFormModal";
import { CouponTableRow } from "./promotions/CouponTableRow";
import { CouponMobileCard } from "./promotions/CouponMobileCard";
import { PromotionsStatsCards } from "./promotions/PromotionsStatsCards";
import { PromotionsFilterToolbar } from "./promotions/PromotionsFilterToolbar";
import { usePromotionsManager } from "./promotions/usePromotionsManager";

export interface AdminCoupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_spend?: number;
  max_discount?: number;
  min_nights?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  description_en: string;
  description_ar: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface PromotionsTabProps {
  triggerToast: (msg: string) => void;
}

export default function PromotionsTab({ triggerToast }: PromotionsTabProps) {
  const { lang, dir, t } = useAdminAuth();

  const {
    coupons,
    promotionsEnabled,
    loading,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    filteredCoupons,
    totalActive,
    totalRedemptions,
    totalEstSavings,
    isModalOpen,
    setIsModalOpen,
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
    handleToggleGlobalSystem,
    handleToggleCouponStatus,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveCoupon,
    handleDeleteCoupon,
    handleCopyCode,
  } = usePromotionsManager({ triggerToast, t });

  return (
    <div dir={dir} className="flex flex-col w-full space-y-6">
      {/* Top Header & Global Toggle Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
              {t("Marketing & Revenue", "التسويق والإيرادات")}
            </span>
            <span className="text-outline">•</span>
            <span className="font-label-sm text-label-sm text-outline">
              {t("Campaign Engine", "محرك الحملات الترويجية")}
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            {t("Promotions & Coupons", "العروض وأكواد الخصم")}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5 max-w-2xl">
            {t(
              "Control guest promotion codes, configure discount parameters, and toggle the global promotional engine.",
              "التحكم في أكواد الخصم الترويجية للنزلاء، وضبط معايير الخصم، وتفعيل أو إيقاف محرك العروض في المنصة."
            )}
          </p>
        </div>

        {/* Global Controls & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Global Master Switch */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface leading-tight">
                {t("Promotion Engine", "نظام العروض")}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  promotionsEnabled ? "text-status-emerald" : "text-status-terracotta"
                }`}
              >
                {promotionsEnabled ? t("ACTIVE", "مفعل بالكامل") : t("PAUSED", "متوقف مؤقتاً")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleGlobalSystem}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                promotionsEnabled ? "bg-status-emerald" : "bg-outline-variant"
              }`}
              title={t("Toggle Promotion Engine Platform-wide", "تبديل حالة نظام العروض في المنصة")}
              aria-label="Toggle promotion engine platform-wide"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface-container-lowest shadow ring-0 transition duration-200 ${
                  promotionsEnabled ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Create Button */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-10 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-title-sm text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>{t("New Promo Code", "إضافة كود خصم جديد")}</span>
          </button>
        </div>
      </div>

      {/* 4-KPI Overview Row */}
      <PromotionsStatsCards
        coupons={coupons}
        promotionsEnabled={promotionsEnabled}
        totalActive={totalActive}
        totalRedemptions={totalRedemptions}
        totalEstSavings={totalEstSavings}
        t={t}
      />

      {/* Filter Tabs & Search Bar */}
      <PromotionsFilterToolbar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        coupons={coupons}
        t={t}
      />

      {/* Coupons Table & Cards List */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container/60 overflow-hidden">
        {/* Desktop Table View (>= lg) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-surface-container/80 bg-surface-container-low/50 text-[11px] font-bold uppercase tracking-wider text-outline">
                <th className="py-3 px-4 text-start">{t("Coupon Code", "كود الخصم")}</th>
                <th className="py-3 px-4 text-start">{t("Type & Value", "النوع والقيمة")}</th>
                <th className="py-3 px-4 text-start">{t("Rule Parameters", "الشروط والقيود")}</th>
                <th className="py-3 px-4 text-start">{t("Description", "الوصف")}</th>
                <th className="py-3 px-4 text-start">{t("Redemptions", "مرات الاستخدام")}</th>
                <th className="py-3 px-4 text-start">{t("Expiration", "تاريخ الانتهاء")}</th>
                <th className="py-3 px-4 text-end">{t("Status & Actions", "الحالة والإجراءات")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-outline">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                      <span>{t("Loading promotion coupons...", "جارٍ تحميل أكواد الخصم...")}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-outline">
                    {t("No promo codes match your filter.", "لا توجد أكواد خصم تطابق معايير البحث.")}
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => (
                  <CouponTableRow
                    key={c.id}
                    c={c}
                    lang={lang}
                    t={t}
                    handleCopyCode={handleCopyCode}
                    handleToggleCouponStatus={handleToggleCouponStatus}
                    handleOpenEditModal={handleOpenEditModal}
                    handleDeleteCoupon={handleDeleteCoupon}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Fluid Card Layout (< lg) */}
        <div className="block lg:hidden w-full divide-y divide-surface-container/60">
          {filteredCoupons.length === 0 ? (
            <div className="py-12 text-center text-outline">
              {t("No promo codes match your filter.", "لا توجد أكواد خصم تطابق معايير البحث.")}
            </div>
          ) : (
            filteredCoupons.map((c) => (
              <CouponMobileCard
                key={c.id}
                c={c}
                lang={lang}
                t={t}
                handleCopyCode={handleCopyCode}
                handleToggleCouponStatus={handleToggleCouponStatus}
                handleOpenEditModal={handleOpenEditModal}
                handleDeleteCoupon={handleDeleteCoupon}
              />
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Coupon Modal */}
      <CouponFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingCoupon={editingCoupon}
        formCode={formCode}
        setFormCode={setFormCode}
        formType={formType}
        setFormType={setFormType}
        formValue={formValue}
        setFormValue={setFormValue}
        formMinSpend={formMinSpend}
        setFormMinSpend={setFormMinSpend}
        formMaxDiscount={formMaxDiscount}
        setFormMaxDiscount={setFormMaxDiscount}
        formMinNights={formMinNights}
        setFormMinNights={setFormMinNights}
        formUsageLimit={formUsageLimit}
        setFormUsageLimit={setFormUsageLimit}
        formDescEn={formDescEn}
        setFormDescEn={setFormDescEn}
        formDescAr={formDescAr}
        setFormDescAr={setFormDescAr}
        formExpiresAt={formExpiresAt}
        setFormExpiresAt={setFormExpiresAt}
        formIsActive={formIsActive}
        setFormIsActive={setFormIsActive}
        isSaving={isSaving}
        onSave={handleSaveCoupon}
        dir={dir}
        t={t}
      />
    </div>
  );
}
