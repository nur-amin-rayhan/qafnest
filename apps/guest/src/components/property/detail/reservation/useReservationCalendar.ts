"use client";

import { useState, useMemo } from "react";
import {
  getSaudiToday,
  addDaysIso,
} from "./reservationDateUtils";

interface UseReservationCalendarOptions {
  checkinDate: string;
  checkoutDate: string;
  checkinTime?: string;
  checkoutTime?: string;
  onCheckinChange: (value: string) => void;
  onCheckoutChange: (value: string) => void;
  language: string;
  selectingField: "checkin" | "checkout";
  setSelectingField: (field: "checkin" | "checkout") => void;
  setCalendarOpen: (open: boolean) => void;
}

export function useReservationCalendar({
  checkinDate,
  checkoutDate,
  checkinTime = "16:00",
  checkoutTime = "12:00",
  onCheckinChange,
  onCheckoutChange,
  language,
  selectingField,
  setSelectingField,
  setCalendarOpen,
}: UseReservationCalendarOptions) {
  const todaySaudi = useMemo(() => getSaudiToday(), []);

  const [viewMonth, setViewMonth] = useState(() => {
    const base = checkinDate || todaySaudi;
    const d = new Date(`${base}T00:00:00Z`);
    return Number.isNaN(d.getTime())
      ? { year: 2026, month: 10 }
      : { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });

  // Build calendar cells for current viewMonth
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
    return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  }, [viewMonth, language]);

  const isTwelveHourMode = checkinTime === "00:00" && checkoutTime === "12:00" && checkinDate === checkoutDate;

  const handleSelectDate = (iso: string) => {
    if (iso < todaySaudi) return;
    if (isTwelveHourMode) {
      onCheckinChange(iso);
      onCheckoutChange(iso);
      setCalendarOpen(false);
      return;
    }
    if (selectingField === "checkin") {
      onCheckinChange(iso);
      if (!checkoutDate || checkoutDate <= iso) {
        onCheckoutChange(addDaysIso(iso, 1));
      }
      setSelectingField("checkout");
    } else {
      if (iso <= checkinDate) {
        onCheckinChange(iso);
        onCheckoutChange(addDaysIso(iso, 1));
      } else {
        onCheckoutChange(iso);
        setCalendarOpen(false);
      }
    }
  };

  const applyQuickPreset = (nightsCount: number) => {
    const start = checkinDate && checkinDate >= todaySaudi ? checkinDate : todaySaudi;
    onCheckinChange(start);
    onCheckoutChange(addDaysIso(start, nightsCount));
    setCalendarOpen(false);
  };

  const weekdayHeaders =
    language === "ar"
      ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return {
    todaySaudi,
    viewMonth,
    setViewMonth,
    calendarDays,
    monthTitle,
    weekdayHeaders,
    handleSelectDate,
    applyQuickPreset,
  };
}

