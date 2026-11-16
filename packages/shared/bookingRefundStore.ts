import {
  hydrateSharedJsonFile,
  persistSharedJsonFile,
  readSharedJsonFile,
  writeSharedJsonFile,
} from "./serverJsonStore";

export interface RefundTimelineStep {
  step: "requested" | "approved" | "processing" | "disbursed" | "rejected";
  title: string;
  description: string;
  timestamp: string;
  actor: "guest" | "admin" | "system";
}

export interface BookingRefundRecord {
  id: string; // e.g. RFD-XXXX
  bookingRef: string;
  guestId?: string;
  guestEmail?: string;
  guestPhone?: string;
  totalBookingPrice: number;
  refundAmount: number;
  refundPercentage: number;
  penaltyAmount: number;
  cancellationReason: string;
  requestedAt: string;
  disbursedAt?: string;
  transactionNumber?: string;
  status: "pending_review" | "approved" | "disbursed" | "rejected";
  refundMethod: "original_card" | "sadad_reversal" | "bank_transfer" | "wallet";
  payoutVoided: boolean;
  policyTier: "1hr_instant_grace" | "flexible_48h" | "moderate_24h" | "non_refundable" | "admin_override";
  timeline: RefundTimelineStep[];
}

export interface CancellationPolicyQuote {
  eligibleForRefund: boolean;
  refundPercentage: number;
  refundAmount: number;
  penaltyAmount: number;
  policyTier: "1hr_instant_grace" | "flexible_48h" | "moderate_24h" | "non_refundable" | "admin_override";
  hoursSinceBooking: number;
  hoursUntilCheckin: number;
  summaryEn: string;
  summaryAr: string;
}

const REFUNDS_FILE_NAME = "booking-refunds.json";

const normalizeRefunds = (parsed: unknown): Record<string, BookingRefundRecord> =>
  parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, BookingRefundRecord>)
    : {};

export async function hydrateBookingRefundStore(): Promise<Record<string, BookingRefundRecord>> {
  return hydrateSharedJsonFile<Record<string, BookingRefundRecord>>(
    REFUNDS_FILE_NAME,
    () => ({}),
    normalizeRefunds
  );
}

export async function persistBookingRefundStore(): Promise<boolean> {
  return persistSharedJsonFile(REFUNDS_FILE_NAME, loadRefunds());
}

function loadRefunds(): Record<string, BookingRefundRecord> {
  return readSharedJsonFile<Record<string, BookingRefundRecord>>(
    REFUNDS_FILE_NAME,
    () => ({}),
    normalizeRefunds
  );
}

function saveRefunds(records: Record<string, BookingRefundRecord>) {
  writeSharedJsonFile(REFUNDS_FILE_NAME, records);
}

/**
 * Calculates cancellation refund eligibility and breakdown.
 * Standard Policy:
 * - Strictly Non-Refundable once payment is completed (0% automatic refund).
 * - Guests may still cancel their reservation, with 0 SAR refund.
 * - Exceptional Manual Override: Allows admin to manually issue an exceptional refund from the Admin Dashboard.
 */
export function calculateCancellationRefundQuote(params: {
  createdAt: string;
  checkIn: string;
  totalPrice: number;
  isAdminOverride?: boolean;
  adminOverridePercent?: number;
}): CancellationPolicyQuote {
  const now = new Date();
  const created = new Date(params.createdAt || now);
  const checkinDate = new Date(params.checkIn);

  const hoursSinceBooking = Math.max(0, (now.getTime() - created.getTime()) / (1000 * 60 * 60));
  const hoursUntilCheckin = (checkinDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (params.isAdminOverride && typeof params.adminOverridePercent === "number") {
    const percent = Math.min(100, Math.max(0, params.adminOverridePercent));
    const refundAmt = Math.round(((params.totalPrice * percent) / 100) * 100) / 100;
    const penaltyAmt = Math.round(Math.max(0, params.totalPrice - refundAmt) * 100) / 100;
    return {
      eligibleForRefund: percent > 0,
      refundPercentage: percent,
      refundAmount: refundAmt,
      penaltyAmount: penaltyAmt,
      policyTier: percent > 0 ? "admin_override" : "non_refundable",
      hoursSinceBooking: Math.round(hoursSinceBooking * 10) / 10,
      hoursUntilCheckin: Math.round(hoursUntilCheckin * 10) / 10,
      summaryEn:
        percent > 0
          ? `Exceptional manual admin refund: ${percent}% granted (${refundAmt} SAR).`
          : "Paid reservations are strictly non-refundable upon cancellation.",
      summaryAr:
        percent > 0
          ? `استرداد استثنائي يدوي من الإدارة: بنسبة ${percent}% (${refundAmt} ر.س).`
          : "الحجوزات المدفوعة غير قابلة للاسترداد بعد إتمام الدفع.",
    };
  }

  return {
    eligibleForRefund: false,
    refundPercentage: 0,
    refundAmount: 0,
    penaltyAmount: params.totalPrice,
    policyTier: "non_refundable",
    hoursSinceBooking: Math.round(hoursSinceBooking * 10) / 10,
    hoursUntilCheckin: Math.round(hoursUntilCheckin * 10) / 10,
    summaryEn:
      "Once payment is completed, reservations are strictly non-refundable. You may still cancel your booking, but no refund will be issued.",
    summaryAr:
      "بمجرد إتمام الدفع، تصبح الحجوزات غير قابلة للاسترداد نهائياً. يمكنك إلغاء الحجز إذا رغبت، ولكن لن يتم استرداد أي مبلغ.",
  };
}

export function createBookingRefundRecord(params: {
  bookingRef: string;
  guestId?: string;
  guestEmail?: string;
  guestPhone?: string;
  totalBookingPrice: number;
  refundAmount: number;
  refundPercentage: number;
  penaltyAmount: number;
  cancellationReason: string;
  actor: "guest" | "admin";
  policyTier: "1hr_instant_grace" | "flexible_48h" | "moderate_24h" | "non_refundable" | "admin_override";
  refundMethod?: "original_card" | "sadad_reversal" | "bank_transfer" | "wallet";
}): BookingRefundRecord {
  const records = loadRefunds();
  const now = new Date().toISOString();
  const id = `RFD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const isAutoApproved = params.refundPercentage > 0;

  const record: BookingRefundRecord = {
    id,
    bookingRef: params.bookingRef,
    guestId: params.guestId,
    guestEmail: params.guestEmail,
    guestPhone: params.guestPhone,
    totalBookingPrice: params.totalBookingPrice,
    refundAmount: params.refundAmount,
    refundPercentage: params.refundPercentage,
    penaltyAmount: params.penaltyAmount,
    cancellationReason: params.cancellationReason || "Guest requested cancellation",
    requestedAt: now,
    status: isAutoApproved ? "approved" : "rejected",
    refundMethod: params.refundMethod || "original_card",
    payoutVoided: true,
    policyTier: params.policyTier,
    timeline: [
      {
        step: "requested",
        title: "Cancellation Requested",
        description: `Cancelled via ${params.actor === "guest" ? "Guest Portal" : "Admin Customer Support Helpline"}.`,
        timestamp: now,
        actor: params.actor,
      },
      ...(isAutoApproved
        ? [
            {
              step: "approved" as const,
              title: "Refund Approved",
              description: `Policy matched ${params.policyTier} (${params.refundPercentage}% - ${params.refundAmount} SAR).`,
              timestamp: now,
              actor: "system" as const,
            },
            {
              step: "processing" as const,
              title: "Disbursement in Progress",
              description: "Routing to payment processor / Saudi banking clearing house.",
              timestamp: now,
              actor: "system" as const,
            },
          ]
        : [
            {
              step: "rejected" as const,
              title: "Refund Ineligible",
              description: "Reservation cancelled under strict non-refundable post-payment policy.",
              timestamp: now,
              actor: "system" as const,
            },
          ]),
    ],
  };

  records[params.bookingRef] = record;
  saveRefunds(records);
  return record;
}

export function markRefundDisbursed(
  bookingRef: string,
  adminNotes?: string,
  transactionNumber?: string
): BookingRefundRecord | null {
  const records = loadRefunds();
  const record = records[bookingRef];
  if (!record) return null;

  const cleanTxn = String(transactionNumber || "").trim();
  const now = new Date().toISOString();
  record.status = "disbursed";
  record.disbursedAt = now;
  if (cleanTxn) {
    record.transactionNumber = cleanTxn;
  }
  record.timeline.push({
    step: "disbursed",
    title: "Refund Completed & Disbursed",
    description: `${cleanTxn ? `Bank/SARIE Txn #${cleanTxn}. ` : ""}${
      adminNotes || "Funds successfully remitted to guest's account."
    }`,
    timestamp: now,
    actor: "admin",
  });

  records[bookingRef] = record;
  saveRefunds(records);
  return record;
}

export function getBookingRefundRecord(bookingRef: string): BookingRefundRecord | null {
  const records = loadRefunds();
  return records[bookingRef] || null;
}

export function getAllBookingRefunds(): BookingRefundRecord[] {
  const records = loadRefunds();
  return Object.values(records).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}
