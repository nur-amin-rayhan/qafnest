import type { SupabaseClient } from "@supabase/supabase-js";
import { getRiyadhNowInfo } from "@qafnest/shared";
import { getAllStoredPayouts } from "@qafnest/shared/hostPayoutStore";
import {
  evaluatePropertyDeletionEligibility,
  type DeletionBookingCandidate,
  type PropertyDeletionEligibility,
} from "@qafnest/shared/propertyDeletionConfig";

/**
 * Checks live Supabase bookings and escrow payouts for a property to verify
 * whether it has any upcoming, active, unchecked-out, or unsettled reservations.
 */
export async function checkHostPropertyDeletionEligibility(
  supabase: SupabaseClient,
  propertyId: string
): Promise<{ eligibility: PropertyDeletionEligibility; error?: string }> {
  const { data: bookingRows, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_reference, property_id, status, payment_status, auth_subject, check_in, check_out"
    )
    .eq("property_id", propertyId)
    .limit(500);

  if (error) {
    return {
      eligibility: {
        eligible: false,
        reasonEn: error.message,
        reasonAr: error.message,
        blockingBookings: [],
      },
      error: error.message,
    };
  }

  const todayIso = getRiyadhNowInfo().dateIso;
  const payouts = getAllStoredPayouts();
  const eligibility = evaluatePropertyDeletionEligibility({
    propertyId,
    bookings: (bookingRows || []) as DeletionBookingCandidate[],
    payouts,
    todayIso,
  });

  return { eligibility };
}
