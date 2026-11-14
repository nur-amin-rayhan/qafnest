import type { SupabaseClient } from "@supabase/supabase-js";

/** Default timeout after which an unpaid initiated checkout session expires (in minutes).
 * SEC-06: Set to 30 minutes to accommodate 3D-Secure SMS delays and BNPL (Tamara/Tabby) verification.
 */
export const CHECKOUT_EXPIRY_MINUTES = 30;

/**
 * Reconciles and auto-cancels abandoned bookings where payment was initiated
 * but never completed within the allowable checkout expiry window.
 */
export async function reconcileStaleBookings(
  dbClient: SupabaseClient,
  options?: { propertyIds?: string[]; guestId?: string; authSubject?: string }
): Promise<number> {
  try {
    const cutoffTime = new Date(Date.now() - CHECKOUT_EXPIRY_MINUTES * 60 * 1000).toISOString();
    let query = dbClient
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "pending")
      .eq("payment_status", "initiated")
      .neq("status", "confirmed")
      .neq("payment_status", "success")
      .not("auth_subject", "ilike", "%SADAD_HOLD%")
      .lt("created_at", cutoffTime);

    if (options?.propertyIds && options.propertyIds.length > 0) {
      query = query.in("property_id", options.propertyIds);
    }
    if (options?.guestId) {
      query = query.eq("guest_id", options.guestId);
    }
    if (options?.authSubject) {
      query = query.eq("auth_subject", options.authSubject);
    }

    const { data, error } = await query.select("id, property_id, check_in, check_out");
    if (!error && data && data.length > 0) {
      return data.length;
    }
    return 0;
  } catch (err) {
    console.warn("Notice: Stale booking reconciliation exception:", err);
    return 0;
  }
}

/**
 * Immediately cancels an initiated booking (e.g. user abandoned checkout or closed gateway).
 * Ensures that confirmed/paid bookings are never cancelled via this path.
 */
export async function cancelInitiatedBooking(
  dbClient: SupabaseClient,
  bookingRefOrId: string
): Promise<{ success: boolean; cancelled: boolean; error?: string }> {
  try {
    const cleanRef = bookingRefOrId.trim();
    if (!cleanRef) {
      return { success: false, cancelled: false, error: "missing_reference" };
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanRef);
    let selectQuery = dbClient
      .from("bookings")
      .select("id, status, payment_status, booking_reference")
      .limit(1);

    selectQuery = isUuid
      ? selectQuery.eq("id", cleanRef)
      : selectQuery.eq("booking_reference", cleanRef);

    const { data: rows, error: fetchErr } = await selectQuery;
    if (fetchErr || !rows || rows.length === 0) {
      return { success: false, cancelled: false, error: "booking_not_found" };
    }

    const booking = rows[0];
    if (booking.status === "confirmed" || booking.payment_status === "success") {
      return { success: false, cancelled: false, error: "booking_already_paid" };
    }

    const { error: updateErr } = await dbClient
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .neq("status", "confirmed")
      .neq("payment_status", "success");

    if (updateErr) {
      return { success: false, cancelled: false, error: updateErr.message };
    }

    return { success: true, cancelled: true };
  } catch (err) {
    return {
      success: false,
      cancelled: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Cancels any prior pending/initiated bookings for a guest before starting a new checkout.
 * Prevents multiple conflicting pending sessions from lingering in the database.
 */
export async function cancelPreviousInitiatedGuestBookings(
  dbClient: SupabaseClient,
  guestId: string | null,
  guestSubject: string
): Promise<void> {
  try {
    let query = dbClient
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "pending")
      .eq("payment_status", "initiated")
      .neq("status", "confirmed")
      .neq("payment_status", "success");

    if (guestId) {
      query = query.or(`guest_id.eq.${guestId},auth_subject.eq.${guestSubject}`);
    } else {
      query = query.eq("auth_subject", guestSubject);
    }

    await query;
  } catch (err) {
    console.warn("Notice: Failed to cancel previous initiated guest bookings:", err);
  }
}

