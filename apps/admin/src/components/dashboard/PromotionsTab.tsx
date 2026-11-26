"use client";

import React from "react";
import { Plus, RefreshCw } from "lucide-react";
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
            <span className="text-xs font-semibold text-[#4F2396] dark:text-purple-300">
              {t("Marketing & Revenue", "التسويق والإيرادات")}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t("Campaign Engine", "محرك الحملات الترويجية")}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t("Promotions & Coupons", "العروض وأكواد الخصم")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            {t(
              "Control guest promotion codes, configure discount parameters, and toggle the global promotional engine.",
              "التحكم في أكواد الخصم الترويجية للنزلاء، وضبط معايير الخصم، وتفعيل أو إيقاف محرك العروض في المنصة."
            )}
          </p>
        </div>

        {/* Global Controls & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Global Master Switch */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0E0D16] border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                {t("Promotion Engine", "نظام العروض")}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  promotionsEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {promotionsEnabled ? t("ACTIVE", "مفعل بالكامل") : t("PAUSED", "متوقف مؤقتاً")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleGlobalSystem}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/40 ${
                promotionsEnabled ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
              title={t("Toggle Promotion Engine Platform-wide", "تبديل حالة نظام العروض في المنصة")}
              aria-label="Toggle promotion engine platform-wide"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                  promotionsEnabled ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Create Button */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-9 px-4 rounded-lg bg-[#4F2396] hover:bg-[#3D1A78] text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} />
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
      <div className="bg-white dark:bg-[#0E0D16] rounded-xl shadow-xs border border-slate-200/90 dark:border-slate-800 overflow-hidden">
        {/* Desktop Table View (>= xl) */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full min-w-[820px] text-start border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 text-start">{t("Coupon Code", "كود الخصم")}</th>
                <th className="py-3 px-4 text-start">{t("Type & Value", "النوع والقيمة")}</th>
                <th className="py-3 px-4 text-start">{t("Rule Parameters", "الشروط والقيود")}</th>
                <th className="py-3 px-4 text-start">{t("Description", "الوصف")}</th>
                <th className="py-3 px-4 text-start">{t("Redemptions", "مرات الاستخدام")}</th>
                <th className="py-3 px-4 text-start">{t("Expiration", "تاريخ الانتهاء")}</th>
                <th className="py-3 px-4 text-end">{t("Status & Actions", "الحالة والإجراءات")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-900 dark:text-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-[#4F2396]" />
                      <span>{t("Loading promotion coupons...", "جارٍ تحميل أكواد الخصم...")}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
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

        {/* Mobile & Tablet Fluid Card Layout (< xl) */}
        <div className="block xl:hidden w-full divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredCoupons.length === 0 ? (
            <div className="py-12 text-center text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500">
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
