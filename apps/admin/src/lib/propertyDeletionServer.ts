import type { SupabaseClient } from "@supabase/supabase-js";
import { getRiyadhNowInfo } from "@qafnest/shared";
import { getAllStoredPayouts } from "@qafnest/shared/hostPayoutStore";
import {
  evaluatePropertyDeletionEligibility,
  type BlockingReservationSummary,
  type DeletionBookingCandidate,
  type PropertyDeletionEligibility,
  type PropertyDeletionRequest,
} from "@qafnest/shared/propertyDeletionStore";

export interface AdminEnrichedDeletionRequest extends PropertyDeletionRequest {
  activeBookingsCount: number;
  blockingBookings: BlockingReservationSummary[];
  eligibleToDelete: boolean;
}

/**
 * Re-evaluates a single property's live booking and escrow state right before Admin auto-delete.
 */
export async function verifySinglePropertyDeletionEligibility(
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

/**
 * Attaches live reservation blocking diagnostics to all pending property deletion requests.
 */
export async function enrichDeletionRequestsWithLiveBookings(
  supabase: SupabaseClient,
  requests: PropertyDeletionRequest[]
): Promise<AdminEnrichedDeletionRequest[]> {
  if (requests.length === 0) return [];

  const pendingPropertyIds = Array.from(
    new Set(
      requests
        .filter((r) => r.status === "pending" && r.propertyId)
        .map((r) => r.propertyId)
    )
  );

  const bookingsByProperty = new Map<string, DeletionBookingCandidate[]>();
  if (pendingPropertyIds.length > 0) {
    const { data: bookingRows } = await supabase
      .from("bookings")
      .select(
        "id, booking_reference, property_id, status, payment_status, auth_subject, check_in, check_out"
      )
      .in("property_id", pendingPropertyIds)
      .limit(1000);

    for (const row of (bookingRows || []) as DeletionBookingCandidate[]) {
      const pid = String(row.property_id || "");
      if (!pid) continue;
      const list = bookingsByProperty.get(pid) || [];
      list.push(row);
      bookingsByProperty.set(pid, list);
    }
  }

  const todayIso = getRiyadhNowInfo().dateIso;
  const payouts = getAllStoredPayouts();

  return requests.map((req) => {
    if (req.status !== "pending") {
      return {
        ...req,
        activeBookingsCount: 0,
        blockingBookings: [],
        eligibleToDelete: false,
      };
    }

    const candidates = bookingsByProperty.get(req.propertyId) || [];
    const eligibility = evaluatePropertyDeletionEligibility({
      propertyId: req.propertyId,
      bookings: candidates,
      payouts,
      todayIso,
    });

    return {
      ...req,
      activeBookingsCount: eligibility.blockingBookings.length,
      blockingBookings: eligibility.blockingBookings,
      eligibleToDelete: eligibility.eligible,
    };
  });
}
