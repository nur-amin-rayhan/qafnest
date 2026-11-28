import { isUuid } from "@/lib/services/propertyIdentifiers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CHECKIN_TIME, DEFAULT_CHECKOUT_TIME } from "@qafnest/shared";

export interface PersistBookingParams {
  dbClient: SupabaseClient;
  resolvedDbPropertyId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  pricing: { couponCode?: string | null; couponDiscount?: number };
  guestId: string | null;
  bookingRef: string;
  guestSubject: string;
  checkinTime?: string | null;
  checkoutTime?: string | null;
  initialStatus?: string;
  initialPaymentStatus?: string;
  paymentMethod?: string;
  smartLockPin?: string | null;
}

export async function persistBookingToDatabase({
  dbClient,
  resolvedDbPropertyId,
  checkIn,
  checkOut,
  nights,
  guests,
  totalPrice,
  pricing,
  guestId,
  bookingRef,
  guestSubject,
  checkinTime,
  checkoutTime,
  initialStatus,
  initialPaymentStatus,
  paymentMethod,
  smartLockPin,
}: PersistBookingParams): Promise<{ bookingId: string; bookingPersisted: boolean; overlapConflict?: boolean }> {
  let bookingId = `book-${Math.random().toString(36).slice(2, 10)}`;
  let bookingPersisted = false;
  let overlapConflict = false;

  const bookingPayload: Record<string, unknown> = {
    property_id: resolvedDbPropertyId,
    check_in: checkIn,
    check_out: checkOut,
    checkin_time: checkinTime || DEFAULT_CHECKIN_TIME,
    checkout_time: checkoutTime || DEFAULT_CHECKOUT_TIME,
    total_nights: nights,
    guests_count: Number(guests),
    total_price: totalPrice,
    status: initialStatus || "pending",
    payment_status: initialPaymentStatus || "initiated",
    smart_lock_pin: smartLockPin !== undefined ? smartLockPin : null,
  };

  if (paymentMethod) {
    bookingPayload.payment_method = paymentMethod;
  }

  if (pricing.couponCode) {
    bookingPayload.coupon_code = pricing.couponCode;
    bookingPayload.coupon_discount = pricing.couponDiscount;
  }

  const effectiveGuestId =
    guestId && isUuid(guestId)
      ? guestId
      : guestSubject && isUuid(guestSubject)
      ? guestSubject
      : null;
  if (effectiveGuestId) {
    bookingPayload.guest_id = effectiveGuestId;
  }

  try {
    const { data: insertedBooking, error: insertError } = await dbClient
      .from("bookings")
      .insert({
        ...bookingPayload,
        booking_reference: bookingRef,
        auth_subject: guestSubject,
      })
      .select("id")
      .maybeSingle();

    if (!insertError && insertedBooking?.id) {
      bookingId = String(insertedBooking.id);
      bookingPersisted = true;
    } else if (insertError) {
      const errMsg = String(insertError.message || "");
      if (errMsg.includes("booking_slot_overlap") || insertError.code === "23P01") {
        overlapConflict = true;
      } else {
        const safePayload = { ...bookingPayload };
        delete safePayload.coupon_code;
        delete safePayload.coupon_discount;
        // Strip optional time columns only when missing in legacy schemas
        if (errMsg.includes("column")) {
          delete safePayload.checkin_time;
          delete safePayload.checkout_time;
        }
        if (
          errMsg.includes("uuid") ||
          errMsg.includes("22P02") ||
          !isUuid(String(safePayload.guest_id || ""))
        ) {
          delete safePayload.guest_id;
        }

        const { data: fallbackBooking, error: fallbackError } = await dbClient
          .from("bookings")
          .insert({
            ...safePayload,
            booking_reference: bookingRef,
            auth_subject: guestSubject,
          })
          .select("id")
          .maybeSingle();

        if (!fallbackError && fallbackBooking?.id) {
          bookingId = String(fallbackBooking.id);
          bookingPersisted = true;
        } else {
          const fbMsg = String(fallbackError?.message || "");
          if (fbMsg.includes("booking_slot_overlap") || fallbackError?.code === "23P01") {
            overlapConflict = true;
          }
          console.error("Booking persistence failed:", insertError, fallbackError);
        }
      }
    }
  } catch (dbErr) {
    console.error("Booking insert exception:", dbErr);
  }

  return { bookingId, bookingPersisted, overlapConflict };
}

