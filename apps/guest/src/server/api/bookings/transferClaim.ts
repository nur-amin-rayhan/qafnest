import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import {
  recordTransferClaim,
  getTransferClaim,
} from "@qafnest/shared/helplineVerificationStore";
import { recordUserActivity } from "@qafnest/shared/userActivityStore";
import { hydrateSharedJsonFile } from "@qafnest/shared/serverJsonStore";

function userOwnsBooking(
  authUser: { id: string; phone?: string | null; isPhoneVerified?: boolean },
  booking: { guest_id?: string | null; auth_subject?: string | null }
): boolean {
  if (booking.guest_id === authUser.id || booking.auth_subject === authUser.id) return true;
  if (authUser.isPhoneVerified && authUser.phone && booking.auth_subject === authUser.phone) return true;
  return false;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ref: string }> }
) {
  const { ref } = await context.params;
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getAdminOrServerClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
  const query = supabase
    .from("bookings")
    .select("id, booking_reference, guest_id, auth_subject")
    .limit(1);
  const { data: booking } = await (isUuid ? query.eq("id", ref) : query.eq("booking_reference", ref)).maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (!userOwnsBooking(authUser, booking) && authUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await hydrateSharedJsonFile("helpline-transfer-claims.json", () => ({}));
  const claim = getTransferClaim(booking.booking_reference || ref);
  return NextResponse.json({ success: true, claim });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ ref: string }> }
) {
  const { ref } = await context.params;
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getAdminOrServerClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
  const query = supabase
    .from("bookings")
    .select("id, booking_reference, total_price, status, payment_status, guest_id, auth_subject")
    .limit(1);
  const { data: booking, error } = await (isUuid ? query.eq("id", ref) : query.eq("booking_reference", ref)).maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!userOwnsBooking(authUser, booking) && authUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Not your booking" }, { status: 403 });
  }

  const resolvedRef = booking.booking_reference || ref;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const transferReference = String(body.transferReference || "").trim();
    if (!transferReference) {
      return NextResponse.json({ error: "Transfer reference number is required." }, { status: 400 });
    }

    await hydrateSharedJsonFile("helpline-transfer-claims.json", () => ({}));
    const claim = recordTransferClaim({
      bookingRef: resolvedRef,
      guestId: authUser.id,
      transferReference,
      bankName: String(body.bankName || "Saudi National Bank (SNB)"),
      senderName: String(body.senderName || authUser.email?.split("@")[0] || "Guest"),
      amount: Number(booking.total_price) || Number(body.amount) || 0,
    });

    try {
      recordUserActivity({
        userId: authUser.id,
        userName: authUser.email?.split("@")[0] || "Guest",
        role: "guest",
        category: "payment",
        action: "transfer_claim_submitted",
        title: `Transfer claim submitted for #${resolvedRef}`,
        details: `Ref #${transferReference} · SAR ${claim.amount} · Bank: ${claim.bankName}`,
        targetId: booking.id,
        targetLabel: resolvedRef,
        actor: authUser.email || "Guest",
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Transfer claim submitted! Support will verify payment shortly.",
      claim,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error recording claim" },
      { status: 500 }
    );
  }
}
