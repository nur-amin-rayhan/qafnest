/**
 * Automated Verification Script for QafNest Time-Slot Availability System
 * Tests:
 * 1. Hourly time-slot overlap engine & same-day turnover logic
 * 2. 12:00 PM checkout cutoff transitions & available checkin slots
 * 3. Daily property live status calculation before vs after 12:00 PM cutoff
 * 4. API endpoint /api/properties/:id/availability response schema
 * 5. API endpoint /api/payments/checkout validation with time-slots
 */

import {
  doTimeSlotsOverlap,
  validateTimeSlotBooking,
  getAvailableCheckinSlots,
  getPropertyLiveDailyStatus,
  CHECKIN_TIME_SLOTS,
  CHECKOUT_TIME_SLOTS,
  DEFAULT_CHECKOUT_CUTOFF,
} from "../packages/shared/timeSlots.ts";

async function runTests() {
  console.log("========================================================");
  console.log("🕒 QAFNEST HOURLY TIME-SLOT AVAILABILITY TEST SUITE");
  console.log("========================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✖ FAIL: ${message}`);
      failed++;
    }
  }

  // --- UNIT TESTS: SHARED TIME-SLOT ENGINE ---
  console.log("\n--- SECTION 1: HOURLY INTERVAL OVERLAP DETECTION ---");

  const existingBooking = {
    checkIn: "2026-12-01",
    checkOut: "2026-12-05",
    checkinTime: "15:00",
    checkoutTime: "12:00",
    bookingRef: "QAF-EXISTING-01",
    status: "confirmed",
  };

  // 1. Same-day check-in on checkout date at 15:00 (AFTER 12:00 PM cutoff)
  const sameDayValidCandidate = {
    checkIn: "2026-12-05",
    checkOut: "2026-12-08",
    checkinTime: "15:00",
    checkoutTime: "12:00",
  };
  const overlapsSameDay = doTimeSlotsOverlap(existingBooking, sameDayValidCandidate);
  assert(!overlapsSameDay, "Check-in on checkout day at 15:00 does NOT overlap with 12:00 checkout");

  const validationSameDay = validateTimeSlotBooking(sameDayValidCandidate, [existingBooking]);
  assert(validationSameDay.isAvailable, "Validation confirms booking is AVAILABLE for check-in on checkout day at 15:00");

  // 2. Same-day check-in on checkout date at 10:00 (BEFORE 12:00 PM cutoff)
  const sameDayEarlyCandidate = {
    checkIn: "2026-12-05",
    checkOut: "2026-12-08",
    checkinTime: "10:00",
    checkoutTime: "12:00",
  };
  const overlapsEarly = doTimeSlotsOverlap(existingBooking, sameDayEarlyCandidate);
  assert(overlapsEarly, "Check-in on checkout day at 10:00 DOES overlap with 12:00 checkout");

  const validationEarly = validateTimeSlotBooking(sameDayEarlyCandidate, [existingBooking]);
  assert(!validationEarly.isAvailable, "Validation marks 10:00 check-in as UNAVAILABLE on checkout day");
  assert(
    validationEarly.conflictReason === "prior_guest_not_checked_out",
    "Conflict reason accurately identifies prior guest not checked out"
  );
  assert(
    validationEarly.conflictMessageEn && validationEarly.conflictMessageEn.includes("12:00"),
    "Localized English conflict message mentions 12:00 PM cutoff"
  );
  assert(
    validationEarly.conflictMessageAr && validationEarly.conflictMessageAr.includes("12:00"),
    "Localized Arabic conflict message mentions 12:00 PM cutoff"
  );

  // 3. Middle-of-stay check-in (fully occupied)
  const insideOccupiedCandidate = {
    checkIn: "2026-12-03",
    checkOut: "2026-12-06",
    checkinTime: "15:00",
    checkoutTime: "12:00",
  };
  const validationOccupied = validateTimeSlotBooking(insideOccupiedCandidate, [existingBooking]);
  assert(!validationOccupied.isAvailable, "Candidate booking during existing stay is rejected");
  assert(validationOccupied.conflictReason === "dates_fully_occupied", "Conflict reason is dates_fully_occupied");

  // --- SECTION 2: CHECKOUT DAY TIME-SLOT FILTERING ---
  console.log("\n--- SECTION 2: AVAILABLE CHECK-IN SLOTS ON CHECKOUT DAYS ---");

  const slotsOnCheckoutDay = getAvailableCheckinSlots("2026-12-05", [existingBooking], [
    "10:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
    "16:00",
  ]);
  assert(
    !slotsOnCheckoutDay.includes("10:00") && !slotsOnCheckoutDay.includes("11:00"),
    "Slots prior to 12:00 PM cutoff (10:00, 11:00) are filtered out"
  );
  assert(
    slotsOnCheckoutDay.includes("12:00") && slotsOnCheckoutDay.includes("14:00") && slotsOnCheckoutDay.includes("15:00"),
    "Slots at or after 12:00 PM (12:00, 14:00, 15:00) are available"
  );

  const slotsOnOccupiedNight = getAvailableCheckinSlots("2026-12-03", [existingBooking]);
  assert(slotsOnOccupiedNight.length === 0, "No check-in slots available on fully occupied night");

  // --- SECTION 3: DAILY PROPERTY STATUS TRANSITION ---
  console.log("\n--- SECTION 3: REAL-TIME DAILY STATUS TRANSITIONS ---");

  // A. Checkout day at 11:00 AM (660 minutes) - before cutoff
  const statusBeforeCutoff = getPropertyLiveDailyStatus("2026-12-05", [existingBooking], 660, "12:00");
  assert(statusBeforeCutoff.isCheckoutDay, "Accurately identifies date as checkout day");
  assert(statusBeforeCutoff.isCurrentlyOccupied, "Before 12:00 PM cutoff, property is currently occupied");
  assert(!statusBeforeCutoff.isAvailableForCheckin, "Before 12:00 PM cutoff, property is not yet available for check-in");
  assert(
    statusBeforeCutoff.statusLabelEn.includes("Occupied (Checking out at 12:00 PM)"),
    "English status label indicates occupied checking out at 12:00 PM"
  );

  // B. Checkout day at 12:30 PM (750 minutes) - after cutoff
  const statusAfterCutoff = getPropertyLiveDailyStatus("2026-12-05", [existingBooking], 750, "12:00");
  assert(statusAfterCutoff.isCheckoutDay, "Still identifies date as checkout day");
  assert(!statusAfterCutoff.isCurrentlyOccupied, "After 12:00 PM cutoff, property is NO LONGER occupied");
  assert(statusAfterCutoff.isAvailableForCheckin, "After 12:00 PM cutoff, property TRANSITIONS TO AVAILABLE for check-in");
  assert(
    statusAfterCutoff.statusLabelEn.includes("Available (Checkout completed at 12:00 PM)"),
    "English status label confirms checkout completed at 12:00 PM cutoff"
  );
  assert(
    statusAfterCutoff.statusLabelAr.includes("متاح (تمت المغادرة بعد 12:00 م)"),
    "Arabic status label confirms checkout completed at 12:00 PM cutoff"
  );

  // --- SECTION 4: LIVE HTTP API INTEGRATION ---
  console.log("\n--- SECTION 4: LIVE AVAILABILITY API CHECK ---");

  try {
    const res = await fetch("http://localhost:3000/api/properties/kidia-falcon-ridge/availability");
    assert(res.status === 200, "GET /api/properties/:id/availability returns HTTP 200");
    const json = await res.json();
    assert(Array.isArray(json.checkoutDates), "API response contains checkoutDates array");
    assert(typeof json.checkoutCutoff === "string", "API response contains checkoutCutoff");
    assert(Array.isArray(json.timeSlotBookings), "API response contains timeSlotBookings array");
    assert(json.todayStatus && typeof json.todayStatus.isCheckoutDay === "boolean", "API response contains todayStatus object");
  } catch (err) {
    console.warn("Notice: Local server check skipped or unreachable:", err.message);
  }

  // --- SECTION 5: CHECKOUT RATE CALCULATION & CONFLICT ENFORCEMENT ---
  console.log("\n--- SECTION 5: BACKEND CHECKOUT RATE & CONFLICT ENFORCEMENT ---");

  const { checkDatesAndCalculateRate } = await import("../apps/guest/src/lib/services/checkoutHelpers.ts");

  const createMockDb = (existingBookingsList) => ({
    from: (table) => {
      if (table === "bookings") {
        return {
          select: () => ({
            eq: () => ({
              lte: () => ({
                gte: () => ({
                  or: () => Promise.resolve({ data: existingBookingsList }),
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            gte: () => ({
              lt: () => Promise.resolve({ data: [] }),
            }),
          }),
        }),
      };
    },
  });

  const mockExisting = [
    {
      id: "b1",
      check_in: "2026-12-01",
      check_out: "2026-12-05",
      checkin_time: "15:00:00",
      checkout_time: "12:00:00",
      status: "confirmed",
      guest_id: "other-guest",
      auth_subject: "other-sub",
      created_at: new Date().toISOString(),
      booking_reference: "QAF-001",
    },
  ];

  // Test 5.1: Same-day check-in at 15:00 on checkout day (2026-12-05) -> ALLOWED
  const resValid = await checkDatesAndCalculateRate({
    checkIn: "2026-12-05",
    checkOut: "2026-12-08",
    checkinTime: "15:00",
    checkoutTime: "12:00",
    nights: 3,
    resolvedDbPropertyId: "test-prop",
    propWeekdayPrice: 500,
    propWeekendPrice: 600,
    propBasePrice: 500,
    supabase: createMockDb(mockExisting),
  });
  assert(!resValid.error, "Check-in on checkout date at 15:00 produces no conflict error");
  assert(resValid.baseStayRate > 0, "Check-in on checkout date at 15:00 successfully calculates baseStayRate");

  // Test 5.2: Same-day check-in at 10:00 (before 12:00 PM cutoff) -> REJECTED with 409
  const resEarlyConflict = await checkDatesAndCalculateRate({
    checkIn: "2026-12-05",
    checkOut: "2026-12-08",
    checkinTime: "10:00",
    checkoutTime: "12:00",
    nights: 3,
    resolvedDbPropertyId: "test-prop",
    propWeekdayPrice: 500,
    propWeekendPrice: 600,
    propBasePrice: 500,
    supabase: createMockDb(mockExisting),
  });
  assert(Boolean(resEarlyConflict.error), "Check-in on checkout date at 10:00 triggers conflict error");
  assert(resEarlyConflict.error?.code === "checkout_cutoff_conflict", "Error code is specifically checkout_cutoff_conflict");
  assert(resEarlyConflict.error?.status === 409, "Conflict returns HTTP status 409");
  assert(
    resEarlyConflict.error?.message?.includes("12:00"),
    "English message informs user that check-in is available after 12:00 PM"
  );
  assert(
    resEarlyConflict.error?.messageAr?.includes("12:00"),
    "Arabic message informs user that check-in is available after 12:00 PM"
  );

  console.log("\n========================================================");
  console.log(`📊 TIME-SLOT AVAILABILITY TEST SUMMARY:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log("========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
