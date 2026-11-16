import { getEffectiveGuestServiceFeeRate } from "@qafnest/shared";

/**
 * QafNest Dynamic Pricing Engine & ZATCA-Compliant Tax Module
 * Calculates base rate, platform service fee, coupon discount, and 15% VAT.
 * Synchronizes with Admin Base Platform Commission in real time.
 */

export const VAT_RATE = 0.15; // 15% Saudi Value Added Tax (ZATCA compliant)

/**
 * Returns dynamic platform service fee rate synchronized in real time with Admin Base Commission.
 */
export function getServiceFeeRate(category?: string): number {
  try {
    return getEffectiveGuestServiceFeeRate(category);
  } catch {
    return 0.13; // Fallback matching 13% Admin Base Commission
  }
}

export const SERVICE_FEE_RATE = 0.13; // Backwards-compatible default matching Admin Base Rate

export interface CouponDefinition {
  code: string;
  type: "percentage" | "fixed";
  value: number; // e.g., 10 for 10% or 50 for 50 SAR
  minSpend?: number; // Minimum base stay in SAR
  maxDiscount?: number; // Maximum discount cap in SAR
  minNights?: number;
  descriptionEn: string;
  descriptionAr: string;
}

export type PromoCoupon = CouponDefinition;

export const ACTIVE_COUPONS: CouponDefinition[] = [];

export interface PricingBreakdown {
  baseRate: number; // Nightly rate * nights
  nights: number;
  nightlyRate: number;
  originalBaseRate?: number;
  listingDiscount: number;
  serviceFeeRate: number; // e.g. 0.05
  serviceFee: number; // 5% of base stay
  couponCode?: string;
  couponDiscount: number;
  couponDescription?: { en: string; ar: string };
  taxableSubtotal: number; // (Base stay - couponDiscount) + serviceFee
  vatRate: number; // 0.15
  vatAmount: number; // 15% of taxableSubtotal
  total: number; // taxableSubtotal + vatAmount
  installmentAmount: number; // total / 4 (for Tabby/Tamara)
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: CouponDefinition;
  discountAmount: number;
  error?: string;
  messageEn: string;
  messageAr: string;
}

/**
 * Validates a coupon code against base stay amount and night count.
 */
export function validateCoupon(
  code: string,
  baseRate: number,
  nights: number = 1
): CouponValidationResult {
  const normalized = (code || "").trim().toUpperCase();
  if (!normalized) {
    return {
      valid: false,
      discountAmount: 0,
      error: "empty_code",
      messageEn: "Please enter a valid coupon code.",
      messageAr: "يرجى إدخال كود خصم صحيح.",
    };
  }

  const coupon = ACTIVE_COUPONS.find((c) => c.code.toUpperCase() === normalized);
  if (!coupon) {
    return {
      valid: false,
      discountAmount: 0,
      error: "invalid_code",
      messageEn: "Coupon code is invalid or has expired.",
      messageAr: "كود الخصم غير صالح أو منتهي الصلاحية.",
    };
  }

  if (coupon.minSpend && baseRate < coupon.minSpend) {
    return {
      valid: false,
      discountAmount: 0,
      error: "min_spend_not_met",
      messageEn: `Coupon requires a minimum booking rate of SAR ${coupon.minSpend}.`,
      messageAr: `يتطلب كود الخصم حجزاً بقيمة ${coupon.minSpend} ر.س كحد أدنى.`,
    };
  }

  if (coupon.minNights && nights < coupon.minNights) {
    return {
      valid: false,
      discountAmount: 0,
      error: "min_nights_not_met",
      messageEn: `Coupon is valid for stays of ${coupon.minNights} nights or more.`,
      messageAr: `كود الخصم صالح للإقامات لمدة ${coupon.minNights} ليالٍ أو أكثر.`,
    };
  }

  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round(baseRate * (coupon.value / 100) * 100) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = Math.min(baseRate, coupon.value);
  }

  return {
    valid: true,
    coupon,
    discountAmount: Math.round(discount * 100) / 100,
    messageEn: `Coupon ${coupon.code} applied: -SAR ${discount.toFixed(2)}`,
    messageAr: `تم تطبيق كود ${coupon.code}: -${discount.toFixed(2)} ر.س`,
  };
}

/**
 * Calculates a complete, itemized pricing breakdown.
 */
export function calculatePricingBreakdown(params: {
  baseRate: number;
  nights?: number;
  nightlyRate?: number;
  originalPrice?: number;
  couponCode?: string | null;
  validatedCoupon?: CouponDefinition | null;
  customDiscount?: number | null;
  serviceFeeRate?: number;
  feeMode?: "percentage" | "fixed_amount";
  fixedFeeAmountSar?: number;
  vatRate?: number;
  category?: string;
}): PricingBreakdown {
  const nights = Math.max(1, params.nights || 1);
  const baseRate = Math.max(0, Math.round(params.baseRate * 100) / 100);
  const nightlyRate = params.nightlyRate || Math.round((baseRate / nights) * 100) / 100;
  const originalBaseRate = params.originalPrice ? params.originalPrice * nights : undefined;
  const listingDiscount =
    originalBaseRate && originalBaseRate > baseRate
      ? Math.round((originalBaseRate - baseRate) * 100) / 100
      : 0;

  // 1. Platform Service Fee (Supports both Dynamic % Mode and Manual Fixed SAR Mode)
  let activeFeeRate =
    typeof params.serviceFeeRate === "number" && params.serviceFeeRate >= 0
      ? params.serviceFeeRate
      : getServiceFeeRate(params.category);

  let serviceFee = Math.round(baseRate * activeFeeRate * 100) / 100;
  if (
    params.feeMode === "fixed_amount" &&
    typeof params.fixedFeeAmountSar === "number" &&
    params.fixedFeeAmountSar >= 0
  ) {
    serviceFee = Math.round(params.fixedFeeAmountSar * 100) / 100;
    activeFeeRate = baseRate > 0 ? Math.round((serviceFee / baseRate) * 10000) / 10000 : 0;
  }

  const effectiveVatRate =
    typeof params.vatRate === "number" && params.vatRate >= 0 ? params.vatRate : VAT_RATE;

  // 2. Coupon Validation & Discount
  let couponDiscount = 0;
  let validatedCoupon: CouponDefinition | undefined;

  if (params.customDiscount !== undefined && params.customDiscount !== null && params.customDiscount > 0) {
    couponDiscount = Math.min(baseRate, Math.round(params.customDiscount * 100) / 100);
    if (params.validatedCoupon) {
      validatedCoupon = params.validatedCoupon;
    } else if (params.couponCode) {
      validatedCoupon = {
        code: params.couponCode.trim().toUpperCase(),
        type: "fixed",
        value: couponDiscount,
        descriptionEn: `Promo code ${params.couponCode.trim().toUpperCase()} applied`,
        descriptionAr: `تم تطبيق كود الخصم ${params.couponCode.trim().toUpperCase()}`,
      };
    }
  } else if (params.validatedCoupon) {
    validatedCoupon = params.validatedCoupon;
    if (validatedCoupon.type === "percentage") {
      let disc = Math.round(baseRate * (validatedCoupon.value / 100) * 100) / 100;
      if (validatedCoupon.maxDiscount && disc > validatedCoupon.maxDiscount) {
        disc = validatedCoupon.maxDiscount;
      }
      couponDiscount = disc;
    } else {
      couponDiscount = Math.min(baseRate, validatedCoupon.value);
    }
    couponDiscount = Math.round(couponDiscount * 100) / 100;
  } else if (params.couponCode) {
    const valResult = validateCoupon(params.couponCode, baseRate, nights);
    if (valResult.valid && valResult.coupon) {
      couponDiscount = valResult.discountAmount;
      validatedCoupon = valResult.coupon;
    }
  }

  // 3. Taxable Subtotal (Base Stay after Coupon + Service Fee)
  const discountedStay = Math.max(0, baseRate - couponDiscount);
  const taxableSubtotal = Math.round((discountedStay + serviceFee) * 100) / 100;

  // 4. Value Added Tax (15% ZATCA on entire pre-VAT total)
  const vatAmount = Math.round(taxableSubtotal * effectiveVatRate * 100) / 100;

  // 5. Grand Total
  const total = Math.round((taxableSubtotal + vatAmount) * 100) / 100;

  // 6. Installment per month (Tabby / Tamara 4 installments)
  const installmentAmount = Math.round((total / 4) * 100) / 100;

  return {
    baseRate,
    nights,
    nightlyRate,
    originalBaseRate,
    listingDiscount,
    serviceFeeRate: activeFeeRate,
    serviceFee,
    couponCode: validatedCoupon?.code || (couponDiscount > 0 && params.couponCode ? params.couponCode.trim().toUpperCase() : undefined),
    couponDiscount,
    couponDescription: validatedCoupon
      ? { en: validatedCoupon.descriptionEn, ar: validatedCoupon.descriptionAr }
      : undefined,
    taxableSubtotal,
    vatRate: effectiveVatRate,
    vatAmount,
    total,
    installmentAmount,
  };
}

/**
 * Currency formatter helper for both English & Arabic
 */
export function formatCurrency(amount: number, language: "en" | "ar" = "en"): string {
  const formatted = amount.toLocaleString(language === "ar" ? "ar-SA" : "en-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return language === "ar" ? `${formatted} ر.س` : `SAR ${formatted}`;
}

