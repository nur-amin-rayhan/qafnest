import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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
  let authUser = await verifyHostSession(request);
  if (!authUser && process.env.NODE_ENV !== "production") {
    authUser = {
      id: process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002",
      phone: process.env.NEXT_PUBLIC_DEV_HOST_PHONE || "",
      isPhoneVerified: true,
      email: process.env.NEXT_PUBLIC_DEV_HOST_EMAIL || "",
      name: process.env.NEXT_PUBLIC_DEV_HOST_NAME || "",
      role: "host",
      provider: "supabase",
    };
  }

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
    status?: "confirmed" | "cancelled" | "pending";
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
      .select("id, booking_reference, property_id, status, payment_status, smart_lock_pin")
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

    if (pErr || !property || property.host_id !== authUser.id) {
      return NextResponse.json(
        { code: "forbidden", message: "You are not authorized to modify this booking." },
        { status: 403 }
      );
    }

    // 2. Prepare update payload
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status && ["confirmed", "cancelled", "pending"].includes(body.status)) {
      if (body.status === "confirmed" && booking.payment_status !== "success") {
        return NextResponse.json(
          {
            code: "payment_not_verified",
            message: "Cannot confirm reservation without verified payment confirmation from gateway.",
          },
          { status: 400 }
        );
      }
      updatePayload.status = body.status;
    }

    if (body.pin && /^\d{4,12}$/.test(body.pin)) {
      if (booking.status === "cancelled") {
        return NextResponse.json(
          {
            code: "pin_disabled_for_cancelled",
            message: "Smart Lock PIN is strictly disabled for cancelled reservations.",
          },
          { status: 400 }
        );
      }

      updatePayload.smart_lock_pin = body.pin;
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
