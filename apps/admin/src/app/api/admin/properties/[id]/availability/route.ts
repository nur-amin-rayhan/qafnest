import { NextRequest, NextResponse } from "next/server";
import { createAdminDataClient, isAdminRequest } from "@/lib/adminApi";
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
  hydrateBookingSlotStore,
  mergeSlotConfigIntoCustomDayPricing,
  updateServerPropertySlotConfig,
} from "@qafnest/shared/bookingSlotStore";

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

function cleanWeekdayPricing(raw: unknown, prop?: Record<string, unknown>) {
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const toNum = (v: unknown) => (v != null && Number(v) > 0 ? Number(v) : null);
  return {
    sunday: toNum(rec.sunday ?? prop?.sunday_price),
    monday: toNum(rec.monday ?? prop?.monday_price),
    tuesday: toNum(rec.tuesday ?? prop?.tuesday_price),
    wednesday: toNum(rec.wednesday ?? prop?.wednesday_price),
    thursday: toNum(rec.thursday ?? prop?.thursday_price),
    friday: toNum(rec.friday ?? prop?.friday_price),
    saturday: toNum(rec.saturday ?? prop?.saturday_price),
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveAdminProperty(
  supabase: ReturnType<typeof createAdminDataClient>,
  idOrSlug: string
) {
  if (!supabase) return null;
  const col = UUID_REGEX.test(idOrSlug) ? "id" : "slug";
  const primary = await supabase
    .from("properties")
    .select(
      "id, slug, title, base_price, weekday_price, weekend_price, custom_day_pricing, sunday_price, monday_price, tuesday_price, wednesday_price, thursday_price, friday_price, saturday_price"
    )
    .eq(col, idOrSlug)
    .maybeSingle();
  if (primary.error && /custom_day_pricing|sunday_price|column .* does not exist/i.test(primary.error.message || "")) {
    const legacy = await supabase
      .from("properties")
      .select("id, slug, title, base_price, weekday_price, weekend_price")
      .eq(col, idOrSlug)
      .maybeSingle();
    return legacy.data as Record<string, unknown> | null;
  }
  return primary.data as Record<string, unknown> | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  await hydrateBookingSlotStore();

  const rawId = decodeURIComponent(params.id || "");
  if (!rawId) {
    return NextResponse.json({ code: "missing_property_id" }, { status: 400 });
  }

  const supabase = createAdminDataClient();
  const prop = await resolveAdminProperty(supabase, rawId);

  if (!supabase || !prop) {
    const slotConfig = getServerPropertySlotConfig({ propertyId: rawId, slug: rawId });
    const riyadhNow = getRiyadhNowInfo();
    return NextResponse.json({
      success: true,
      propertyId: rawId,
      slug: rawId,
      basePrice: 0,
      customDayPricing: {},
      bookedDates: [],
      checkoutDates: [],
      timeSlotBookings: [],
      blockedDates: slotConfig.hostBlockedDates || [],
      priceOverrides: {},
      slotConfig,
      todaySummary: getCalendarDaySlotSummary({
        dateIso: riyadhNow.dateIso,
        existingBookings: [],
        slotConfig,
        hostBlockedDates: slotConfig.hostBlockedDates || [],
        riyadhNow,
      }),
    });
  }

  try {
    const resolvedId = String(prop.id);
    const resolvedSlug = typeof prop.slug === "string" ? prop.slug : undefined;
    const slotConfig = getServerPropertySlotConfig({
      propertyId: resolvedId,
      slug: resolvedSlug,
      dbCustomDayPricing: prop.custom_day_pricing,
    });

    // Fetch verified confirmed/completed bookings AND active Helpline SADAD holds so calendar locks match Guest portal
    let bookingRows: Array<Record<string, unknown>> = [];
    const primaryBookingsRes = await supabase
      .from("bookings")
      .select("id, booking_reference, auth_subject, check_in, check_out, checkin_time, checkout_time, status, payment_status, created_at")
      .eq("property_id", resolvedId)
      .neq("status", "cancelled");

    if (primaryBookingsRes.error) {
      const fallbackBookingsRes = await supabase
        .from("bookings")
        .select("id, booking_reference, auth_subject, check_in, check_out, status, payment_status, created_at")
        .eq("property_id", resolvedId)
        .neq("status", "cancelled");
      bookingRows = (fallbackBookingsRes.data || []) as Array<Record<string, unknown>>;
    } else {
      bookingRows = (primaryBookingsRes.data || []) as Array<Record<string, unknown>>;
    }

    const verifiedBookingRows = bookingRows.filter((b) => {
      if (b.status === "confirmed" || b.status === "completed") {
        return !b.payment_status || b.payment_status === "success" || b.payment_status === "paid";
      }
      return (
        b.status === "pending" &&
        (String(b.auth_subject || "").includes("SADAD_HOLD") || String(b.auth_subject || "").includes("|"))
      );
    });

    const { bookedDates, checkoutDates, timeSlotBookings } = normalizeBookings(
      verifiedBookingRows as Array<Record<string, unknown>>
    );

    const { data: availRows } = await supabase
      .from("property_availability")
      .select("date, is_available, nightly_price")
      .eq("property_id", resolvedId);

    const rawBlockedDates: string[] = [];
    const priceOverrides: Record<string, number> = {};
    for (const row of availRows || []) {
      if (row.is_available === false) rawBlockedDates.push(row.date);
      if (typeof row.nightly_price === "number" && row.nightly_price > 0) {
        priceOverrides[row.date] = Number(row.nightly_price);
      }
    }

    const manualBlockedDates = deriveHostManualBlockedDates(rawBlockedDates, timeSlotBookings, slotConfig);
    const riyadhNow = getRiyadhNowInfo();

    return NextResponse.json({
      success: true,
      propertyId: resolvedId,
      slug: resolvedSlug || null,
      title: String(prop.title || ""),
      basePrice: Number(prop.base_price) || 0,
      weekdayPrice: Number(prop.weekday_price || prop.base_price) || 0,
      weekendPrice: Number(prop.weekend_price || prop.base_price) || 0,
      customDayPricing: cleanWeekdayPricing(prop.custom_day_pricing, prop),
      bookedDates,
      checkoutDates,
      timeSlotBookings,
      blockedDates: manualBlockedDates,
      priceOverrides,
      slotConfig,
      todaySummary: getCalendarDaySlotSummary({
        dateIso: riyadhNow.dateIso,
        existingBookings: timeSlotBookings,
        slotConfig,
        hostBlockedDates: manualBlockedDates,
        riyadhNow,
        effectiveStandardPrice: Number(prop.base_price) || 0,
      }),
    });
  } catch (err: unknown) {
    console.error("Admin availability GET error:", err);
    return NextResponse.json(
      { code: "internal_error", message: "Failed to load availability." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  await hydrateBookingSlotStore();

  const rawId = decodeURIComponent(params.id || "");
  if (!rawId) {
    return NextResponse.json({ code: "missing_property_id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const {
    blockedDates,
    priceOverrides,
    slotConfigUpdates,
    basePrice,
    weekdayPrice,
    weekendPrice,
    customDayPricing,
  } = payload || {};

  const supabase = createAdminDataClient();
  const prop = await resolveAdminProperty(supabase, rawId);
  const resolvedId = prop ? String(prop.id) : rawId;
  const resolvedSlug = typeof prop?.slug === "string" ? prop.slug : rawId;

  try {
    return await acquirePropertyBookingLock([resolvedId, resolvedSlug], async () => {
      let timeSlotBookings: TimeSlotBooking[] = [];

      if (supabase && prop) {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data: activeRows } = await supabase
          .from("bookings")
          .select("id, booking_reference, check_in, check_out, checkin_time, checkout_time, status, created_at")
          .eq("property_id", resolvedId)
          .or(`status.in.(confirmed,completed),and(status.eq.pending,created_at.gt.${fifteenMinutesAgo})`);
        timeSlotBookings = normalizeBookings((activeRows || []) as Array<Record<string, unknown>>).timeSlotBookings;
      }

      if (slotConfigUpdates?.dateSlotOverrides && typeof slotConfigUpdates.dateSlotOverrides === "object") {
        for (const [dateStr, ov] of Object.entries(
          slotConfigUpdates.dateSlotOverrides as Record<string, { standardEnabled?: boolean; twelveHourEnabled?: boolean; fullDayClosed?: boolean } | null>
        )) {
          if (!ov) continue;
          const nextDateStr = addDaysToIsoDate(dateStr, 1);
          if (ov.fullDayClosed === true || ov.twelveHourEnabled === false) {
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
                  message: `Cannot close 4:00 PM slot on ${dateStr}: active booking ${eveningConflict.bookingRef || ""} occupies this night.`,
                  messageAr: `لا يمكن إيقاف فترة 4:00 م في ${dateStr}: يوجد حجز مؤكد ${eveningConflict.bookingRef || ""}.`,
                },
                { status: 409 }
              );
            }
          }
        }
      }

      const nextSlotConfig = updateServerPropertySlotConfig({
        propertyId: resolvedId,
        slug: resolvedSlug,
        dbCustomDayPricing: prop?.custom_day_pricing,
        updates: {
          ...(slotConfigUpdates || {}),
          ...(Array.isArray(blockedDates)
            ? {
                hostBlockedDates: blockedDates.filter(
                  (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
                ),
              }
            : {}),
          updatedBy: "admin",
        },
      });

      if (supabase && prop) {
        const propUpdates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (typeof basePrice === "number" && basePrice > 0) propUpdates.base_price = basePrice;
        if (typeof weekdayPrice === "number" && weekdayPrice > 0) {
          propUpdates.weekday_price = weekdayPrice;
          if (!propUpdates.base_price) propUpdates.base_price = weekdayPrice;
        }
        if (typeof weekendPrice === "number" && weekendPrice > 0) propUpdates.weekend_price = weekendPrice;

        const existingCustomObj =
          prop.custom_day_pricing && typeof prop.custom_day_pricing === "object"
            ? { ...(prop.custom_day_pricing as Record<string, unknown>) }
            : {};
        if (customDayPricing && typeof customDayPricing === "object") {
          for (const [dayKey, col] of [
            ["sunday", "sunday_price"],
            ["monday", "monday_price"],
            ["tuesday", "tuesday_price"],
            ["wednesday", "wednesday_price"],
            ["thursday", "thursday_price"],
            ["friday", "friday_price"],
            ["saturday", "saturday_price"],
          ] as const) {
            const val = (customDayPricing as Record<string, unknown>)[dayKey];
            if (val === null || val === "") {
              delete existingCustomObj[dayKey];
              propUpdates[col] = null;
            } else if (val !== undefined && Number.isFinite(Number(val)) && Number(val) > 0) {
              const num = Math.round(Number(val) * 100) / 100;
              existingCustomObj[dayKey] = num;
              propUpdates[col] = num;
            }
          }
        }
        propUpdates.custom_day_pricing = mergeSlotConfigIntoCustomDayPricing(
          existingCustomObj,
          nextSlotConfig
        );

        const { error: propUpdErr } = await supabase
          .from("properties")
          .update(propUpdates)
          .eq("id", resolvedId);
        if (
          propUpdErr &&
          /custom_day_pricing|sunday_price|column .* does not exist/i.test(propUpdErr.message || "")
        ) {
          await supabase
            .from("properties")
            .update({ updated_at: propUpdates.updated_at })
            .eq("id", resolvedId);
        }

        if (Array.isArray(blockedDates)) {
          const { data: curAvail } = await supabase
            .from("property_availability")
            .select("date, is_available")
            .eq("property_id", resolvedId);

          const rawBlocked = (curAvail || []).filter((r) => r.is_available === false).map((r) => r.date);
          const prevManual = new Set(deriveHostManualBlockedDates(rawBlocked, timeSlotBookings, nextSlotConfig));
          const desiredManual = new Set(blockedDates.filter((d): d is string => typeof d === "string"));

          const toBlock = Array.from(desiredManual).filter((d) => !prevManual.has(d));
          const toUnblock = Array.from(prevManual)
            .filter((d) => !desiredManual.has(d))
            .filter((dateStr) => {
              const nextDateStr = addDaysToIsoDate(dateStr, 1);
              return !timeSlotBookings.some((b) =>
                doTimeSlotsOverlap(
                  { checkIn: dateStr, checkOut: nextDateStr, checkinTime: DEFAULT_CHECKIN_TIME, checkoutTime: DEFAULT_CHECKOUT_TIME },
                  b
                )
              );
            });

          if (toBlock.length > 0) {
            await supabase.from("property_availability").upsert(
              toBlock.map((dateStr) => ({
                property_id: resolvedId,
                date: dateStr,
                is_available: false,
                updated_at: new Date().toISOString(),
              })),
              { onConflict: "property_id,date" }
            );
          }
          if (toUnblock.length > 0) {
            await supabase
              .from("property_availability")
              .update({ is_available: true, updated_at: new Date().toISOString() })
              .eq("property_id", resolvedId)
              .in("date", toUnblock);
          }
        }

        if (priceOverrides && typeof priceOverrides === "object") {
          const dates = Object.keys(priceOverrides);
          if (dates.length > 0) {
            const { data: existingRows } = await supabase
              .from("property_availability")
              .select("date, is_available")
              .eq("property_id", resolvedId)
              .in("date", dates);
            const availByDate = new Map((existingRows || []).map((r) => [r.date, r.is_available]));
            await supabase.from("property_availability").upsert(
              Object.entries(priceOverrides).map(([dateStr, price]) => ({
                property_id: resolvedId,
                date: dateStr,
                nightly_price: price != null && Number(price) > 0 ? Number(price) : null,
                is_available: availByDate.has(dateStr) ? Boolean(availByDate.get(dateStr)) : true,
                updated_at: new Date().toISOString(),
              })),
              { onConflict: "property_id,date" }
            );
          }
        }
      }

      return NextResponse.json({
        success: true,
        slotConfig: nextSlotConfig,
        message: "Admin calendar & time-slot configuration saved.",
      });
    });
  } catch (err: unknown) {
    console.error("Admin availability POST error:", err);
    return NextResponse.json(
      { code: "internal_error", message: "Failed to save availability configuration." },
      { status: 500 }
    );
  }
}
