/**
 * Time-Slot Availability & Hourly Booking System
 * Validates bookings by specific hours and enforces the 12:00 PM checkout cutoff.
 */

export const DEFAULT_CHECKOUT_CUTOFF = "12:00"; // 12:00 PM Cutoff
export const DEFAULT_CHECKIN_TIME = "16:00";    // 4:00 PM Check-in (Default)
export const DEFAULT_CHECKOUT_TIME = "12:00";   // 12:00 PM Check-out
export const TWELVE_HOUR_CHECKIN_TIME = "00:00"; // 12:00 AM Optional 12-Hour Check-in

export const CHECKIN_TIME_SLOTS = [
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "20:00",
] as const;

export const CHECKOUT_TIME_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
] as const;

export interface TimeSlotBooking {
  id?: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  checkinTime?: string | null; // e.g. "15:00"
  checkoutTime?: string | null; // e.g. "12:00"
  bookingRef?: string;
  status?: string; // "confirmed" | "completed" | "pending"
}

export interface TimeSlotValidationResult {
  isAvailable: boolean;
  conflictReason?:
    | "prior_guest_not_checked_out"
    | "subsequent_guest_arriving"
    | "dates_fully_occupied"
    | "dates_unavailable"
    | "slot_format_disabled";
  conflictMessageEn?: string;
  conflictMessageAr?: string;
  conflictingBookingRef?: string;
  availableCheckinAfter?: string; // e.g. "12:00"
}

export interface PropertyDailyTimeSlotStatus {
  date: string;
  isCheckoutDay: boolean;
  checkoutCutoff: string;
  isCurrentlyOccupied: boolean;
  isAvailableForCheckin: boolean;
  availableCheckinTimes: string[];
  statusLabelEn: string;
  statusLabelAr: string;
}

export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 720; // default 12:00 PM = 12 * 60 = 720
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  return (Number.isFinite(h) ? h : 12) * 60 + (Number.isFinite(m) ? m : 0);
}

export function formatGathernTime(time24: string, language: string = "ar"): string {
  if (!time24) return language === "ar" ? "12:00 م" : "12:00 PM";
  const [hourStr, minuteStr = "00"] = time24.split(":");
  const hourNum = Number(hourStr);
  if (!Number.isFinite(hourNum)) return time24;
  const isPm = hourNum >= 12;
  const period = isPm ? (language === "ar" ? "م" : "PM") : language === "ar" ? "ص" : "AM";
  const hour12 = hourNum % 12 || 12;
  const paddedHour = String(hour12).padStart(2, "0");
  return `${paddedHour}:${minuteStr.slice(0, 2)} ${period}`;
}

export function getDateTimeTimestamp(dateIso: string, timeStr?: string | null): number {
  const [year, month, day] = dateIso.split("-").map(Number);
  const [hourStr = "12", minuteStr = "00"] = (timeStr || "12:00").split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  return Date.UTC(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * Checks whether two hourly bookings overlap in time.
 * If Booking A checks out on date D at 12:00 PM, and Booking B checks in on date D at 15:00 (or >= 12:00 PM),
 * they DO NOT overlap (Booking B is permitted).
 */
export function doTimeSlotsOverlap(
  slotA: TimeSlotBooking,
  slotB: TimeSlotBooking
): boolean {
  const startA = getDateTimeTimestamp(slotA.checkIn, slotA.checkinTime || DEFAULT_CHECKIN_TIME);
  const endA = getDateTimeTimestamp(slotA.checkOut, slotA.checkoutTime || DEFAULT_CHECKOUT_TIME);

  const startB = getDateTimeTimestamp(slotB.checkIn, slotB.checkinTime || DEFAULT_CHECKIN_TIME);
  const endB = getDateTimeTimestamp(slotB.checkOut, slotB.checkoutTime || DEFAULT_CHECKOUT_TIME);

  // Standard interval intersection: [startA, endA) overlaps [startB, endB)
  return startA < endB && endA > startB;
}

/**
 * Validates a requested booking against all existing bookings using hourly time-slots.
 */
export function validateTimeSlotBooking(
  requested: TimeSlotBooking,
  existingBookings: TimeSlotBooking[],
  options?: {
    excludeBookingRef?: string;
    cutoffTime?: string;
  }
): TimeSlotValidationResult {
  const { excludeBookingRef, cutoffTime = DEFAULT_CHECKOUT_CUTOFF } = options || {};

  const reqCheckinTime = requested.checkinTime || DEFAULT_CHECKIN_TIME;
  const reqCheckoutTime = requested.checkoutTime || DEFAULT_CHECKOUT_TIME;

  const reqStart = getDateTimeTimestamp(requested.checkIn, reqCheckinTime);
  const reqEnd = getDateTimeTimestamp(requested.checkOut, reqCheckoutTime);

  if (reqStart >= reqEnd) {
    return {
      isAvailable: false,
      conflictReason: "dates_fully_occupied",
      conflictMessageEn: "Check-out time must be after check-in time.",
      conflictMessageAr: "وقت المغادرة يجب أن يكون بعد وقت الوصول.",
    };
  }

  for (const existing of existingBookings) {
    if (excludeBookingRef && existing.bookingRef === excludeBookingRef) continue;
    if (existing.status === "cancelled" || existing.status === "failed") continue;

    const existCheckinTime = existing.checkinTime || DEFAULT_CHECKIN_TIME;
    const existCheckoutTime = existing.checkoutTime || DEFAULT_CHECKOUT_TIME;

    const existStart = getDateTimeTimestamp(existing.checkIn, existCheckinTime);
    const existEnd = getDateTimeTimestamp(existing.checkOut, existCheckoutTime);

    // Check intersection
    if (reqStart < existEnd && reqEnd > existStart) {
      // Analyze specific conflict scenario:
      // Scenario A: Request starts on checkout day of existing booking, but before checkout time
      if (requested.checkIn === existing.checkOut && parseTimeToMinutes(reqCheckinTime) < parseTimeToMinutes(existCheckoutTime)) {
        return {
          isAvailable: false,
          conflictReason: "prior_guest_not_checked_out",
          conflictingBookingRef: existing.bookingRef,
          availableCheckinAfter: existCheckoutTime,
          conflictMessageEn: `Property is occupied until ${formatGathernTime(existCheckoutTime, "en")} checkout cutoff. Check-in permitted after ${formatGathernTime(existCheckoutTime, "en")}.`,
          conflictMessageAr: `العقار مشغول حتى موعد المغادرة الساعة ${formatGathernTime(existCheckoutTime, "ar")}. تسجيل الوصول متاح بعد الساعة ${formatGathernTime(existCheckoutTime, "ar")}.`,
        };
      }

      // Scenario B: Request ends on checkin day of a future booking, but after that booking's checkin time
      if (requested.checkOut === existing.checkIn && parseTimeToMinutes(reqCheckoutTime) > parseTimeToMinutes(existCheckinTime)) {
        return {
          isAvailable: false,
          conflictReason: "subsequent_guest_arriving",
          conflictingBookingRef: existing.bookingRef,
          conflictMessageEn: `Subsequent guest arrives at ${formatGathernTime(existCheckinTime, "en")}. Please select a checkout time prior to ${formatGathernTime(existCheckinTime, "en")}.`,
          conflictMessageAr: `النزيل القادم يصل الساعة ${formatGathernTime(existCheckinTime, "ar")}. يرجى اختيار وقت مغادرة قبل ذلك.`,
        };
      }

      // Scenario C: Fully overlapping nights
      return {
        isAvailable: false,
        conflictReason: "dates_fully_occupied",
        conflictingBookingRef: existing.bookingRef,
        conflictMessageEn: "The property is already booked for these dates and hours.",
        conflictMessageAr: "العقار محجوز بالفعل خلال هذه التواريخ والساعات.",
      };
    }
  }

  return { isAvailable: true };
}

/**
 * Returns available check-in time slots for a given date.
 * If date is a checkout day where previous guest departs at 12:00 PM,
 * filters out earlier hours and only returns check-in slots >= checkout cutoff.
 */
export function getAvailableCheckinSlots(
  dateIso: string,
  existingBookings: TimeSlotBooking[],
  candidateSlots: readonly string[] = CHECKIN_TIME_SLOTS
): string[] {
  // Find if there is a booking checking out on dateIso
  const checkoutBooking = existingBookings.find(
    (b) => b.checkOut === dateIso && b.status !== "cancelled" && b.status !== "failed"
  );

  // Find if there is a booking checking in or continuing through dateIso
  const occupiedBooking = existingBookings.find((b) => {
    if (b.status === "cancelled" || b.status === "failed") return false;
    return b.checkIn <= dateIso && b.checkOut > dateIso && b.checkIn !== dateIso;
  });

  if (occupiedBooking && (!checkoutBooking || occupiedBooking !== checkoutBooking)) {
    return []; // Fully occupied night
  }

  const minCheckinMinutes = checkoutBooking
    ? parseTimeToMinutes(checkoutBooking.checkoutTime || DEFAULT_CHECKOUT_CUTOFF)
    : 0;

  return candidateSlots.filter((slot) => parseTimeToMinutes(slot) >= minCheckinMinutes);
}

/**
 * Determines live property status on a given date (particularly today).
 * Automatically transitions to "available" after the 12:00 PM checkout cutoff.
 */
export function getPropertyLiveDailyStatus(
  dateIso: string,
  existingBookings: TimeSlotBooking[],
  nowMinutesRiyadh: number = 720, // default 12:00 PM = 720 min
  cutoffTime: string = DEFAULT_CHECKOUT_CUTOFF
): PropertyDailyTimeSlotStatus {
  const cutoffMinutes = parseTimeToMinutes(cutoffTime);
  const checkoutBooking = existingBookings.find(
    (b) => b.checkOut === dateIso && b.status !== "cancelled" && b.status !== "failed"
  );

  const fullDayOccupied = existingBookings.some((b) => {
    if (b.status === "cancelled" || b.status === "failed") return false;
    return b.checkIn < dateIso && b.checkOut > dateIso;
  });

  if (fullDayOccupied) {
    return {
      date: dateIso,
      isCheckoutDay: false,
      checkoutCutoff: cutoffTime,
      isCurrentlyOccupied: true,
      isAvailableForCheckin: false,
      availableCheckinTimes: [],
      statusLabelEn: "Occupied",
      statusLabelAr: "مشغول بالكامل",
    };
  }

  if (checkoutBooking) {
    const isPastCutoff = nowMinutesRiyadh >= cutoffMinutes;
    const availableSlots = getAvailableCheckinSlots(dateIso, existingBookings);

    return {
      date: dateIso,
      isCheckoutDay: true,
      checkoutCutoff: cutoffTime,
      isCurrentlyOccupied: !isPastCutoff,
      isAvailableForCheckin: isPastCutoff && availableSlots.length > 0,
      availableCheckinTimes: availableSlots,
      statusLabelEn: isPastCutoff
        ? `Available (Checkout completed at ${formatGathernTime(cutoffTime, "en")})`
        : `Occupied (Checking out at ${formatGathernTime(cutoffTime, "en")})`,
      statusLabelAr: isPastCutoff
        ? `متاح (تمت المغادرة بعد ${formatGathernTime(cutoffTime, "ar")})`
        : `مشغول (المغادرة اليوم ${formatGathernTime(cutoffTime, "ar")})`,
    };
  }

  return {
    date: dateIso,
    isCheckoutDay: false,
    checkoutCutoff: cutoffTime,
    isCurrentlyOccupied: false,
    isAvailableForCheckin: true,
    availableCheckinTimes: [...CHECKIN_TIME_SLOTS],
    statusLabelEn: "Available",
    statusLabelAr: "متاح للحجز",
  };
}

