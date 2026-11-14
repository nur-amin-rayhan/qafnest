/**
 * Granular 7-Day & Date-Specific Pricing Engine for QafNest.
 * Enforces hierarchical rate resolution:
 * 1. Individual Calendar Date Override (highest precedence)
 * 2. Day-of-the-Week Granular Rate (Sunday - Saturday)
 * 3. Master Base Price (automatic fallback for unconfigured dates)
 */

export type DayOfWeek =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export const DAY_OF_WEEK_NAMES: readonly DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const DAY_LABELS: Record<DayOfWeek, { en: string; ar: string; shortEn: string; shortAr: string }> = {
  sunday: { en: "Sunday", ar: "الأحد", shortEn: "Sun", shortAr: "أحد" },
  monday: { en: "Monday", ar: "الاثنين", shortEn: "Mon", shortAr: "إثنين" },
  tuesday: { en: "Tuesday", ar: "الثلاثاء", shortEn: "Tue", shortAr: "ثلاثاء" },
  wednesday: { en: "Wednesday", ar: "الأربعاء", shortEn: "Wed", shortAr: "أربعاء" },
  thursday: { en: "Thursday", ar: "الخميس", shortEn: "Thu", shortAr: "خميس" },
  friday: { en: "Friday", ar: "الجمعة", shortEn: "Fri", shortAr: "جمعة" },
  saturday: { en: "Saturday", ar: "السبت", shortEn: "Sat", shortAr: "سبت" },
};

export interface GranularWeeklyPricing {
  sunday?: number | null;
  monday?: number | null;
  tuesday?: number | null;
  wednesday?: number | null;
  thursday?: number | null;
  friday?: number | null;
  saturday?: number | null;
}

export type RateSource =
  | "date_override"
  | "day_of_week"
  | "weekend_weekday"
  | "base_rate";

export interface GranularPricingOptions {
  masterBasePrice: number;
  weeklyPricing?: GranularWeeklyPricing | null;
  weekdayPrice?: number | null;
  weekendPrice?: number | null;
  dateOverrides?: Record<string, number> | null;
}

export interface NightlyRateDetail {
  date: string;
  dayName: DayOfWeek;
  dayLabelEn: string;
  dayLabelAr: string;
  rate: number;
  source: RateSource;
}

export interface GranularStayCalculation {
  totalStayRate: number;
  averageNightlyRate: number;
  nightsCount: number;
  nightlyBreakdown: NightlyRateDetail[];
}

export function getDayOfWeekFromIso(dateIso: string): DayOfWeek {
  const [y, m, d] = dateIso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayIdx = date.getUTCDay();
  return DAY_OF_WEEK_NAMES[dayIdx];
}

export function isSaudiWeekend(day: DayOfWeek): boolean {
  return day === "thursday" || day === "friday" || day === "saturday";
}

/**
 * Resolves the effective nightly price for an individual date following the strict precedence:
 * Date Override -> Day of Week -> Weekday/Weekend fallback -> Master Base Rate.
 */
export function getEffectiveNightlyRateForDate(
  dateIso: string,
  options: GranularPricingOptions
): NightlyRateDetail {
  const dayName = getDayOfWeekFromIso(dateIso);
  const labels = DAY_LABELS[dayName];
  const masterBase = Number(options.masterBasePrice) || 0;

  // 1. Level 1: Individual Calendar Date Override
  if (
    options.dateOverrides &&
    typeof options.dateOverrides[dateIso] === "number" &&
    options.dateOverrides[dateIso] > 0
  ) {
    return {
      date: dateIso,
      dayName,
      dayLabelEn: labels.en,
      dayLabelAr: labels.ar,
      rate: Math.round(options.dateOverrides[dateIso] * 100) / 100,
      source: "date_override",
    };
  }

  // 2. Level 2: Specific Day-of-the-Week Granular Rate
  if (options.weeklyPricing) {
    const dayRate = options.weeklyPricing[dayName];
    if (typeof dayRate === "number" && dayRate > 0) {
      return {
        date: dateIso,
        dayName,
        dayLabelEn: labels.en,
        dayLabelAr: labels.ar,
        rate: Math.round(dayRate * 100) / 100,
        source: "day_of_week",
      };
    }
  }

  // 3. Level 2b: Weekend / Weekday Fallback Rate
  const isWeekend = isSaudiWeekend(dayName);
  if (isWeekend && typeof options.weekendPrice === "number" && options.weekendPrice > 0) {
    return {
      date: dateIso,
      dayName,
      dayLabelEn: labels.en,
      dayLabelAr: labels.ar,
      rate: Math.round(options.weekendPrice * 100) / 100,
      source: "weekend_weekday",
    };
  }
  if (!isWeekend && typeof options.weekdayPrice === "number" && options.weekdayPrice > 0) {
    return {
      date: dateIso,
      dayName,
      dayLabelEn: labels.en,
      dayLabelAr: labels.ar,
      rate: Math.round(options.weekdayPrice * 100) / 100,
      source: "weekend_weekday",
    };
  }

  // 4. Level 3: Master Base Price (Default)
  return {
    date: dateIso,
    dayName,
    dayLabelEn: labels.en,
    dayLabelAr: labels.ar,
    rate: Math.round(masterBase * 100) / 100,
    source: "base_rate",
  };
}

/**
 * Calculates total stay rate and itemized breakdown across all stay dates.
 */
export function calculateGranularStayRate(
  checkIn: string,
  nights: number,
  options: GranularPricingOptions
): GranularStayCalculation {
  const nightsCount = Math.max(1, Math.round(nights));
  const [year, month, day] = checkIn.split("-").map(Number);
  const startTimestamp = Date.UTC(year, month - 1, day);

  const nightlyBreakdown: NightlyRateDetail[] = [];
  let totalStayRate = 0;

  for (let i = 0; i < nightsCount; i++) {
    const currentNightDate = new Date(startTimestamp + i * 86_400_000);
    const yStr = currentNightDate.getUTCFullYear();
    const mStr = String(currentNightDate.getUTCMonth() + 1).padStart(2, "0");
    const dStr = String(currentNightDate.getUTCDate()).padStart(2, "0");
    const dateIso = `${yStr}-${mStr}-${dStr}`;

    const detail = getEffectiveNightlyRateForDate(dateIso, options);
    nightlyBreakdown.push(detail);
    totalStayRate += detail.rate;
  }

  const roundedTotal = Math.round(totalStayRate * 100) / 100;
  const averageNightlyRate = Math.round((roundedTotal / nightsCount) * 100) / 100;

  return {
    totalStayRate: roundedTotal,
    averageNightlyRate,
    nightsCount,
    nightlyBreakdown,
  };
}

