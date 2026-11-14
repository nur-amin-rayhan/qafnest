import assert from "node:assert/strict";
import {
  getDayOfWeekFromIso,
  isSaudiWeekend,
  getEffectiveNightlyRateForDate,
  calculateGranularStayRate,
  DAY_OF_WEEK_NAMES,
  DAY_LABELS,
} from "../packages/shared/pricingEngine.ts";

console.log("------------------------------------------------------------------");
console.log("  Testing Granular 7-Day & Calendar Date Pricing Engine");
console.log("------------------------------------------------------------------");

// Test 1: Day of week resolution from ISO string
console.log("Test 1: Verify day-of-week parsing from ISO date string...");
assert.equal(getDayOfWeekFromIso("2026-11-08"), "sunday");
assert.equal(getDayOfWeekFromIso("2026-11-09"), "monday");
assert.equal(getDayOfWeekFromIso("2026-11-10"), "tuesday");
assert.equal(getDayOfWeekFromIso("2026-11-11"), "wednesday");
assert.equal(getDayOfWeekFromIso("2026-11-12"), "thursday");
assert.equal(getDayOfWeekFromIso("2026-11-13"), "friday");
assert.equal(getDayOfWeekFromIso("2026-11-14"), "saturday");
console.log("  ✓ All 7 days correctly derived in UTC");

// Test 2: Fallback to Master Base Price when no day-of-week or date override exists
console.log("Test 2: Verify automatic fallback to Master Base Price...");
const baseOnlyResult = getEffectiveNightlyRateForDate("2026-11-09", {
  masterBasePrice: 500,
});
assert.equal(baseOnlyResult.rate, 500);
assert.equal(baseOnlyResult.source, "base_rate");
assert.equal(baseOnlyResult.dayName, "monday");
console.log("  ✓ Unconfigured dates cleanly default to Master Base Price (500 SAR)");

// Test 3: Day-of-week granular price precedence over base price
console.log("Test 3: Verify day-of-week rate overrides master base rate...");
const weeklyConfig = {
  sunday: 450,
  monday: 450,
  tuesday: 480,
  wednesday: 480,
  thursday: 750,
  friday: 900,
  saturday: 700,
};

const fridayResult = getEffectiveNightlyRateForDate("2026-11-13", {
  masterBasePrice: 500,
  weeklyPricing: weeklyConfig,
});
assert.equal(fridayResult.rate, 900);
assert.equal(fridayResult.source, "day_of_week");
assert.equal(fridayResult.dayName, "friday");

const mondayResult = getEffectiveNightlyRateForDate("2026-11-09", {
  masterBasePrice: 500,
  weeklyPricing: weeklyConfig,
});
assert.equal(mondayResult.rate, 450);
assert.equal(mondayResult.source, "day_of_week");
console.log("  ✓ Day-of-week rates (Friday: 900, Monday: 450) correctly take precedence over base (500)");

// Test 4: Partial 7-day pricing: unconfigured days fallback to master base price
console.log("Test 4: Verify partial 7-day pricing defaults unconfigured days to base price...");
const partialWeekly = {
  friday: 1100,
  thursday: 950,
  // Other days unconfigured / undefined
};

const unconfiguredTuesday = getEffectiveNightlyRateForDate("2026-11-10", {
  masterBasePrice: 600,
  weeklyPricing: partialWeekly,
});
assert.equal(unconfiguredTuesday.rate, 600);
assert.equal(unconfiguredTuesday.source, "base_rate");

const configuredThursday = getEffectiveNightlyRateForDate("2026-11-12", {
  masterBasePrice: 600,
  weeklyPricing: partialWeekly,
});
assert.equal(configuredThursday.rate, 950);
assert.equal(configuredThursday.source, "day_of_week");
console.log("  ✓ Configured day (Thu: 950) used, while unconfigured day (Tue) seamlessly defaults to base (600)");

// Test 5: Level 1 Calendar Date Override has highest precedence over everything
console.log("Test 5: Verify Calendar Date Override takes highest precedence...");
const dateOverrides = {
  "2026-11-13": 1500, // Friday with special festival/holiday rate
  "2026-11-09": 300,  // Monday flash discount
};

// 2026-11-13 has day-of-week 1100 and master base 600, but date override is 1500
const overrideFriday = getEffectiveNightlyRateForDate("2026-11-13", {
  masterBasePrice: 600,
  weeklyPricing: partialWeekly,
  dateOverrides,
});
assert.equal(overrideFriday.rate, 1500);
assert.equal(overrideFriday.source, "date_override");

// 2026-11-09 has unconfigured day-of-week and base 600, but date override is 300
const overrideMonday = getEffectiveNightlyRateForDate("2026-11-09", {
  masterBasePrice: 600,
  weeklyPricing: partialWeekly,
  dateOverrides,
});
assert.equal(overrideMonday.rate, 300);
assert.equal(overrideMonday.source, "date_override");
console.log("  ✓ Date overrides (1500 on Friday, 300 on Monday) take precedence over weekly and base rates");

// Test 6: Multi-night stay rate calculation with mixed pricing rules
console.log("Test 6: Verify calculateGranularStayRate across multi-night stay...");
// 3-night stay:
// 2026-11-12 (Thursday): configured in partialWeekly -> 950
// 2026-11-13 (Friday): date override -> 1500
// 2026-11-14 (Saturday): unconfigured -> defaults to masterBasePrice 600
const stayCalc = calculateGranularStayRate("2026-11-12", 3, {
  masterBasePrice: 600,
  weeklyPricing: partialWeekly,
  dateOverrides,
});

assert.equal(stayCalc.nightsCount, 3);
assert.equal(stayCalc.totalStayRate, 950 + 1500 + 600); // 3050
assert.equal(stayCalc.averageNightlyRate, 1016.67);
assert.equal(stayCalc.nightlyBreakdown[0].rate, 950);
assert.equal(stayCalc.nightlyBreakdown[0].source, "day_of_week");
assert.equal(stayCalc.nightlyBreakdown[1].rate, 1500);
assert.equal(stayCalc.nightlyBreakdown[1].source, "date_override");
assert.equal(stayCalc.nightlyBreakdown[2].rate, 600);
assert.equal(stayCalc.nightlyBreakdown[2].source, "base_rate");
console.log("  ✓ Total stay calculation correctly computed 3,050 SAR (950 + 1500 + 600) with detailed breakdown");

// Test 7: Fallback to weekend/weekday prices when granular day-of-week is null
console.log("Test 7: Verify fallback to legacy weekday/weekend prices if weeklyPricing is absent...");
const legacyFallback = getEffectiveNightlyRateForDate("2026-11-13", { // Friday (weekend)
  masterBasePrice: 500,
  weekdayPrice: 480,
  weekendPrice: 720,
});
assert.equal(legacyFallback.rate, 720);
assert.equal(legacyFallback.source, "weekend_weekday");
console.log("  ✓ Correct fallback to weekend price (720)");

console.log("------------------------------------------------------------------");
console.log("✨ ALL 7 GRANULAR PRICING TESTS PASSED FLAWLESSLY! ✨");
console.log("------------------------------------------------------------------");
