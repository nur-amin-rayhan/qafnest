import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { voidCancelledBookingPayout, hydrateHostPayoutStore } from "@qafnest/shared/hostPayoutStore";
import { addDaysToIsoDate } from "@qafnest/shared";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { verifyHostSession } from "@/lib/auth/serverAuth";

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const { url } = getSupabaseConfig();
  if (!serviceKey || !url) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const bookingId = resolvedParams?.id;
  if (!bookingId) {
    return NextResponse.json({ code: "invalid_id" }, { status: 400 });
  }

  let body: {
    status?: "confirmed" | "cancelled" | "pending" | "checked_in" | "completed";
    pin?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_body" }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ code: "database_not_configured" }, { status: 503 });
  }

  try {
    // 1. Fetch booking and check property ownership
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("id, booking_reference, property_id, check_in, check_out, status, payment_status, smart_lock_pin")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ code: "not_found", message: "Booking not found." }, { status: 404 });
    }

    const { data: property, error: pErr } = await supabase
      .from("properties")
      .select("id, host_id, title")
      .eq("id", booking.property_id)
      .single();

    if (pErr || !property || !property.host_id || property.host_id !== authUser.id) {
      return NextResponse.json(
        { code: "forbidden", message: "You are not authorized to modify this booking." },
        { status: 403 }
      );
    }

    // 2. Prepare update payload
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    let hasMutation = false;
    const isPaymentSettled =
      booking.payment_status === "success" || booking.payment_status === "paid";
    const allowedStatuses = ["confirmed", "cancelled", "pending", "checked_in", "completed"] as const;

    if (body.status !== undefined) {
      if (!(allowedStatuses as readonly string[]).includes(body.status)) {
        return NextResponse.json(
          { code: "invalid_status", message: "Unsupported booking status transition." },
          { status: 400 }
        );
      }
      if (
        (body.status === "confirmed" ||
          body.status === "checked_in" ||
          body.status === "completed") &&
        !isPaymentSettled
      ) {
        return NextResponse.json(
          {
            code: "payment_not_verified",
            message: "Cannot advance reservation without verified payment confirmation from gateway.",
          },
          { status: 400 }
        );
      }
      updatePayload.status = body.status;
      hasMutation = true;
    }

    const effectiveNextStatus = String(updatePayload.status || booking.status || "");
    if (body.pin !== undefined) {
      if (!/^\d{4,12}$/.test(String(body.pin))) {
        return NextResponse.json(
          { code: "invalid_pin", message: "Smart Lock PIN must be 4 to 12 digits." },
          { status: 400 }
        );
      }
      if (effectiveNextStatus === "cancelled") {
        return NextResponse.json(
          {
            code: "pin_disabled_for_cancelled",
            message: "Smart Lock PIN is strictly disabled for cancelled reservations.",
          },
          { status: 400 }
        );
      }
      updatePayload.smart_lock_pin = String(body.pin);
      hasMutation = true;
    }

    if (!hasMutation) {
      return NextResponse.json(
        { code: "empty_update", message: "Provide a valid status or Smart Lock PIN update." },
        { status: 400 }
      );
    }

    // 3. Perform update
    const { data: updated, error: uErr } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", bookingId)
      .select()
      .single();

    if (uErr) {
      return NextResponse.json({ code: "update_failed", message: uErr.message }, { status: 500 });
    }

    // 3b. When a booking is cancelled by Host, release booked night slots & void pending payout
    if (updatePayload.status === "cancelled" && booking.status !== "cancelled") {
      try {
        if (booking.check_in && booking.check_out && booking.check_out > booking.check_in) {
          const releaseDates: string[] = [];
          let cursor = String(booking.check_in).slice(0, 10);
          const endDate = String(booking.check_out).slice(0, 10);
          let guard = 0;
          while (cursor < endDate && guard < 180) {
            releaseDates.push(cursor);
            cursor = addDaysToIsoDate(cursor, 1);
            guard++;
          }
          if (releaseDates.length > 0) {
            await supabase
              .from("property_availability")
              .update({ is_available: true, updated_at: new Date().toISOString() })
              .eq("property_id", booking.property_id)
              .in("date", releaseDates);
          }
        }
        if (booking.booking_reference) {
          await hydrateHostPayoutStore();
          voidCancelledBookingPayout(String(booking.booking_reference), 0);
        }
      } catch (cleanupErr) {
        console.warn("Notice: booking cancellation cleanup warning:", cleanupErr);
      }
    }

    // 4. Create host notification record if PIN or status changed
    try {
      await supabase.from("host_notifications").insert({
        host_id: authUser.id,
        property_id: booking.property_id,
        booking_id: booking.id,
        event_type: body.pin ? "pin_manually_set" : "status_updated",
        title: body.pin ? "Smart Lock PIN Manually Set" : "Booking Status Updated",
        body: body.pin
          ? `Lock PIN ${updatePayload.smart_lock_pin} assigned to booking ${booking.booking_reference}.`
          : `Booking ${booking.booking_reference} status updated to ${updatePayload.status}.`,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      booking: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
