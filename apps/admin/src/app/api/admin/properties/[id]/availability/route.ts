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

function cleanWeekdayPricing(raw: unknown) {
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const toNum = (v: unknown) => (v != null && Number(v) > 0 ? Number(v) : null);
  return {
    sunday: toNum(rec.sunday),
    monday: toNum(rec.monday),
    tuesday: toNum(rec.tuesday),
    wednesday: toNum(rec.wednesday),
    thursday: toNum(rec.thursday),
    friday: toNum(rec.friday),
    saturday: toNum(rec.saturday),
  };
}

async function resolveAdminProperty(
  supabase: ReturnType<typeof createAdminDataClient>,
  idOrSlug: string
) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("properties")
    .select("id, slug, title, base_price, weekday_price, weekend_price")
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .maybeSingle();
  return data;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

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
    const slotConfig = getServerPropertySlotConfig({
      propertyId: resolvedId,
      slug: prop.slug,
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
      slug: prop.slug || null,
      title: prop.title || "",
      basePrice: Number(prop.base_price) || 0,
      weekdayPrice: Number(prop.weekday_price || prop.base_price) || 0,
      weekendPrice: Number(prop.weekend_price || prop.base_price) || 0,
      customDayPricing: cleanWeekdayPricing({}),
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
      { code: "internal_error", message: err instanceof Error ? err.message : "Failed to load availability" },
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

  const rawId = decodeURIComponent(params.id || "");
  if (!rawId) {
    return NextResponse.json({ code: "missing_property_id" }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const { blockedDates, priceOverrides, slotConfigUpdates } = payload || {};

  const supabase = createAdminDataClient();
  const prop = await resolveAdminProperty(supabase, rawId);
  const resolvedId = prop ? String(prop.id) : rawId;
  const resolvedSlug = prop?.slug ? String(prop.slug) : rawId;

  try {
    return await acquirePropertyBookingLock([resolvedId, resolvedSlug], async () => {
      let timeSlotBookings: TimeSlotBooking[] = [];

      if (supabase && prop) {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data: activeRows } = await supabase
          .from("bookings")
          .select("id, booking_reference, check_in, check_out, status, created_at")
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
        await supabase
          .from("properties")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", resolvedId);

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
      { code: "internal_error", message: err instanceof Error ? err.message : "Failed to save" },
      { status: 500 }
    );
  }
}
