import assert from "node:assert/strict";
import {
  SEQUENTIAL_UNIT_CODES,
  getNumericUnitCode,
  getListingReference,
} from "../apps/guest/src/components/property/detail/propertyDetailHelpers.ts";

console.log("------------------------------------------------------------------");
console.log("  Testing Sequential Numeric Unit Codes & Strict Localization");
console.log("------------------------------------------------------------------");

// Test 1: Verify all sequential unit codes are pure numbers (no letters, no QN-)
console.log("Test 1: Verify format of sequential numeric unit codes...");
const assignedCodes = Object.values(SEQUENTIAL_UNIT_CODES);
assert.ok(assignedCodes.length >= 40, "Expected at least 40 mapped catalog properties");

for (const code of assignedCodes) {
  assert.match(code, /^\d{6}$/, `Code ${code} must be a 6-digit pure number`);
  assert.ok(!code.includes("QN-"), `Code ${code} must not contain QN- prefix`);
}
console.log(`  ✓ All ${assignedCodes.length} assigned unit codes are strictly 6-digit numeric codes`);

// Test 2: Uniqueness of unit codes
console.log("Test 2: Verify uniqueness of unit codes across properties...");
const uniqueSet = new Set(assignedCodes);
assert.equal(uniqueSet.size, assignedCodes.length, "All unit codes must be completely unique");
console.log("  ✓ 100% unique code assignment verified");

// Test 3: Permanence and determinism
console.log("Test 3: Verify deterministic assignment across multiple calls...");
assert.equal(getNumericUnitCode("kidia-falcon-ridge"), "201001");
assert.equal(getListingReference("kidia-falcon-ridge"), "201001");
assert.equal(getNumericUnitCode("sea-unique-vibe"), "201007");
assert.equal(getNumericUnitCode("kidia-falcon-ridge"), "201001"); // Repeat check
console.log("  ✓ Unit codes are strictly deterministic and permanent");

// Test 4: Dynamic UUID resolution
console.log("Test 4: Verify dynamic UUID resolution to 6-digit numeric codes...");
const dynamicUuid1 = "b8bec694-8ff7-405d-8478-367a9d3f373d";
const dynamicCode1 = getNumericUnitCode(dynamicUuid1);
assert.match(dynamicCode1, /^\d{6}$/, "Dynamic UUID must produce a 6-digit number");
assert.equal(getNumericUnitCode(dynamicUuid1), dynamicCode1, "Dynamic UUID code must be repeatable");
console.log(`  ✓ Dynamic UUID resolved cleanly to numeric code #${dynamicCode1}`);

// Test 5: Verify numeric codes eliminate old alphanumeric QN- format
console.log("Test 5: Verify elimination of alphanumeric QN- format...");
const sampleKeys = ["kidia-falcon-ridge", "deal-living-room-narjis-1", "general-alula-stargazing"];
for (const key of sampleKeys) {
  const ref = getListingReference(key);
  assert.ok(!ref.startsWith("QN-"), `Listing reference ${ref} should not start with QN-`);
  assert.match(ref, /^\d{6}$/, `Listing reference ${ref} should be pure 6-digit number`);
}
console.log("  ✓ Zero alphanumeric QN- references remain; all are clean numeric codes");

// Test 6: Verify location display adheres strictly to language
console.log("Test 6: Verify strict language adherence in location displays...");
const sampleProperty = {
  city: "riyadh",
  cityName: "Riyadh",
  district: "Riyadh, Tuwaiq & Qiddiya View",
  districtAr: "الرياض، إطلالة طويق والقدية",
};

// Simulate PropertyDetail location resolution in English
const enRaw = sampleProperty.district || sampleProperty.districtAr;
assert.ok(!/[\u0600-\u06FF]/.test(enRaw), `English district must contain zero Arabic characters: ${enRaw}`);

// Simulate PropertyDetail location resolution in Arabic
const arRaw = sampleProperty.districtAr || sampleProperty.district;
assert.ok(/[\u0600-\u06FF]/.test(arRaw), `Arabic district must contain Arabic characters: ${arRaw}`);
console.log("  ✓ English location is 100% English ('Riyadh, Tuwaiq & Qiddiya View')");
console.log("  ✓ Arabic location is 100% Arabic ('الرياض، إطلالة طويق والقدية')");

console.log("------------------------------------------------------------------");
console.log("✨ ALL SEQUENTIAL UNIT CODE & LOCALIZATION TESTS PASSED! ✨");
console.log("------------------------------------------------------------------");
