import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import {
  calculateCancellationRefundQuote,
  createBookingRefundRecord,
  getBookingRefundRecord,
} from "@qafnest/shared/bookingRefundStore";
import { voidCancelledBookingPayout } from "@qafnest/shared/hostPayoutStore";
import { recordUserActivity } from "@qafnest/shared/userActivityStore";
import { QAFNEST_SUPPORT_CONTACT } from "@qafnest/shared";

export const dynamic = "force-dynamic";

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
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, booking_reference, total_price, status, payment_status, check_in, check_out, guest_id, auth_subject, created_at")
    .eq("booking_reference", ref)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Authorize: user must own the booking or match auth_subject
  const userMatches =
    booking.guest_id === authUser.id ||
    String(booking.auth_subject || "").includes(authUser.id) ||
    (authUser.phone && String(booking.auth_subject || "").includes(authUser.phone.slice(-8)));

  if (!userMatches && authUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Not your booking" }, { status: 403 });
  }

  const quote = calculateCancellationRefundQuote({
    createdAt: booking.created_at,
    checkIn: booking.check_in,
    totalPrice: Number(booking.total_price || 0),
  });

  const existingRefund = getBookingRefundRecord(ref);

  return NextResponse.json({
    success: true,
    bookingRef: ref,
    status: booking.status,
    paymentStatus: booking.payment_status,
    totalPrice: Number(booking.total_price || 0),
    quote,
    existingRefund,
  });
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

  if (authUser.role !== "admin") {
    return NextResponse.json(
      {
        code: "customer_support_required",
        error: `Self-service cancellation is disabled. Please contact QafNest Customer Support at ${QAFNEST_SUPPORT_CONTACT.displayPhone} (${QAFNEST_SUPPORT_CONTACT.supportEmail}) to cancel reservation #${ref}.`,
        errorAr: `الإلغاء الذاتي من بوابة الضيف غير متاح. يرجى التحدث مع خدمة عملاء قاف نست على الرقم ${QAFNEST_SUPPORT_CONTACT.displayPhone} لإلغاء الحجز رقم #${ref}.`,
        supportContact: QAFNEST_SUPPORT_CONTACT,
      },
      { status: 403 }
    );
  }

  const supabase = await getAdminOrServerClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, booking_reference, total_price, status, payment_status, check_in, check_out, guest_id, auth_subject, created_at, properties(id, title)")
    .eq("booking_reference", ref)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const userMatches =
    booking.guest_id === authUser.id ||
    String(booking.auth_subject || "").includes(authUser.id) ||
    (authUser.phone && String(booking.auth_subject || "").includes(authUser.phone.slice(-8)));

  if (!userMatches && authUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Not your booking" }, { status: 403 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Booking is already cancelled." }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {}

  const reason = String(body.reason || "Guest requested self-service cancellation via portal");
  const wasPaid = booking.payment_status === "success" || booking.payment_status === "paid";

  const quote = calculateCancellationRefundQuote({
    createdAt: booking.created_at,
    checkIn: booking.check_in,
    totalPrice: Number(booking.total_price || 0),
  });

  const nextPaymentStatus =
    booking.payment_status === "initiated"
      ? "failed"
      : booking.payment_status;

  // 1. Update Supabase (guests can cancel bookings, but paid bookings carry zero refund)
  const { data: updated, error: updErr } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: nextPaymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id)
    .select("id, booking_reference, status, payment_status")
    .maybeSingle();

  if (updErr || !updated) {
    return NextResponse.json({ error: updErr?.message || "Failed to cancel booking" }, { status: 500 });
  }

  // 2. Host payout adjustment & refund record only apply if a non-zero refund was approved
  if (quote.refundPercentage > 0) {
    voidCancelledBookingPayout(ref, quote.refundPercentage);
  }

  let refundRecord = null;
  if (wasPaid && quote.refundAmount > 0) {
    refundRecord = createBookingRefundRecord({
      bookingRef: ref,
      guestId: authUser.id,
      guestEmail: authUser.email || undefined,
      guestPhone: authUser.phone || undefined,
      totalBookingPrice: Number(booking.total_price || 0),
      refundAmount: quote.refundAmount,
      refundPercentage: quote.refundPercentage,
      penaltyAmount: quote.penaltyAmount,
      cancellationReason: reason,
      actor: "guest",
      policyTier: quote.policyTier,
    });
  }

  // 3. Log User Activity
  try {
    const propTitle = Array.isArray(booking.properties)
      ? booking.properties[0]?.title
      : (booking.properties as { title?: string } | null)?.title;

    recordUserActivity({
      userId: authUser.id,
      userName: authUser.email?.split("@")[0] || "Guest",
      role: "guest",
      category: "booking",
      action: "guest_cancelled_booking",
      title: `Guest cancelled booking #${ref}`,
      details: `${propTitle || "Property"} · Non-refundable (0 SAR refunded)`,
      targetId: booking.id,
      targetLabel: ref,
      actor: authUser.email || "Guest Self-Service",
    });
  } catch {}

  return NextResponse.json({
    success: true,
    message: `Booking #${ref} has been cancelled successfully.`,
    booking: updated,
    refund: refundRecord,
    quote,
  });
}
