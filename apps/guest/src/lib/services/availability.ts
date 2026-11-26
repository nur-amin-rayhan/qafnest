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
  _propertyId: string,
  _checkIn: string,
  _checkOut: string,
  _bookingRef: string,
  _checkinTime: string = DEFAULT_CHECKIN_TIME,
  _checkoutTime: string = DEFAULT_CHECKOUT_TIME
): void {
  // Server database availability is the single source of truth; do not persist stale browser ranges.
}

export function removeBookedRange(_propertyId: string, _bookingRef: string): void {
  // Server database availability is the single source of truth.
}
