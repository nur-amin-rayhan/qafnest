"use client";

import React from "react";

interface PreviewPricingSidebarProps {
  isUnpublished: boolean;
  basePrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  discountPercent: number;
  nights: number;
  setNights: React.Dispatch<React.SetStateAction<number>>;
  guestsCount: number;
  setGuestsCount: React.Dispatch<React.SetStateAction<number>>;
  capacity: number;
  splitInstallment: string;
  subtotal: number;
  serviceFee: number;
  vat: number;
  estimatedTotal: number;
  t: (ar: string, en: string) => string;
}

export function PreviewPricingSidebar({
  isUnpublished,
  basePrice,
  originalPrice,
  hasDiscount,
  discountPercent,
  nights,
  setNights,
  guestsCount,
  setGuestsCount,
  capacity,
  splitInstallment,
  subtotal,
  serviceFee,
  vat,
  estimatedTotal,
  t,
}: PreviewPricingSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto rounded-3xl">
      <section className="relative overflow-hidden rounded-3xl border border-violet-200/90 bg-white p-5 shadow-[0_18px_55px_rgba(70,35,130,0.12)] dark:border-violet-500/25 dark:bg-[#12101a] dark:shadow-[0_18px_55px_rgba(0,0,0,0.4)] sm:p-6">
        {/* Prominent Under Review Notice If Unpublished */}
        {isUnpublished && (
          <div className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-300 mb-1">
              <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
              <span>{t("قيد المراجعة • نمط المعاينة", "Under Review • Preview Mode")}</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
              {t(
                "العقار غير متاح للحجز العام بعد. يتم عرض نموذج الحسابات والأسعار هنا للتحقق الإداري الكامل.",
                "This listing is currently unpublished. Complete reservation and pricing layout is displayed here for administrative auditing."
              )}
            </p>
          </div>
        )}

        {/* Pricing Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 dark:border-white/10">
          <div>
            {hasDiscount && (
              <div className="text-[13px] font-extrabold text-rose-500 line-through dark:text-rose-400">
                {originalPrice} SAR
              </div>
            )}
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-violet-700 dark:text-violet-300">
                {basePrice}
              </span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {t("ريال / ليلة", "SAR / night")}
              </span>
            </div>
          </div>

          {hasDiscount && (
            <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-300">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Duration & Guests Selectors */}
        <div className="mt-4 space-y-3">
          {/* Stay Duration Selector */}
          <div className="rounded-2xl border border-violet-200/70 bg-violet-50/30 p-3 text-xs dark:border-violet-500/20 dark:bg-[#161224]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {t("مدة الإقامة:", "Stay Duration:")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNights(Math.max(1, nights - 1))}
                  className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-sm cursor-pointer"
                  aria-label="Decrease nights"
                >
                  -
                </button>
                <span className="font-bold text-violet-700 dark:text-violet-300 px-1">
                  {nights} {t(nights === 1 ? "ليلة" : "ليال", nights === 1 ? "night" : "nights")}
                </span>
                <button
                  type="button"
                  onClick={() => setNights(nights + 1)}
                  className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-sm cursor-pointer"
                  aria-label="Increase nights"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Guests Counter */}
          <div className="rounded-2xl border border-violet-200/70 bg-violet-50/30 p-3 text-xs dark:border-violet-500/20 dark:bg-[#161224]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {t("عدد الضيوف:", "Guests:")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                  className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-sm cursor-pointer"
                  aria-label="Decrease guests"
                >
                  -
                </button>
                <span className="font-bold text-gray-900 dark:text-white px-1">
                  {guestsCount} {t("ضيوف", "guests")}
                </span>
                <button
                  type="button"
                  onClick={() => setGuestsCount(Math.min(capacity, guestsCount + 1))}
                  className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center font-bold text-sm cursor-pointer"
                  aria-label="Increase guests"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Tabby & Tamara Installment Callout */}
          <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50/80 to-fuchsia-50/80 p-3.5 text-xs dark:border-violet-500/25 dark:from-violet-950/30 dark:to-fuchsia-950/20">
            <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white">
              <span>{t("قسّمها على ٤ دفعات بدون فوائد", "Split in 4 with Tabby / Tamara")}</span>
              <span className="text-violet-700 dark:text-violet-300">{splitInstallment} SAR</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {t("متوافق مع الشريعة الإسلامية وبدون أي رسوم تأخير", "0% interest, Shariah-compliant monthly installments")}
            </p>
          </div>
        </div>

        {/* Price Breakdown Calculation */}
        <div className="mt-5 space-y-2 border-t border-violet-100/80 pt-4 text-xs dark:border-violet-500/15">
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>
              {basePrice} SAR × {nights} {t("ليالي", "nights")}
            </span>
            <span>{subtotal} SAR</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>{t("رسوم الخدمة والتشغيل", "Service fee")}</span>
            <span>{serviceFee} SAR</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>{t("ضريبة القيمة المضافة", "VAT")}</span>
            <span>{vat} SAR</span>
          </div>
          <div className="flex justify-between border-t border-violet-100/80 pt-2 font-bold text-sm text-gray-950 dark:text-white dark:border-violet-500/20">
            <span>{t("الإجمالي المتوقع", "Total")}</span>
            <span className="text-violet-700 dark:text-violet-300">{estimatedTotal} SAR</span>
          </div>
        </div>

        {/* Reserve CTA */}
        <div className="mt-5">
          {isUnpublished ? (
            <button
              type="button"
              disabled
              className="w-full rounded-2xl bg-gray-300 dark:bg-white/15 py-3.5 text-xs font-bold text-gray-600 dark:text-gray-400 cursor-not-allowed text-center"
            >
              {t("الحجز معلق حتى اعتماد الإعلان", "Booking paused (Under Review)")}
            </button>
          ) : (
            <button
              type="button"
              className="w-full rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-violet-700/25 transition hover:brightness-110 cursor-pointer text-center"
            >
              {t("حجز الإقامة الآن", "Reserve Stay")}
            </button>
          )}
        </div>

        <div className="mt-3 text-center text-[11px] text-gray-500 dark:text-gray-400">
          {t("لن يتم خصم أي مبالغ في هذه المعاينة", "No charges incurred during admin preview")}
        </div>
      </section>
    </aside>
  );
}

