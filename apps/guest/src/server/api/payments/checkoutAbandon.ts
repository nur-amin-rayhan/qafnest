import { NextRequest, NextResponse } from "next/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { cancelInitiatedBooking } from "@/lib/services/bookingReconciliation";
import { clearPendingWalletSplit } from "@/lib/services/walletService";
import { verifyGuestSession } from "@/lib/auth/serverAuth";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    }
    body = payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const bookingRef = typeof body.bookingRef === "string" ? body.bookingRef.trim() : "";
  if (!bookingRef) {
    return NextResponse.json({ code: "missing_reference" }, { status: 400 });
  }

  // Optional authentication check: caller can be authenticated or session owner
  const authUser = await verifyGuestSession(request);

  try {
    const dbClient = await getAdminOrServerClient();

    // Check booking existence and prevent cancelling paid reservations
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingRef);
    const query = dbClient.from("bookings").select("guest_id, auth_subject, status, payment_status");
    const { data: rows } = await (isUuid ? query.eq("id", bookingRef) : query.eq("booking_reference", bookingRef));

    if (rows && rows.length > 0) {
      const b = rows[0];
      if (b.status === "confirmed" || b.payment_status === "success") {
        return NextResponse.json(
          { code: "booking_already_paid", message: "Cannot abandon a confirmed and paid reservation." },
          { status: 400 }
        );
      }

      if (authUser) {
        const isOwner =
          b.guest_id === authUser.id ||
          b.auth_subject === authUser.id ||
          (authUser.phone && b.auth_subject === authUser.phone);

        if (!isOwner) {
          return NextResponse.json({ code: "unauthorized" }, { status: 403 });
        }
      }
    }

    clearPendingWalletSplit(bookingRef);
    const result = await cancelInitiatedBooking(dbClient, bookingRef);
    if (!result.success) {
      return NextResponse.json(
        {
          code: result.error || "cancel_failed",
          message: "Unable to cancel booking reservation session.",
        },
        { status: result.error === "booking_not_found" ? 404 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      cancelled: true,
      message: "Reservation checkout session cancelled and availability reverted.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

