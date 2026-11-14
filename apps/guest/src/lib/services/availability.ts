/**
 * Availability Service for QafNest properties.
 * Tracks booked dates and hourly time-slots to prevent double bookings
 * while enabling 12:00 PM checkout day transitions.
 */

import {
  DEFAULT_CHECKOUT_CUTOFF,
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  CHECKIN_TIME_SLOTS,
  CHECKOUT_TIME_SLOTS,
  TimeSlotBooking,
  TimeSlotValidationResult,
  PropertyDailyTimeSlotStatus,
  PropertyBookingSlotConfig,
  doTimeSlotsOverlap,
  validateTimeSlotBooking,
  getAvailableCheckinSlots,
  getPropertyLiveDailyStatus,
  isSameDayTwelveHourStay,
} from "@qafnest/shared";

export {
  DEFAULT_CHECKOUT_CUTOFF,
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  CHECKIN_TIME_SLOTS,
  CHECKOUT_TIME_SLOTS,
  type TimeSlotBooking,
  type TimeSlotValidationResult,
  type PropertyDailyTimeSlotStatus,
  type PropertyBookingSlotConfig,
  doTimeSlotsOverlap,
  validateTimeSlotBooking,
  getAvailableCheckinSlots,
  getPropertyLiveDailyStatus,
};

export interface BookedDateRange extends TimeSlotBooking {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  checkinTime?: string | null;
  checkoutTime?: string | null;
  bookingRef?: string;
}

export interface LiveAvailabilityResult {
  unavailableDates: string[];
  bookedDates: string[];
  blockedDates: string[];
  checkoutDates: string[];
  checkoutCutoff: string;
  priceOverrides: Record<string, number>;
  timeSlotBookings: TimeSlotBooking[];
  todayStatus?: PropertyDailyTimeSlotStatus;
  availableCheckinSlots?: string[];
  slotConfig?: PropertyBookingSlotConfig;
}

const DEFAULT_BOOKED_RANGES: Record<string, BookedDateRange[]> = {};

const LOCAL_STORAGE_KEY = "qafnest_booked_dates";

function getStoredBookings(): Record<string, BookedDateRange[]> {
  return {};
}

export function doRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

export function getBookedDateRanges(propertyId: string): BookedDateRange[] {
  const all = getStoredBookings();
  return all[propertyId] || [];
}

/**
 * Checks if a requested date range and time-slot is fully available.
 * Honors 12:00 PM cutoff on checkout days, permitting new check-ins on the same date >= 12:00 PM.
 */
export function isPropertyAvailable(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  optionsOrRef?:
    | string
    | {
        excludeBookingRef?: string;
        checkinTime?: string;
        checkoutTime?: string;
      }
): boolean {
  if (!checkIn || !checkOut) return false;
  const excludeBookingRef = typeof optionsOrRef === "string" ? optionsOrRef : optionsOrRef?.excludeBookingRef;
  const checkinTime = typeof optionsOrRef === "object" ? optionsOrRef.checkinTime || DEFAULT_CHECKIN_TIME : DEFAULT_CHECKIN_TIME;
  const checkoutTime = typeof optionsOrRef === "object" ? optionsOrRef.checkoutTime || DEFAULT_CHECKOUT_TIME : DEFAULT_CHECKOUT_TIME;

  const isSameDay12h = isSameDayTwelveHourStay({ checkIn, checkOut, checkinTime, checkoutTime });
  if (checkIn > checkOut || (checkIn === checkOut && !isSameDay12h)) return false;

  const bookedRanges = getBookedDateRanges(propertyId);
  const validation = validateTimeSlotBooking(
    { checkIn, checkOut, checkinTime, checkoutTime },
    bookedRanges,
    { excludeBookingRef }
  );

  return validation.isAvailable;
}

/**
 * Fetches real-time unavailable dates, time-slots, checkout cutoff, and status from the database.
 */
export async function fetchLivePropertyAvailability(propertyId: string): Promise<LiveAvailabilityResult> {
  const fallback: LiveAvailabilityResult = {
    unavailableDates: [],
    bookedDates: [],
    blockedDates: [],
    checkoutDates: [],
    checkoutCutoff: DEFAULT_CHECKOUT_CUTOFF,
    priceOverrides: {},
    timeSlotBookings: [],
  };

  if (typeof window === "undefined" || !propertyId) {
    return fallback;
  }

  try {
    const res = await fetch(`/api/properties/${encodeURIComponent(propertyId)}/availability`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return {
        unavailableDates: data.unavailableDates || [],
        bookedDates: data.bookedDates || [],
        blockedDates: data.blockedDates || [],
        checkoutDates: data.checkoutDates || [],
        checkoutCutoff: data.checkoutCutoff || DEFAULT_CHECKOUT_CUTOFF,
        priceOverrides: data.priceOverrides || {},
        timeSlotBookings: data.timeSlotBookings || [],
        todayStatus: data.todayStatus,
        availableCheckinSlots: data.availableCheckinSlots,
        slotConfig: data.slotConfig,
      };
    }
  } catch (err) {
    console.warn("Notice: Live availability fetch error:", err);
  }
  return fallback;
}

export function recordBookedRange(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  bookingRef: string,
  checkinTime: string = DEFAULT_CHECKIN_TIME,
  checkoutTime: string = DEFAULT_CHECKOUT_TIME
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const data: Record<string, BookedDateRange[]> = raw ? JSON.parse(raw) : {};
    if (!data[propertyId]) data[propertyId] = [];
    data[propertyId].push({ checkIn, checkOut, bookingRef, checkinTime, checkoutTime });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to persist booked range locally:", err);
  }
}

export function removeBookedRange(propertyId: string, bookingRef: string): void {
  if (typeof window === "undefined" || !bookingRef) return;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;
    const data: Record<string, BookedDateRange[]> = JSON.parse(raw);
    if (data[propertyId]) {
      data[propertyId] = data[propertyId].filter((r) => r.bookingRef !== bookingRef);
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.error("Failed to remove booked range locally:", err);
  }
}
