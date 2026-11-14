import { useMemo } from "react";
import { getStayTotal, Property } from "@/data/properties";
import { calculatePricingBreakdown } from "@/lib/services/pricing";
import { usePlatformFeeSync } from "@/hooks/usePlatformFeeSync";
import {
  computeSlotAwareStayRate,
  isSameDayTwelveHourStay,
  type PropertyBookingSlotConfig,
} from "@qafnest/shared";

export function useReservationPricing({
  property,
  checkinDate,
  checkoutDate,
  checkinTime = "16:00",
  checkoutTime = "12:00",
  nights,
  language,
  slotConfig,
  dateOverrides,
}: {
  property: Property;
  checkinDate: string;
  checkoutDate?: string;
  checkinTime?: string;
  checkoutTime?: string;
  nights: number;
  language: string;
  slotConfig?: PropertyBookingSlotConfig | null;
  dateOverrides?: Record<string, number>;
}) {
  const { feeRate, feeMode, fixedFeeAmountSar, vatRate, isLiveSynced } = usePlatformFeeSync(property.category);
  const safeNights = Math.max(1, nights);
  const isTwelveHourStay = isSameDayTwelveHourStay({
    checkIn: checkinDate,
    checkOut: checkoutDate,
    checkinTime,
    checkoutTime,
  });

  const resolvedRates = useMemo(() => {
    if (isTwelveHourStay && checkoutDate) {
      const weeklyPricing = property.customDayPricing || {
        sunday: property.sundayPrice,
        monday: property.mondayPrice,
        tuesday: property.tuesdayPrice,
        wednesday: property.wednesdayPrice,
        thursday: property.thursdayPrice,
        friday: property.fridayPrice,
        saturday: property.saturdayPrice,
      };
      const slotCalc = computeSlotAwareStayRate({
        checkIn: checkinDate,
        checkOut: checkoutDate,
        checkinTime,
        checkoutTime,
        pricingOptions: {
          masterBasePrice: property.basePrice,
          weeklyPricing,
          weekendPrice: property.weekendPrice,
          dateOverrides: dateOverrides || property.dateOverrides || null,
        },
        slotConfig: slotConfig || undefined,
      });
      return { baseStayRate: slotCalc.baseStayRate, billableUnits: slotCalc.billableUnits };
    }
    return {
      baseStayRate: getStayTotal(property, checkinDate, safeNights, { dateOverrides }),
      billableUnits: safeNights,
    };
  }, [
    isTwelveHourStay,
    property,
    checkinDate,
    checkoutDate,
    checkinTime,
    checkoutTime,
    safeNights,
    slotConfig,
    dateOverrides,
  ]);

  const baseStayRate = resolvedRates.baseStayRate;
  const effectiveNightlyRate = Math.round((baseStayRate / resolvedRates.billableUnits) * 100) / 100;
  const isWeekendRate = effectiveNightlyRate !== property.basePrice;

  const hasDiscount =
    !isTwelveHourStay &&
    Boolean(property.originalPrice && property.originalPrice > effectiveNightlyRate);
  const discountPercent =
    !isTwelveHourStay
      ? property.discountPercentage ||
        (hasDiscount
          ? Math.round(
              ((property.originalPrice! - effectiveNightlyRate) / property.originalPrice!) * 100
            )
          : 0)
      : 0;

  const previewPricing = useMemo(() => {
    return calculatePricingBreakdown({
      baseRate: baseStayRate,
      nights: resolvedRates.billableUnits,
      nightlyRate: effectiveNightlyRate,
      originalPrice: isTwelveHourStay ? effectiveNightlyRate : property.originalPrice,
      serviceFeeRate: feeRate,
      feeMode,
      fixedFeeAmountSar,
      vatRate,
      category: property.category,
    });
  }, [
    baseStayRate,
    resolvedRates.billableUnits,
    effectiveNightlyRate,
    isTwelveHourStay,
    property.originalPrice,
    feeRate,
    feeMode,
    fixedFeeAmountSar,
    vatRate,
    property.category,
  ]);

  const estimatedTotal = previewPricing.total;
  const originalNightly = hasDiscount ? property.originalPrice! : effectiveNightlyRate;
  const originalSubtotal = Math.round(originalNightly * resolvedRates.billableUnits * 100) / 100;
  const offerDiscountAmount = Math.max(0, Math.round((originalSubtotal - baseStayRate) * 100) / 100);
  const currencyLabel = language === "ar" ? "ر.س" : "SAR";
  const riyalLabel = currencyLabel;
  const splitInstallment = (previewPricing.total / 4).toFixed(2);

  return {
    isTwelveHourStay,
    hasDiscount,
    discountPercent,
    effectiveNightlyRate,
    isWeekendRate,
    baseStayRate,
    previewPricing,
    estimatedTotal,
    originalNightly,
    originalSubtotal,
    offerDiscountAmount,
    currencyLabel,
    riyalLabel,
    splitInstallment,
    isLiveSynced,
  };
}
