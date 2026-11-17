import { resolvePropertyIdentifier, isUuid } from "@/lib/services/propertyIdentifiers";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  DEFAULT_CHECKOUT_CUTOFF,
  type TimeSlotBooking,
  addDaysToIsoDate,
  computeSlotAwareStayRate,
  deriveHostManualBlockedDates,
  doTimeSlotsOverlap,
  formatGathernTime,
  isFormatEnabledOnDate,
  isSameDayTwelveHourStay,
  type GranularWeeklyPricing,
  type PropertyBookingSlotConfig,
} from "@qafnest/shared";
import { getServerPropertySlotConfig } from "@qafnest/shared/bookingSlotStore";

export { isUuid };
export { persistBookingToDatabase, type PersistBookingParams } from "./bookingPersistence";

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "QAF-";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

export interface ResolvedPropertyInfo {
  propTitle: string;
  propCityName: string;
  propImages: string[];
  propBasePrice: number;
  propWeekdayPrice: number | null;
  propWeekendPrice: number | null;
  customDayPricing?: GranularWeeklyPricing | null;
  propCapacity: number;
  resolvedDbPropertyId: string;
  propSlug?: string;
  propCategory?: string;
  definedCheckinTime?: string;
  definedCheckoutTime?: string;
  slotConfig?: PropertyBookingSlotConfig;
}

export async function resolveCheckoutProperty(
  rawPropertyId: string,
  supabase: SupabaseClient
): Promise<ResolvedPropertyInfo | null> {
  const { uuid: propertyUuid, slug: propertySlug } = resolvePropertyIdentifier(rawPropertyId);

  let propTitle = "", propCityName = "", propImages: string[] = [];
  let propBasePrice = 0, propWeekdayPrice: number | null = null, propWeekendPrice: number | null = null;
  let propCapacity = 4, resolvedDbPropertyId = propertyUuid, propCategory = "chalet";
  let definedCheckinTime = DEFAULT_CHECKIN_TIME, definedCheckoutTime = DEFAULT_CHECKOUT_TIME;
  let isDbProperty = false;

  let customDayPricing: GranularWeeklyPricing | null = null;
  try {
    const stdFields = "id, title, city_name, images, base_price, weekday_price, weekend_price, is_approved, category, checkin_time, checkout_time, capacity";
    const advFields = `${stdFields}, custom_day_pricing, sunday_price, monday_price, tuesday_price, wednesday_price, thursday_price, friday_price, saturday_price`;

    let dbProps: Array<Record<string, unknown>> | null = null;
    const filterQuery = (fields: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = (supabase.from("properties") as any).select(fields).eq("is_approved", true);
      return isUuid(rawPropertyId)
        ? q.eq("id", rawPropertyId).limit(1)
        : q.eq("slug", propertySlug).limit(1);
    };

    const advRes = await filterQuery(advFields);
    if (!advRes.error && advRes.data?.length) {
      dbProps = advRes.data as Array<Record<string, unknown>>;
    } else {
      const stdRes = await filterQuery(stdFields);
      if (!stdRes.error && stdRes.data?.length) {
        dbProps = stdRes.data as Array<Record<string, unknown>>;
      }
    }

    if (dbProps && dbProps.length > 0) {
      const dbProp = dbProps[0];
      isDbProperty = true;
      resolvedDbPropertyId = String(dbProp.id);
      propTitle = String(dbProp.title || "");
      propCityName = String(dbProp.city_name || "");
      propImages = Array.isArray(dbProp.images) ? (dbProp.images as string[]) : [];
      propBasePrice = Number(dbProp.base_price) || 0;
      propWeekdayPrice = Number(dbProp.weekday_price || propBasePrice);
      propWeekendPrice = Number(dbProp.weekend_price || propBasePrice);
      propCapacity = Number(dbProp.capacity) || 4;
      propCategory = String(dbProp.category || "chalet");
      if (dbProp.checkin_time) definedCheckinTime = String(dbProp.checkin_time).slice(0, 5);
      if (dbProp.checkout_time) definedCheckoutTime = String(dbProp.checkout_time).slice(0, 5);

      if (dbProp.custom_day_pricing && typeof dbProp.custom_day_pricing === "object") {
        customDayPricing = dbProp.custom_day_pricing as GranularWeeklyPricing;
      } else if (dbProp.sunday_price || dbProp.friday_price) {
        customDayPricing = {
          sunday: dbProp.sunday_price as number,
          monday: dbProp.monday_price as number,
          tuesday: dbProp.tuesday_price as number,
          wednesday: dbProp.wednesday_price as number,
          thursday: dbProp.thursday_price as number,
          friday: dbProp.friday_price as number,
          saturday: dbProp.saturday_price as number,
        };
      }
    }
  } catch {}

  if (!isDbProperty) {
    return null;
  }

  return {
    propTitle,
    propCityName,
    propImages,
    propBasePrice,
    propWeekdayPrice,
    propWeekendPrice,
    customDayPricing,
    propCapacity,
    resolvedDbPropertyId,
    propSlug: propertySlug,
    propCategory,
    definedCheckinTime,
    definedCheckoutTime,
    slotConfig: getServerPropertySlotConfig({
      propertyId: resolvedDbPropertyId,
      slug: propertySlug,
      dbCustomDayPricing: customDayPricing,
    }),
  };
}

export async function checkDatesAndCalculateRate({
  checkIn,
  checkOut,
  checkinTime = DEFAULT_CHECKIN_TIME,
  checkoutTime = DEFAULT_CHECKOUT_TIME,
  nights,
  resolvedDbPropertyId,
  propWeekdayPrice,
  propWeekendPrice,
  propBasePrice,
  customDayPricing,
  slotConfig,
  supabase,
  currentGuestId,
  currentGuestSubject,
}: {
  checkIn: string;
  checkOut: string;
  checkinTime?: string;
  checkoutTime?: string;
  nights: number;
  resolvedDbPropertyId: string;
  propWeekdayPrice: number | null;
  propWeekendPrice: number | null;
  propBasePrice: number;
  customDayPricing?: GranularWeeklyPricing | null;
  slotConfig?: PropertyBookingSlotConfig | null;
  supabase: SupabaseClient;
  currentGuestId?: string | null;
  currentGuestSubject?: string | null;
}): Promise<{ baseStayRate: number; error?: { code: string; message?: string; messageAr?: string; status: number } }> {
  const isSameDay12h = isSameDayTwelveHourStay({ checkIn, checkOut, checkinTime, checkoutTime });

  // Validate enabled timing format configured by Host / Admin
  if (slotConfig) {
    if (isSameDay12h) {
      if (!isFormatEnabledOnDate(slotConfig, "twelve_hour_12am_12pm", checkIn)) {
        return {
          baseStayRate: 0,
          error: {
            code: "slot_format_disabled",
            message: `The 12:00 AM – 12:00 PM (12-hour) slot is not enabled by the host for ${checkIn}. Please choose the 4:00 PM – 12:00 PM standard slot.`,
            messageAr: `فترة 12:00 ص – 12:00 م (12 ساعة) غير مفعّلة من قِبل المضيف لتاريخ ${checkIn}. يرجى اختيار الفترة الافتراضية 4:00 م – 12:00 م.`,
            status: 409,
          },
        };
      }
    } else if (checkOut > checkIn) {
      const checkSpanDays = Math.max(1, Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000));
      for (let i = 0; i < checkSpanDays; i++) {
        const dayIso = addDaysToIsoDate(checkIn, i);
        if (!isFormatEnabledOnDate(slotConfig, "standard_4pm_12pm", dayIso)) {
          return {
            baseStayRate: 0,
            error: {
              code: "slot_format_disabled",
              message: `Standard 4:00 PM check-in is disabled by the host/admin on ${dayIso}.`,
              messageAr: `تم تعطيل الوصول الساعة 4:00 م في ${dayIso} من قِبل المضيف أو الإدارة.`,
              status: 409,
            },
          };
        }
      }
    }
  }

  const existingBookingSlots: TimeSlotBooking[] = [];
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    type CandidateBookingRow = {
      id: string;
      check_in: string;
      check_out: string;
      checkin_time?: string | null;
      checkout_time?: string | null;
      status: string;
      payment_status?: string | null;
      guest_id?: string | null;
      auth_subject?: string | null;
      created_at?: string | null;
      booking_reference?: string | null;
    };

    const primaryCandidates = await supabase
      .from("bookings")
      .select("id, check_in, check_out, checkin_time, checkout_time, status, payment_status, guest_id, auth_subject, created_at, booking_reference")
      .eq("property_id", resolvedDbPropertyId)
      .lte("check_in", checkOut)
      .gte("check_out", checkIn)
      .or(`status.in.(confirmed,completed),and(status.eq.pending,created_at.gt.${fifteenMinutesAgo})`);

    let candidateBookings = primaryCandidates.data as CandidateBookingRow[] | null;
    if (
      primaryCandidates.error &&
      (primaryCandidates.error.code === "42703" ||
        /checkin_time|checkout_time|column .* does not exist/i.test(primaryCandidates.error.message || ""))
    ) {
      const legacyCandidates = await supabase
        .from("bookings")
        .select("id, check_in, check_out, status, payment_status, guest_id, auth_subject, created_at, booking_reference")
        .eq("property_id", resolvedDbPropertyId)
        .lte("check_in", checkOut)
        .gte("check_out", checkIn)
        .or(`status.in.(confirmed,completed),and(status.eq.pending,created_at.gt.${fifteenMinutesAgo})`);
      candidateBookings = legacyCandidates.data as CandidateBookingRow[] | null;
    }

    if (candidateBookings && candidateBookings.length > 0) {
      const requestedSlot: TimeSlotBooking = {
        checkIn,
        checkOut,
        checkinTime: checkinTime || DEFAULT_CHECKIN_TIME,
        checkoutTime: checkoutTime || DEFAULT_CHECKOUT_TIME,
      };

      for (const b of candidateBookings) {
        const bMeta = b as Record<string, unknown>;
        const existingSlot: TimeSlotBooking = {
          checkIn: b.check_in,
          checkOut: b.check_out,
          checkinTime: bMeta.checkin_time ? String(bMeta.checkin_time).slice(0, 5) : DEFAULT_CHECKIN_TIME,
          checkoutTime: bMeta.checkout_time ? String(bMeta.checkout_time).slice(0, 5) : DEFAULT_CHECKOUT_TIME,
          bookingRef: b.booking_reference || undefined,
          status: b.status,
        };
        if (b.status === "confirmed" || b.status === "completed") {
          existingBookingSlots.push(existingSlot);
        }

        if (doTimeSlotsOverlap(requestedSlot, existingSlot)) {
          if (b.status === "confirmed" || b.status === "completed") {
            if (checkIn === b.check_out && checkOut > checkIn) {
              const cutoff = existingSlot.checkoutTime || DEFAULT_CHECKOUT_CUTOFF;
              return {
                baseStayRate: 0,
                error: {
                  code: "checkout_cutoff_conflict",
                  message: `The property is occupied until ${formatGathernTime(cutoff, "en")} on ${checkIn}. Check-in is available after ${formatGathernTime(cutoff, "en")}.`,
                  messageAr: `العقار مشغول حتى موعد المغادرة الساعة ${formatGathernTime(cutoff, "ar")} في ${checkIn}. تسجيل الوصول متاح بعد الساعة ${formatGathernTime(cutoff, "ar")}.`,
                  status: 409,
                },
              };
            }
            return {
              baseStayRate: 0,
              error: {
                code: "dates_unavailable",
                message: "The selected dates and hours are already booked.",
                messageAr: "التواريخ والأوقات المحددة محجوزة بالفعل.",
                status: 409,
              },
            };
          }

          if (b.status === "pending") {
            const isSameGuest =
              (currentGuestId && b.guest_id === currentGuestId) ||
              (currentGuestSubject && b.auth_subject === currentGuestSubject);
            if (!isSameGuest) {
              return {
                baseStayRate: 0,
                error: {
                  code: "dates_temporarily_held",
                  message: "These dates and hours are currently held by another guest completing payment. Please try again in 15 minutes.",
                  messageAr: "هذه التواريخ والأوقات محجوزة مؤقتاً لنزيل آخر يقوم بإتمام الدفع. يرجى المحاولة بعد 15 دقيقة.",
                  status: 409,
                },
              };
            }
          }
        }
      }
    }
  } catch (conflictErr) {
    console.warn("Notice: Booking availability check exception:", conflictErr);
  }

  let availabilityRows: Array<{ date: string; is_available: boolean; nightly_price: number | null }> = [];
  try {
    const exclusiveEndDate = checkIn === checkOut ? addDaysToIsoDate(checkIn, 1) : checkOut;
    const { data: rows } = await supabase
      .from("property_availability")
      .select("date, is_available, nightly_price")
      .eq("property_id", resolvedDbPropertyId)
      .gte("date", checkIn)
      .lt("date", exclusiveEndDate);

    if (rows && rows.length > 0) {
      availabilityRows = rows;
      const rawBlocked = rows.filter((r) => r.is_available === false).map((r) => r.date);
      const manualBlocked = deriveHostManualBlockedDates(rawBlocked, existingBookingSlots, slotConfig);

      // For overnight/multi-day checkIn->checkOut, any manual block OR non-12h block on night rows rejects;
      // for 12h same-day (00:00->12:00), only host manual whole-day close blocks the unoccupied morning half.
      const isDateBlockedForRequestedSlot = isSameDay12h
        ? manualBlocked.includes(checkIn)
        : rawBlocked.length > 0;

      if (isDateBlockedForRequestedSlot) {
        return {
          baseStayRate: 0,
          error: {
            code: "dates_unavailable",
            message: "One or more of your selected dates have been blocked by the host.",
            messageAr: "أحد التواريخ المحددة أو أكثر تم إغلاقها من قِبل المضيف.",
            status: 409,
          },
        };
      }
    }
  } catch (availErr) {
    console.warn("Notice: property_availability lookup:", availErr);
  }

  const dateOverrides: Record<string, number> = {};
  for (const row of availabilityRows) {
    if (typeof row.nightly_price === "number" && row.nightly_price > 0) {
      dateOverrides[row.date] = Number(row.nightly_price);
    }
  }

  const { baseStayRate } = computeSlotAwareStayRate({
    checkIn,
    checkOut,
    checkinTime,
    checkoutTime,
    pricingOptions: {
      masterBasePrice: propBasePrice,
      weeklyPricing: customDayPricing,
      weekdayPrice: propWeekdayPrice,
      weekendPrice: propWeekendPrice,
      dateOverrides,
    },
    slotConfig: slotConfig || undefined,
  });

  // Preserve unused `nights` parameter compatibility if needed by callers
  void nights;

  return { baseStayRate };
}
