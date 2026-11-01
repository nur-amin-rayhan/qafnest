/**
 * Availability Service for QafNest properties.
 * Tracks booked dates for properties to prevent double bookings.
 */

export interface BookedDateRange {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  bookingRef?: string;
}

// Initial realistic booked dates for demo/featured properties (e.g. upcoming high-demand dates)
function getFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_BOOKED_RANGES: Record<string, BookedDateRange[]> = {
  "kidia-falcon-ridge": [
    { checkIn: getFutureDate(3), checkOut: getFutureDate(5), bookingRef: "QAF-DEMO01" },
    { checkIn: getFutureDate(12), checkOut: getFutureDate(15), bookingRef: "QAF-DEMO02" },
  ],
  "prop-1": [
    { checkIn: getFutureDate(4), checkOut: getFutureDate(6), bookingRef: "QAF-DEMO03" },
  ],
  "prop-2": [
    { checkIn: getFutureDate(7), checkOut: getFutureDate(9), bookingRef: "QAF-DEMO04" },
  ],
};

const LOCAL_STORAGE_KEY = "qafnest_booked_dates";

function getStoredBookings(): Record<string, BookedDateRange[]> {
  if (typeof window === "undefined") return { ...DEFAULT_BOOKED_RANGES };
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BOOKED_RANGES };
    const parsed = JSON.parse(raw) as Record<string, BookedDateRange[]>;
    // Merge defaults with stored
    const merged: Record<string, BookedDateRange[]> = { ...DEFAULT_BOOKED_RANGES };
    for (const [propId, ranges] of Object.entries(parsed)) {
      merged[propId] = [...(merged[propId] || []), ...ranges];
    }
    return merged;
  } catch {
    return { ...DEFAULT_BOOKED_RANGES };
  }
}

/**
 * Check if two date ranges [startA, endA) and [startB, endB) overlap.
 */
export function doRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  // Overlap occurs if startA < endB and endA > startB
  return startA < endB && endA > startB;
}

/**
 * Returns all booked date ranges for a given property.
 */
export function getBookedDateRanges(propertyId: string): BookedDateRange[] {
  const all = getStoredBookings();
  return all[propertyId] || [];
}

/**
 * Checks if a requested date range is fully available for booking.
 */
export function isPropertyAvailable(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingRef?: string
): boolean {
  if (!checkIn || !checkOut || checkIn >= checkOut) return false;
  const bookedRanges = getBookedDateRanges(propertyId);
  for (const range of bookedRanges) {
    if (excludeBookingRef && range.bookingRef === excludeBookingRef) continue;
    if (doRangesOverlap(checkIn, checkOut, range.checkIn, range.checkOut)) {
      return false; // Conflicting booking exists
    }
  }
  return true;
}

/**
 * Persists a newly confirmed booking date range to prevent subsequent bookings.
 */
export function recordBookedRange(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  bookingRef: string
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    const data: Record<string, BookedDateRange[]> = raw ? JSON.parse(raw) : {};
    if (!data[propertyId]) data[propertyId] = [];
    data[propertyId].push({ checkIn, checkOut, bookingRef });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to persist booked range locally:", err);
  }
}
