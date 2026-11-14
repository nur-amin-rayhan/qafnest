"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchLivePropertyAvailability,
  getBookedDateRanges,
  validateTimeSlotBooking,
  getAvailableCheckinSlots,
  getPropertyLiveDailyStatus,
  DEFAULT_CHECKOUT_CUTOFF,
  CHECKIN_TIME_SLOTS,
  type TimeSlotBooking,
  type TimeSlotValidationResult,
  type PropertyDailyTimeSlotStatus,
  type LiveAvailabilityResult,
} from "@/lib/services/availability";
import {
  addDaysToIsoDate,
  createDefaultPropertySlotConfig,
  deriveHostManualBlockedDates,
  getCalendarDaySlotSummary,
  getRiyadhNowInfo,
  getTwelveHourRateForDate,
  isFormatEnabledOnDate,
  isSameDayTwelveHourStay,
  TWELVE_HOUR_CHECKIN_TIME,
  type CalendarDaySlotSummary,
  type PropertyBookingSlotConfig,
} from "@qafnest/shared";
import { getSaudiToday } from "./reservationDateUtils";

export interface UsePropertyAvailabilityOptions {
  propertyId: string;
  checkinDate: string;
  checkoutDate: string;
  checkinTime: string;
  checkoutTime: string;
  basePrice?: number;
}

function getRiyadhMinutesNow(): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Riyadh",
      hour12: false,
      hour: "numeric",
      minute: "numeric",
    }).formatToParts(new Date());
    const hRaw = parseInt(parts.find((p) => p.type === "hour")?.value || "12", 10);
    const h = Number.isFinite(hRaw) ? hRaw % 24 : 12;
    const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    return h * 60 + m;
  } catch {
    return 720;
  }
}

export function usePropertyAvailability({
  propertyId,
  checkinDate,
  checkoutDate,
  checkinTime,
  checkoutTime,
  basePrice = 0,
}: UsePropertyAvailabilityOptions) {
  const [liveData, setLiveData] = useState<LiveAvailabilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAvailability = useCallback(async () => {
    if (!propertyId) return;
    setIsLoading(true);
    try {
      const result = await fetchLivePropertyAvailability(propertyId);
      setLiveData(result);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  const mergedBookings = useMemo<TimeSlotBooking[]>(() => {
    const local = getBookedDateRanges(propertyId);
    const apiBookings = liveData?.timeSlotBookings || [];
    const seen = new Set<string>();
    const combined: TimeSlotBooking[] = [];

    for (const b of [...apiBookings, ...local]) {
      const key = `${b.checkIn}_${b.checkOut}_${b.bookingRef || ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(b);
      }
    }
    return combined;
  }, [propertyId, liveData?.timeSlotBookings]);

  const slotConfig = useMemo<PropertyBookingSlotConfig>(() => {
    return liveData?.slotConfig || createDefaultPropertySlotConfig(propertyId);
  }, [liveData?.slotConfig, propertyId]);

  const checkoutDates = useMemo(() => {
    const fromApi = liveData?.checkoutDates || [];
    const fromLocal = getBookedDateRanges(propertyId).map((r) => r.checkOut);
    return Array.from(new Set([...fromApi, ...fromLocal]));
  }, [liveData?.checkoutDates, propertyId]);

  const blockedDates = useMemo(() => {
    return deriveHostManualBlockedDates(liveData?.blockedDates || [], mergedBookings, slotConfig);
  }, [liveData?.blockedDates, mergedBookings, slotConfig]);

  const unavailableDates = useMemo(() => {
    return liveData?.unavailableDates || [];
  }, [liveData?.unavailableDates]);

  const checkoutCutoff = liveData?.checkoutCutoff || DEFAULT_CHECKOUT_CUTOFF;
  const priceOverrides = useMemo(() => liveData?.priceOverrides || {}, [liveData?.priceOverrides]);

  const todaySaudi = useMemo(() => getSaudiToday(), []);
  const todayStatus = useMemo<PropertyDailyTimeSlotStatus>(() => {
    if (liveData?.todayStatus) return liveData.todayStatus;
    const nowMinutes = getRiyadhMinutesNow();
    return getPropertyLiveDailyStatus(todaySaudi, mergedBookings, nowMinutes, checkoutCutoff);
  }, [liveData?.todayStatus, todaySaudi, mergedBookings, checkoutCutoff]);

  const isCheckoutDay = useMemo(() => {
    if (!checkinDate) return false;
    return checkoutDates.includes(checkinDate);
  }, [checkinDate, checkoutDates]);

  const getDaySummary = useCallback(
    (dateIso: string): CalendarDaySlotSummary => {
      const riyadhNow = getRiyadhNowInfo();
      const stdPrice = priceOverrides[dateIso] || basePrice || 0;
      return getCalendarDaySlotSummary({
        dateIso,
        existingBookings: mergedBookings,
        slotConfig,
        hostBlockedDates: blockedDates,
        riyadhNow,
        effectiveStandardPrice: stdPrice,
      });
    },
    [mergedBookings, slotConfig, blockedDates, priceOverrides, basePrice]
  );

  const checkinDaySummary = useMemo(
    () => (checkinDate ? getDaySummary(checkinDate) : null),
    [checkinDate, getDaySummary]
  );

  const isStandardEnabledOnCheckin = useMemo(() => {
    if (!checkinDate) return slotConfig.enableStandard4pmTo12pm;
    return isFormatEnabledOnDate(slotConfig, "standard_4pm_12pm", checkinDate, blockedDates);
  }, [checkinDate, slotConfig, blockedDates]);

  const isTwelveHourEnabledProperty = slotConfig.enableTwelveHour12amTo12pm;

  const isTwelveHourEnabledOnCheckin = useMemo(() => {
    if (!checkinDate) return slotConfig.enableTwelveHour12amTo12pm;
    return (
      isFormatEnabledOnDate(slotConfig, "twelve_hour_12am_12pm", checkinDate, blockedDates) &&
      checkinDaySummary?.morningStatus === "available"
    );
  }, [checkinDate, slotConfig, blockedDates, checkinDaySummary]);

  const twelveHourRateForCheckin = useMemo(() => {
    const stdPrice = (checkinDate && priceOverrides[checkinDate]) || basePrice || 0;
    return getTwelveHourRateForDate(slotConfig, checkinDate || todaySaudi, stdPrice);
  }, [slotConfig, checkinDate, todaySaudi, priceOverrides, basePrice]);

  const availableCheckinSlots = useMemo(() => {
    const candidates: string[] = [];
    if (isTwelveHourEnabledOnCheckin) {
      candidates.push(TWELVE_HOUR_CHECKIN_TIME);
    }
    if (isStandardEnabledOnCheckin) {
      candidates.push(...CHECKIN_TIME_SLOTS);
    }
    if (candidates.length === 0) return [];
    if (!checkinDate) return candidates;

    const slotFiltered = getAvailableCheckinSlots(checkinDate, mergedBookings, candidates);
    // Filter out morning 00:00 if morning half is already booked (even by multi-day or same-day stay)
    return slotFiltered.filter((slot) => {
      if (slot === TWELVE_HOUR_CHECKIN_TIME) {
        return checkinDaySummary?.morningStatus === "available";
      }
      return checkinDaySummary?.eveningStatus !== "booked";
    });
  }, [
    checkinDate,
    mergedBookings,
    isTwelveHourEnabledOnCheckin,
    isStandardEnabledOnCheckin,
    checkinDaySummary,
  ]);

  const validationResult = useMemo<TimeSlotValidationResult>(() => {
    if (!checkinDate || !checkoutDate) {
      return { isAvailable: true };
    }

    const isSameDay12h = isSameDayTwelveHourStay({
      checkIn: checkinDate,
      checkOut: checkoutDate,
      checkinTime,
      checkoutTime,
    });

    if (isSameDay12h) {
      if (!isFormatEnabledOnDate(slotConfig, "twelve_hour_12am_12pm", checkinDate, blockedDates)) {
        return {
          isAvailable: false,
          conflictReason: "dates_unavailable",
          conflictMessageEn: `The 12:00 AM – 12:00 PM (12h) slot is not available on ${checkinDate}. Please choose the standard 4:00 PM – 12:00 PM format.`,
          conflictMessageAr: `فترة 12:00 ص – 12:00 م (12 ساعة) غير متاحة في ${checkinDate}. يرجى اختيار الفترة الافتراضية 4:00 م – 12:00 م.`,
        };
      }
    } else if (checkoutDate > checkinDate) {
      const span = Math.max(
        1,
        Math.round((Date.parse(`${checkoutDate}T00:00:00Z`) - Date.parse(`${checkinDate}T00:00:00Z`)) / 86_400_000)
      );
      for (let i = 0; i < span; i++) {
        const dIso = addDaysToIsoDate(checkinDate, i);
        if (!isFormatEnabledOnDate(slotConfig, "standard_4pm_12pm", dIso, blockedDates)) {
          return {
            isAvailable: false,
            conflictReason: "dates_unavailable",
            conflictMessageEn: `Date ${dIso} is closed by the host/admin for standard bookings.`,
            conflictMessageAr: `تاريخ ${dIso} مغلق حالياً من قِبل المضيف أو الإدارة.`,
          };
        }
      }
    }

    return validateTimeSlotBooking(
      { checkIn: checkinDate, checkOut: checkoutDate, checkinTime, checkoutTime },
      mergedBookings,
      { cutoffTime: checkoutCutoff }
    );
  }, [
    checkinDate,
    checkoutDate,
    checkinTime,
    checkoutTime,
    mergedBookings,
    checkoutCutoff,
    slotConfig,
    blockedDates,
  ]);

  return {
    isLoading,
    liveData,
    mergedBookings,
    slotConfig,
    blockedDates,
    checkoutDates,
    unavailableDates,
    priceOverrides,
    checkoutCutoff,
    todayStatus,
    isCheckoutDay,
    checkinDaySummary,
    getDaySummary,
    isStandardEnabledOnCheckin,
    isTwelveHourEnabledProperty,
    isTwelveHourEnabledOnCheckin,
    twelveHourRateForCheckin,
    availableCheckinSlots,
    isAvailable: validationResult.isAvailable,
    validationResult,
    refresh: loadAvailability,
  };
}
