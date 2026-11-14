"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  calculatePricingBreakdown,
  validateCoupon,
  PricingBreakdown,
  CouponDefinition,
  formatCurrency,
} from "@/lib/services/pricing";
import { usePlatformFeeSync } from "@/hooks/usePlatformFeeSync";
import { PricingLineItems } from "./pricing/PricingLineItems";
import { PricingCouponForm } from "./pricing/PricingCouponForm";
import { PricingTotalAndInstallments } from "./pricing/PricingTotalAndInstallments";

interface PricingBreakdownModuleProps {
  baseRate: number;
  nights?: number;
  nightlyRate?: number;
  originalPrice?: number;
  initialCouponCode?: string | null;
  language?: "en" | "ar";
  onPricingChange?: (pricing: PricingBreakdown) => void;
  className?: string;
  showInstallments?: boolean;
  serviceFeeRate?: number;
  feeMode?: "percentage" | "fixed_amount";
  fixedFeeAmountSar?: number;
  vatRate?: number;
  category?: string;
}

export default function PricingBreakdownModule({
  baseRate,
  nights = 1,
  nightlyRate,
  originalPrice,
  initialCouponCode = null,
  language = "en",
  onPricingChange,
  className = "",
  showInstallments = true,
  serviceFeeRate,
  feeMode,
  fixedFeeAmountSar,
  vatRate,
  category,
}: PricingBreakdownModuleProps) {
  const {
    feeRate: syncedFeeRate,
    feeMode: syncedFeeMode,
    fixedFeeAmountSar: syncedFixedFee,
    vatRate: syncedVatRate,
  } = usePlatformFeeSync(category);
  const activeFeeRate = typeof serviceFeeRate === "number" ? serviceFeeRate : syncedFeeRate;
  const activeFeeMode = feeMode || syncedFeeMode;
  const activeFixedFee =
    typeof fixedFeeAmountSar === "number" ? fixedFeeAmountSar : syncedFixedFee;
  const activeVatRate = typeof vatRate === "number" ? vatRate : syncedVatRate;

  const [couponInput, setCouponInput] = useState(initialCouponCode || "");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(initialCouponCode || null);
  const [appliedCouponDef, setAppliedCouponDef] = useState<CouponDefinition | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const t = (en: string, ar: string) => (language === "ar" ? ar : en);

  // Calculate pricing breakdown in real time
  const pricing = useMemo(() => {
    return calculatePricingBreakdown({
      baseRate,
      nights,
      nightlyRate,
      originalPrice,
      couponCode: appliedCoupon,
      validatedCoupon: appliedCouponDef,
      customDiscount: appliedDiscount,
      serviceFeeRate: activeFeeRate,
      feeMode: activeFeeMode,
      fixedFeeAmountSar: activeFixedFee,
      vatRate: activeVatRate,
      category,
    });
  }, [
    baseRate,
    nights,
    nightlyRate,
    originalPrice,
    appliedCoupon,
    appliedCouponDef,
    appliedDiscount,
    activeFeeRate,
    activeFeeMode,
    activeFixedFee,
    activeVatRate,
    category,
  ]);

  // Sync pricing changes with parent
  useEffect(() => {
    onPricingChange?.(pricing);
  }, [pricing, onPricingChange]);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || couponInput).trim().toUpperCase();
    setCouponError(null);
    setCouponSuccess(null);

    if (!targetCode) {
      setCouponError(t("Please enter a promo code.", "يرجى كتابة كود الخصم أولاً."));
      return;
    }

    setIsApplying(true);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: targetCode, baseRate, nights, category }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon(targetCode);
        setAppliedCouponDef(data.coupon || null);
        setAppliedDiscount(typeof data.discountAmount === "number" ? data.discountAmount : null);
        setCouponInput(targetCode);
        setCouponSuccess(
          language === "ar"
            ? `تم تطبيق الكود ${targetCode} بنجاح! وفرت ${formatCurrency(data.discountAmount, "ar")}`
            : `Coupon ${targetCode} applied! You save ${formatCurrency(data.discountAmount, "en")}`
        );
      } else {
        setAppliedCoupon(null);
        setAppliedCouponDef(null);
        setAppliedDiscount(null);
        const errorMsg =
          language === "ar"
            ? data.messageAr || "كود الخصم غير صالح أو لا يستوفي الشروط."
            : data.messageEn || "Invalid or ineligible promo code.";
        setCouponError(errorMsg);
      }
    } catch {
      // Offline / fallback client validation
      const localResult = validateCoupon(targetCode, baseRate, nights);
      if (localResult.valid) {
        setAppliedCoupon(targetCode);
        setAppliedCouponDef(localResult.coupon || null);
        setAppliedDiscount(localResult.discountAmount);
        setCouponInput(targetCode);
        setCouponSuccess(language === "ar" ? localResult.messageAr : localResult.messageEn);
      } else {
        setAppliedCoupon(null);
        setAppliedCouponDef(null);
        setAppliedDiscount(null);
        setCouponError(language === "ar" ? localResult.messageAr : localResult.messageEn);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setAppliedCouponDef(null);
    setAppliedDiscount(null);
    setCouponInput("");
    setCouponError(null);
    setCouponSuccess(null);
  };

  return (
    <div
      className={`space-y-4 font-sans text-start ${className}`}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* 1. Itemized Costs Breakdown */}
      <PricingLineItems
        pricing={pricing}
        nights={nights}
        language={language}
        onRemoveCoupon={handleRemoveCoupon}
        t={t}
      />

      {/* 2. Coupon Input Field & Actions */}
      <PricingCouponForm
        couponInput={couponInput}
        setCouponInput={setCouponInput}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        isApplying={isApplying}
        couponSuccess={couponSuccess}
        couponError={couponError}
        setCouponError={setCouponError}
        t={t}
      />

      {/* 3. Divider, Total Amount & Installments */}
      <PricingTotalAndInstallments
        pricing={pricing}
        language={language}
        showInstallments={showInstallments}
        t={t}
      />
    </div>
  );
}
