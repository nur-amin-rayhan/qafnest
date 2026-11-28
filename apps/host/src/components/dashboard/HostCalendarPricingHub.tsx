"use client";

import React, { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { HostPropertySummary } from "./HostOverviewHub";
import { CalendarMonthGrid } from "./calendar/CalendarMonthGrid";
import { CalendarPricingSidebar } from "./calendar/CalendarPricingSidebar";
import { EditDatePriceModal } from "./calendar/EditDatePriceModal";
import { useHostCalendarPricing } from "./calendar/useHostCalendarPricing";

interface HostCalendarPricingHubProps {
  properties: HostPropertySummary[];
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  userId?: string;
}

export default function HostCalendarPricingHub({
  properties,
  lang,
  t,
  userId,
}: HostCalendarPricingHubProps) {
  const {
    selectedPropertyId,
    setSelectedPropertyId,
    selectedProperty,
    monthData,
    loading,
    isSaving,
    savedNotice,
    saveError,
    blockedDates,
    bookedDates,
    slotConfig,
    slotSummaryByDate,
    masterBasePrice,
    setMasterBasePrice,
    customDayPricing,
    setCustomDayPricing,
    priceOverrides,
    modalDateIso,
    isModalOpen,
    formatDayIso,
    toggleDayBlocked,
    handleTogglePropertySlotFormat,
    handleChangePropertyTwelveHourPrice,
    handleSaveDateSlotOverride,
    handlePrevMonth,
    handleNextMonth,
    handleOpenDateModal,
    handleCloseDateModal,
    handleSavePricing,
    handleSaveDateOverride,
    activeModalEffective,
  } = useHostCalendarPricing(properties, lang, t, userId);

  const weekDayNames = useMemo(() => {
    if (lang === "ar") {
      return ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    }
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  }, [lang]);

  return (
    <div className="mx-auto w-full max-w-[1640px] px-2.5 sm:px-6 md:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#4F2396] text-white shadow-xs">
              <CalendarDays size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t("Calendar & Availability Hub", "التقويم وإدارة الإتاحة والأسعار")}
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                {t(
                  "Configure master base rates, granular 7-day pricing, and individual date overrides.",
                  "تحكم بالسعر الأساسي المعتمد، وأسعار أيام الأسبوع، والتخصيص الفردي لتواريخ التقويم."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Top Property Selector (Always visible at the top) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-600 dark:text-slate-400 hidden sm:inline">
            {t("Selected Property:", "العقار المختار:")}
          </span>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="rounded-2xl border-2 border-violet-200 dark:border-slate-700 bg-white dark:bg-[#12101a] px-4 py-2.5 text-xs sm:text-sm font-black text-slate-800 dark:text-white shadow-xs outline-none cursor-pointer hover:border-[#4F2396] focus:border-[#4F2396] focus:ring-2 focus:ring-[#4F2396]/20 transition"
          >
            {properties.length > 0 ? (
              properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.city ? `(${p.city})` : ""}
                </option>
              ))
            ) : (
              <option value={selectedPropertyId || "default"}>
                {selectedPropertyId || t("Loading properties...", "جارٍ تحميل العقارات...")}
              </option>
            )}
          </select>
        </div>
      </div>

      {/* Main Grid: Calendar on Left/Center, Quick Pricing Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <CalendarMonthGrid
          monthData={monthData}
          loading={loading}
          handlePrevMonth={handlePrevMonth}
          handleNextMonth={handleNextMonth}
          weekDayNames={weekDayNames}
          bookedDates={bookedDates}
          blockedDates={blockedDates}
          slotSummaryByDate={slotSummaryByDate}
          priceOverrides={priceOverrides}
          customDayPricing={customDayPricing}
          masterBasePrice={masterBasePrice}
          formatDayIso={formatDayIso}
          onSelectDateForEdit={handleOpenDateModal}
          lang={lang}
          t={t}
        />

        <CalendarPricingSidebar
          masterBasePrice={masterBasePrice}
          setMasterBasePrice={setMasterBasePrice}
          customDayPricing={customDayPricing}
          setCustomDayPricing={setCustomDayPricing}
          slotConfig={slotConfig}
          onToggleSlotFormat={handleTogglePropertySlotFormat}
          onChangeTwelveHourPrice={handleChangePropertyTwelveHourPrice}
          savedNotice={savedNotice}
          saveError={saveError}
          isSaving={isSaving}
          selectedPropertyId={selectedPropertyId}
          properties={properties}
          selectedProperty={selectedProperty}
          onSelectPropertyId={setSelectedPropertyId}
          handleSavePricing={handleSavePricing}
          t={t}
          lang={lang}
        />
      </div>

      {/* Interactive Date Inspector & Override Modal */}
      <EditDatePriceModal
        isOpen={isModalOpen}
        onClose={handleCloseDateModal}
        dateIso={modalDateIso}
        isBooked={modalDateIso ? bookedDates.includes(modalDateIso) : false}
        isBlocked={modalDateIso ? blockedDates.includes(modalDateIso) : false}
        onToggleBlock={toggleDayBlocked}
        currentOverridePrice={modalDateIso ? priceOverrides[modalDateIso] ?? null : null}
        effectiveRate={activeModalEffective.rate}
        effectiveSource={activeModalEffective.source}
        onSaveOverride={handleSaveDateOverride}
        slotSummary={modalDateIso ? slotSummaryByDate[modalDateIso] ?? null : null}
        slotConfig={slotConfig}
        onSaveDateSlotOverride={handleSaveDateSlotOverride}
        lang={lang}
        t={t}
      />
    </div>
  );
}
