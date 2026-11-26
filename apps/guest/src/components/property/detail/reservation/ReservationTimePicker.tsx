"use client";

import React from "react";
import { Moon, Sun, CheckCircle2 } from "lucide-react";
import {
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
  checkinTime: _checkinTime,
  checkoutTime: _checkoutTime,
  onCheckinTimeChange,
  onCheckoutTimeChange,
  onSelectSlotFormat,
  isTwelveHourStay = false,
  isTwelveHourEnabledProperty = false,
  isTwelveHourEnabledOnDate = false,
  isStandardEnabledOnDate = true,
  twelveHourRate,
  standardRate,
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

  // Case 1: Property only offers standard overnight stays (Clean, minimal single-line status)
  if (!isTwelveHourEnabledProperty) {
    return (
      <div className="border-t border-slate-100 py-3 dark:border-white/10">
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/40">
          <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Moon className="h-3.5 w-3.5 text-[#4F2396] dark:text-purple-300" />
            <span>{isAr ? "مواعيد الإقامة" : "Stay Timings"}</span>
          </span>
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            {isAr ? "دخول 4:00 م · خروج 12:00 ظ" : "In 4:00 PM · Out 12:00 PM"}
          </span>
        </div>
      </div>
    );
  }

  // Case 2: Property supports 12-hour stays (Clean, minimal segmented cards like Gathern)
  return (
    <div className="border-t border-slate-100 py-3 dark:border-white/10 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {isAr ? "خيارات أوقات الإقامة" : "Stay Format"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Standard Overnight */}
        <button
          type="button"
          disabled={!isStandardEnabledOnDate}
          onClick={handleSelectStandard}
          className={`rounded-xl border p-2.5 text-start transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            !isTwelveHourStay
              ? "border-[#4F2396] bg-purple-50/70 text-[#4F2396] shadow-2xs dark:border-purple-400 dark:bg-purple-950/30 dark:text-purple-300"
              : "border-slate-200/80 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-bold text-xs text-slate-900 dark:text-white">
              <Moon className="h-3 w-3 text-[#4F2396] dark:text-purple-300 shrink-0" />
              <span>{isAr ? "إقامة كاملة" : "Overnight"}</span>
            </div>
            {!isTwelveHourStay && (
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4F2396] dark:text-purple-300 shrink-0" />
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{isAr ? "4 م – 12 ظ" : "4 PM – 12 PM"}</span>
            {standardRate ? (
              <span className="font-bold text-slate-800 dark:text-white">
                {standardRate} SAR
              </span>
            ) : null}
          </div>
        </button>

        {/* 12-Hour Morning */}
        <button
          type="button"
          disabled={!isTwelveHourEnabledOnDate}
          onClick={handleSelectTwelveHour}
          className={`rounded-xl border p-2.5 text-start transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isTwelveHourStay
              ? "border-[#4F2396] bg-purple-50/70 text-[#4F2396] shadow-2xs dark:border-purple-400 dark:bg-purple-950/30 dark:text-purple-300"
              : "border-slate-200/80 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-bold text-xs text-slate-900 dark:text-white">
              <Sun className="h-3 w-3 text-amber-500 shrink-0" />
              <span>{isAr ? "12 ساعة" : "12-Hour"}</span>
            </div>
            {isTwelveHourStay && (
              <CheckCircle2 className="h-3.5 w-3.5 text-[#4F2396] dark:text-purple-300 shrink-0" />
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {!isTwelveHourEnabledOnDate
                ? isAr
                  ? "غير متاح"
                  : "Unavailable"
                : isAr
                ? "12 ص – 12 ظ"
                : "12 AM – 12 PM"}
            </span>
            {isTwelveHourEnabledOnDate && twelveHourRate ? (
              <span className="font-bold text-slate-800 dark:text-white">
                {twelveHourRate} SAR
              </span>
            ) : null}
          </div>
        </button>
      </div>
    </div>
  );
}
