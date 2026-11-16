import type { PropertyBookingSlotConfig, TimeSlotBooking } from "@qafnest/shared";

export interface AvailabilitySnapshot {
  bookedDates: string[];
  checkoutDates: string[];
  blockedDates: string[];
  timeSlotBookings: TimeSlotBooking[];
  priceOverrides: Record<string, number>;
  slotConfig?: PropertyBookingSlotConfig;
  weekdayPrice?: number;
  weekendPrice?: number;
  basePrice?: number;
}

export interface SlotQuote {
  available: boolean;
  conflictingRef: string | null;
  blockedDateConflict: string | null;
  nights: number;
  pricing: {
    listingAmountSar: number;
    guestServiceFeePercent: number;
    guestServiceFeeSar: number;
    vatRatePercent: number;
    vatAmountSar: number;
    guestTotalSar: number;
    hostNetPayoutSar: number;
  };
}

export interface CreatedConfirmation {
  bookingReference: string;
  propertyTitle: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  checkIn: string;
  checkOut: string;
  guestTotalSar: number;
  status: string;
  paymentMode: "pending_sadad" | "confirmed_paid";
  smartLockPin?: string | null;
  sadadBillNumber?: string | null;
  autoCreatedGuest?: boolean;
}

export interface HelplineUserSearchResult {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationalId?: string;
  city?: string;
  verified?: boolean;
  isActive: boolean;
  isSuspended: boolean;
  status: string;
}

export interface HelplineVerificationSession {
  token: string;
  phoneNumber: string;
  guestName?: string;
  nationalId?: string;
  idType?: string;
  otpVerified: boolean;
  identityVerified: boolean;
  completed: boolean;
  devOtpCode?: string;
  verificationMethod: string;
}
