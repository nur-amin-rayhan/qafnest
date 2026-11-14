import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { verifyHostSession } from "@/lib/auth/serverAuth";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  TWELVE_HOUR_CHECKIN_TIME,
  addDaysToIsoDate,
  deriveHostManualBlockedDates,
  doTimeSlotsOverlap,
  getCalendarDaySlotSummary,
  getRiyadhNowInfo,
  type TimeSlotBooking,
} from "@qafnest/shared";
import {
  acquirePropertyBookingLock,
  getServerPropertySlotConfig,
  updateServerPropertySlotConfig,
} from "@qafnest/shared/bookingSlotStore";

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const { url } = getSupabaseConfig();
  if (!serviceKey || !url) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isUuid(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function cleanWeekdayPricing(raw: unknown, prop: Record<string, unknown>) {
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const toNum = (v: unknown) => (v != null && Number(v) > 0 ? Number(v) : null);
  return {
    sunday: toNum(rec.sunday ?? prop.sunday_price),
    monday: toNum(rec.monday ?? prop.monday_price),
    tuesday: toNum(rec.tuesday ?? prop.tuesday_price),
    wednesday: toNum(rec.wednesday ?? prop.wednesday_price),
    thursday: toNum(rec.thursday ?? prop.thursday_price),
    friday: toNum(rec.friday ?? prop.friday_price),
    saturday: toNum(rec.saturday ?? prop.saturday_price),
  };
}

function normalizeBookings(rows: Array<Record<string, unknown>> | null): {
  bookedDates: string[];
  checkoutDates: string[];
  timeSlotBookings: TimeSlotBooking[];
} {
  const bookedDates = new Set<string>();
  const checkoutDates = new Set<string>();
  const timeSlotBookings: TimeSlotBooking[] = [];

  for (const b of rows || []) {
    const checkIn = String(b.check_in || "");
    const checkOut = String(b.check_out || "");
    if (!checkIn || !checkOut) continue;

    const checkinTime = b.checkin_time ? String(b.checkin_time).slice(0, 5) : DEFAULT_CHECKIN_TIME;
    const checkoutTime = b.checkout_time ? String(b.checkout_time).slice(0, 5) : DEFAULT_CHECKOUT_TIME;

    timeSlotBookings.push({
      checkIn,
      checkOut,
      checkinTime,
      checkoutTime,
      bookingRef: b.booking_reference ? String(b.booking_reference) : undefined,
      status: b.status ? String(b.status) : "confirmed",
    });

    if (checkOut > checkIn) {
      checkoutDates.add(checkOut);
      const start = Date.parse(`${checkIn}T00:00:00.000Z`);
      const end = Date.parse(`${checkOut}T00:00:00.000Z`);
      const nights = Math.max(1, Math.round((end - start) / 86_400_000));
      for (let i = 0; i < nights; i++) {
        bookedDates.add(new Date(start + i * 86_400_000).toISOString().slice(0, 10));
      }
    } else if (checkIn === checkOut) {
      checkoutDates.add(checkOut);
    }
  }

  return {
    bookedDates: Array.from(bookedDates).sort(),
    checkoutDates: Array.from(checkoutDates).sort(),
    timeSlotBookings,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const propertyId = params.id;
  if (!propertyId) {
    return NextResponse.json({ code: "missing_property_id" }, { status: 400 });
  }

  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ code: "database_not_configured" }, { status: 503 });
  }

  try {
    // 1. Fetch property to verify host ownership and current base/weekend pricing
    // 1. Verify property ownership (schema-safe columns only)
    let propQuery = supabase
      .from("properties")
      .select("id, slug, title, host_id, base_price, weekday_price, weekend_price");

    if (isUuid(propertyId)) {
      propQuery = propQuery.or(`id.eq.${propertyId},slug.eq.${propertyId}`);
    } else {
      propQuery = propQuery.eq("slug", propertyId);
    }

    const { data: prop } = await propQuery.maybeSingle();

    if (prop && prop.host_id && prop.host_id !== authUser.id) {
      return NextResponse.json(
        { code: "forbidden", message: "You are not authorized to manage this property." },
        { status: 403 }
      );
    }

    const effectiveProp = prop || {
      id: propertyId,
      slug: propertyId,
      title: propertyId,
      host_id: authUser.id,
      base_price: 0,
      weekday_price: 0,
      weekend_price: 0,
    };

    const customDayPricing = cleanWeekdayPricing({}, effectiveProp as Record<string, unknown>);
    const slotConfig = getServerPropertySlotConfig({
      propertyId: effectiveProp.id,
      slug: effectiveProp.slug,
    });

    const targetDbId = prop && isUuid(prop.id) ? prop.id : (isUuid(propertyId) ? propertyId : null);

    // 2. Fetch verified confirmed/completed bookings only (never show unpaid pending checkouts as Booked)
    let bookingsData: unknown[] = [];
    if (targetDbId) {
      const { data: bRows } = await supabase
        .from("bookings")
        .select("id, booking_reference, check_in, check_out, status, payment_status, created_at")
        .eq("property_id", targetDbId)
        .in("status", ["confirmed", "completed"]);
      bookingsData = (bRows || []).filter(
        (b) => !b.payment_status || b.payment_status === "success" || b.payment_status === "paid"
      );
    }

    const { bookedDates, checkoutDates, timeSlotBookings } = normalizeBookings(
      bookingsData as Array<Record<string, unknown>>
    );

    // 3. Fetch property_availability records (blocked days and per-date pricing)
    const rawBlockedDates: string[] = [];
    const priceOverrides: Record<string, number> = {};

    if (targetDbId) {
      const { data: availabilityRows } = await supabase
        .from("property_availability")
        .select("date, is_available, nightly_price")
        .eq("property_id", targetDbId);

      if (availabilityRows && availabilityRows.length > 0) {
        for (const row of availabilityRows) {
          if (row.is_available === false) {
            rawBlockedDates.push(row.date);
          }
          if (typeof row.nightly_price === "number" && row.nightly_price > 0) {
            priceOverrides[row.date] = Number(row.nightly_price);
          }
        }
      }
    }

    const manualBlockedDates = deriveHostManualBlockedDates(rawBlockedDates, timeSlotBookings, slotConfig);
    const riyadhNow = getRiyadhNowInfo();
    const todaySummary = getCalendarDaySlotSummary({
      dateIso: riyadhNow.dateIso,
      existingBookings: timeSlotBookings,
      slotConfig,
      hostBlockedDates: manualBlockedDates,
      riyadhNow,
      effectiveStandardPrice: Number(effectiveProp.base_price) || 0,
    });

    return NextResponse.json({
      success: true,
      propertyId: effectiveProp.id,
      slug: effectiveProp.slug || null,
      basePrice: Number(effectiveProp.base_price) || 0,
      weekdayPrice: Number(effectiveProp.weekday_price || effectiveProp.base_price) || 0,
      weekendPrice: Number(effectiveProp.weekend_price || effectiveProp.base_price) || 0,
      customDayPricing,
      bookedDates,
      checkoutDates,
      timeSlotBookings,
      blockedDates: manualBlockedDates,
      priceOverrides,
      slotConfig,
      todaySummary,
    });
  } catch (err: unknown) {
    console.error("Host availability query exception:", err);
    return NextResponse.json(
      { code: "internal_error", message: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const propertyId = params.id;
  if (!propertyId) {
    return NextResponse.json({ code: "missing_property_id" }, { status: 400 });
  }

  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ code: "database_not_configured" }, { status: 503 });
  }

  try {
    // 1. Verify property ownership (schema-safe columns only)
    let propQuery = supabase
      .from("properties")
      .select("id, slug, host_id, base_price");

    if (isUuid(propertyId)) {
      propQuery = propQuery.or(`id.eq.${propertyId},slug.eq.${propertyId}`);
    } else {
      propQuery = propQuery.eq("slug", propertyId);
    }

    const { data: prop } = await propQuery.maybeSingle();

    if (prop && prop.host_id && prop.host_id !== authUser.id) {
      return NextResponse.json(
        { code: "forbidden", message: "You are not authorized to manage this property." },
        { status: 403 }
      );
    }

    const effectiveProp = prop || {
      id: propertyId,
      slug: propertyId,
      host_id: authUser.id,
      base_price: 0,
    };

    const payload = await request.json();
    const {
      blockedDates,
      basePrice,
      weekdayPrice,
      weekendPrice,
      customDayPricing,
      priceOverrides,
      slotConfigUpdates,
    } = payload || {};

    return await acquirePropertyBookingLock([effectiveProp.id, effectiveProp.slug], async () => {
      // Load active bookings to prevent accidental overwrite or blocking already-booked slots
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const targetDbId = prop && isUuid(prop.id) ? prop.id : (isUuid(propertyId) ? propertyId : null);
      let activeBookingRows: unknown[] = [];
      if (targetDbId) {
        const { data: bRows } = await supabase
          .from("bookings")
          .select("id, booking_reference, check_in, check_out, status, created_at")
          .eq("property_id", targetDbId)
          .or(`status.in.(confirmed,completed),and(status.eq.pending,created_at.gt.${fifteenMinutesAgo})`);
        activeBookingRows = bRows || [];
      }

      const { timeSlotBookings } = normalizeBookings(
        (activeBookingRows || []) as Array<Record<string, unknown>>
      );

      // Overwrite check: refuse closing a full day or disabling a half-slot that already has an active booking
      if (Array.isArray(blockedDates)) {
        for (const dateStr of blockedDates) {
          if (typeof dateStr !== "string") continue;
          const nextDateStr = addDaysToIsoDate(dateStr, 1);
          const hasMorningBooking = timeSlotBookings.some((b) =>
            doTimeSlotsOverlap(
              { checkIn: dateStr, checkOut: dateStr, checkinTime: TWELVE_HOUR_CHECKIN_TIME, checkoutTime: DEFAULT_CHECKOUT_TIME },
              b
            )
          );
          const hasEveningBooking = timeSlotBookings.some((b) =>
            doTimeSlotsOverlap(
              { checkIn: dateStr, checkOut: nextDateStr, checkinTime: DEFAULT_CHECKIN_TIME, checkoutTime: DEFAULT_CHECKOUT_TIME },
              b
            )
          );
          if (hasMorningBooking && hasEveningBooking) {
            return NextResponse.json(
              {
                code: "slot_has_active_booking",
                message: `Cannot block ${dateStr} because guests hold confirmed bookings across that date.`,
                messageAr: `لا يمكن إغلاق ${dateStr} لوجود حجوزات مؤكدة تشغل الفترات الزمنية لهذا اليوم.`,
              },
              { status: 409 }
            );
          }
        }
      }

      if (slotConfigUpdates?.dateSlotOverrides && typeof slotConfigUpdates.dateSlotOverrides === "object") {
        for (const [dateStr, ov] of Object.entries(
          slotConfigUpdates.dateSlotOverrides as Record<string, { standardEnabled?: boolean; twelveHourEnabled?: boolean; fullDayClosed?: boolean } | null>
        )) {
          if (!ov) continue;
          const nextDateStr = addDaysToIsoDate(dateStr, 1);
          if (ov.twelveHourEnabled === false || ov.fullDayClosed === true) {
            const morningConflict = timeSlotBookings.find((b) =>
              doTimeSlotsOverlap(
                { checkIn: dateStr, checkOut: dateStr, checkinTime: TWELVE_HOUR_CHECKIN_TIME, checkoutTime: DEFAULT_CHECKOUT_TIME },
                b
              )
            );
            if (morningConflict && ov.fullDayClosed === true) {
              return NextResponse.json(
                {
                  code: "slot_has_active_booking",
                  message: `Cannot close ${dateStr}: active guest booking ${morningConflict.bookingRef || ""} occupies morning hours until 12:00 PM.`,
                  messageAr: `لا يمكن إغلاق ${dateStr}: الحجز ${morningConflict.bookingRef || ""} يشغل الفترة الصباحية حتى 12:00 م.`,
                },
                { status: 409 }
              );
            }
          }
          if (ov.standardEnabled === false || ov.fullDayClosed === true) {
            const eveningConflict = timeSlotBookings.find((b) =>
              doTimeSlotsOverlap(
                { checkIn: dateStr, checkOut: nextDateStr, checkinTime: DEFAULT_CHECKIN_TIME, checkoutTime: DEFAULT_CHECKOUT_TIME },
                b
              )
            );
            if (eveningConflict) {
              return NextResponse.json(
                {
                  code: "slot_has_active_booking",
                  message: `Cannot disable 4:00 PM slot on ${dateStr}: active booking ${eveningConflict.bookingRef || ""} occupies that night.`,
                  messageAr: `لا يمكن إيقاف فترة 4:00 م في ${dateStr}: يوجد حجز مؤكد ${eveningConflict.bookingRef || ""}.`,
                },
                { status: 409 }
              );
            }
          }
        }
      }

      // 2. Persist slot configuration in shared store (booking-slot-configs.json)
      let nextSlotConfig = getServerPropertySlotConfig({
        propertyId: effectiveProp.id,
        slug: effectiveProp.slug,
      });

      if (slotConfigUpdates || Array.isArray(blockedDates)) {
        nextSlotConfig = updateServerPropertySlotConfig({
          propertyId: effectiveProp.id,
          slug: effectiveProp.slug,
          updates: {
            ...(slotConfigUpdates || {}),
            ...(Array.isArray(blockedDates)
              ? {
                  hostBlockedDates: blockedDates.filter(
                    (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
                  ),
                }
              : {}),
            updatedBy: "host",
          },
        });
      }

      // 3. Update valid DB pricing columns on properties (base_price, weekday_price, weekend_price)
      const propertyUpdates: Record<string, unknown> = {};
      if (typeof basePrice === "number" && basePrice > 0) {
        propertyUpdates.base_price = basePrice;
      }
      if (typeof weekdayPrice === "number" && weekdayPrice > 0) {
        propertyUpdates.weekday_price = weekdayPrice;
        if (!propertyUpdates.base_price) {
          propertyUpdates.base_price = weekdayPrice;
        }
      }
      if (typeof weekendPrice === "number" && weekendPrice > 0) {
        propertyUpdates.weekend_price = weekendPrice;
      }

      if (prop) {
        propertyUpdates.updated_at = new Date().toISOString();
        if (isUuid(prop.id)) {
          await supabase.from("properties").update(propertyUpdates).eq("id", prop.id);
        } else {
          await supabase.from("properties").update(propertyUpdates).eq("slug", prop.slug || propertyId);
        }
      }

      // 4. Update manual blocked dates in property_availability WITHOUT unblocking confirmed booking nights
      if (targetDbId && Array.isArray(blockedDates)) {
        const { data: currentAvailability } = await supabase
          .from("property_availability")
          .select("date, is_available")
          .eq("property_id", targetDbId);

        const rawCurrentlyBlocked = (currentAvailability || [])
          .filter((r) => r.is_available === false)
          .map((r) => r.date);

        const prevManualBlocked = new Set(
          deriveHostManualBlockedDates(rawCurrentlyBlocked, timeSlotBookings, nextSlotConfig)
        );
        const desiredManualBlocked = new Set(
          blockedDates.filter((d): d is string => typeof d === "string")
        );

        const toBlock = Array.from(desiredManualBlocked).filter((d) => !prevManualBlocked.has(d));
        const toUnblock = Array.from(prevManualBlocked).filter((d) => !desiredManualBlocked.has(d));

        // Guard: never unblock a date that has an overnight booking starting or continuing through its evening
        const safeToUnblock = toUnblock.filter((dateStr) => {
          const nextDateStr = addDaysToIsoDate(dateStr, 1);
          return !timeSlotBookings.some((b) =>
            doTimeSlotsOverlap(
              { checkIn: dateStr, checkOut: nextDateStr, checkinTime: DEFAULT_CHECKIN_TIME, checkoutTime: DEFAULT_CHECKOUT_TIME },
              b
            )
          );
        });

        if (toBlock.length > 0) {
          const rowsToUpsert = toBlock.map((dateStr) => ({
            property_id: targetDbId,
            date: dateStr,
            is_available: false,
            updated_at: new Date().toISOString(),
          }));
          await supabase.from("property_availability").upsert(rowsToUpsert, {
            onConflict: "property_id,date",
          });
        }

        if (safeToUnblock.length > 0) {
          await supabase
            .from("property_availability")
            .update({ is_available: true, updated_at: new Date().toISOString() })
            .eq("property_id", targetDbId)
            .in("date", safeToUnblock);
        }
      }

      // 5. Update date-specific price overrides without overwriting blocked flag
      if (targetDbId && priceOverrides && typeof priceOverrides === "object") {
        const dates = Object.keys(priceOverrides);
        if (dates.length > 0) {
          const { data: existingRows } = await supabase
            .from("property_availability")
            .select("date, is_available")
            .eq("property_id", targetDbId)
            .in("date", dates);
          const availByDate = new Map((existingRows || []).map((r) => [r.date, r.is_available]));

          const overrideRows = Object.entries(priceOverrides).map(([dateStr, price]) => ({
            property_id: targetDbId,
            date: dateStr,
            nightly_price: price != null && Number(price) > 0 ? Number(price) : null,
            is_available: availByDate.has(dateStr) ? Boolean(availByDate.get(dateStr)) : true,
            updated_at: new Date().toISOString(),
          }));

          await supabase.from("property_availability").upsert(overrideRows, {
            onConflict: "property_id,date",
          });
        }
      }

      return NextResponse.json({
        success: true,
        propertyId: effectiveProp.id,
        slug: effectiveProp.slug || null,
        slotConfig: nextSlotConfig,
        message: "Availability, time-slot controls, and pricing updated successfully.",
      });
    });
  } catch (err: unknown) {
    console.error("Host availability update exception:", err);
    return NextResponse.json(
      { code: "internal_error", message: err instanceof Error ? err.message : "Failed to update availability" },
      { status: 500 }
    );
  }
}
