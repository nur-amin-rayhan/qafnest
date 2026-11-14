"use client";

import React from "react";
import { Clock, SunMoon, CheckCircle2, Moon, Sun } from "lucide-react";
import { formatGathernTime } from "./reservationDateUtils";
import {
  BOOKING_SLOT_FORMATS,
  type BookingSlotFormatId,
  TWELVE_HOUR_CHECKIN_TIME,
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
} from "@qafnest/shared";

export interface ReservationTimePickerProps {
  language: string;
  timePickerOpen?: "checkin" | "checkout" | null;
  setTimePickerOpen?: (val: "checkin" | "checkout" | null) => void;
  setCalendarOpen?: (val: boolean) => void;
  checkinTime: string;
  checkoutTime: string;
  onCheckinTimeChange: (slot: string) => void;
  onCheckoutTimeChange: (slot: string) => void;
  onSelectSlotFormat?: (formatId: BookingSlotFormatId) => void;
  isTwelveHourStay?: boolean;
  isTwelveHourEnabledProperty?: boolean;
  isTwelveHourEnabledOnDate?: boolean;
  isStandardEnabledOnDate?: boolean;
  twelveHourRate?: number;
  standardRate?: number;
  isCheckoutDay?: boolean;
  checkoutCutoff?: string;
  availableCheckinSlots?: string[];
}

export function ReservationTimePicker({
  language,
  checkinTime,
  checkoutTime,
  onCheckinTimeChange,
  onCheckoutTimeChange,
  onSelectSlotFormat,
  isTwelveHourStay = false,
  isTwelveHourEnabledProperty = false,
  isTwelveHourEnabledOnDate = false,
  isStandardEnabledOnDate = true,
  twelveHourRate,
  standardRate,
  isCheckoutDay = false,
  checkoutCutoff = DEFAULT_CHECKOUT_TIME,
}: ReservationTimePickerProps) {
  const isAr = language === "ar";

  const handleSelectStandard = () => {
    if (!isStandardEnabledOnDate) return;
    if (onSelectSlotFormat) {
      onSelectSlotFormat("standard_4pm_12pm");
    } else {
      onCheckinTimeChange(DEFAULT_CHECKIN_TIME);
      onCheckoutTimeChange(DEFAULT_CHECKOUT_TIME);
    }
  };

  const handleSelectTwelveHour = () => {
    if (!isTwelveHourEnabledProperty || !isTwelveHourEnabledOnDate) return;
    if (onSelectSlotFormat) {
      onSelectSlotFormat("twelve_hour_12am_12pm");
    } else {
      onCheckinTimeChange(TWELVE_HOUR_CHECKIN_TIME);
      onCheckoutTimeChange(DEFAULT_CHECKOUT_TIME);
    }
  };

  return (
    <div className="border-t border-slate-100 py-3.5 dark:border-white/10 space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-black text-gray-900 dark:text-violet-200">
          <SunMoon className="h-4 w-4 text-[#4F2396] dark:text-violet-400" />
          {isAr ? "خيارات أوقات الإقامة" : "Select Stay Format"}
        </span>
        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-400">
          {isAr ? "مواعيد ثابتة ومضمونة" : "Fixed standard timings"}
        </span>
      </div>

      {/* Two Defined Stay Format Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Card 1: Standard 4:00 PM -> 12:00 PM */}
        <button
          type="button"
          disabled={!isStandardEnabledOnDate}
          onClick={handleSelectStandard}
          className={`relative rounded-2xl border p-3 text-start transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            !isTwelveHourStay
              ? "border-[#4F2396] bg-violet-50/90 ring-2 ring-[#4F2396] shadow-sm dark:bg-violet-900/25 dark:border-violet-500"
              : "border-slate-200 bg-white hover:border-violet-300 dark:border-white/10 dark:bg-white/5"
          }`}
        >
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <Moon className="h-4 w-4 text-[#4F2396] dark:text-violet-400 shrink-0" />
              <span className="text-xs font-black text-gray-950 dark:text-white">
                {isAr
                  ? BOOKING_SLOT_FORMATS.standard_4pm_12pm.shortLabelAr
                  : BOOKING_SLOT_FORMATS.standard_4pm_12pm.shortLabelEn}
              </span>
            </div>
            {!isTwelveHourStay && (
              <CheckCircle2 className="h-4 w-4 text-[#4F2396] dark:text-violet-400 shrink-0" />
            )}
          </div>

          <div className="mt-1.5 text-[11px] font-extrabold text-gray-700 dark:text-gray-200">
            {isAr ? "دخول 4:00 م · خروج 12:00 ظ (اليوم التالي)" : "Check-in 4:00 PM · Checkout 12:00 PM (Next Day)"}
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-300">
            <span>{isAr ? "إقامة كاملة (الافتراضي)" : "Full overnight stay"}</span>
            {standardRate ? (
              <span className="font-bold text-[#4F2396] dark:text-violet-300">
                {standardRate} SAR
              </span>
            ) : null}
          </div>
        </button>

        {/* Card 2: 12-Hour 12:00 AM -> 12:00 PM */}
        <button
          type="button"
          disabled={!isTwelveHourEnabledProperty || !isTwelveHourEnabledOnDate}
          onClick={handleSelectTwelveHour}
          className={`relative rounded-2xl border p-3 text-start transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isTwelveHourStay
              ? "border-cyan-600 bg-cyan-50/90 ring-2 ring-cyan-600 shadow-sm dark:bg-cyan-900/25 dark:border-cyan-400"
              : "border-slate-200 bg-white hover:border-cyan-400 dark:border-white/10 dark:bg-white/5"
          }`}
        >
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="text-xs font-black text-gray-950 dark:text-white">
                {isAr
                  ? BOOKING_SLOT_FORMATS.twelve_hour_12am_12pm.shortLabelAr
                  : BOOKING_SLOT_FORMATS.twelve_hour_12am_12pm.shortLabelEn}
              </span>
            </div>
            {isTwelveHourStay && (
              <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            )}
          </div>

          <div className="mt-1.5 text-[11px] font-extrabold text-gray-700 dark:text-gray-200">
            {isAr ? "دخول 12:00 ص · خروج 12:00 ظ (نفس اليوم)" : "Check-in 12:00 AM · Checkout 12:00 PM (Same Day)"}
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-gray-500 dark:text-gray-300">
            <span>
              {!isTwelveHourEnabledProperty
                ? isAr
                  ? "غير معروض لهذا العقار"
                  : "Not offered by host"
                : !isTwelveHourEnabledOnDate
                ? isAr
                  ? "الصباح محجوز أو غير متاح"
                  : "Morning occupied/closed"
                : isAr
                ? "فترة 12 ساعة خاصة"
                : "Special 12h stay"}
            </span>
            {isTwelveHourEnabledProperty && isTwelveHourEnabledOnDate && twelveHourRate ? (
              <span className="font-bold text-cyan-700 dark:text-cyan-300">
                {twelveHourRate} SAR
              </span>
            ) : null}
          </div>
        </button>
      </div>

      {/* Applied Timings Display Box */}
      <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-2.5 dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-white/80 p-2 dark:bg-white/5">
            <span className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              {isAr ? "تسجيل الوصول" : "Check-in"}
            </span>
            <span className="text-xs font-black text-gray-950 dark:text-white">
              {formatGathernTime(checkinTime, language)}
            </span>
          </div>

          <div className="rounded-xl bg-white/80 p-2 dark:bg-white/5">
            <span className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              {isAr ? "تسجيل المغادرة" : "Check-out"}
            </span>
            <span className="text-xs font-black text-gray-950 dark:text-white">
              {formatGathernTime(checkoutTime, language)}
            </span>
          </div>
        </div>

        {/* Transition & Half-day notice */}
        {isCheckoutDay && !isTwelveHourStay && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 px-1">
            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {isAr
                ? `يغادر النزيل السابق في ${formatGathernTime(checkoutCutoff, "ar")} — الدخول متاح ومضمون بعد ذلك في 4:00 م.`
                : `Prior guest departs at ${formatGathernTime(checkoutCutoff, "en")} — unit is sanitized and ready for 4:00 PM check-in.`}
            </span>
          </div>
        )}

        {isTwelveHourStay && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 px-1">
            <Sun className="h-3.5 w-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <span>
              {isAr
                ? "إقامة نهارية خفيفة (12 ساعة من منتصف الليل حتى الظهيرة) بسعر خاص."
                : "12-hour morning stay (12:00 AM midnight to 12:00 PM noon) at dedicated host rate."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
