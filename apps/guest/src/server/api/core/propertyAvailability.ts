import { NextResponse } from "next/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { resolvePropertyIdentifier } from "@/lib/services/propertyIdentifiers";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_CUTOFF,
  DEFAULT_CHECKOUT_TIME,
  TimeSlotBooking,
  deriveHostManualBlockedDates,
  getAvailableCheckinSlots,
  getPropertyLiveDailyStatus,
  getRiyadhNowInfo,
} from "@qafnest/shared";
import { getServerPropertySlotConfig } from "@qafnest/shared/bookingSlotStore";


export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const rawPropertyId = params.id;
  if (!rawPropertyId) {
    return NextResponse.json({ code: "missing_property_id" }, { status: 400 });
  }

  const { uuid: propertyUuid, slug: propertySlug } = resolvePropertyIdentifier(rawPropertyId);

  try {
    const supabase = await getAdminOrServerClient();

    // Resolve property UUID and checkout time
    let resolvedId = propertyUuid;
    let resolvedSlug = propertySlug;
    let definedCheckoutTime = DEFAULT_CHECKOUT_CUTOFF;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawPropertyId);
    const propQuery = supabase
      .from("properties")
      .select("id, slug, checkout_time");
    const { data: propData } = await (isUuid
      ? propQuery.eq("id", propertyUuid)
      : propQuery.eq("slug", propertySlug)
    ).maybeSingle();

    if (propData?.id) {
      resolvedId = propData.id;
      if (propData.slug) resolvedSlug = propData.slug;
      if (propData.checkout_time) {
        definedCheckoutTime = String(propData.checkout_time).slice(0, 5);
      }
    }

    const slotConfig = getServerPropertySlotConfig({
      propertyId: resolvedId,
      slug: resolvedSlug || rawPropertyId,
    });

    // 1. Fetch verified confirmed/completed bookings + helpline SADAD holds (never block calendars for abandoned online checkouts)
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, check_in, check_out, checkin_time, checkout_time, status, payment_status, auth_subject, booking_reference, created_at")
      .eq("property_id", resolvedId)
      .in("status", ["confirmed", "completed", "pending"]);

    const bookedDates = new Set<string>();
    const checkoutDates = new Set<string>();
    const timeSlotBookings: TimeSlotBooking[] = [];

    const verifiedBookings = (bookings || []).filter(
      (b) =>
        (b.status === "pending" && String((b as any).auth_subject || "").includes("SADAD_HOLD")) ||
        ((b.status === "confirmed" || b.status === "completed") &&
          (!b.payment_status || b.payment_status === "success" || b.payment_status === "paid"))
    );

    if (verifiedBookings.length > 0) {
      for (const b of verifiedBookings) {
        if (!b.check_in || !b.check_out) continue;
        const bMeta = b as Record<string, unknown>;
        const checkinTime = bMeta.checkin_time ? String(bMeta.checkin_time).slice(0, 5) : DEFAULT_CHECKIN_TIME;
        const checkoutTime = bMeta.checkout_time ? String(bMeta.checkout_time).slice(0, 5) : (definedCheckoutTime || DEFAULT_CHECKOUT_TIME);

        checkoutDates.add(b.check_out);
        timeSlotBookings.push({
          id: b.id,
          checkIn: b.check_in,
          checkOut: b.check_out,
          checkinTime,
          checkoutTime,
          status: b.status,
        });

        if (b.check_out > b.check_in) {
          const start = Date.parse(`${b.check_in}T00:00:00.000Z`);
          const end = Date.parse(`${b.check_out}T00:00:00.000Z`);
          const nights = Math.max(1, Math.round((end - start) / 86_400_000));
          for (let i = 0; i < nights; i++) {
            const dStr = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
            bookedDates.add(dStr);
          }
        }
      }
    }

    // 2. Fetch property_availability blocked dates and custom pricing
    const { data: availabilityRows } = await supabase
      .from("property_availability")
      .select("date, is_available, nightly_price")
      .eq("property_id", resolvedId);

    const rawBlockedDates: string[] = [];
    const priceOverrides: Record<string, number> = {};

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

    const manualBlockedDates = deriveHostManualBlockedDates(
      rawBlockedDates,
      timeSlotBookings,
      slotConfig
    );

    const combined = new Set<string>();
    bookedDates.forEach((d) => combined.add(d));
    manualBlockedDates.forEach((d) => combined.add(d));
    const unavailableDates = Array.from(combined).sort();

    // 3. Calculate live status for today in Asia/Riyadh timezone accurately
    const { dateIso: todayRiyadh, minutesNow: nowMinutesRiyadh } = getRiyadhNowInfo();

    const todayStatus = getPropertyLiveDailyStatus(
      todayRiyadh,
      timeSlotBookings,
      nowMinutesRiyadh,
      definedCheckoutTime
    );

    const availableCheckinSlots = getAvailableCheckinSlots(todayRiyadh, timeSlotBookings);

    return NextResponse.json({
      success: true,
      propertyId: resolvedId,
      unavailableDates,
      bookedDates: Array.from(bookedDates),
      blockedDates: manualBlockedDates,
      checkoutDates: Array.from(checkoutDates),
      checkoutCutoff: definedCheckoutTime,
      priceOverrides,
      timeSlotBookings,
      todayStatus,
      availableCheckinSlots,
      slotConfig,
    });
  } catch (err: unknown) {
    console.error("Property availability query exception:", err);
    return NextResponse.json(
      { code: "internal_error", message: "Failed to load availability" },
      { status: 500 }
    );
  }
}
