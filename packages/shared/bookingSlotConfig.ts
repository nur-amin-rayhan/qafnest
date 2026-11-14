import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_CUTOFF,
  DEFAULT_CHECKOUT_TIME,
  TWELVE_HOUR_CHECKIN_TIME,
  doTimeSlotsOverlap,
  formatGathernTime,
  parseTimeToMinutes,
  type TimeSlotBooking,
} from "./timeSlots";
import {
  calculateGranularStayRate,
  getEffectiveNightlyRateForDate,
  type GranularPricingOptions,
} from "./pricingEngine";

export type BookingSlotFormatId = "standard_4pm_12pm" | "twelve_hour_12am_12pm";

export interface BookingSlotFormatDefinition {
  id: BookingSlotFormatId;
  checkinTime: string;
  checkoutTime: string;
  isSameDayCheckout: boolean;
  labelEn: string;
  labelAr: string;
  shortLabelEn: string;
  shortLabelAr: string;
}

export const BOOKING_SLOT_FORMATS: Record<BookingSlotFormatId, BookingSlotFormatDefinition> = {
  standard_4pm_12pm: {
    id: "standard_4pm_12pm",
    checkinTime: DEFAULT_CHECKIN_TIME, // 16:00 (4:00 PM)
    checkoutTime: DEFAULT_CHECKOUT_TIME, // 12:00 (12:00 PM)
    isSameDayCheckout: false,
    labelEn: "4:00 PM Check-in → 12:00 PM Check-out",
    labelAr: "دخول 4:00 م ← خروج 12:00 م (افتراضي)",
    shortLabelEn: "4 PM – 12 PM",
    shortLabelAr: "4 م – 12 م",
  },
  twelve_hour_12am_12pm: {
    id: "twelve_hour_12am_12pm",
    checkinTime: TWELVE_HOUR_CHECKIN_TIME, // 00:00 (12:00 AM)
    checkoutTime: DEFAULT_CHECKOUT_TIME, // 12:00 (12:00 PM)
    isSameDayCheckout: true,
    labelEn: "12:00 AM Check-in → 12:00 PM Check-out (12h)",
    labelAr: "دخول 12:00 ص ← خروج 12:00 م (12 ساعة)",
    shortLabelEn: "12 AM – 12 PM (12h)",
    shortLabelAr: "12 ص – 12 م (12س)",
  },
};

export interface DateSlotOverride {
  standardEnabled?: boolean;
  twelveHourEnabled?: boolean;
  twelveHourPrice?: number | null;
  standardPrice?: number | null;
  fullDayClosed?: boolean;
}

export interface PropertyBookingSlotConfig {
  propertyId: string;
  slug?: string;
  /** Primary format: 4:00 PM Check-in -> 12:00 PM Check-out (next day) */
  enableStandard4pmTo12pm: boolean;
  /** Optional 12-hour format: 12:00 AM Check-in -> 12:00 PM Check-out (same day) */
  enableTwelveHour12amTo12pm: boolean;
  /** Manual rate controlled by Host/Admin for the 12 AM -> 12 PM slot (SAR) */
  twelveHourPrice: number | null;
  /** Dates explicitly closed as full-day blocks by Host or Admin */
  hostBlockedDates?: string[];
  /** Per-date format toggles & manual slot rate overrides (keyed YYYY-MM-DD) */
  dateSlotOverrides: Record<string, DateSlotOverride>;
  updatedBy?: "host" | "admin";
  updatedAt?: string;
}

export type CalendarDaySlotOverallStatus =
  | "available_full"       // Both 12 AM-12 PM (12h) and 4 PM-12 PM open
  | "available_standard"   // Standard 4 PM-12 PM open (12h OFF or past today)
  | "available_12h_only"   // Only 12 AM-12 PM open (evening standard disabled/blocked)
  | "split_checkout_open"  // Morning booked until 12 PM checkout, afternoon 4 PM+ OPEN
  | "split_checkin_open"   // Morning 12 AM-12 PM OPEN, evening 4 PM+ booked
  | "checkout_only_closed" // Morning booked until 12 PM checkout, evening closed/disabled
  | "booked_full"          // Both halves occupied by bookings
  | "closed";              // Host/Admin closed whole day (or both formats disabled)

export type SlotHalfStatus = "booked" | "blocked" | "available" | "disabled";

export interface CalendarDayTimeWindow {
  startTime: string;
  endTime: string;
  bookingRef?: string;
  status?: string;
  formatId?: BookingSlotFormatId;
  price?: number | null;
  labelEn: string;
  labelAr: string;
}

export interface CalendarDaySlotSummary {
  date: string;
  morningStatus: SlotHalfStatus;
  eveningStatus: SlotHalfStatus;
  overallStatus: CalendarDaySlotOverallStatus;
  isCheckoutDay: boolean;
  checkoutTime: string | null;
  occupiedWindows: CalendarDayTimeWindow[];
  openWindows: CalendarDayTimeWindow[];
  isPast?: boolean;
}

export function createDefaultPropertySlotConfig(
  propertyId: string,
  slug?: string
): PropertyBookingSlotConfig {
  return {
    propertyId,
    ...(slug ? { slug } : {}),
    enableStandard4pmTo12pm: true,
    enableTwelveHour12amTo12pm: false,
    twelveHourPrice: null,
    hostBlockedDates: [],
    dateSlotOverrides: {},
  };
}

export function sanitizeDateSlotOverride(raw: unknown): DateSlotOverride | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: DateSlotOverride = {};
  if (typeof r.standardEnabled === "boolean") out.standardEnabled = r.standardEnabled;
  if (typeof r.twelveHourEnabled === "boolean") out.twelveHourEnabled = r.twelveHourEnabled;
  if (typeof r.fullDayClosed === "boolean") out.fullDayClosed = r.fullDayClosed;
  if (r.twelveHourPrice === null) {
    out.twelveHourPrice = null;
  } else if (r.twelveHourPrice !== undefined && Number(r.twelveHourPrice) > 0) {
    out.twelveHourPrice = Math.round(Number(r.twelveHourPrice) * 100) / 100;
  }
  if (r.standardPrice === null) {
    out.standardPrice = null;
  } else if (r.standardPrice !== undefined && Number(r.standardPrice) > 0) {
    out.standardPrice = Math.round(Number(r.standardPrice) * 100) / 100;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function sanitizePropertySlotConfig(
  raw: unknown,
  propertyId: string,
  slug?: string
): PropertyBookingSlotConfig {
  const base = createDefaultPropertySlotConfig(propertyId, slug);
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;

  const dateSlotOverrides: Record<string, DateSlotOverride> = {};
  if (obj.dateSlotOverrides && typeof obj.dateSlotOverrides === "object") {
    for (const [dateKey, val] of Object.entries(obj.dateSlotOverrides as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
      const sanitized = sanitizeDateSlotOverride(val);
      if (sanitized) dateSlotOverrides[dateKey] = sanitized;
    }
  }

  const hostBlockedDates = Array.isArray(obj.hostBlockedDates)
    ? Array.from(
        new Set(obj.hostBlockedDates.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)))
      ).sort()
    : [];

  return {
    propertyId: propertyId || (typeof obj.propertyId === "string" ? obj.propertyId : ""),
    slug: slug || (typeof obj.slug === "string" ? obj.slug : undefined),
    enableStandard4pmTo12pm:
      typeof obj.enableStandard4pmTo12pm === "boolean" ? obj.enableStandard4pmTo12pm : true,
    enableTwelveHour12amTo12pm:
      typeof obj.enableTwelveHour12amTo12pm === "boolean" ? obj.enableTwelveHour12amTo12pm : false,
    twelveHourPrice:
      obj.twelveHourPrice !== undefined && obj.twelveHourPrice !== null && Number(obj.twelveHourPrice) > 0
        ? Math.round(Number(obj.twelveHourPrice) * 100) / 100
        : null,
    hostBlockedDates,
    dateSlotOverrides,
    updatedBy: obj.updatedBy === "admin" ? "admin" : obj.updatedBy === "host" ? "host" : undefined,
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : undefined,
  };
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const ms = Date.parse(`${isoDate}T00:00:00.000Z`);
  if (!Number.isFinite(ms)) return isoDate;
  return new Date(ms + days * 86_400_000).toISOString().slice(0, 10);
}

export function getRiyadhNowInfo(): { dateIso: string; minutesNow: number } {
  try {
    const now = new Date();
    const dateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Riyadh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const getPart = (t: Intl.DateTimeFormatPartTypes) =>
      dateParts.find((p) => p.type === t)?.value || "01";
    const dateIso = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;

    const timeParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Riyadh",
      hour12: false,
      hour: "numeric",
      minute: "numeric",
    }).formatToParts(now);
    const rawHour = parseInt(timeParts.find((p) => p.type === "hour")?.value || "12", 10);
    const h = Number.isFinite(rawHour) ? rawHour % 24 : 12;
    const m = parseInt(timeParts.find((p) => p.type === "minute")?.value || "0", 10);
    return { dateIso, minutesNow: h * 60 + (Number.isFinite(m) ? m : 0) };
  } catch {
    return { dateIso: new Date().toISOString().slice(0, 10), minutesNow: 720 };
  }
}

export function isSameDayTwelveHourStay(params: {
  checkIn?: string | null;
  checkOut?: string | null;
  checkinTime?: string | null;
  checkoutTime?: string | null;
}): boolean {
  const { checkIn, checkOut, checkinTime, checkoutTime } = params;
  if (!checkIn || !checkOut || checkIn !== checkOut) return false;
  const startMin = parseTimeToMinutes(checkinTime || DEFAULT_CHECKIN_TIME);
  const endMin = parseTimeToMinutes(checkoutTime || DEFAULT_CHECKOUT_TIME);
  return startMin < endMin;
}

export function detectBookingSlotFormat(params: {
  checkIn?: string | null;
  checkOut?: string | null;
  checkinTime?: string | null;
  checkoutTime?: string | null;
}): BookingSlotFormatId {
  const checkinNorm = String(params.checkinTime || DEFAULT_CHECKIN_TIME).slice(0, 5);
  const checkoutNorm = String(params.checkoutTime || DEFAULT_CHECKOUT_TIME).slice(0, 5);
  if (
    checkinNorm === TWELVE_HOUR_CHECKIN_TIME &&
    checkoutNorm === DEFAULT_CHECKOUT_TIME &&
    (!params.checkOut || params.checkIn === params.checkOut)
  ) {
    return "twelve_hour_12am_12pm";
  }
  return "standard_4pm_12pm";
}

export function isFormatEnabledOnDate(
  config: PropertyBookingSlotConfig,
  formatId: BookingSlotFormatId,
  dateIso: string,
  hostBlockedDates: string[] = []
): boolean {
  const override = config.dateSlotOverrides?.[dateIso];
  const explicitBlocked = config.hostBlockedDates || [];
  if (override?.fullDayClosed === true || hostBlockedDates.includes(dateIso) || explicitBlocked.includes(dateIso)) {
    return false;
  }
  if (formatId === "twelve_hour_12am_12pm") {
    if (typeof override?.twelveHourEnabled === "boolean") return override.twelveHourEnabled;
    return config.enableTwelveHour12amTo12pm;
  }
  if (typeof override?.standardEnabled === "boolean") return override.standardEnabled;
  return config.enableStandard4pmTo12pm;
}

export function getTwelveHourRateForDate(
  config: PropertyBookingSlotConfig,
  dateIso: string,
  fallbackStandardRate: number
): { rate: number; isManualRate: boolean } {
  const datePrice = config.dateSlotOverrides?.[dateIso]?.twelveHourPrice;
  if (typeof datePrice === "number" && datePrice > 0) {
    return { rate: Math.round(datePrice * 100) / 100, isManualRate: true };
  }
  if (typeof config.twelveHourPrice === "number" && config.twelveHourPrice > 0) {
    return { rate: Math.round(config.twelveHourPrice * 100) / 100, isManualRate: true };
  }
  return { rate: Math.round((Number(fallbackStandardRate) || 0) * 100) / 100, isManualRate: false };
}

export function computeSlotAwareStayRate(params: {
  checkIn: string;
  checkOut: string;
  checkinTime?: string | null;
  checkoutTime?: string | null;
  pricingOptions: GranularPricingOptions;
  slotConfig?: PropertyBookingSlotConfig | null;
}): {
  baseStayRate: number;
  billableUnits: number;
  stayType: BookingSlotFormatId;
  isManualTwelveHourRate: boolean;
} {
  const { checkIn, checkOut, checkinTime, checkoutTime, pricingOptions, slotConfig } = params;
  const effectiveConfig = slotConfig || createDefaultPropertySlotConfig("default");

  // Merge any date-level standardPrice override into dateOverrides cleanly
  const mergedOverrides: Record<string, number> = { ...(pricingOptions.dateOverrides || {}) };
  for (const [dKey, ov] of Object.entries(effectiveConfig.dateSlotOverrides || {})) {
    if (typeof ov.standardPrice === "number" && ov.standardPrice > 0 && !mergedOverrides[dKey]) {
      mergedOverrides[dKey] = ov.standardPrice;
    }
  }
  const mergedOptions: GranularPricingOptions = {
    ...pricingOptions,
    dateOverrides: mergedOverrides,
  };

  if (isSameDayTwelveHourStay({ checkIn, checkOut, checkinTime, checkoutTime })) {
    const standardDetail = getEffectiveNightlyRateForDate(checkIn, mergedOptions);
    const { rate, isManualRate } = getTwelveHourRateForDate(effectiveConfig, checkIn, standardDetail.rate);
    return {
      baseStayRate: rate,
      billableUnits: 1,
      stayType: "twelve_hour_12am_12pm",
      isManualTwelveHourRate: isManualRate,
    };
  }

  const startMs = Date.parse(`${checkIn}T00:00:00.000Z`);
  const endMs = Date.parse(`${checkOut}T00:00:00.000Z`);
  const nights = Math.max(1, Math.round((endMs - startMs) / 86_400_000));
  const { totalStayRate, nightlyBreakdown } = calculateGranularStayRate(checkIn, nights, mergedOptions);

  // If guest somehow books multi-day starting at 00:00 midnight, include the Day-1 morning 12h slot charge cleanly
  const normalizedCheckin = String(checkinTime || DEFAULT_CHECKIN_TIME).slice(0, 5);
  let morningAddon = 0;
  let isManualTwelveHourRate = false;
  if (normalizedCheckin === TWELVE_HOUR_CHECKIN_TIME && nights >= 1) {
    const firstRate = nightlyBreakdown[0]?.rate ?? pricingOptions.masterBasePrice;
    const resolvedMorning = getTwelveHourRateForDate(effectiveConfig, checkIn, firstRate);
    morningAddon = resolvedMorning.rate;
    isManualTwelveHourRate = resolvedMorning.isManualRate;
  }

  return {
    baseStayRate: Math.round((totalStayRate + morningAddon) * 100) / 100,
    billableUnits: nights,
    stayType: "standard_4pm_12pm",
    isManualTwelveHourRate,
  };
}

/**
 * Derive true manual full-day closed dates from property_availability rows (where is_available=false)
 * by separating host blocks from booking night rows, merged with explicit config.hostBlockedDates.
 */
export function deriveHostManualBlockedDates(
  availabilityBlockedDates: string[],
  bookings: TimeSlotBooking[],
  config?: PropertyBookingSlotConfig | null
): string[] {
  const result = new Set<string>(config?.hostBlockedDates || []);
  for (const [dKey, ov] of Object.entries(config?.dateSlotOverrides || {})) {
    if (ov.fullDayClosed === true) result.add(dKey);
  }

  for (const d of availabilityBlockedDates) {
    // Check if an active confirmed/completed booking actually covers evening night [d 16:00, d+1 12:00)
    const nextD = addDaysToIsoDate(d, 1);
    const coveredByBookingNight = bookings.some((b) =>
      doTimeSlotsOverlap(
        { checkIn: d, checkOut: nextD, checkinTime: DEFAULT_CHECKIN_TIME, checkoutTime: DEFAULT_CHECKOUT_TIME },
        b
      )
    );
    if (!coveredByBookingNight) {
      result.add(d);
    }
  }

  return Array.from(result).sort();
}

/**
 * Build complete per-day half-slot summary for Host, Admin, and Guest calendars so every cell
 * communicates exact occupied windows (e.g. 00:00-12:00 checkout) and open windows (e.g. 4:00 PM+).
 */
export function getCalendarDaySlotSummary(params: {
  dateIso: string;
  existingBookings: TimeSlotBooking[];
  slotConfig?: PropertyBookingSlotConfig | null;
  hostBlockedDates?: string[];
  riyadhNow?: { dateIso: string; minutesNow: number };
  effectiveStandardPrice?: number | null;
}): CalendarDaySlotSummary {
  const {
    dateIso,
    existingBookings,
    slotConfig,
    hostBlockedDates = [],
    riyadhNow,
    effectiveStandardPrice = null,
  } = params;

  const config = slotConfig || createDefaultPropertySlotConfig("default");
  const nextDateIso = addDaysToIsoDate(dateIso, 1);
  const override = config.dateSlotOverrides?.[dateIso];
  const isWholeDayBlocked =
    override?.fullDayClosed === true ||
    hostBlockedDates.includes(dateIso) ||
    Boolean(config.hostBlockedDates?.includes(dateIso));

  const morningSlotWindow: TimeSlotBooking = {
    checkIn: dateIso,
    checkOut: dateIso,
    checkinTime: TWELVE_HOUR_CHECKIN_TIME,
    checkoutTime: DEFAULT_CHECKOUT_CUTOFF,
  };

  const eveningSlotWindow: TimeSlotBooking = {
    checkIn: dateIso,
    checkOut: nextDateIso,
    checkinTime: DEFAULT_CHECKIN_TIME,
    checkoutTime: DEFAULT_CHECKOUT_CUTOFF,
  };

  const morningBookings = existingBookings.filter((b) => doTimeSlotsOverlap(morningSlotWindow, b));
  const eveningBookings = existingBookings.filter((b) => doTimeSlotsOverlap(eveningSlotWindow, b));

  const checkoutBooking = existingBookings.find((b) => b.checkOut === dateIso) || null;
  const isCheckoutDay = Boolean(checkoutBooking);
  const checkoutTime = checkoutBooking ? String(checkoutBooking.checkoutTime || DEFAULT_CHECKOUT_CUTOFF).slice(0, 5) : null;

  const occupiedWindows: CalendarDayTimeWindow[] = [];
  const openWindows: CalendarDayTimeWindow[] = [];

  const isPast = Boolean(riyadhNow && dateIso < riyadhNow.dateIso);
  if (isPast) {
    const wasMorningBooked = morningBookings.length > 0;
    const wasEveningBooked = eveningBookings.length > 0;
    return {
      date: dateIso,
      morningStatus: wasMorningBooked ? "booked" : "disabled",
      eveningStatus: wasEveningBooked ? "booked" : "disabled",
      overallStatus: wasMorningBooked || wasEveningBooked ? "booked_full" : "closed",
      isCheckoutDay,
      checkoutTime,
      occupiedWindows: [],
      openWindows: [],
      isPast: true,
    };
  }

  let morningStatus: SlotHalfStatus;
  if (morningBookings.length > 0) {
    morningStatus = "booked";
    const first = morningBookings[0];
    const endTime = first.checkOut === dateIso ? String(first.checkoutTime || DEFAULT_CHECKOUT_CUTOFF).slice(0, 5) : "12:00";
    occupiedWindows.push({
      startTime: "00:00",
      endTime,
      bookingRef: first.bookingRef,
      status: first.status,
      labelEn:
        first.checkOut === dateIso && first.checkIn !== dateIso
          ? `12:00 AM – ${formatGathernTime(endTime, "en")} (Guest Checkout)`
          : first.checkIn === dateIso && first.checkOut === dateIso
          ? `12:00 AM – ${formatGathernTime(endTime, "en")} (12h Stay Booked)`
          : "12:00 AM – 12:00 PM (In-Stay)",
      labelAr:
        first.checkOut === dateIso && first.checkIn !== dateIso
          ? `12:00 ص – ${formatGathernTime(endTime, "ar")} (مغادرة النزيل)`
          : first.checkIn === dateIso && first.checkOut === dateIso
          ? `12:00 ص – ${formatGathernTime(endTime, "ar")} (إقامة 12 ساعة محجوزة)`
          : "12:00 ص – 12:00 م (إقامة جارية)",
    });
  } else if (isWholeDayBlocked) {
    morningStatus = "blocked";
  } else if (!isFormatEnabledOnDate(config, "twelve_hour_12am_12pm", dateIso, hostBlockedDates)) {
    morningStatus = "disabled";
  } else if (riyadhNow && dateIso === riyadhNow.dateIso && riyadhNow.minutesNow >= parseTimeToMinutes(DEFAULT_CHECKOUT_CUTOFF)) {
    morningStatus = "disabled";
  } else {
    morningStatus = "available";
    const resolved12h = getTwelveHourRateForDate(config, dateIso, effectiveStandardPrice || 0);
    openWindows.push({
      formatId: "twelve_hour_12am_12pm",
      startTime: "00:00",
      endTime: "12:00",
      price: resolved12h.rate > 0 ? resolved12h.rate : null,
      labelEn: "12:00 AM – 12:00 PM (12h Slot Open)",
      labelAr: "12:00 ص – 12:00 م (سفرة 12 ساعة متاحة)",
    });
  }

  let eveningStatus: SlotHalfStatus;
  if (eveningBookings.length > 0) {
    eveningStatus = "booked";
    const first = eveningBookings[0];
    const startTime = first.checkIn === dateIso ? String(first.checkinTime || DEFAULT_CHECKIN_TIME).slice(0, 5) : "16:00";
    occupiedWindows.push({
      startTime,
      endTime: "23:59",
      bookingRef: first.bookingRef,
      status: first.status,
      labelEn:
        first.checkIn === dateIso
          ? `${formatGathernTime(startTime, "en")} → Next Day 12:00 PM (Booked)`
          : "4:00 PM → Next Day 12:00 PM (Occupied Stay)",
      labelAr:
        first.checkIn === dateIso
          ? `${formatGathernTime(startTime, "ar")} ← 12:00 م اليوم التالي (محجوز)`
          : "4:00 م ← 12:00 م اليوم التالي (إقامة جارية)",
    });
  } else if (isWholeDayBlocked) {
    eveningStatus = "blocked";
  } else if (!isFormatEnabledOnDate(config, "standard_4pm_12pm", dateIso, hostBlockedDates)) {
    eveningStatus = "disabled";
  } else {
    eveningStatus = "available";
    openWindows.push({
      formatId: "standard_4pm_12pm",
      startTime: DEFAULT_CHECKIN_TIME,
      endTime: "12:00",
      price: effectiveStandardPrice && effectiveStandardPrice > 0 ? effectiveStandardPrice : null,
      labelEn: isCheckoutDay
        ? `4:00 PM+ Open Today (After ${formatGathernTime(checkoutTime || "12:00", "en")} Checkout)`
        : "4:00 PM – 12:00 PM Next Day (Open)",
      labelAr: isCheckoutDay
        ? `متاح من 4:00 م (بعد مغادرة ${formatGathernTime(checkoutTime || "12:00", "ar")})`
        : "4:00 م – 12:00 م اليوم التالي (متاح)",
    });
  }

  let overallStatus: CalendarDaySlotOverallStatus;
  if (isWholeDayBlocked) {
    overallStatus = "closed";
  } else if (morningStatus === "booked" && eveningStatus === "booked") {
    overallStatus = "booked_full";
  } else if (morningStatus === "booked" && eveningStatus === "available") {
    overallStatus = "split_checkout_open";
  } else if (morningStatus === "booked") {
    overallStatus = "checkout_only_closed";
  } else if (morningStatus === "available" && eveningStatus === "booked") {
    overallStatus = "split_checkin_open";
  } else if (morningStatus === "available" && eveningStatus === "available") {
    overallStatus = "available_full";
  } else if (eveningStatus === "available") {
    overallStatus = "available_standard";
  } else if (morningStatus === "available") {
    overallStatus = "available_12h_only";
  } else {
    overallStatus = "closed";
  }

  return {
    date: dateIso,
    morningStatus,
    eveningStatus,
    overallStatus,
    isCheckoutDay,
    checkoutTime,
    occupiedWindows,
    openWindows,
  };
}
