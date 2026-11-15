/**
 * Property Deletion Request & Active-Reservation Protection Rules.
 * Browser-safe types, preset reasons, and reservation blocking evaluators
 * shared across Host Portal (:3001) and Admin Portal (:3003).
 */

import type { SharedHostPayoutRecord } from "./hostPayoutConfig";

export type PropertyDeletionReasonCode =
  | "property_sold"
  | "long_term_lease"
  | "major_renovation"
  | "discontinuing_hosting"
  | "duplicate_listing"
  | "other";

export type PropertyDeletionRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface PropertyDeletionReasonOption {
  code: PropertyDeletionReasonCode;
  labelEn: string;
  labelAr: string;
}

export const PROPERTY_DELETION_REASONS: PropertyDeletionReasonOption[] = [
  {
    code: "property_sold",
    labelEn: "Property Sold / Ownership Transferred",
    labelAr: "تم بيع العقار / نقل الملكية",
  },
  {
    code: "long_term_lease",
    labelEn: "Rented Out Under Long-Term Contract",
    labelAr: "تم تأجير العقار بعقد طويل الأمد",
  },
  {
    code: "major_renovation",
    labelEn: "Closed for Major Renovation / Maintenance",
    labelAr: "إغلاق العقار لأعمال ترميم وصيانة شاملة",
  },
  {
    code: "discontinuing_hosting",
    labelEn: "Discontinuing Short-Term Hosting on QafNest",
    labelAr: "التوقف عن التأجير عبر منصة قاف نست",
  },
  {
    code: "duplicate_listing",
    labelEn: "Duplicate / Merged Listing Entry",
    labelAr: "إعلان مكرر أو تم دمجه مع وحدة أخرى",
  },
  {
    code: "other",
    labelEn: "Other Specific Reason",
    labelAr: "سبب آخر محدد",
  },
];

export interface PropertyDeletionRequest {
  id: string;
  propertyId: string;
  unitCode?: string;
  propertyTitle: string;
  propertyTitleAr?: string;
  propertyCity?: string;
  hostId: string;
  hostName?: string;
  hostPhone?: string;
  hostEmail?: string;
  reasonCode: PropertyDeletionReasonCode;
  reasonLabelEn: string;
  reasonLabelAr: string;
  reasonDetails: string;
  status: PropertyDeletionRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  autoDeletedAt?: string;
}

export interface PropertyDeletionRequestSummary {
  id: string;
  status: PropertyDeletionRequestStatus;
  reasonCode: PropertyDeletionReasonCode;
  reasonLabelEn: string;
  reasonLabelAr: string;
  reasonDetails: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
}

export interface BlockingReservationSummary {
  id: string;
  bookingReference: string;
  status: string;
  paymentStatus: string;
  checkIn: string;
  checkOut: string;
  blockReasonEn: string;
  blockReasonAr: string;
}

export interface PropertyDeletionEligibility {
  eligible: boolean;
  reasonEn: string;
  reasonAr: string;
  blockingBookings: BlockingReservationSummary[];
}

export interface DeletionBookingCandidate {
  id: string;
  booking_reference?: string | null;
  property_id?: string | null;
  status?: string | null;
  payment_status?: string | null;
  auth_subject?: string | null;
  check_in?: string | null;
  check_out?: string | null;
}

export function getDeletionReasonOption(
  code?: string | null
): PropertyDeletionReasonOption | null {
  const clean = String(code || "").trim();
  return PROPERTY_DELETION_REASONS.find((item) => item.code === clean) || null;
}

export function validateDeletionReasonInput(
  reasonCode?: string | null,
  reasonDetails?: string | null
): {
  valid: boolean;
  option?: PropertyDeletionReasonOption;
  cleanedDetails: string;
  errorEn?: string;
  errorAr?: string;
} {
  const option = getDeletionReasonOption(reasonCode);
  const cleanedDetails = String(reasonDetails || "").trim();

  if (!option) {
    return {
      valid: false,
      cleanedDetails,
      errorEn: "Please select a valid deletion reason category.",
      errorAr: "يرجى اختيار سبب محدد لطلب حذف العقار.",
    };
  }
  if (cleanedDetails.length < 10) {
    return {
      valid: false,
      option,
      cleanedDetails,
      errorEn: "Please provide a specific reason explanation (minimum 10 characters) for admin review.",
      errorAr: "يرجى كتابة تفاصيل السبب (10 أحرف على الأقل) لمراجعة الإدارة.",
    };
  }
  if (cleanedDetails.length > 1000) {
    return {
      valid: false,
      option,
      cleanedDetails,
      errorEn: "Reason explanation cannot exceed 1000 characters.",
      errorAr: "يجب ألا يتجاوز نص السبب 1000 حرف.",
    };
  }

  return {
    valid: true,
    option,
    cleanedDetails,
  };
}

/**
 * Enforces strict protection against deleting properties with active reservations:
 * Blocks deletion (or deletion requests) whenever a property has:
 * - An upcoming or not-yet-checked-out reservation (confirmed, checked_in, pending/SADAD hold)
 * - An open guest check-in / in-stay booking (regardless of scheduled date)
 * - An open refund dispute (refund_requested)
 * - Unsettled escrow/host payout funds tied to a booking on the property
 */
export function evaluatePropertyDeletionEligibility(params: {
  propertyId: string;
  bookings: DeletionBookingCandidate[];
  payouts?: SharedHostPayoutRecord[];
  todayIso?: string;
}): PropertyDeletionEligibility {
  const { propertyId, bookings, payouts = [] } = params;
  const todayIso = params.todayIso || new Date().toISOString().slice(0, 10);

  const unsettledBookingKeys = new Set<string>();
  for (const p of payouts) {
    if (p.status === "disbursed" || Number(p.netPayoutAmount || 0) <= 0) continue;
    if (p.bookingId) unsettledBookingKeys.add(String(p.bookingId));
    if (p.reference) {
      unsettledBookingKeys.add(p.reference.replace(/^SARIE-/i, ""));
    }
    if (Array.isArray(p.bookings)) {
      for (const bk of p.bookings) {
        if (bk.id) unsettledBookingKeys.add(String(bk.id));
        if (bk.reference) unsettledBookingKeys.add(String(bk.reference));
      }
    }
  }

  const blockingBookings: BlockingReservationSummary[] = [];

  for (const b of bookings) {
    if (b.property_id && String(b.property_id) !== propertyId) continue;
    const statusLower = String(b.status || "").toLowerCase();
    const paymentStatusLower = String(b.payment_status || "").toLowerCase();
    const authSubject = String(b.auth_subject || "");
    const checkInIso = String(b.check_in || "").slice(0, 10);
    const checkOutIso = String(b.check_out || "").slice(0, 10);
    const ref = String(b.booking_reference || b.id).trim();

    const isAbandonedDraft =
      statusLower === "pending" &&
      paymentStatusLower === "initiated" &&
      !authSubject.includes("SADAD_HOLD");

    if (isAbandonedDraft) continue;

    if (
      statusLower === "cancelled" ||
      statusLower === "rejected" ||
      statusLower === "refunded"
    ) {
      continue;
    }

    const hasUnsettledPayout =
      unsettledBookingKeys.has(String(b.id)) || (ref ? unsettledBookingKeys.has(ref) : false);

    let blockReasonEn = "";
    let blockReasonAr = "";

    if (statusLower === "checked_in") {
      blockReasonEn = "Guest is currently checked in (check-out pending)";
      blockReasonAr = "الضيف مقيم حالياً ولم يسجل المغادرة بعد";
    } else if (statusLower === "refund_requested") {
      blockReasonEn = "Open refund / dispute request pending resolution";
      blockReasonAr = "يوجد طلب استرداد أو نزاع قيد المعالجة";
    } else if (statusLower === "pending_sadad" || statusLower === "pending") {
      blockReasonEn = "Active reservation hold awaiting payment confirmation";
      blockReasonAr = "حجز معلق بانتظار تأكيد سداد الدفعة";
    } else if (checkOutIso >= todayIso || statusLower === "confirmed") {
      if (checkOutIso >= todayIso) {
        blockReasonEn =
          checkInIso > todayIso
            ? "Upcoming confirmed reservation (awaiting check-in & check-out)"
            : "Active stay in progress / awaiting guest check-out completion";
        blockReasonAr =
          checkInIso > todayIso
            ? "حجز مؤكد قادم (بانتظار تسجيل الدخول والمغادرة)"
            : "إقامة نشطة / بانتظار إتمام مغادرة الضيف";
      } else if (hasUnsettledPayout) {
        blockReasonEn = "Post-checkout payout settlement still pending";
        blockReasonAr = "التسوية المالية للحجز بعد المغادرة قيد الانتظار";
      }
    } else if (hasUnsettledPayout) {
      blockReasonEn = "Unsettled escrow payout linked to this reservation";
      blockReasonAr = "توجد مستحقات مالية قيد الضمان لهذا الحجز";
    }

    if (blockReasonEn) {
      blockingBookings.push({
        id: String(b.id),
        bookingReference: ref,
        status: statusLower || "confirmed",
        paymentStatus: paymentStatusLower || "paid",
        checkIn: checkInIso,
        checkOut: checkOutIso,
        blockReasonEn,
        blockReasonAr,
      });
    }
  }

  if (blockingBookings.length > 0) {
    return {
      eligible: false,
      reasonEn: `Cannot delete property while ${blockingBookings.length} active or unsettled reservation(s) exist (awaiting check-in, check-out, or payout settlement).`,
      reasonAr: `لا يمكن حذف العقار لوجود ${blockingBookings.length} حجز نشط أو قيد الانتظار (بانتظار تسجيل الدخول أو المغادرة أو التسوية المالية).`,
      blockingBookings,
    };
  }

  return {
    eligible: true,
    reasonEn: "No active reservations or unsettled escrow bookings. Eligible for admin deletion review.",
    reasonAr: "لا توجد حجوزات نشطة أو مستحقات معلقة. يمكن إرسال طلب الحذف لمراجعة الإدارة.",
    blockingBookings: [],
  };
}
