import type { BookingPropertyDetails } from "@/lib/bookings/bookingProperty";

export type Booking = {
  id: string;
  booking_reference?: string;
  check_in: string;
  check_out: string;
  total_nights: number;
  guests_count: number;
  total_price: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  smart_lock_pin: string | null;
  created_at: string;
  isSadadHold?: boolean;
  sadadInfo?: {
    billerCode: string;
    billerName: string;
    billNumber: string;
    iban: string;
    bankName: string;
    accountName: string;
  } | null;
  refund?: {
    id: string;
    bookingRef: string;
    totalBookingPrice: number;
    refundAmount: number;
    refundPercentage: number;
    penaltyAmount: number;
    cancellationReason: string;
    requestedAt: string;
    disbursedAt?: string;
    status: "pending_review" | "approved" | "disbursed" | "rejected";
    refundMethod: string;
    policyTier: string;
    timeline: Array<{
      step: string;
      title: string;
      description: string;
      timestamp: string;
      actor: string;
    }>;
  } | null;
  transferClaim?: {
    bookingRef: string;
    transferReference: string;
    bankName?: string;
    senderName?: string;
    amount: number;
    submittedAt: string;
    status: "pending_verification" | "confirmed" | "rejected";
    adminNotes?: string;
  } | null;
  property: BookingPropertyDetails | null;
};
