export interface RemittanceBookingDetail {
  bookingId: string;
  bookingReference: string;
  propertyId?: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  grossAmount: number;
  commission: number;
  vat: number;
  netPayout: number;
}

export interface HostPropertyBookingTx {
  bookingId: string;
  bookingReference: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestName: string;
  grossAmount: number;
  serviceFeeAmount: number;
  promoDiscountAmount: number;
  netPayout: number;
  payoutStatus: "disbursed" | "processing" | "pending" | "on_hold";
  createdAt: string;
}

export interface HostPropertyFinanceSummary {
  propertyId: string;
  propertyTitle: string;
  category: string;
  categoryName: string;
  city: string;
  status: string;
  basePrice: number;
  bookingsCount: number;
  grossRevenue: number;
  serviceFeeAmount: number;
  promoDiscountAmount: number;
  netEarnings: number;
  paidOut: number;
  dueAmount: number;
  bookings: HostPropertyBookingTx[];
}

export interface HostRemittance {
  id: string;
  dateAr: string;
  dateEn: string;
  rawDate: string;
  bank: string;
  iban: string;
  amount: string;
  numericAmount: number;
  grossAmount: number;
  commissionAmount: number;
  commissionRatePercent?: number;
  promoDiscountAmount?: number;
  vatAmount: number;
  staysCount: number;
  status: "settled" | "processing" | "pending";
  bookings: RemittanceBookingDetail[];
}

export interface HostPayoutIban {
  iban: string;
  formattedIban: string;
  bankNameEn: string;
  bankNameAr: string;
  accountHolder: string;
  isVerified: boolean;
  verifiedAt: string;
}

export interface HostVatInvoice {
  id: string;
  date: string;
  bookingRef: string;
  propertyTitle: string;
  serviceFee: string;
  vat: string;
  total: string;
  qrPayload: string;
}

export interface HostSettlementSettings {
  payoutFrequency: "weekly" | "biweekly" | "monthly" | "manual";
  minPayoutThreshold: number;
  autoReleaseAfterCheckin: boolean;
  notifySms: boolean;
}

export interface HostSettlementAdjustment {
  id: string;
  type: "deposit_hold" | "damage_claim" | "policy_adjustment" | "cancellation_credit";
  bookingRef: string;
  amount: number;
  status: "under_review" | "settled" | "released";
  descriptionAr: string;
  descriptionEn: string;
  date: string;
}

export interface HostSettlementSummary {
  grossRevenue: number;
  commissionAmount: number;
  vatAmount: number;
  commissionRatePercent?: number;
  vatRatePercent?: number;
  netEarnings: number;
  disbursedTotal: number;
  pendingSettlement: number;
  settings: HostSettlementSettings;
  adjustments: HostSettlementAdjustment[];
}
