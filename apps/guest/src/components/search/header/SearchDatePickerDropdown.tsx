"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DAY_NAMES,
  DAY_NAMES_AR,
  MONTH_NAMES,
  MONTH_NAMES_AR,
  addDaysISO,
  formatReadableDate,
  getSaudiTodayISO,
} from "../searchConstants";

interface SearchDatePickerDropdownProps {
  checkinDate: string;
  setCheckinDate: (date: string) => void;
  checkoutDate: string;
  setCheckoutDate: (date: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  language: "en" | "ar";
}

export function SearchDatePickerDropdown({
  checkinDate,
  setCheckinDate,
  checkoutDate,
  setCheckoutDate,
  isOpen,
  onToggle,
  onClose,
  language,
}: SearchDatePickerDropdownProps) {
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (checkinDate) {
      const [y, m, d] = checkinDate.split("-").map(Number);
      if (y && m && d) return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const handleCalendarDayClick = (dayISO: string) => {
    const today = getSaudiTodayISO();
    if (dayISO < today) return;

    if (!checkinDate || (checkinDate && checkoutDate)) {
      setCheckinDate(dayISO);
      setCheckoutDate("");
    } else if (checkinDate && !checkoutDate) {
      if (dayISO > checkinDate) {
        setCheckoutDate(dayISO);
      } else {
        setCheckinDate(dayISO);
        setCheckoutDate("");
      }
    }
  };

  const renderMonthCalendar = (year: number, month: number, isRightMonth = false) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = getSaudiTodayISO();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = dayISO < today;
      const isCheckin = dayISO === checkinDate;
      const isCheckout = dayISO === checkoutDate;
      const isInRange =
        checkinDate &&
        checkoutDate &&
        dayISO > checkinDate &&
        dayISO < checkoutDate;

      days.push(
        <button
          key={dayISO}
          type="button"
          disabled={isPast}
          onClick={() => handleCalendarDayClick(dayISO)}
          className={`h-8 w-8 sm:h-9 sm:w-9 text-xs font-bold rounded-xl flex items-center justify-center transition-all ${
            isPast
              ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
              : isCheckin || isCheckout
              ? "bg-gradient-to-br from-violet-700 via-purple-600 to-fuchsia-600 text-white font-extrabold shadow-md shadow-violet-600/30 cursor-pointer scale-105"
              : isInRange
              ? "bg-violet-100/90 dark:bg-violet-900/40 text-violet-900 dark:text-violet-200 rounded-lg cursor-pointer"
              : "text-gray-800 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-white/10 cursor-pointer"
          }`}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="w-full sm:w-64">
        <div className="flex items-center justify-between mb-3 px-1">
          {!isRightMonth ? (
            <button
              type="button"
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
              }
              className="p-1.5 rounded-xl border border-violet-200/80 dark:border-violet-500/25 hover:bg-violet-50 dark:hover:bg-white/10 text-violet-700 dark:text-violet-300 transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-7" />
          )}

          <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
            {language === "ar" ? MONTH_NAMES_AR[month] : MONTH_NAMES[month]} {year}
          </h4>

          {isRightMonth ? (
            <button
              type="button"
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
              }
              className="p-1.5 rounded-xl border border-violet-200/80 dark:border-violet-500/25 hover:bg-violet-50 dark:hover:bg-white/10 text-violet-700 dark:text-violet-300 transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
              }
              className="sm:hidden p-1.5 rounded-xl border border-violet-200/80 dark:border-violet-500/25 hover:bg-violet-50 dark:hover:bg-white/10 text-violet-700 dark:text-violet-300 transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {(language === "ar" ? DAY_NAMES_AR : DAY_NAMES).map((name, idx) => (
            <span
              key={idx}
              className="text-[10px] font-extrabold uppercase text-violet-600/75 dark:text-violet-300/70"
            >
              {name}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 place-items-center">{days}</div>
      </div>
    );
  };

  const leftYear = viewDate.getFullYear();
  const leftMonth = viewDate.getMonth();
  const nextMonthDate = new Date(leftYear, leftMonth + 1, 1);
  const rightYear = nextMonthDate.getFullYear();
  const rightMonth = nextMonthDate.getMonth();

  return (
    <div className="relative flex-[1.4] min-w-[250px] px-3 py-1.5 border-b lg:border-b-0 lg:border-r border-violet-200/60 dark:border-violet-500/20">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left rtl:text-right flex items-center justify-between cursor-pointer rounded-xl hover:bg-violet-50/60 dark:hover:bg-white/5 px-1.5 py-0.5 transition-colors"
      >
        <div className="min-w-0 pr-2">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-violet-700/75 dark:text-violet-300/80 flex items-center gap-1 leading-tight">
            <CalendarDays className="w-3 h-3 text-violet-600 dark:text-violet-400" />
            {language === "ar" ? "تاريخ الوصول والمغادرة" : "Check-in & Check-out Dates"}
          </span>
          <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white block mt-0.5 whitespace-nowrap">
            {checkinDate
              ? `${formatReadableDate(checkinDate, language)} → ${
                  checkoutDate
                    ? formatReadableDate(checkoutDate, language)
                    : language === "ar"
                    ? "المغادرة"
                    : "Check-out"
                }`
              : language === "ar"
              ? "اختر التواريخ"
              : "Select dates"}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          className="absolute top-full left-1/2 -translate-x-1/2 lg:left-auto lg:right-0 rtl:lg:right-auto rtl:lg:left-0 lg:translate-x-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-auto max-w-[650px] rounded-3xl bg-white dark:bg-[#141122] border border-violet-200/90 dark:border-violet-500/30 shadow-[0_24px_60px_rgba(109,40,217,0.24)] p-4 sm:p-5 z-[90]"
        >
          {/* Quick Nights Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-violet-100 dark:border-violet-500/20">
            <span className="text-xs font-extrabold text-violet-800 dark:text-violet-200">
              {language === "ar" ? "تحديد سريع:" : "Quick stay:"}
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    const base = checkinDate || getSaudiTodayISO();
                    setCheckinDate(base);
                    setCheckoutDate(addDaysISO(base, n));
                  }}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-violet-200/80 dark:border-violet-500/25 bg-violet-50/50 dark:bg-white/5 text-violet-700 dark:text-violet-300 hover:bg-violet-600 hover:text-white transition-colors cursor-pointer"
                >
                  {n}{" "}
                  {language === "ar"
                    ? n === 1
                      ? "ليلة"
                      : "ليالٍ"
                    : n === 1
                    ? "Night"
                    : "Nights"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            {renderMonthCalendar(leftYear, leftMonth, false)}
            <div className="hidden sm:block w-px bg-violet-100 dark:bg-violet-500/20" />
            <div className="hidden sm:block">
              {renderMonthCalendar(rightYear, rightMonth, true)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-violet-100 dark:border-violet-500/20 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {checkinDate && checkoutDate
                ? `${formatReadableDate(checkinDate, language)} → ${formatReadableDate(
                    checkoutDate,
                    language
                  )}`
                : language === "ar"
                ? "اختر تاريخ الوصول ثم المغادرة"
                : "Select check-in then check-out date"}
            </span>
            <button
              type="button"
              onClick={() => {
                if (checkinDate && !checkoutDate) {
                  setCheckoutDate(addDaysISO(checkinDate, 1));
                }
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 text-white font-bold text-xs shadow-sm hover:opacity-95 cursor-pointer"
            >
              {language === "ar" ? "تم" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

