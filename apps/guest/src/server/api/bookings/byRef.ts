import { NextRequest, NextResponse } from "next/server";
import {
  isMissingBilingualColumnError,
  stripBilingualFromSelect,
} from "@qafnest/shared";
import {
  BOOKING_PROPERTY_SELECT_FIELDS,
  formatBookingPropertyPayload,
} from "@/lib/bookings/bookingProperty";
import { createClient } from "@/lib/supabase/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { verifyBookingSlipToken } from "@qafnest/shared/portalSessionEdge";

export async function GET(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  const bookingRef = params.ref?.trim();
  if (!bookingRef) {
    return NextResponse.json({ code: "missing_reference" }, { status: 400 });
  }

  // 1. Authenticate user cryptographically (Supabase session or Firebase ID token)
  const authUser = await verifyGuestSession(request);

  // 2. Fetch booking using admin or server client
  const dbClient = await getAdminOrServerClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingRef);

  const query = dbClient.from("bookings").select("*");
  const { data: bookings, error } = await (isUuid
    ? query.eq("id", bookingRef).limit(1)
    : query.eq("booking_reference", bookingRef).limit(1));

  if (error || !bookings || bookings.length === 0) {
    return NextResponse.json({ code: "booking_not_found" }, { status: 404 });
  }

  const booking = bookings[0];

  // Auto-expire initiated session if older than 15 minutes (exclude helpline SADAD holds)
  if (
    booking.status === "pending" &&
    booking.payment_status === "initiated" &&
    !String(booking.auth_subject || "").includes("SADAD_HOLD") &&
    booking.created_at &&
    Date.now() - new Date(booking.created_at).getTime() > 15 * 60 * 1000
  ) {
    booking.status = "cancelled";
    booking.payment_status = "failed";
    try {
      await dbClient
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);
    } catch {}
  }

  // 3. Security & Access Control:
  // Strictly enforce authorization:
  // - Caller is the verified owner of the booking (matching UID or verified phone number)
  // - OR caller presents a valid HMAC-signed short-lived confirmation slip token
  const isOwner = Boolean(
    authUser && (
      booking.guest_id === authUser.id ||
      booking.auth_subject === authUser.id ||
      (authUser.isPhoneVerified && authUser.phone && booking.auth_subject === authUser.phone)
    )
  );

  const slipToken =
    request.headers.get("x-booking-slip")?.trim() ||
    request.nextUrl.searchParams.get("slip")?.trim() ||
    null;
  const bookingKey = String(booking.booking_reference || booking.id);
  const hasSignedSlip = Boolean(
    slipToken && (await verifyBookingSlipToken(slipToken, bookingKey, booking.payment_id))
  );

  if (!isOwner && !hasSignedSlip) {
    return NextResponse.json(
      { code: "unauthorized", message: "You are not authorized to view this booking." },
      { status: 403 }
    );
  }

  // Only expose physical smart lock PIN and exact location when payment has succeeded and booking is confirmed
  const canAccessPin =
    (booking.status === "confirmed" || booking.status === "completed") &&
    booking.payment_status === "success";

  // 4. Attach Property details
  const supabase = await createClient();
  let propertyDetails = null;
  if (booking.property_id) {
    try {
      const initialProp = await supabase
        .from("properties")
        .select(BOOKING_PROPERTY_SELECT_FIELDS)
        .eq("id", booking.property_id)
        .maybeSingle();

      let dbProp = initialProp.data as Record<string, unknown> | null;
      if (initialProp.error && isMissingBilingualColumnError(initialProp.error)) {
        const retryProp = await supabase
          .from("properties")
          .select(stripBilingualFromSelect(BOOKING_PROPERTY_SELECT_FIELDS))
          .eq("id", booking.property_id)
          .maybeSingle();
        dbProp = retryProp.data as Record<string, unknown> | null;
      }

      if (dbProp) {
        propertyDetails = formatBookingPropertyPayload(dbProp, canAccessPin);
      }
    } catch {}
  }

  return NextResponse.json({
    success: true,
    booking: {
      id: booking.id,
      bookingRef: booking.booking_reference || booking.id,
      status: booking.status,
      paymentStatus: booking.payment_status,
      paymentMethod: booking.payment_method || "Card",
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      totalNights: booking.total_nights,
      guestsCount: booking.guests_count,
      totalPrice: Number(booking.total_price),
      smartLockPin: canAccessPin ? (booking.smart_lock_pin || null) : null,
      property: propertyDetails,
      createdAt: booking.created_at,
    },
  });
}
