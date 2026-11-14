import { NextRequest, NextResponse } from "next/server";
import {
  isMissingBilingualColumnError,
  stripBilingualFromSelect,
} from "@qafnest/shared";
import {
  BOOKING_PROPERTY_SELECT_FIELDS,
  formatBookingPropertyPayload,
} from "@/lib/bookings/bookingProperty";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { reconcileStaleBookings } from "@/lib/services/bookingReconciliation";
import { getBookingRefundRecord } from "@qafnest/shared/bookingRefundStore";
import { getTransferClaim } from "@qafnest/shared/helplineVerificationStore";

export async function GET(request: NextRequest) {
  // 1. Authenticate caller (Supabase session, Firebase ID token, or verified phone)
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Sign in required to view bookings." },
      { status: 401 }
    );
  }

  try {
    const dbClient = await getAdminOrServerClient();

    // 2. Query bookings matching the authenticated guest by UID, auth_subject, or verified phone
    let query = dbClient
      .from("bookings")
      .select(
        "id, booking_reference, check_in, check_out, total_nights, guests_count, total_price, status, payment_status, smart_lock_pin, property_id, guest_id, auth_subject, created_at, payment_method"
      )
      .order("created_at", { ascending: false });

    // Multi-tenant matcher: guest_id = authUser.id OR auth_subject = authUser.id
    if (authUser.phone) {
      query = query.or(
        `guest_id.eq.${authUser.id},auth_subject.eq.${authUser.id},auth_subject.eq.${authUser.phone}`
      );
    } else {
      query = query.or(`guest_id.eq.${authUser.id},auth_subject.eq.${authUser.id}`);
    }

    // Run reconciliation in parallel with the read query to avoid blocking latency
    const [, { data: rawBookings, error: bookingsError }] = await Promise.all([
      reconcileStaleBookings(dbClient, {
        guestId: authUser.id,
        authSubject: authUser.id,
      }),
      query,
    ]);
    if (bookingsError) {
      return NextResponse.json(
        { code: "bookings_query_failed", message: bookingsError.message },
        { status: 500 }
      );
    }

    // Hide uncompleted gateway sessions so unpaid/abandoned checkouts never appear as active bookings (preserve Helpline SADAD holds)
    const bookingsList = (rawBookings || []).filter(
      (b) =>
        !(
          b.status === "pending" &&
          b.payment_status === "initiated" &&
          !String(b.auth_subject || "").includes("SADAD_HOLD")
        )
    );

    // 3. Batch resolve property metadata
    const propertyIds = Array.from(
      new Set(bookingsList.map((b) => b.property_id).filter(Boolean))
    );

    const propertyMap = new Map<string, Record<string, unknown>>();

    if (propertyIds.length > 0) {
      try {
        const initialProps = await dbClient
          .from("properties")
          .select(BOOKING_PROPERTY_SELECT_FIELDS)
          .in("id", propertyIds);

        let propsData = initialProps.data as Array<Record<string, unknown>> | null;
        if (initialProps.error && isMissingBilingualColumnError(initialProps.error)) {
          const retryProps = await dbClient
            .from("properties")
            .select(stripBilingualFromSelect(BOOKING_PROPERTY_SELECT_FIELDS))
            .in("id", propertyIds);
          propsData = retryProps.data as Array<Record<string, unknown>> | null;
        }

        if (propsData) {
          for (const rawProp of propsData) {
            propertyMap.set(String(rawProp.id), rawProp);
          }
        }
      } catch (propErr) {
        console.warn("Notice: Failed to fetch batch properties for bookings:", propErr);
      }
    }

    // 4. Enrich and format response
    const enrichedBookings = bookingsList.map((b) => {
      const rawPropInfo = b.property_id ? propertyMap.get(b.property_id) : null;
      const canAccessPin =
        (b.status === "confirmed" || b.status === "completed") &&
        b.payment_status === "success";
      const propInfo = rawPropInfo
        ? formatBookingPropertyPayload(rawPropInfo, canAccessPin)
        : null;
      const isSadadHold = String(b.auth_subject || "").includes("SADAD_HOLD");
      const bookingRef = b.booking_reference || b.id;

      return {
        id: b.id,
        booking_reference: bookingRef,
        check_in: b.check_in,
        check_out: b.check_out,
        total_nights: b.total_nights,
        guests_count: b.guests_count,
        total_price: Number(b.total_price),
        status: b.status,
        payment_status: b.payment_status,
        payment_method: b.payment_method || (isSadadHold ? "SADAD / Bank Transfer" : "Card"),
        smart_lock_pin: canAccessPin ? (b.smart_lock_pin || null) : null,
        property_id: b.property_id,
        property: propInfo || {
          id: b.property_id || "",
          title: "",
          city_name: "",
          images: [],
        },
        created_at: b.created_at,
        coupon_code: ((b as Record<string, unknown>).coupon_code as string | null) || null,
        coupon_discount: (b as Record<string, unknown>).coupon_discount
          ? Number((b as Record<string, unknown>).coupon_discount)
          : null,
        isSadadHold,
        sadadInfo: isSadadHold
          ? {
              billerCode: "042",
              billerName: "QafNest Real Estate Platform (Helpline Reserve)",
              billNumber: bookingRef.replace(/[^0-9]/g, "").padStart(10, "108"),
              iban: "SA4410000001234567890123",
              bankName: "Saudi National Bank (SNB)",
              accountName: "QafNest Hospitality Escrow",
            }
          : null,
        refund: getBookingRefundRecord(bookingRef),
        transferClaim: getTransferClaim(bookingRef),
      };
    });

    return NextResponse.json({
      success: true,
      bookings: enrichedBookings,
      count: enrichedBookings.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

