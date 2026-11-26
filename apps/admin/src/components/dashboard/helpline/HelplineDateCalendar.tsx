"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  TWELVE_HOUR_CHECKIN_TIME,
  addDaysToIsoDate,
  getCalendarDaySlotSummary,
  getRiyadhNowInfo,
  type CalendarDaySlotSummary,
  type PropertyBookingSlotConfig,
  type TimeSlotBooking,
} from "@qafnest/shared";

interface HelplineDateCalendarProps {
  lang: "en" | "ar";
  t: (en: string, ar: string) => string;
  basePrice: number;
  weekdayPrice?: number;
  weekendPrice?: number;
  checkIn: string;
  checkOut: string;
  stayMode: "overnight" | "twelve_hour";
  onStayModeChange: (mode: "overnight" | "twelve_hour") => void;
  onChangeDates: (checkIn: string, checkOut: string) => void;
  bookedDates?: string[];
  checkoutDates?: string[];
  blockedDates?: string[];
  timeSlotBookings?: TimeSlotBooking[];
  priceOverrides?: Record<string, number>;
  slotConfig?: PropertyBookingSlotConfig;
  loadingAvailability?: boolean;
}

export function HelplineDateCalendar({
  lang,
  t,
  basePrice,
  weekdayPrice,
  weekendPrice,
  checkIn,
  checkOut,
  stayMode,
  onStayModeChange,
  onChangeDates,
  bookedDates = [],
  checkoutDates = [],
  blockedDates = [],
  timeSlotBookings = [],
  priceOverrides = {},
  slotConfig,
  loadingAvailability = false,
}: HelplineDateCalendarProps) {
  const riyadhNow = useMemo(() => getRiyadhNowInfo(), []);
  const todaySaudi = riyadhNow.dateIso;

  const [selectingField, setSelectingField] = useState<"checkin" | "checkout">("checkin");
  const [viewMonth, setViewMonth] = useState(() => {
    const base = checkIn || todaySaudi;
    const d = new Date(`${base}T00:00:00Z`);
    return Number.isNaN(d.getTime())
      ? { year: 2026, month: 10 }
      : { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });

  const isTwelveHourStay = stayMode === "twelve_hour";
  const checkoutCutoff = DEFAULT_CHECKOUT_TIME;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(Date.UTC(viewMonth.year, viewMonth.month, 1));
    const startWeekday = firstDay.getUTCDay();
    const daysInMonth = new Date(Date.UTC(viewMonth.year, viewMonth.month + 1, 0)).getUTCDate();
    const cells: Array<{ iso: string | null; day: number | null }> = [];
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ iso: null, day: null });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const mStr = String(viewMonth.month + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      cells.push({ iso: `${viewMonth.year}-${mStr}-${dStr}`, day: d });
    }
    return cells;
  }, [viewMonth]);

  const monthTitle = useMemo(() => {
    const d = new Date(Date.UTC(viewMonth.year, viewMonth.month, 1));
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  }, [viewMonth, lang]);

  const weekdayHeaders =
    lang === "ar"
      ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const unavailableSet = useMemo(
    () => new Set([...bookedDates, ...blockedDates]),
    [bookedDates, blockedDates]
  );

  const getRateForDay = (iso: string): number => {
    if (priceOverrides[iso] && priceOverrides[iso] > 0) return priceOverrides[iso];
    const d = new Date(`${iso}T00:00:00Z`);
    const dayOfWeek = d.getUTCDay(); // Thu=4, Fri=5, Sat=6
    const isSaudiWeekend = dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6;
    if (isSaudiWeekend && weekendPrice && weekendPrice > 0) return weekendPrice;
    if (!isSaudiWeekend && weekdayPrice && weekdayPrice > 0) return weekdayPrice;
    return basePrice;
  };

  const getDaySummary = (iso: string): CalendarDaySlotSummary | null => {
    if (!slotConfig) return null;
    try {
      return getCalendarDaySlotSummary({
        dateIso: iso,
        existingBookings: timeSlotBookings,
        slotConfig,
        hostBlockedDates: blockedDates,
        riyadhNow,
        effectiveStandardPrice: getRateForDay(iso),
      });
    } catch {
      return null;
    }
  };

  const handleSelectDate = (iso: string) => {
    if (iso < todaySaudi) return;
    if (isTwelveHourStay) {
      onChangeDates(iso, iso);
      return;
    }
    if (selectingField === "checkin") {
      const nextOut = !checkOut || checkOut <= iso ? addDaysToIsoDate(iso, 1) : checkOut;
      onChangeDates(iso, nextOut);
      setSelectingField("checkout");
    } else {
      if (iso <= checkIn) {
        onChangeDates(iso, addDaysToIsoDate(iso, 1));
      } else {
        onChangeDates(checkIn, iso);
        setSelectingField("checkin");
      }
    }
  };

  const applyQuickPreset = (nightsCount: number) => {
    const start = checkIn && checkIn >= todaySaudi ? checkIn : todaySaudi;
    onChangeDates(start, addDaysToIsoDate(start, nightsCount));
    setSelectingField("checkin");
  };

  const nights = useMemo(() => {
    if (isTwelveHourStay) return 1;
    if (!checkIn || !checkOut || checkOut <= checkIn) return 1;
    const ms = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
    return Math.max(1, Math.round(ms / 86_400_000));
  }, [checkIn, checkOut, isTwelveHourStay]);

  return (
    <div
      data-testid="helpline-date-calendar"
      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-4 sm:p-5 shadow-xs space-y-4 text-slate-900 dark:text-slate-100"
    >
      {/* Top Row: Stay Mode + Field Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t("Select Stay Dates (Product Calendar)", "اختر تواريخ الإقامة (تقويم العقار)")}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t(
              "Click dates directly on the property calendar. Booked or blocked dates are automatically disabled.",
              "انقر مباشرة على التواريخ المتاحة في التقويم. التواريخ المحجوزة أو المغلقة معطلة تلقائياً."
            )}
          </p>
        </div>

        {/* Overnight vs 12h Mode */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => onStayModeChange("overnight")}
            className={`px-3 py-1.5 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
              !isTwelveHourStay
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
            }`}
          >
            {t(`Overnight (${DEFAULT_CHECKIN_TIME}–${DEFAULT_CHECKOUT_TIME})`, "مبيت ليلي")}
          </button>
          <button
            type="button"
            onClick={() => onStayModeChange("twelve_hour")}
            className={`px-3 py-1.5 rounded-md text-xs transition cursor-pointer whitespace-nowrap ${
              isTwelveHourStay
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
            }`}
          >
            {t(
              `12h Stay (${TWELVE_HOUR_CHECKIN_TIME}–${DEFAULT_CHECKOUT_TIME})`,
              "إقامة ١٢ ساعة"
            )}
          </button>
        </div>
      </div>

      {/* Step Tabs matching Guest ReservationCalendarPopover */}
      {!isTwelveHourStay ? (
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            data-testid="cal-select-checkin-tab"
            onClick={() => setSelectingField("checkin")}
            className={`rounded-lg py-2 px-3 text-xs font-semibold transition cursor-pointer flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 ${
              selectingField === "checkin"
                ? "bg-[#4F2396] text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
            }`}
          >
            <span>{t("1. Select Check-in (4:00 PM)", "١. اختر الوصول (٤:٠٠ م)")}</span>
            <span className="font-mono text-[11px] opacity-90">{checkIn}</span>
          </button>
          <button
            type="button"
            data-testid="cal-select-checkout-tab"
            onClick={() => setSelectingField("checkout")}
            className={`rounded-lg py-2 px-3 text-xs font-semibold transition cursor-pointer flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 ${
              selectingField === "checkout"
                ? "bg-[#4F2396] text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
            }`}
          >
            <span>{t("2. Select Check-out (12:00 PM)", "٢. اختر المغادرة (١٢:٠٠ م)")}</span>
            <span className="font-mono text-[11px] opacity-90">{checkOut}</span>
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/40 px-3 py-2 text-xs font-semibold text-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
          <span>
            {t(
              "Select Date for 12-Hour Stay (12:00 AM – 12:00 PM)",
              "اختر تاريخ فترة الـ ١٢ ساعة (١٢:٠٠ ص – ١٢:٠٠ م)"
            )}
          </span>
          <span className="font-mono">{checkIn}</span>
        </div>
      )}

      {/* Quick Duration Pills */}
      {!isTwelveHourStay && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 me-1">
            {t("Quick stay:", "مدة سريعة:")}
          </span>
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
              className={`rounded-lg border px-3 py-1 text-xs transition cursor-pointer ${
                nights === preset.count
                  ? "border-[#4F2396] bg-[#4F2396] text-white font-semibold shadow-xs"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400 font-medium"
              }`}
            >
              {lang === "ar" ? preset.labelAr : preset.labelEn}
            </button>
          ))}
        </div>
      )}

      {/* Month Header & Navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() =>
            setViewMonth((prev) =>
              prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {monthTitle}
          </span>
          {loadingAvailability && (
            <RefreshCw size={14} className="text-[#4F2396] dark:text-purple-400 animate-spin" />
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            setViewMonth((prev) =>
              prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
        {weekdayHeaders.map((dayName) => (
          <span key={dayName} className="py-1">
            {dayName}
          </span>
        ))}
      </div>

      {/* 7-Column Guest-Style Calendar Cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((cell, idx) => {
          if (!cell.iso || !cell.day) {
            return <div key={`empty-${idx}`} className="h-14" />;
          }

          const isPast = cell.iso < todaySaudi;
          const isStart = cell.iso === checkIn;
          const isEnd = !isTwelveHourStay && cell.iso === checkOut;
          const isInRange =
            !isTwelveHourStay &&
            Boolean(checkIn && checkOut) &&
            cell.iso > checkIn &&
            cell.iso < checkOut;

          const daySummary = getDaySummary(cell.iso);
          const isCheckoutDay = daySummary
            ? daySummary.isCheckoutDay
            : checkoutDates.includes(cell.iso);
          const isSplitCheckoutOpen = daySummary?.overallStatus === "split_checkout_open";
          const isSplitCheckinOpen = daySummary?.overallStatus === "split_checkin_open";

          let isBlocked: boolean;
          if (daySummary) {
            if (isTwelveHourStay) {
              isBlocked = daySummary.morningStatus !== "available";
            } else if (selectingField === "checkin") {
              isBlocked = daySummary.eveningStatus !== "available";
            } else {
              isBlocked =
                daySummary.morningStatus === "booked" || daySummary.overallStatus === "closed";
            }
          } else {
            isBlocked =
              unavailableSet.has(cell.iso) &&
              (!isCheckoutDay || selectingField === "checkout");
          }

          const isDisabled = isPast || isBlocked;
          const dayRate = getRateForDay(cell.iso);
          const twelveHourPrice = isTwelveHourStay
            ? daySummary?.openWindows.find((w) => w.formatId === "twelve_hour_12am_12pm")?.price
            : null;
          const rateLabel = twelveHourPrice && twelveHourPrice > 0 ? twelveHourPrice : dayRate;

          return (
            <button
              key={cell.iso}
              type="button"
              data-testid={`cal-day-${cell.iso}`}
              disabled={isDisabled}
              onClick={() => handleSelectDate(cell.iso!)}
              title={
                isPast
                  ? "Past date"
                  : isBlocked
                  ? "Booked / Unavailable"
                  : `${cell.iso} · SAR ${rateLabel}`
              }
              className={`h-14 rounded-xl flex flex-col items-center justify-center text-xs transition relative overflow-hidden border ${
                isDisabled
                  ? isBlocked && !isPast
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-400 line-through cursor-not-allowed opacity-75"
                    : "bg-slate-100 dark:bg-slate-900 border-transparent text-slate-400 dark:text-slate-600 line-through cursor-not-allowed"
                  : isStart || isEnd
                  ? "bg-[#4F2396] border-[#4F2396] text-white font-bold shadow-xs cursor-pointer scale-[1.02]"
                  : isInRange
                  ? "bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800 text-[#4F2396] dark:text-purple-300 font-semibold cursor-pointer"
                  : isSplitCheckoutOpen
                  ? "bg-gradient-to-b from-amber-100 via-white to-emerald-50 dark:from-amber-950/40 dark:via-slate-900 dark:to-emerald-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 font-semibold hover:border-[#4F2396] cursor-pointer"
                  : isSplitCheckinOpen
                  ? "bg-gradient-to-b from-cyan-50 via-white to-violet-100 dark:from-cyan-950/40 dark:via-slate-900 dark:to-purple-950/40 border-cyan-300 dark:border-cyan-700 text-cyan-950 dark:text-cyan-200 font-semibold hover:border-[#4F2396] cursor-pointer"
                  : isCheckoutDay
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/60 cursor-pointer"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-[#4F2396] hover:bg-purple-50/50 dark:hover:bg-purple-950/20 cursor-pointer font-medium"
              }`}
            >
              <span className="text-[13px] leading-none">{cell.day}</span>
              {isBlocked && !isPast ? (
                <span className="mt-1 text-[9px] font-extrabold leading-none text-rose-500 no-underline">
                  {t("Booked", "محجوز")}
                </span>
              ) : isSplitCheckoutOpen && !isStart && !isEnd ? (
                <span className="mt-1 text-[9px] font-extrabold leading-none text-emerald-700">
                  {t("Open 4PM+", "متاح ٤م+")}
                </span>
              ) : isSplitCheckinOpen && !isStart && !isEnd ? (
                <span className="mt-1 text-[9px] font-extrabold leading-none text-cyan-700">
                  12AM-12PM
                </span>
              ) : (
                <span
                  className={`mt-1 text-[10px] font-bold leading-none ${
                    isStart || isEnd
                      ? "text-white"
                      : isDisabled
                      ? "text-slate-400 dark:text-slate-600"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {rateLabel > 0 ? `${rateLabel}` : "—"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Clear Legend matching Guest Product Page */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#4F2396] inline-block" />
            <span>{t("Selected", "المحدد")}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 inline-block" />
            <span>{t("Booked / Blocked", "محجوز / مغلق")}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-b from-amber-300 to-emerald-400 inline-block" />
            <span>{t(`Split Day (Open after ${checkoutCutoff})`, "متاح ٤م+")}</span>
          </span>
        </div>

        <span className="font-semibold text-[#4F2396] dark:text-purple-300">
          {isTwelveHourStay
            ? t("12-Hour Day Slot Selected", "فترة ١٢ ساعة محددة")
            : `${nights} ${t(nights === 1 ? "night" : "nights", "ليلة")}`}
        </span>
      </div>
    </div>
  );
}
