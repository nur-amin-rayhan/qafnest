"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  MONTH_NAMES,
  MONTH_NAMES_AR,
  DAY_NAMES,
  DAY_NAMES_AR,
} from "./heroConstants";

interface DateRangeDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  checkinDate: string;
  checkoutDate: string;
  onDayClick: (dayISO: string) => void;
  dateRangeDisplay: string;
  checkInDateLabel: string;
  calendarHelpLabel: string;
  doneLabel: string;
  language: string;
  viewDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  todayISO: string;
}

export function DateRangeDropdown({
  isOpen,
  onToggle,
  onClose,
  checkinDate,
  checkoutDate,
  onDayClick,
  dateRangeDisplay,
  checkInDateLabel,
  calendarHelpLabel,
  doneLabel,
  language,
  viewDate,
  onPrevMonth,
  onNextMonth,
  todayISO,
}: DateRangeDropdownProps) {
  const renderMonthCalendar = (
    year: number,
    month: number,
    isRightMonth = false
  ) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isPast = dayISO < todayISO;
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
          onClick={() => onDayClick(dayISO)}
          className={`h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm font-semibold rounded-full flex items-center justify-center transition-all ${
            isPast
              ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
              : isCheckin || isCheckout
              ? "bg-purple-700 text-white font-bold shadow-md cursor-pointer scale-105"
              : isInRange
              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 rounded-none cursor-pointer"
              : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          }`}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="w-full sm:w-64">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          {!isRightMonth ? (
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <div className="w-6" />
          )}

          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            {language === "ar" ? MONTH_NAMES_AR[month] : MONTH_NAMES[month]} {year}
          </h4>

          {isRightMonth ? (
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onNextMonth}
                className="sm:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
              <div className="hidden sm:block w-6" />
            </>
          )}
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {(language === "ar" ? DAY_NAMES_AR : DAY_NAMES).map((name, idx) => (
            <span
              key={idx}
              className="text-[11px] font-bold text-gray-400 dark:text-gray-500"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Days Grid */}
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
    <div
      className={`relative w-full flex-[1.4] min-w-0 lg:min-w-[230px] border-b lg:border-b-0 lg:border-e border-gray-200/80 dark:border-white/10 transition-all ${
        isOpen ? "z-50" : "z-10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 sm:py-3.5 flex items-center justify-between text-start hover:bg-gray-50/60 dark:hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer"
      >
        <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block whitespace-nowrap">
            {checkInDateLabel}
          </span>
          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate block mt-0.5 whitespace-nowrap">
            {dateRangeDisplay}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            data-lenis-prevent="true"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2.5 inset-x-0 mx-auto w-[calc(100vw-2.5rem)] max-w-[310px] sm:max-w-[620px] sm:w-auto lg:inset-x-auto lg:right-0 rtl:lg:right-auto rtl:lg:left-0 lg:max-w-[680px] z-[100] rounded-3xl bg-white dark:bg-[#0E0E1A] shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-gray-200/80 dark:border-white/15 p-4 sm:p-5 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row gap-6">
              {renderMonthCalendar(leftYear, leftMonth, false)}
              <div className="hidden sm:block w-px bg-gray-100 dark:bg-white/10" />
              <div className="hidden sm:block">
                {renderMonthCalendar(rightYear, rightMonth, true)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2 text-xs text-gray-500">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate min-w-0 pr-2 rtl:pr-0 rtl:pl-2">{calendarHelpLabel}</span>
              <button
                type="button"
                onClick={onClose}
                className="font-bold text-xs text-purple-700 dark:text-purple-400 hover:underline cursor-pointer shrink-0"
              >
                {doneLabel}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

