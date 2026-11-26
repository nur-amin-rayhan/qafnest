import React from "react";
import { CalendarDays, AlertCircle } from "lucide-react";
import type { CalendarDaySlotSummary } from "@qafnest/shared";
import { formatGathernDate } from "./reservationDateUtils";
import { ReservationCalendarPopover } from "./ReservationCalendarPopover";
import type { useReservationCalendar } from "./useReservationCalendar";

export interface ReservationDateSectionProps {
  language: string;
  nights: number;
  checkinDate: string;
  checkoutDate: string;
  isAvailable: boolean;
  calendarOpen: boolean;
  setCalendarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectingField: "checkin" | "checkout";
  setSelectingField: React.Dispatch<React.SetStateAction<"checkin" | "checkout">>;
  setTimePickerOpen: React.Dispatch<React.SetStateAction<"checkin" | "checkout" | null>>;
  estimatedTotal: number;
  basePrice: number;
  calendarState: ReturnType<typeof useReservationCalendar>;
  checkoutDates?: string[];
  unavailableDates?: string[];
  checkoutCutoff?: string;
  conflictMessage?: string | null;
  getDaySummary?: (iso: string) => CalendarDaySlotSummary;
  isTwelveHourStay?: boolean;
}

export function ReservationDateSection({
  language,
  nights,
  checkinDate,
  checkoutDate,
  isAvailable,
  calendarOpen,
  setCalendarOpen,
  selectingField,
  setSelectingField,
  setTimePickerOpen,
  estimatedTotal,
  basePrice,
  calendarState,
  checkoutDates = [],
  unavailableDates = [],
  checkoutCutoff = "12:00",
  conflictMessage = null,
  getDaySummary,
  isTwelveHourStay = false,
}: ReservationDateSectionProps) {
  const {
    todaySaudi,
    viewMonth,
    setViewMonth,
    calendarDays,
    monthTitle,
    weekdayHeaders,
    handleSelectDate,
    applyQuickPreset,
  } = calendarState;

  return (
    <div className="border-t border-slate-200/80 py-4 dark:border-slate-800">
      <div className="mb-2.5 flex items-center justify-between text-xs sm:text-[13px]">
        <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
          <CalendarDays className="h-3.5 w-3.5 text-[#4F2396] dark:text-purple-300" />
          {isTwelveHourStay
            ? language === "ar"
              ? "إقامة 12 ساعة (12 ص – 12 م)"
              : "12-Hour Stay (12 AM – 12 PM)"
            : `${nights} ${language === "ar" ? (nights === 1 ? "ليلة" : "ليال") : nights === 1 ? "night" : "nights"}`}
        </span>
        <button
          type="button"
          onClick={() => {
            setSelectingField("checkin");
            setCalendarOpen((prev) => !prev);
          }}
          className="font-semibold text-[#4F2396] hover:text-[#431c82] dark:text-purple-300 dark:hover:text-purple-200 transition-colors cursor-pointer"
        >
          {language === "ar" ? "يمكنك تعديل التاريخ" : "You can edit the date"}
        </button>
      </div>

      {/* Date Inputs Box */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-1 shadow-xs dark:border-slate-800 dark:bg-[#110F18]">
        <div className="grid grid-cols-2 divide-x rtl:divide-x-reverse divide-slate-200/90 dark:divide-slate-800">
          <button
            type="button"
            onClick={() => {
              setSelectingField("checkin");
              setCalendarOpen(true);
              setTimePickerOpen(null);
            }}
            className={`text-left rtl:text-right px-3.5 py-2.5 transition rounded-xl cursor-pointer ${
              calendarOpen && selectingField === "checkin"
                ? "bg-purple-50/80 dark:bg-purple-950/40 ring-1 ring-inset ring-[#4F2396]/40 dark:ring-purple-400/40"
                : "hover:bg-slate-100/60 dark:hover:bg-white/5"
            }`}
          >
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {language === "ar" ? "تاريخ الوصول" : "Check-in Date"}
            </span>
            <span
              suppressHydrationWarning
              className="mt-1 block text-xs sm:text-[13px] font-bold leading-snug text-slate-900 dark:text-white"
            >
              {formatGathernDate(checkinDate, language)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectingField("checkout");
              setCalendarOpen(true);
              setTimePickerOpen(null);
            }}
            className={`text-left rtl:text-right px-3.5 py-2.5 transition rounded-xl cursor-pointer ${
              calendarOpen && selectingField === "checkout"
                ? "bg-purple-50/80 dark:bg-purple-950/40 ring-1 ring-inset ring-[#4F2396]/40 dark:ring-purple-400/40"
                : "hover:bg-slate-100/60 dark:hover:bg-white/5"
            }`}
          >
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {language === "ar" ? "تاريخ المغادرة" : "Check-out Date"}
            </span>
            <span
              suppressHydrationWarning
              className="mt-1 block text-xs sm:text-[13px] font-bold leading-snug text-slate-900 dark:text-white"
            >
              {formatGathernDate(checkoutDate, language)}
            </span>
          </button>
        </div>
      </div>

      {/* Smart Calendar Popover */}
      {calendarOpen && (
        <ReservationCalendarPopover
          language={language}
          viewMonth={viewMonth}
          setViewMonth={setViewMonth}
          selectingField={selectingField}
          setSelectingField={setSelectingField}
          checkinDate={checkinDate}
          checkoutDate={checkoutDate}
          todaySaudi={todaySaudi}
          nights={nights}
          estimatedTotal={estimatedTotal}
          basePrice={basePrice}
          calendarDays={calendarDays}
          monthTitle={monthTitle}
          weekdayHeaders={weekdayHeaders}
          handleSelectDate={handleSelectDate}
          applyQuickPreset={applyQuickPreset}
          onClose={() => setCalendarOpen(false)}
          checkoutDates={checkoutDates}
          unavailableDates={unavailableDates}
          checkoutCutoff={checkoutCutoff}
          getDaySummary={getDaySummary}
          isTwelveHourStay={isTwelveHourStay}
        />
      )}

      {!isAvailable && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {conflictMessage ||
              (language === "ar"
                ? "هذه التواريخ والساعات غير متاحة لهذا العقار. يُرجى اختيار تواريخ أخرى."
                : "These dates and time slots are unavailable. Please choose different times.")}
          </span>
        </div>
      )}
    </div>
  );
}
