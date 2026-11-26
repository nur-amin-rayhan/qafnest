"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarDaySlotSummary } from "@qafnest/shared";

interface ReservationCalendarPopoverProps {
  language: string;
  viewMonth: { year: number; month: number };
  setViewMonth: React.Dispatch<React.SetStateAction<{ year: number; month: number }>>;
  selectingField: "checkin" | "checkout";
  setSelectingField: (field: "checkin" | "checkout") => void;
  checkinDate: string;
  checkoutDate: string;
  todaySaudi: string;
  nights: number;
  estimatedTotal: number;
  basePrice: number;
  calendarDays: Array<{ iso: string | null; day: number | null }>;
  monthTitle: string;
  weekdayHeaders: string[];
  handleSelectDate: (iso: string) => void;
  applyQuickPreset: (nightsCount: number) => void;
  onClose: () => void;
  checkoutDates?: string[];
  unavailableDates?: string[];
  checkoutCutoff?: string;
  getDaySummary?: (iso: string) => CalendarDaySlotSummary;
  isTwelveHourStay?: boolean;
}

export function ReservationCalendarPopover({
  language,
  setViewMonth,
  selectingField,
  setSelectingField,
  checkinDate,
  checkoutDate,
  todaySaudi,
  nights,
  estimatedTotal,
  basePrice,
  calendarDays,
  monthTitle,
  weekdayHeaders,
  handleSelectDate,
  applyQuickPreset,
  onClose,
  checkoutDates = [],
  unavailableDates = [],
  checkoutCutoff = "12:00",
  getDaySummary,
  isTwelveHourStay = false,
}: ReservationCalendarPopoverProps) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-[#110F18]">
      {/* Calendar Mode Selector Tabs */}
      {!isTwelveHourStay ? (
        <div className="mb-3 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100/80 p-1 border border-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => setSelectingField("checkin")}
            className={`rounded-lg py-2 text-[11px] font-bold transition cursor-pointer ${
              selectingField === "checkin"
                ? "bg-[#4F2396] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {language === "ar" ? "١. اختر الوصول (4:00 م)" : "1. Select Check-in (4 PM)"}
          </button>
          <button
            type="button"
            onClick={() => setSelectingField("checkout")}
            className={`rounded-lg py-2 text-[11px] font-bold transition cursor-pointer ${
              selectingField === "checkout"
                ? "bg-[#4F2396] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {language === "ar" ? "٢. اختر المغادرة (12:00 م)" : "2. Select Check-out (12 PM)"}
          </button>
        </div>
      ) : (
        <div className="mb-3 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-800 border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 text-center">
          {language === "ar"
            ? "اختر تاريخ فترة الـ 12 ساعة (12:00 ص – 12:00 م)"
            : "Select Date for 12-Hour Stay (12:00 AM – 12:00 PM)"}
        </div>
      )}

      {/* Quick Duration Pills */}
      {!isTwelveHourStay && (
        <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { count: 1, labelEn: "1 Night", labelAr: "ليلة واحدة" },
            { count: 2, labelEn: "2 Nights (Weekend)", labelAr: "ليلتان (ويكند)" },
            { count: 3, labelEn: "3 Nights", labelAr: "٣ ليالٍ" },
            { count: 7, labelEn: "1 Week", labelAr: "أسبوع" },
          ].map((preset) => (
            <button
              key={preset.count}
              type="button"
              onClick={() => applyQuickPreset(preset.count)}
              className={`shrink-0 rounded-xl border px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
                nights === preset.count
                  ? "border-[#4F2396] bg-[#4F2396] text-white shadow-xs"
                  : "border-slate-200/80 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300"
              }`}
            >
              {language === "ar" ? preset.labelAr : preset.labelEn}
            </button>
          ))}
        </div>
      )}

      {/* Month Header & Navigation */}
      <div className="mb-2.5 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() =>
            setViewMonth((prev) =>
              prev.month === 0
                ? { year: prev.year - 1, month: 11 }
                : { year: prev.year, month: prev.month - 1 }
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
          {monthTitle}
        </span>
        <button
          type="button"
          onClick={() =>
            setViewMonth((prev) =>
              prev.month === 11
                ? { year: prev.year + 1, month: 0 }
                : { year: prev.year, month: prev.month + 1 }
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1">
        {weekdayHeaders.map((dayName) => (
          <span key={dayName} className="py-1">
            {dayName}
          </span>
        ))}
      </div>

      {/* Days Grid with Split Half-Day Checkout/Checkin Visibility */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, idx) => {
          if (!cell.iso || !cell.day) {
            return <div key={`empty-${idx}`} className="h-12" />;
          }
          const isPast = cell.iso < todaySaudi;
          const isStart = cell.iso === checkinDate;
          const isEnd = !isTwelveHourStay && cell.iso === checkoutDate;
          const isInRange =
            !isTwelveHourStay &&
            Boolean(checkinDate && checkoutDate) &&
            cell.iso > checkinDate &&
            cell.iso < checkoutDate;

          const daySummary = getDaySummary ? getDaySummary(cell.iso) : null;
          const isCheckoutDay = daySummary ? daySummary.isCheckoutDay : checkoutDates.includes(cell.iso);
          const isSplitCheckoutOpen = daySummary?.overallStatus === "split_checkout_open";
          const isSplitCheckinOpen = daySummary?.overallStatus === "split_checkin_open";

          let isBlocked: boolean;
          if (daySummary) {
            if (isTwelveHourStay) {
              isBlocked = daySummary.morningStatus !== "available";
            } else if (selectingField === "checkin") {
              isBlocked = daySummary.eveningStatus !== "available";
            } else {
              // Selecting checkout date > checkinDate: morning of checkout date cannot already belong to another stay
              isBlocked = daySummary.morningStatus === "booked" || daySummary.overallStatus === "closed";
            }
          } else {
            isBlocked =
              unavailableDates.includes(cell.iso) &&
              (!isCheckoutDay || selectingField === "checkout");
          }

          const isDisabled = isPast || isBlocked;

          const cellTooltip = daySummary
            ? [
                ...daySummary.occupiedWindows.map((w) => (language === "ar" ? w.labelAr : w.labelEn)),
                ...daySummary.openWindows.map((w) => (language === "ar" ? w.labelAr : w.labelEn)),
              ].join("\n")
            : undefined;

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={isDisabled}
              title={cellTooltip}
              onClick={() => handleSelectDate(cell.iso!)}
              className={`flex h-12 flex-col items-center justify-center rounded-xl text-xs transition cursor-pointer relative overflow-hidden ${
                isDisabled
                  ? "opacity-30 cursor-not-allowed text-slate-400 line-through bg-slate-50 dark:bg-white/5"
                  : isStart || isEnd
                  ? "bg-[#4F2396] text-white font-bold shadow-md shadow-[#4F2396]/20 scale-[1.02]"
                  : isInRange
                  ? "bg-purple-50 text-[#4F2396] font-bold dark:bg-purple-950/40 dark:text-purple-200 border-y border-purple-200/50 dark:border-purple-800/40"
                  : isSplitCheckoutOpen
                  ? "bg-gradient-to-b from-amber-100 via-white to-emerald-50 text-amber-950 font-bold border border-amber-300/80 hover:border-[#4F2396] dark:from-amber-500/20 dark:to-emerald-500/15 dark:text-amber-100"
                  : isSplitCheckinOpen
                  ? "bg-gradient-to-b from-cyan-50 via-white to-purple-100 text-cyan-950 font-bold border border-cyan-300/80 hover:border-[#4F2396] dark:from-cyan-500/20 dark:to-purple-500/20 dark:text-cyan-100"
                  : isCheckoutDay
                  ? "bg-amber-50 text-amber-900 font-bold border border-amber-300/70 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-200"
                  : "hover:bg-slate-100 text-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/60"
              }`}
            >
              <span className="leading-none">{cell.day}</span>
              {isSplitCheckoutOpen && !isStart && !isEnd ? (
                <span className="mt-0.5 text-[7px] font-extrabold leading-none text-emerald-700 dark:text-emerald-300">
                  {language === "ar" ? "متاح ٤م+" : "Open 4PM+"}
                </span>
              ) : isSplitCheckinOpen && !isStart && !isEnd ? (
                <span className="mt-0.5 text-[7px] font-extrabold leading-none text-cyan-700 dark:text-cyan-300">
                  {language === "ar" ? "١٢ص-١٢م" : "12AM-12PM"}
                </span>
              ) : isCheckoutDay && !isStart && !isEnd ? (
                <span className="mt-0.5 text-[7px] font-extrabold leading-none text-amber-700 dark:text-amber-300">
                  {language === "ar" ? "٤م+" : "4 PM+"}
                </span>
              ) : (
                <span
                  className={`mt-0.5 text-[8px] font-semibold leading-none ${
                    isStart || isEnd
                      ? "text-purple-200"
                      : "text-[#4F2396] dark:text-purple-300"
                  }`}
                >
                  {isTwelveHourStay && daySummary?.openWindows.find((w) => w.formatId === "twelve_hour_12am_12pm")?.price
                    ? daySummary.openWindows.find((w) => w.formatId === "twelve_hour_12am_12pm")?.price
                    : basePrice}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Half-Day Split & Checkout Cutoff Helper Legend */}
      <div className="mt-2.5 space-y-1 px-1 text-[10px] text-amber-800 dark:text-amber-200">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-gradient-to-b from-amber-400 to-emerald-500" />
          <span>
            {language === "ar"
              ? `الأيام المميزة (متاح ٤م+) محجوزة حتى مغادرة ${checkoutCutoff} ظهراً ومفتوحة للدخول 4:00 م`
              : `Split days (Open 4PM+) are occupied until ${checkoutCutoff} PM checkout and bookable from 4:00 PM`}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-3 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-900 dark:text-white">
          {isTwelveHourStay
            ? language === "ar"
              ? `فترة 12 ساعة (12ص–12م) · ${estimatedTotal.toFixed(0)} ر.س`
              : `12-Hour Stay (12 AM–12 PM) · ${estimatedTotal.toFixed(0)} SAR`
            : `${nights} ${language === "ar" ? "ليلة" : nights === 1 ? "night" : "nights"} · ${estimatedTotal.toFixed(0)} SAR`}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-[#4F2396] px-4 py-2 text-xs font-bold text-white hover:bg-[#431c82] cursor-pointer shadow-xs transition"
        >
          {language === "ar" ? "تم" : "Done"}
        </button>
      </div>
    </div>
  );
}
