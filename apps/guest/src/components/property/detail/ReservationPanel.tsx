"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { getPropertyCapacity, Property } from "@/data/properties";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  TWELVE_HOUR_CHECKIN_TIME,
  type BookingSlotFormatId,
} from "@qafnest/shared";
import {
  getSaudiToday,
  getDayAfter,
  formatGathernDate,
  formatGathernTime,
  addDaysIso,
  CHECKIN_TIME_SLOTS,
  CHECKOUT_TIME_SLOTS,
} from "./reservation/reservationDateUtils";
import { SplitPaymentsModal } from "./reservation/SplitPaymentsModal";
import { ReservationTimePicker } from "./reservation/ReservationTimePicker";
import { ReservationGuestsSelector } from "./reservation/ReservationGuestsSelector";
import { ReservationPricingBreakdownSection } from "./reservation/ReservationPricingBreakdownSection";
import { ReservationSplitTrigger } from "./reservation/ReservationSplitTrigger";
import { ReservationPricingHeader } from "./reservation/ReservationPricingHeader";
import { useReservationCalendar } from "./reservation/useReservationCalendar";
import { useReservationPricing } from "./reservation/useReservationPricing";
import { usePropertyAvailability } from "./reservation/usePropertyAvailability";
import { TodayAvailabilityBadge } from "./reservation/TodayAvailabilityBadge";
import { ReservationDateSection } from "./reservation/ReservationDateSection";

export {
  getSaudiToday,
  getDayAfter,
  formatGathernDate,
  formatGathernTime,
  addDaysIso,
  CHECKIN_TIME_SLOTS,
  CHECKOUT_TIME_SLOTS,
};

export interface ReservationPanelProps {
  property: Property;
  checkinDate: string;
  checkinTime: string;
  checkoutDate: string;
  checkoutTime: string;
  guestsCount: number;
  nights: number;
  onCheckinChange: (value: string) => void;
  onCheckinTimeChange: (value: string) => void;
  onCheckoutChange: (value: string) => void;
  onCheckoutTimeChange: (value: string) => void;
  onGuestsChange: (value: number) => void;
  onReserve: () => void;
  compact?: boolean;
}

export default function ReservationPanel({
  property,
  checkinDate,
  checkinTime,
  checkoutDate,
  checkoutTime,
  guestsCount,
  nights,
  onCheckinChange,
  onCheckinTimeChange,
  onCheckoutChange,
  onCheckoutTimeChange,
  onGuestsChange,
  onReserve,
  compact = false,
}: ReservationPanelProps) {
  const { language } = useApp();
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectingField, setSelectingField] = useState<"checkin" | "checkout">("checkin");
  const [timePickerOpen, setTimePickerOpen] = useState<"checkin" | "checkout" | null>(null);

  const title = language === "ar" ? property.titleAr || property.title : property.title;
  const maxGuests = getPropertyCapacity(property);

  const availability = usePropertyAvailability({
    propertyId: property.id,
    checkinDate,
    checkoutDate,
    checkinTime,
    checkoutTime,
    basePrice: property.basePrice,
  });

  const {
    isTwelveHourStay,
    hasDiscount,
    discountPercent,
    effectiveNightlyRate,
    previewPricing,
    estimatedTotal,
    originalNightly,
    originalSubtotal,
    offerDiscountAmount,
    riyalLabel,
    splitInstallment,
  } = useReservationPricing({
    property,
    checkinDate,
    checkoutDate,
    checkinTime,
    checkoutTime,
    nights,
    language,
    slotConfig: availability.slotConfig,
    dateOverrides: availability.priceOverrides,
  });

  const isAvailable = availability.isAvailable;
  const conflictMessage =
    language === "ar"
      ? availability.validationResult.conflictMessageAr
      : availability.validationResult.conflictMessageEn;

  const calendarState = useReservationCalendar({
    checkinDate,
    checkoutDate,
    checkinTime,
    checkoutTime,
    onCheckinChange,
    onCheckoutChange,
    language,
    selectingField,
    setSelectingField,
    setCalendarOpen,
  });

  const handleSelectSlotFormat = (formatId: BookingSlotFormatId) => {
    if (formatId === "twelve_hour_12am_12pm") {
      onCheckinTimeChange(TWELVE_HOUR_CHECKIN_TIME);
      onCheckoutTimeChange(DEFAULT_CHECKOUT_TIME);
      if (checkinDate) {
        onCheckoutChange(checkinDate);
      }
    } else {
      onCheckinTimeChange(DEFAULT_CHECKIN_TIME);
      onCheckoutTimeChange(DEFAULT_CHECKOUT_TIME);
      if (checkinDate && (!checkoutDate || checkoutDate <= checkinDate)) {
        onCheckoutChange(getDayAfter(checkinDate));
      }
    }
  };

  const handleCheckinTimeSelect = (slot: string) => {
    onCheckinTimeChange(slot);
    if (slot === TWELVE_HOUR_CHECKIN_TIME) {
      onCheckoutTimeChange(DEFAULT_CHECKOUT_TIME);
      if (checkinDate) onCheckoutChange(checkinDate);
    } else if (checkinDate && (!checkoutDate || checkoutDate <= checkinDate)) {
      onCheckoutChange(getDayAfter(checkinDate));
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-violet-200/90 bg-white p-5 shadow-[0_18px_55px_rgba(70,35,130,0.12)] dark:border-violet-500/25 dark:bg-[#12101a] dark:shadow-[0_18px_55px_rgba(0,0,0,0.4)] sm:p-6">
      {!property.isApproved && property.status !== "approved" && (
        <div className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-300 mb-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>{language === "ar" ? "قيد المراجعة • نمط المعاينة" : "Under Review • Preview Mode"}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
            {language === "ar"
              ? "العقار قيد المراجعة الإدارية وغير منشور للعامة. يتم عرض هذا النموذج لمعاينة التخطيط الكامل."
              : "This listing is under administrative review and unpublished. Full layout preview is shown."}
          </p>
        </div>
      )}

      {/* Live Hourly Checkout Transition Status Badge */}
      <TodayAvailabilityBadge
        status={availability.todayStatus}
        language={language}
      />

      {/* 1. Top Pricing Header */}
      <ReservationPricingHeader
        hasDiscount={hasDiscount}
        originalNightly={originalNightly}
        basePrice={property.basePrice}
        effectiveNightlyRate={effectiveNightlyRate}
        riyalLabel={riyalLabel}
        nights={nights}
        estimatedTotal={estimatedTotal}
        discountPercent={discountPercent}
        language={language}
      />

      {/* 2. Date Selection Section */}
      <ReservationDateSection
        language={language}
        nights={nights}
        checkinDate={checkinDate}
        checkoutDate={checkoutDate}
        isAvailable={isAvailable}
        calendarOpen={calendarOpen}
        setCalendarOpen={setCalendarOpen}
        selectingField={selectingField}
        setSelectingField={setSelectingField}
        setTimePickerOpen={setTimePickerOpen}
        estimatedTotal={estimatedTotal}
        basePrice={property.basePrice}
        calendarState={calendarState}
        checkoutDates={availability.checkoutDates}
        unavailableDates={availability.unavailableDates}
        checkoutCutoff={availability.checkoutCutoff}
        conflictMessage={conflictMessage}
        getDaySummary={availability.getDaySummary}
        isTwelveHourStay={isTwelveHourStay}
      />

      {/* 3. Check-in Time & Check-out Time */}
      <ReservationTimePicker
        language={language}
        timePickerOpen={timePickerOpen}
        setTimePickerOpen={setTimePickerOpen}
        setCalendarOpen={setCalendarOpen}
        checkinTime={checkinTime}
        checkoutTime={checkoutTime}
        onCheckinTimeChange={handleCheckinTimeSelect}
        onCheckoutTimeChange={onCheckoutTimeChange}
        onSelectSlotFormat={handleSelectSlotFormat}
        isTwelveHourStay={isTwelveHourStay}
        isTwelveHourEnabledProperty={availability.isTwelveHourEnabledProperty}
        isTwelveHourEnabledOnDate={availability.isTwelveHourEnabledOnCheckin}
        isStandardEnabledOnDate={availability.isStandardEnabledOnCheckin}
        twelveHourRate={availability.twelveHourRateForCheckin.rate}
        standardRate={effectiveNightlyRate}
        isCheckoutDay={availability.isCheckoutDay}
        checkoutCutoff={availability.checkoutCutoff}
        availableCheckinSlots={availability.availableCheckinSlots}
      />

      {/* Guests Selector Card */}
      <ReservationGuestsSelector
        language={language}
        guestsCount={guestsCount}
        maxGuests={maxGuests}
        onGuestsChange={onGuestsChange}
      />

      {/* 4. CHOOSE Button & Detailed Price Breakdown */}
      <div className="border-t border-slate-100 pt-5 pb-3 dark:border-white/10">
        <button
          type="button"
          onClick={onReserve}
          disabled={!isAvailable}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black uppercase tracking-wider text-white transition active:scale-[0.99] cursor-pointer ${
            !isAvailable
              ? "cursor-not-allowed bg-gray-400 opacity-60 dark:bg-gray-700"
              : "bg-[#4F2396] hover:bg-[#3d1979] shadow-lg shadow-violet-950/20"
          }`}
        >
          <span>{language === "ar" ? "اختر وتابع الحجز" : "CHOOSE"}</span>
        </button>

        <p className="mt-3 text-center text-xs sm:text-[13px] font-extrabold text-gray-950 dark:text-violet-200">
          {language === "ar"
            ? `ستدفع الآن ${estimatedTotal.toFixed(2)} ر.س`
            : `You will pay now ${estimatedTotal.toFixed(2)} SAR`}
        </p>

        {!compact && (
          <ReservationPricingBreakdownSection
            language={language}
            nights={nights}
            isTwelveHourStay={isTwelveHourStay}
            originalNightly={originalNightly}
            originalSubtotal={originalSubtotal}
            offerDiscountAmount={offerDiscountAmount}
            previewPricing={previewPricing}
            riyalLabel={riyalLabel}
          />
        )}
      </div>

      {/* 5. Pay in Splits (Tamara, Tabby, MIS Pay) */}
      <ReservationSplitTrigger
        language={language}
        onOpen={() => setSplitModalOpen(true)}
      />

      {/* Split Payments Details Modal */}
      <SplitPaymentsModal
        isOpen={splitModalOpen}
        onClose={() => setSplitModalOpen(false)}
        language={language}
        estimatedTotal={estimatedTotal}
        splitInstallment={splitInstallment}
      />

      <p className="sr-only">{title}</p>
    </section>
  );
}
