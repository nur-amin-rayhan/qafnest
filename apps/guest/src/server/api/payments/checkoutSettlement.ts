import { NextResponse } from "next/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import type { calculatePricingBreakdown } from "@/lib/services/pricing";
import { persistBookingToDatabase } from "@/lib/services/checkoutHelpers";
import { recordCouponUsage } from "@/lib/services/couponService";
import { dispatchBookingZatcaInvoice } from "@/lib/services/zatcaReportingHelper";
import { getFirebaseGuestProfile } from "@/lib/services/firebaseGuestProfileStore";
import { DEFAULT_SAUDI_IDENTITY_CONFIG } from "@qafnest/shared/saudiIdentityConfig";
import { getServerSaudiIdentityConfig } from "@qafnest/shared/saudiIdentityStore";
import { hydrateSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import { calculateBookingSettlement } from "@qafnest/shared/platformFee";
import { saveBookingFinancialSnapshot } from "@qafnest/shared/bookingFinancialsStore";
import type { getServerEffectiveGuestFeeConfig } from "@qafnest/shared/platformFeeStore";
import {
  awardLoyaltyPoints,
  deductWalletForBooking,
  getUserWallet,
  refundWalletForBooking,
} from "@/lib/services/walletService";

type GuestFeeConfig = ReturnType<typeof getServerEffectiveGuestFeeConfig>;
type PricingResult = ReturnType<typeof calculatePricingBreakdown>;
type AdminDbClient = Awaited<ReturnType<typeof getAdminOrServerClient>>;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Verifies Saudi National ID or Iqama when CMS mandatory guest policy is active. */
export async function checkMandatorySaudiIdentity(userId: string): Promise<NextResponse | null> {
  await hydrateSharedJsonFile("saudi-identity-config.json", () => DEFAULT_SAUDI_IDENTITY_CONFIG);
  const identityConfig = getServerSaudiIdentityConfig();
  if (!identityConfig.isMandatoryForGuests || !userId) return null;

  let profileNationalId = "";
  let metaVerified = false;
  let metaIqama = "";

  if (UUID_RE.test(userId)) {
    const dbAdmin = await getAdminOrServerClient();
    const { data: profile } = await dbAdmin
      .from("profiles")
      .select("national_id")
      .eq("id", userId)
      .maybeSingle();
    profileNationalId = profile?.national_id || "";

    try {
      if (typeof (dbAdmin as any).auth?.admin?.getUserById === "function") {
        const { data: authRes } = await (dbAdmin as any).auth.admin.getUserById(userId);
        const meta = (authRes?.user?.user_metadata || {}) as Record<string, unknown>;
        metaVerified = Boolean(meta.is_verified);
        metaIqama = typeof meta.iqama === "string" ? meta.iqama : "";
      }
    } catch {
      // Optional auth metadata check
    }
  } else {
    const fbProfile = await getFirebaseGuestProfile(userId);
    if (fbProfile) {
      profileNationalId = fbProfile.national_id || "";
      metaVerified = Boolean(fbProfile.is_verified);
      metaIqama = fbProfile.iqama || "";
    }
  }

  if (!metaVerified && !profileNationalId && !metaIqama) {
    return NextResponse.json(
      {
        code: "identity_verification_required",
        message:
          "Saudi National ID or Iqama verification is required by policy before completing checkout (يجب التحقق من الهوية الوطنية أو الإقامة أولاً).",
      },
      { status: 403 }
    );
  }
  return null;
}

/** Shared financial ledger recorder for both instant-wallet and gateway/split checkouts. */
export function recordCheckoutFinancialSnapshot(params: {
  bookingRef: string;
  bookingId: string;
  pricing: PricingResult;
  rawCouponCode: string | null;
  guestFee: GuestFeeConfig;
  walletAppliedSar: number;
  welcomeBonusUsedSar: number;
  gatewayPaidSar: number;
}): void {
  const settlement = calculateBookingSettlement({
    listingAmountSar: params.pricing.baseRate,
    guestServiceFeeSar: params.pricing.serviceFee,
    vatAmountSar: params.pricing.vatAmount,
    promoDiscountSar: params.pricing.couponDiscount,
    welcomeBonusUsedSar: params.welcomeBonusUsedSar,
    hostCommissionPercent: params.guestFee.hostCommissionPercent,
    vatRatePercent: params.guestFee.vatRatePercent,
  });

  saveBookingFinancialSnapshot({
    bookingRef: params.bookingRef,
    bookingId: params.bookingId,
    listingAmountSar: settlement.listingAmountSar,
    guestServiceFeeSar: settlement.guestServiceFeeSar,
    guestFeeMode: params.guestFee.feeMode,
    guestServiceFeePercent: params.guestFee.serviceFeePercent,
    promoCode: params.pricing.couponCode || params.rawCouponCode,
    promoDiscountSar: settlement.promoDiscountSar,
    taxableSubtotalSar: settlement.taxableSubtotalSar,
    vatRatePercent: settlement.vatRatePercent,
    vatAmountSar: settlement.vatAmountSar,
    totalPriceSar: settlement.guestTotalCollectedSar,
    hostCommissionPercent: settlement.hostCommissionPercent,
    hostCommissionAmountSar: settlement.hostCommissionAmountSar,
    hostNetPayoutSar: settlement.hostNetPayoutSar,
    walletAppliedSar: params.walletAppliedSar,
    welcomeBonusUsedSar: settlement.welcomeBonusUsedSar,
    gatewayPaidSar: params.gatewayPaidSar,
    platformGrossRevenueSar: settlement.platformGrossEarningsSar,
    platformNetRevenueSar: settlement.platformNetRevenueSar,
    recordedAt: new Date().toISOString(),
  });
}

/** Handles full-balance instant wallet checkouts without routing through an external gateway. */
export async function executeDirectWalletCheckout(params: {
  dbClient: AdminDbClient;
  checkoutWallet: Awaited<ReturnType<typeof getUserWallet>> | null;
  effectiveUserId: string;
  resolvedDbPropertyId: string;
  propTitle: string;
  rawPropertyId: string;
  checkIn: string;
  checkOut: string;
  checkinTime: string;
  checkoutTime: string;
  nights: number;
  guests: number;
  totalPrice: number;
  pricing: PricingResult;
  bookingRef: string;
  guestSubject: string;
  guestName: string;
  rawCouponCode: string | null;
  guestFee: GuestFeeConfig;
  resolvedLocale: string;
}): Promise<NextResponse> {
  const userWallet = params.checkoutWallet || (await getUserWallet(params.effectiveUserId));
  if (userWallet.balance < params.totalPrice) {
    return NextResponse.json(
      {
        code: "insufficient_wallet_balance",
        message: `Insufficient wallet balance. Required: ${params.totalPrice.toFixed(2)} SAR, Available: ${userWallet.balance.toFixed(2)} SAR`,
        availableBalance: userWallet.balance,
        requiredAmount: params.totalPrice,
      },
      { status: 400 }
    );
  }

  const deductResult = await deductWalletForBooking({
    userId: params.effectiveUserId,
    amount: params.totalPrice,
    bookingRef: params.bookingRef,
    propertyTitle: params.propTitle,
  });
  if (!deductResult.success) {
    return NextResponse.json(
      {
        code: "wallet_deduction_failed",
        message: deductResult.error || "Could not process wallet deduction.",
      },
      { status: 400 }
    );
  }

  const { bookingId, bookingPersisted, overlapConflict } = await persistBookingToDatabase({
    dbClient: params.dbClient,
    resolvedDbPropertyId: params.resolvedDbPropertyId,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    checkinTime: params.checkinTime,
    checkoutTime: params.checkoutTime,
    nights: params.nights,
    guests: params.guests,
    totalPrice: params.totalPrice,
    pricing: params.pricing,
    guestId: params.effectiveUserId,
    bookingRef: params.bookingRef,
    guestSubject: params.guestSubject,
    initialStatus: "confirmed",
    initialPaymentStatus: "success",
    paymentMethod: "wallet",
    smartLockPin: null,
  });

  if (!bookingPersisted) {
    await refundWalletForBooking({
      userId: params.effectiveUserId,
      amount: params.totalPrice,
      welcomeBonusRestore: deductResult.welcomeBonusUsed,
      bookingRef: params.bookingRef,
      reason: overlapConflict ? "Slot conflict refund" : "Persistence failure refund",
    });
    return NextResponse.json(
      overlapConflict
        ? {
            code: "dates_unavailable",
            message: "This time slot was just reserved by another guest. No duplicate booking allowed.",
            messageAr: "تم حجز هذه الفترة للتو من قِبل نزيل آخر. لا يمكن تكرار الحجز.",
          }
        : {
            code: "booking_persistence_failed",
            message: "Unable to confirm booking reservation. Please contact support.",
          },
      { status: overlapConflict ? 409 : 500 }
    );
  }

  const appliedCode = params.pricing.couponCode || params.rawCouponCode;
  if (appliedCode) {
    await recordCouponUsage(appliedCode, params.effectiveUserId, params.bookingRef).catch(() => undefined);
  }

  const updatedWallet = await awardLoyaltyPoints({
    userId: params.effectiveUserId,
    amountSpent: params.totalPrice,
    bookingRef: params.bookingRef,
    isWalletPayment: true,
  });

  recordCheckoutFinancialSnapshot({
    bookingRef: params.bookingRef,
    bookingId,
    pricing: params.pricing,
    rawCouponCode: params.rawCouponCode,
    guestFee: params.guestFee,
    walletAppliedSar: params.totalPrice,
    welcomeBonusUsedSar: deductResult.welcomeBonusUsed,
    gatewayPaidSar: 0,
  });

  const zatcaResult = await dispatchBookingZatcaInvoice({
    bookingId,
    bookingRef: params.bookingRef,
    totalWithVat: params.totalPrice,
    taxableAmount: params.pricing.taxableSubtotal,
    vatAmount: params.pricing.vatAmount,
    buyerName: params.guestName || "Valued Guest Customer",
    propertyTitle: params.propTitle || "Vacation Rental Accommodation",
    paymentMethod: "wallet",
  });

  return NextResponse.json({
    success: true,
    confirmed: true,
    bookingId,
    bookingRef: params.bookingRef,
    amount: params.totalPrice,
    pricing: params.pricing,
    paymentMethod: "wallet",
    smartLockPin: null,
    newWalletBalance: deductResult.newBalance,
    loyaltyPoints: updatedWallet.loyaltyPoints,
    zatcaStatus: zatcaResult?.clearanceStatus || null,
    zatcaInvoiceNumber: zatcaResult?.invoiceNumber || null,
    redirectUrl: `/${params.resolvedLocale}/property/${params.rawPropertyId}/reserve?confirmed=true&bookingRef=${params.bookingRef}&paidVia=wallet`,
    message: "Booking confirmed instantly using QafNest Wallet balance!",
  });
}
