import { NextRequest, NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import {
  recordTransferClaim,
  getTransferClaim,
} from "@qafnest/shared/helplineVerificationStore";
import { recordUserActivity } from "@qafnest/shared/userActivityStore";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ref: string }> }
) {
  const { ref } = await context.params;
  const claim = getTransferClaim(ref);
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
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, booking_reference, total_price, status, payment_status, guest_id, auth_subject")
    .eq("booking_reference", ref)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const transferReference = String(body.transferReference || "").trim();
    if (!transferReference) {
      return NextResponse.json({ error: "Transfer reference number is required." }, { status: 400 });
    }

    const claim = recordTransferClaim({
      bookingRef: ref,
      guestId: authUser.id,
      transferReference,
      bankName: String(body.bankName || "Saudi National Bank (SNB)"),
      senderName: String(body.senderName || authUser.email?.split("@")[0] || "Guest"),
      amount: Number(body.amount) || Number(booking.total_price) || 0,
    });

    try {
      recordUserActivity({
        userId: authUser.id,
        userName: authUser.email?.split("@")[0] || "Guest",
        role: "guest",
        category: "payment",
        action: "transfer_claim_submitted",
        title: `Transfer claim submitted for #${ref}`,
        details: `Ref #${transferReference} · SAR ${claim.amount} · Bank: ${claim.bankName}`,
        targetId: booking.id,
        targetLabel: ref,
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
