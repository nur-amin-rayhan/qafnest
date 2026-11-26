import type { CardBrand } from "@/lib/services/cardBrand";

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "topup" | "booking_payment" | "refund" | "reward" | "redemption";
  amount: number; // In SAR (+ for credit, - for debit)
  points?: number; // Loyalty points awarded/redeemed
  status: "completed" | "pending" | "failed";
  reference: string; // e.g. TOPUP-84920, QAF-8201
  paymentMethod?: string; // "card", "apple", "mada", "wallet", "system"
  titleEn: string;
  titleAr: string;
  createdAt: string;
}

export interface LoyaltyOffer {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  multiplier: number; // e.g. 2 for 2x points
  bonusPoints?: number;
  badgeEn: string;
  badgeAr: string;
  validUntil: string;
  isActive: boolean;
}

export interface SavedCard {
  id: string;
  userId: string;
  cardholderName: string;
  brand: CardBrand;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: string;
  gatewayToken?: string;
  panHash?: string;
  maskedPan?: string;
  supportsDirectCharge?: boolean;
}

export interface PendingWalletTopUp {
  reference: string;
  userId: string;
  amount: number;
  method: string;
  settled: boolean;
  paymentId?: string;
  createdAt: string;
  settledAt?: string;
}

export interface LoyaltySettings {
  loyaltyEnabled: boolean;
  standardEarnRate: number; // Points per 1 SAR (default: 1)
  walletPaymentMultiplier: number; // default: 1.5
  redemptionRatePoints: number; // default: 100
  redemptionRateSAR: number; // default: 10
}

export interface UserWalletData {
  userId: string;
  balance: number;
  loyaltyPoints: number;
  loyaltyTier: "Bronze" | "Silver" | "Gold" | "Platinum";
  transactions: WalletTransaction[];
  savedCards?: SavedCard[];
  updatedAt?: string;
  welcomeBonusCredited?: boolean;
  welcomeBonusBalance?: number;
  welcomeBonusTotalAwarded?: number;
  welcomeBonusAwardedAt?: string;
  welcomeBonusDeviceId?: string;
}

export interface PendingWalletSplit {
  bookingRef: string;
  userId: string;
  walletAmount: number;
  welcomeBonusAmount?: number;
  gatewayAmount: number;
  totalAmount: number;
  gatewayMethod: string;
  propertyTitle: string;
  settled: boolean;
  createdAt: string;
}

export interface WalletStoreState {
  wallets: Record<string, UserWalletData>;
  activeOffers: LoyaltyOffer[];
  loyaltySettings?: LoyaltySettings;
  pendingSplits?: Record<string, PendingWalletSplit>;
  pendingTopUps?: Record<string, PendingWalletTopUp>;
  processedTopUpPaymentIds?: string[];
}

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  loyaltyEnabled: true,
  standardEarnRate: 1,
  walletPaymentMultiplier: 1.5,
  redemptionRatePoints: 100,
  redemptionRateSAR: 10,
};
