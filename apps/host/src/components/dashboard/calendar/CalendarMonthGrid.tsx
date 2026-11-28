"use client";

import React, { useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  LoaderCircle,
  Tag,
  Clock,
} from "lucide-react";
import {
  getEffectiveNightlyRateForDate,
  getRiyadhNowInfo,
  type CalendarDaySlotSummary,
  type GranularWeeklyPricing,
} from "@qafnest/shared";

interface CalendarMonthGridProps {
  monthData: {
    year: number;
    month: number;
    firstDayIndex: number;
    daysInMonth: number;
    monthName: string;
  };
  loading: boolean;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  weekDayNames: string[];
  bookedDates: string[];
  blockedDates: string[];
  slotSummaryByDate?: Record<string, CalendarDaySlotSummary>;
  priceOverrides: Record<string, number>;
  customDayPricing: Record<string, string>;
  masterBasePrice: string;
  formatDayIso: (year: number, month: number, day: number) => string;
  onSelectDateForEdit: (dateIso: string) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function CalendarMonthGrid({
  monthData,
  loading,
  handlePrevMonth,
  handleNextMonth,
  weekDayNames,
  bookedDates,
  blockedDates,
  slotSummaryByDate = {},
  priceOverrides,
  customDayPricing,
  masterBasePrice,
  formatDayIso,
  onSelectDateForEdit,
  lang,
  t,
}: CalendarMonthGridProps) {
  const numericWeeklyPricing: GranularWeeklyPricing = useMemo(() => {
    const parse = (k: string) => {
      const val = customDayPricing[k];
      return val && Number(val) > 0 ? Number(val) : null;
    };
    return {
      sunday: parse("sunday"),
      monday: parse("monday"),
      tuesday: parse("tuesday"),
      wednesday: parse("wednesday"),
      thursday: parse("thursday"),
      friday: parse("friday"),
      saturday: parse("saturday"),
    };
  }, [customDayPricing]);

  const baseRateNum = Number(masterBasePrice) || 0;
  const riyadhToday = useMemo(() => getRiyadhNowInfo().dateIso, []);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#12101a] p-5 sm:p-7 shadow-xs space-y-5">
      {/* Calendar Month Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white capitalize">
            {monthData.monthName}
          </h2>
          {loading && <LoaderCircle size={16} className="animate-spin text-[#4F2396]" />}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title={t("Previous Month", "الشهر السابق")}
          >
            <ChevronRight size={18} className={lang === "ar" ? "" : "rotate-180"} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            title={t("Next Month", "الشهر القادم")}
          >
            <ChevronLeft size={18} className={lang === "ar" ? "" : "rotate-180"} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3.5 text-xs font-bold text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-md bg-emerald-500" />
          <span>{t("Open (4 PM+)", "متاح (4 م+)")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-md bg-gradient-to-b from-[#4F2396] via-[#4F2396] to-emerald-500" />
          <span>{t("Half-Day Split (Out 12 PM · Open 4 PM+)", "نصف يوم (مغادرة 12م · متاح 4م)")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-md bg-[#4F2396]" />
          <span>{t("Full Booked", "محجوز بالكامل")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-md bg-slate-200 dark:bg-slate-700" />
          <span>{t("Closed", "مغلق")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex h-3 w-3 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[9px] font-black">
            ★
          </span>
          <span>{t("Custom Date Price", "سعر مخصص للتاريخ")}</span>
        </div>
      </div>

      {/* Days Grid */}
      <div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-black text-slate-400 dark:text-slate-500 pb-2">
          {weekDayNames.map((dayName, idx) => (
            <div key={idx}>{dayName}</div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty leading days */}
          {Array.from({ length: monthData.firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-2xl bg-slate-50/40 dark:bg-slate-900/30" />
          ))}

          {/* Month Days */}
          {Array.from({ length: monthData.daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const isoDate = formatDayIso(monthData.year, monthData.month, day);
            const summary = slotSummaryByDate[isoDate];
            const overall = summary?.overallStatus;
            const isPastDate = isoDate < riyadhToday || Boolean(summary?.isPast);

            const isBookedFull =
              overall === "booked_full" ||
              overall === "checkout_only_closed" ||
              (!summary && bookedDates.includes(isoDate));
            const isSplitCheckout = overall === "split_checkout_open";
            const isSplitCheckin = overall === "split_checkin_open";
            const is12hOnly = overall === "available_12h_only";
            const isBlocked =
              overall === "closed" || (!summary && blockedDates.includes(isoDate));

            const { rate, source } = getEffectiveNightlyRateForDate(isoDate, {
              masterBasePrice: baseRateNum,
              weeklyPricing: numericWeeklyPricing,
              dateOverrides: priceOverrides,
            });

            const hasCustomDateOverride = source === "date_override";

            const tooltipLines = isPastDate
              ? (lang === "ar" ? "تاريخ سابق (مغلق)" : "Past date (Closed)")
              : summary
              ? [
                  ...summary.occupiedWindows.map((w) => (lang === "ar" ? w.labelAr : w.labelEn)),
                  ...summary.openWindows.map((w) => (lang === "ar" ? w.labelAr : w.labelEn)),
                ].join("\n")
              : isoDate;

            let cardClasses =
              "bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50";
            if (isPastDate) {
              cardClasses =
                "bg-slate-100/60 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 text-slate-400 dark:text-slate-400 cursor-not-allowed select-none opacity-60 shadow-none hover:bg-slate-100/60 dark:hover:bg-slate-900/50";
            } else if (isBookedFull) {
              cardClasses = "bg-[#4F2396] text-white shadow-xs";
            } else if (isBlocked) {
              cardClasses =
                "bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800";
            } else if (isSplitCheckout) {
              cardClasses =
                "border-2 border-[#4F2396]/60 dark:border-purple-500/60 bg-gradient-to-b from-violet-100 via-white to-emerald-50 dark:from-purple-950/60 dark:via-[#12101a] dark:to-emerald-950/40 text-slate-900 dark:text-white hover:border-[#4F2396]";
            } else if (isSplitCheckin) {
              cardClasses =
                "border-2 border-cyan-400/70 dark:border-cyan-600/70 bg-gradient-to-b from-cyan-50 via-white to-violet-100 dark:from-cyan-950/60 dark:via-[#12101a] dark:to-purple-950/40 text-slate-900 dark:text-white hover:border-[#4F2396]";
            } else if (is12hOnly) {
              cardClasses =
                "border border-cyan-300 dark:border-cyan-800 bg-cyan-50/70 dark:bg-cyan-950/40 text-cyan-950 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-900/40";
            } else if (hasCustomDateOverride) {
              cardClasses =
                "bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 hover:bg-amber-100/90 dark:hover:bg-amber-900/40 shadow-xs";
            }

            return (
              <button
                key={day}
                type="button"
                disabled={isPastDate}
                title={tooltipLines}
                onClick={isPastDate ? undefined : () => onSelectDateForEdit(isoDate)}
                className={`h-20 sm:h-24 rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between text-start transition-all relative group overflow-hidden ${
                  isPastDate ? "cursor-not-allowed" : "cursor-pointer"
                } ${cardClasses}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-black leading-none ${
                      isPastDate ? "text-slate-400 dark:text-slate-400 line-through" : ""
                    }`}
                  >
                    {day}
                  </span>
                  {isPastDate ? (
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400">
                      {t("Passed", "منقضي")}
                    </span>
                  ) : isBookedFull ? (
                    <CheckCircle2 size={12} className="text-[#FF9750]" />
                  ) : isBlocked ? (
                    <Lock size={12} className="text-slate-400 dark:text-slate-400" />
                  ) : isSplitCheckout || isSplitCheckin ? (
                    <Clock size={12} className="text-[#4F2396]" />
                  ) : hasCustomDateOverride ? (
                    <span className="flex items-center gap-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/80 px-1 py-0.5 text-[9px] font-black text-amber-800 dark:text-amber-200">
                      <Tag size={9} />
                    </span>
                  ) : null}
                </div>

                {/* Slot Breakdown Visual */}
                {isPastDate ? (
                  <div className="w-full text-[9px] font-bold text-slate-400 dark:text-slate-400 truncate">
                    {t("Closed", "مغلق")}
                  </div>
                ) : isSplitCheckout ? (
                  <div className="w-full space-y-0.5 text-[9px] font-extrabold leading-tight">
                    <div className="rounded bg-[#4F2396] text-white px-1 py-0.5 truncate">
                      {t("Out 12PM", "خروج 12م")}
                    </div>
                    <div className="rounded bg-emerald-600 text-white px-1 py-0.5 truncate">
                      {t("4PM+ Open", "4م+ متاح")} · {rate}
                    </div>
                  </div>
                ) : isSplitCheckin ? (
                  <div className="w-full space-y-0.5 text-[9px] font-extrabold leading-tight">
                    <div className="rounded bg-cyan-600 text-white px-1 py-0.5 truncate">
                      {t("12AM-12PM", "12ص-12م")}
                    </div>
                    <div className="rounded bg-[#4F2396] text-white px-1 py-0.5 truncate">
                      {t("4PM+ Booked", "4م+ محجوز")}
                    </div>
                  </div>
                ) : isBookedFull ? (
                  <div className="w-full space-y-0.5 text-[9px] font-bold">
                    <div className="truncate">{t("Booked", "محجوز")}</div>
                    {overall === "booked_full" && (
                      <div className="text-[8px] text-violet-200 truncate">
                        {t("All Slots Full", "الفترات ممتلئة")}
                      </div>
                    )}
                  </div>
                ) : isBlocked ? (
                  <div className="text-[10px] font-black truncate w-full text-slate-500 dark:text-slate-300">
                    {t("Closed", "مغلق")}
                  </div>
                ) : (
                  <div className="w-full space-y-0.5">
                    {summary?.morningStatus === "available" && (
                      <div className="text-[8px] font-black text-cyan-700 bg-cyan-100/80 rounded px-1 truncate">
                        {t("12h Open", "12س متاح")}
                      </div>
                    )}
                    <div className="text-[10px] font-black truncate w-full flex items-baseline gap-0.5">
                      {is12hOnly
                        ? summary?.openWindows[0]?.price || rate
                        : rate}
                      <span className="text-[8px] font-bold opacity-70">ر.س</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
