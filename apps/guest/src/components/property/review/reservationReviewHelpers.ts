import { getPropertyCapacity, getStayTotal, type Property } from "@/data/properties";
import { propertyDetailHref } from "@/lib/propertyUrls";
import {
  computeSlotAwareStayRate,
  isSameDayTwelveHourStay,
  sanitizePropertySlotConfig,
  type PropertyBookingSlotConfig,
} from "@qafnest/shared";
import {
  getLocalizedPropertyLocation,
  getLocalizedPropertyTitle,
  getLocalizedCategoryName,
  type Locale,
} from "@/lib/localization/localeHelper";

export function resolveStayImages(property: Property): string[] {
  const valid = (property.images || []).filter(
    (img): img is string => typeof img === "string" && img.trim().length > 0
  );
  if (valid.length > 0) return valid;
  if (property.image && property.image.trim().length > 0) return [property.image];
  return ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"];
}

export function resolveStayLocalization(property: Property, language: string) {
  const locale: Locale = language === "ar" ? "ar" : "en";
  const title = getLocalizedPropertyTitle(property, locale);
  const category = getLocalizedCategoryName(property.category, locale);
  const { city, district, location } = getLocalizedPropertyLocation(property, locale);
  const capacity = getPropertyCapacity(property);

  return { title, category, city, district, location, capacity };
}

export function calculateNights(checkinDate?: string, checkoutDate?: string): number {
  if (!checkinDate || !checkoutDate) return 1;
  const start = Date.parse(`${checkinDate}T00:00:00Z`);
  const end = Date.parse(`${checkoutDate}T00:00:00Z`);
  const duration = Math.ceil((end - start) / 86_400_000);
  return Number.isFinite(duration) && duration > 0 ? duration : 1;
}

export function calculateStayPricing(
  property: Property,
  bookingCheckinDate: string,
  nights: number,
  pricingTotal: number | null,
  language: string,
  options?: {
    checkoutDate?: string;
    checkinTime?: string;
    checkoutTime?: string;
    slotConfig?: PropertyBookingSlotConfig | null;
    dateOverrides?: Record<string, number>;
  }
) {
  let isTwelveHour = false;
  let baseStayRate = getStayTotal(property, bookingCheckinDate, nights, {
    dateOverrides: options?.dateOverrides,
  });

  if (
    options?.checkoutDate &&
    isSameDayTwelveHourStay({
      checkIn: bookingCheckinDate,
      checkOut: options.checkoutDate,
      checkinTime: options.checkinTime,
      checkoutTime: options.checkoutTime,
    })
  ) {
    isTwelveHour = true;
    const weeklyPricing = property.customDayPricing || {
      sunday: property.sundayPrice,
      monday: property.mondayPrice,
      tuesday: property.tuesdayPrice,
      wednesday: property.wednesdayPrice,
      thursday: property.thursdayPrice,
      friday: property.fridayPrice,
      saturday: property.saturdayPrice,
    };
    const rawEmbedded = (property.customDayPricing as Record<string, unknown>)?.__slotConfig;
    const embeddedSlotConfig =
      rawEmbedded && typeof rawEmbedded === "object"
        ? sanitizePropertySlotConfig(rawEmbedded, property.id, property.slug)
        : null;
    const effectiveSlotConfig = options?.slotConfig || embeddedSlotConfig || undefined;

    const slotCalc = computeSlotAwareStayRate({
      checkIn: bookingCheckinDate,
      checkOut: options.checkoutDate,
      checkinTime: options.checkinTime,
      checkoutTime: options.checkoutTime,
      pricingOptions: {
        masterBasePrice: property.basePrice,
        weeklyPricing,
        weekendPrice: property.weekendPrice,
        dateOverrides: options?.dateOverrides || property.dateOverrides || null,
      },
      slotConfig: effectiveSlotConfig,
    });
    baseStayRate = slotCalc.baseStayRate;
  }

  const total = pricingTotal !== null ? pricingTotal : baseStayRate;
  const originalTotal = isTwelveHour
    ? baseStayRate
    : (property.originalPrice || property.basePrice) * nights;
  const hasDiscount = isTwelveHour ? false : originalTotal > baseStayRate;
  const installmentAmount = (total / 4).toLocaleString(
    language === "ar" ? "ar-SA" : "en-SA",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );
  const installmentPrice = `${installmentAmount} ${
    language === "ar" ? "ر.س" : "SAR"
  }`;

  return { baseStayRate, total, originalTotal, hasDiscount, installmentPrice, isTwelveHourStay: isTwelveHour };
}

export function buildEditStayHref(
  propertyId: string,
  searchParamString: string,
  checkin: string,
  checkout: string,
  checkinTime: string,
  checkoutTime: string,
  guests: number
): string {
  const params = new URLSearchParams(searchParamString);
  params.set("check_in", checkin);
  params.set("check_out", checkout);
  params.set("check_in_time", checkinTime);
  params.set("check_out_time", checkoutTime);
  params.set("guests", String(guests));
  return propertyDetailHref(propertyId, params);
}

