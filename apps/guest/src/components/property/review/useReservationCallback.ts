"use client";

import { useEffect } from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { recordBookedRange, removeBookedRange } from "@/lib/services/availability";
import type { Property } from "@/data/properties";
import type { ConfirmedBooking } from "./types";

interface UseReservationCallbackOptions {
  searchParamString: string;
  property: Property;
  title: string;
  images: string[];
  bookingCheckinDate: string;
  bookingCheckoutDate: string;
  bookingGuestsCount: number;
  nights: number;
  total: number;
  language: string;
  setConfirmedBooking: (booking: ConfirmedBooking | null) => void;
  setPaymentMessage: (msg: string | null) => void;
}

function formatGatewayError(rawError: string | null, language: string): string | null {
  if (!rawError) return null;
  const lower = rawError.toLowerCase();
  if (lower.includes("invalid card number")) {
    return language === "ar"
      ? "تم رفض العملية: رقم البطاقة غير صالح أو غير معتمد في بيئة الاختبار (إذا كنت في وضع التجربة، يرجى استخدام بطاقات اختبار ماي فاتورة المعتمدة)."
      : "Transaction declined: Invalid card number. (If testing in Sandbox mode, please use official MyFatoorah test cards).";
  }
  if (lower.includes("restricted card")) {
    return language === "ar"
      ? "تم رفض العملية: البطاقة مقيدة أو غير مفعلة لعمليات الشراء عبر الإنترنت."
      : "Transaction declined: Restricted card. Please ensure online e-commerce transactions are enabled on your card.";
  }
  if (lower.includes("insufficient funds")) {
    return language === "ar"
      ? "تم رفض العملية: الرصيد غير كافٍ لإتمام المعاملة."
      : "Transaction declined: Insufficient funds.";
  }
  return rawError;
}

function buildConfirmedProperty(
  apiProp: Record<string, unknown> | null | undefined,
  property: Property,
  title: string,
  images: string[]
): ConfirmedBooking["property"] {
  const str = (key: string): string | null => {
    const val = apiProp?.[key];
    return typeof val === "string" && val.trim() ? val.trim() : null;
  };
  const num = (key: string): number | null => {
    const val = apiProp?.[key];
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val.trim() && Number.isFinite(Number(val))) return Number(val);
    return null;
  };
  return {
    id: property.id,
    title: str("title") || title,
    titleAr: str("titleAr") ?? str("title_ar") ?? property.titleAr ?? null,
    title_ar: str("title_ar") ?? str("titleAr") ?? property.titleAr ?? null,
    city: str("city") || property.cityName,
    city_name: str("city_name") || str("city") || property.cityName,
    state: str("state") ?? property.state ?? null,
    stateAr: str("stateAr") ?? str("state_ar") ?? property.stateAr ?? null,
    state_ar: str("state_ar") ?? str("stateAr") ?? property.stateAr ?? null,
    district: str("district") ?? property.district ?? null,
    districtAr: str("districtAr") ?? str("district_ar") ?? property.districtAr ?? null,
    district_ar: str("district_ar") ?? str("districtAr") ?? property.districtAr ?? null,
    street: str("street") ?? property.street ?? null,
    streetAr: str("streetAr") ?? str("street_ar") ?? property.streetAr ?? null,
    street_ar: str("street_ar") ?? str("streetAr") ?? property.streetAr ?? null,
    address: str("address") ?? property.address ?? null,
    addressAr: str("addressAr") ?? str("address_ar") ?? property.addressAr ?? null,
    address_ar: str("address_ar") ?? str("addressAr") ?? property.addressAr ?? null,
    postalCode: str("postalCode") ?? str("postal_code") ?? property.postalCode ?? null,
    postal_code: str("postal_code") ?? str("postalCode") ?? property.postalCode ?? null,
    lat: num("lat") ?? property.lat ?? null,
    lng: num("lng") ?? property.lng ?? null,
    googleMapsUrl: str("googleMapsUrl") ?? str("google_maps_url") ?? property.googleMapsUrl ?? null,
    google_maps_url: str("google_maps_url") ?? str("googleMapsUrl") ?? property.googleMapsUrl ?? null,
    images,
  };
}

export function useReservationCallback({
  searchParamString,
  property,
  title,
  images,
  bookingCheckinDate,
  bookingCheckoutDate,
  bookingGuestsCount,
  nights,
  total,
  language,
  setConfirmedBooking,
  setPaymentMessage,
}: UseReservationCallbackOptions) {
  useEffect(() => {
    const params = new URLSearchParams(searchParamString);
    const isConfirmed =
      params.get("confirmed") === "true" || params.get("status") === "success";
    const bookingRef = params.get("bookingRef");
    const pin = params.get("pin");
    const amount = Number(params.get("amount"));
    const paymentError = params.get("payment_error");
    const errorMsg = params.get("message") || params.get("reason");

    if (isConfirmed && bookingRef) {
      const fetchBookingData = async () => {
        let authToken: string | undefined;
        try {
          if (isFirebaseConfigured()) {
            const fbAuth = getFirebaseAuth();
            await fbAuth.authStateReady();
            const fbUser = fbAuth.currentUser;
            if (fbUser) authToken = await fbUser.getIdToken();
          }
        } catch {}

        const paymentId = params.get("paymentId");
        const url = paymentId
          ? `/api/bookings/${encodeURIComponent(bookingRef)}?paymentId=${encodeURIComponent(
              paymentId
            )}`
          : `/api/bookings/${encodeURIComponent(bookingRef)}`;

        const res = await fetch(url, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });
        return res.json();
      };

      fetchBookingData()
        .then((data) => {
          const b = data?.booking;
          const confirmed: ConfirmedBooking = {
            bookingId: b?.id || bookingRef,
            bookingRef: b?.bookingRef || bookingRef,
            smartLockPin: b?.smartLockPin || pin || null,
            amount: b?.totalPrice || amount || total,
            checkIn: b?.checkIn || bookingCheckinDate,
            checkOut: b?.checkOut || bookingCheckoutDate,
            nights: b?.totalNights || nights,
            guests: b?.guestsCount || bookingGuestsCount,
            property: buildConfirmedProperty(b?.property, property, title, images),
          };
          recordBookedRange(
            property.id,
            bookingCheckinDate,
            bookingCheckoutDate,
            bookingRef
          );
          try {
            const rawBookings = window.localStorage.getItem("qafnest_guest_bookings");
            const existingList: ConfirmedBooking[] = rawBookings
              ? JSON.parse(rawBookings)
              : [];
            if (!existingList.some((item) => item.bookingRef === bookingRef)) {
              window.localStorage.setItem(
                "qafnest_guest_bookings",
                JSON.stringify([confirmed, ...existingList])
              );
            }
          } catch {}
          setConfirmedBooking(confirmed);
        })
        .catch(() => {
          const fallback: ConfirmedBooking = {
            bookingId: bookingRef,
            bookingRef: bookingRef,
            smartLockPin: pin || null,
            amount: amount || total,
            checkIn: bookingCheckinDate,
            checkOut: bookingCheckoutDate,
            nights,
            guests: bookingGuestsCount,
            property: buildConfirmedProperty(null, property, title, images),
          };
          setConfirmedBooking(fallback);
        });
    } else if (paymentError) {
      if (bookingRef) {
        removeBookedRange(property.id, bookingRef);
      }
      let resolvedMsg = formatGatewayError(errorMsg, language);
      if (!resolvedMsg) {
        if (paymentError === "amount_mismatch") {
          resolvedMsg =
            language === "ar"
              ? "تعذر إتمام الحجز: عدم تطابق في قيمة الفاتورة المستلمة من البوابة. يرجى المحاولة مجدداً."
              : "Payment verification failed: Amount mismatch between gateway and reservation.";
        } else if (paymentError === "booking_timeout_refund_required") {
          resolvedMsg =
            language === "ar"
              ? "انتهت مهلة الحجز وتم حجز العقار من قبل ضيف آخر. سيتم استرداد المبلغ تلقائياً."
              : "Reservation timed out and property was booked by another guest. An automatic refund will be processed.";
        } else if (paymentError === "booking_not_found") {
          resolvedMsg =
            language === "ar"
              ? "لم يتم العثور على سجل الحجز. يرجى إعادة المحاولة."
              : "Reservation record could not be found. Please try again.";
        } else {
          resolvedMsg =
            language === "ar"
              ? "تعذر إتمام عملية الدفع عبر بوابة ماي فاتورة. يرجى المحاولة مرة أخرى."
              : "Payment was not completed via MyFatoorah. Please try again.";
        }
      }
      setPaymentMessage(resolvedMsg);
    }
  }, [
    searchParamString,
    bookingCheckinDate,
    bookingCheckoutDate,
    bookingGuestsCount,
    nights,
    property,
    title,
    total,
    images,
    language,
    setConfirmedBooking,
    setPaymentMessage,
  ]);
}

