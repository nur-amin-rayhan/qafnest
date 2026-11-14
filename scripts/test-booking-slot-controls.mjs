import fs from "fs";
import path from "path";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  computeSlotAwareStayRate,
  deriveHostManualBlockedDates,
  getCalendarDaySlotSummary,
  validateTimeSlotBooking,
} from "../packages/shared/index.ts";
import {
  acquirePropertyBookingLock,
  getServerPropertySlotConfig,
  updateServerPropertySlotConfig,
} from "../packages/shared/bookingSlotStore.ts";
import { calculatePricingBreakdown } from "../apps/guest/src/lib/services/pricing.ts";
import { checkDatesAndCalculateRate } from "../apps/guest/src/lib/services/checkoutHelpers.ts";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`PASS: ${msg}`);
    passed++;
  } else {
    console.error(`FAIL: ${msg}`);
    failed++;
  }
}

async function run() {
  console.log("=== QAFNEST SLOT CONTROLS, SPLIT CALENDAR & CONCURRENCY VERIFICATION ===");

  assert(DEFAULT_CHECKIN_TIME === "16:00", "Default check-in time is 16:00 (4:00 PM)");
  assert(DEFAULT_CHECKOUT_TIME === "12:00", "Default check-out time is 12:00 (12:00 PM)");

  const testPropId = "slot-test-prop-001";
  const testSlug = "slot-test-chalet";
  const storeFilePath = path.join(process.cwd(), "packages", "shared", "data", "booking-slot-configs.json");
  const hadStoreBefore = fs.existsSync(storeFilePath);
  const storeBackup = hadStoreBefore ? fs.readFileSync(storeFilePath, "utf-8") : null;

  try {
    // 1. Half-day split checkout scenario (Guest A: Dec 9 4PM -> Dec 10 12PM)
    const bookingA = {
      checkIn: "2026-12-09",
      checkOut: "2026-12-10",
      checkinTime: "16:00",
      checkoutTime: "12:00",
      bookingRef: "QAF-SPLIT-A",
      status: "confirmed",
    };

    const configOn = updateServerPropertySlotConfig({
      propertyId: testPropId,
      slug: testSlug,
      updates: {
        enableStandard4pmTo12pm: true,
        enableTwelveHour12amTo12pm: true,
        twelveHourPrice: 420,
        updatedBy: "host",
      },
    });

    const summaryDec10 = getCalendarDaySlotSummary({
      dateIso: "2026-12-10",
      existingBookings: [bookingA],
      slotConfig: configOn,
      effectiveStandardPrice: 700,
    });

    assert(summaryDec10.overallStatus === "split_checkout_open", "Dec 10 renders as split_checkout_open when checkout is 12:00 PM");
    assert(summaryDec10.morningStatus === "booked", "Dec 10 morning (12AM-12PM) marked booked until 12 PM checkout");
    assert(summaryDec10.eveningStatus === "available", "Dec 10 evening (4PM+) marked available for same-day check-in");

    // Booking Dec 10 00:00 -> 12:00 conflicts with Guest A's 12:00 checkout
    const morningAttempt = validateTimeSlotBooking(
      { checkIn: "2026-12-10", checkOut: "2026-12-10", checkinTime: "00:00", checkoutTime: "12:00" },
      [bookingA]
    );
    assert(!morningAttempt.isAvailable, "Morning 12AM-12PM attempt on Dec 10 is rejected due to 12 PM checkout");

    // Booking Dec 10 16:00 -> Dec 11 12:00 succeeds
    const eveningAttempt = validateTimeSlotBooking(
      { checkIn: "2026-12-10", checkOut: "2026-12-11", checkinTime: "16:00", checkoutTime: "12:00" },
      [bookingA]
    );
    assert(eveningAttempt.isAvailable, "Same-day afternoon 4:00 PM check-in on Dec 10 succeeds");

    // 2. Inverse split scenario: Guest B books Dec 15 4PM -> Dec 16 12PM, morning 12AM-12PM stays open
    const bookingB = {
      checkIn: "2026-12-15",
      checkOut: "2026-12-16",
      checkinTime: "16:00",
      checkoutTime: "12:00",
      bookingRef: "QAF-SPLIT-B",
      status: "confirmed",
    };

    const summaryDec15 = getCalendarDaySlotSummary({
      dateIso: "2026-12-15",
      existingBookings: [bookingB],
      slotConfig: configOn,
      effectiveStandardPrice: 700,
    });

    assert(summaryDec15.overallStatus === "split_checkin_open", "Dec 15 renders split_checkin_open (12AM-12PM open, 4PM+ booked)");
    assert(summaryDec15.morningStatus === "available", "Dec 15 morning 12h slot is open");
    assert(summaryDec15.eveningStatus === "booked", "Dec 15 evening 4PM+ slot is booked");

    // Manual 12-hour rate & platform service-fee-only pricing
    const slotRateCalc = computeSlotAwareStayRate({
      checkIn: "2026-12-15",
      checkOut: "2026-12-15",
      checkinTime: "00:00",
      checkoutTime: "12:00",
      pricingOptions: { masterBasePrice: 700 },
      slotConfig: configOn,
    });
    assert(slotRateCalc.baseStayRate === 420 && slotRateCalc.stayType === "twelve_hour_12am_12pm", "12h same-day stay uses manual Host rate (420 SAR)");

    const feeBreakdown = calculatePricingBreakdown({
      baseRate: slotRateCalc.baseStayRate,
      nights: 1,
      category: "chalet",
    });
    assert(feeBreakdown.baseRate === 420 && feeBreakdown.serviceFee > 0 && feeBreakdown.total > 420, "Platform computes service fee + VAT cleanly on manual 12h rate");

    // 3. Cross-portal Admin -> Guest toggle sync & Host block separation
    const configAdminOff = updateServerPropertySlotConfig({
      propertyId: testPropId,
      slug: testSlug,
      updates: { enableTwelveHour12amTo12pm: false, updatedBy: "admin" },
    });
    const guestLoadedConfig = getServerPropertySlotConfig({ propertyId: testPropId, slug: testSlug });
    assert(guestLoadedConfig.enableTwelveHour12amTo12pm === false, "Admin toggle OFF syncs immediately to Guest slot config");

    // 4. Backend checkoutHelpers validation: same-day 12h allowed when ON (even if property_availability marks Dec 15 night false from 4PM booking), rejected when OFF
    const makeMockDb = (bookingsStore, availabilityRows = [{ date: "2026-12-15", is_available: false, nightly_price: null }]) => ({
      from: (table) => {
        if (table === "bookings") {
          return {
            select: () => ({
              eq: () => ({
                lte: () => ({
                  gte: () => ({
                    or: async () => ({ data: [...bookingsStore] }),
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              gte: (col, gteVal) => ({
                lt: async (ltCol, ltVal) => ({
                  data: availabilityRows.filter((r) => r.date >= gteVal && r.date < ltVal),
                }),
              }),
            }),
          }),
        };
      },
    });

    const dbDec15 = [
      {
        id: "b-dec15",
        check_in: "2026-12-15",
        check_out: "2026-12-16",
        checkin_time: "16:00:00",
        checkout_time: "12:00:00",
        status: "confirmed",
        guest_id: "other-g",
        auth_subject: "other-sub",
        created_at: new Date().toISOString(),
        booking_reference: "QAF-SPLIT-B",
      },
    ];

    const rejectedWhenOff = await checkDatesAndCalculateRate({
      checkIn: "2026-12-15",
      checkOut: "2026-12-15",
      checkinTime: "00:00",
      checkoutTime: "12:00",
      nights: 1,
      resolvedDbPropertyId: testPropId,
      propWeekdayPrice: 700,
      propWeekendPrice: 700,
      propBasePrice: 700,
      slotConfig: configAdminOff,
      supabase: makeMockDb(dbDec15),
    });
    assert(rejectedWhenOff.error?.code === "slot_format_disabled", "Checkout rejects 12h slot when Admin/Host toggled it OFF");

    const allowedWhenOn = await checkDatesAndCalculateRate({
      checkIn: "2026-12-15",
      checkOut: "2026-12-15",
      checkinTime: "00:00",
      checkoutTime: "12:00",
      nights: 1,
      resolvedDbPropertyId: testPropId,
      propWeekdayPrice: 700,
      propWeekendPrice: 700,
      propBasePrice: 700,
      slotConfig: configOn,
      supabase: makeMockDb(dbDec15),
    });
    assert(!allowedWhenOn.error && allowedWhenOn.baseStayRate === 420, "Checkout allows 12h morning slot (420 SAR) alongside Dec 15 4PM booking when ON");

    // 5. Concurrent reservation lock prevents double-booking / overwrite
    const concurrentStore = [];
    const attemptConcurrentCheckout = async (guestTag) => {
      return acquirePropertyBookingLock([testPropId], async () => {
        const res = await checkDatesAndCalculateRate({
          checkIn: "2026-12-20",
          checkOut: "2026-12-21",
          checkinTime: "16:00",
          checkoutTime: "12:00",
          nights: 1,
          resolvedDbPropertyId: testPropId,
          propWeekdayPrice: 650,
          propWeekendPrice: 650,
          propBasePrice: 650,
          slotConfig: configOn,
          supabase: makeMockDb(concurrentStore, []),
          currentGuestId: guestTag,
          currentGuestSubject: guestTag,
        });
        if (res.error) return { ok: false, code: res.error.code };
        await new Promise((r) => setTimeout(r, 20));
        concurrentStore.push({
          id: guestTag,
          check_in: "2026-12-20",
          check_out: "2026-12-21",
          checkin_time: "16:00:00",
          checkout_time: "12:00:00",
          status: "pending",
          guest_id: guestTag,
          auth_subject: guestTag,
          created_at: new Date().toISOString(),
          booking_reference: `QAF-${guestTag}`,
        });
        return { ok: true, guestTag };
      });
    };

    const [r1, r2] = await Promise.all([
      attemptConcurrentCheckout("guest-1"),
      attemptConcurrentCheckout("guest-2"),
    ]);
    const winners = [r1, r2].filter((r) => r.ok);
    const blocked = [r1, r2].filter((r) => !r.ok);
    assert(winners.length === 1 && blocked.length === 1 && blocked[0].code === "dates_temporarily_held", "Concurrent lock strictly permits 1 guest and blocks 2nd with dates_temporarily_held");

    // 6. Manual vs booking night block separation
    const manualOnly = deriveHostManualBlockedDates(["2026-12-15", "2026-12-28"], [bookingB], configOn);
    assert(!manualOnly.includes("2026-12-15") && manualOnly.includes("2026-12-28"), "deriveHostManualBlockedDates keeps booking night 2026-12-15 separate from manual block 2026-12-28");

    // 7. Noor Villa / Named Property Host-to-Guest sync verification
    const noorVillaSlug = "noor-villa";
    const noorVillaUuid = "d3b00000-0000-4000-8000-000000000099";
    updateServerPropertySlotConfig({
      propertyId: noorVillaUuid,
      slug: noorVillaSlug,
      updates: {
        enableTwelveHour12amTo12pm: true,
        twelveHourPrice: 380,
        updatedBy: "host",
      },
    });

    const noorSyncedConfigBySlug = getServerPropertySlotConfig({
      propertyId: noorVillaSlug,
      slug: noorVillaSlug,
    });
    assert(noorSyncedConfigBySlug.enableTwelveHour12amTo12pm === true, "Noor Villa 12h slot is enabled when fetched by slug in Guest portal");
    assert(noorSyncedConfigBySlug.twelveHourPrice === 380, "Noor Villa manual 12h price is 380 SAR when fetched by slug in Guest portal");

    const noorStayRate = computeSlotAwareStayRate({
      checkIn: "2026-12-18",
      checkOut: "2026-12-18",
      checkinTime: "00:00",
      checkoutTime: "12:00",
      slotConfig: noorSyncedConfigBySlug,
      pricingOptions: { masterBasePrice: 750 },
    });
    assert(noorStayRate.baseStayRate === 380, "Noor Villa 12h stay rate correctly computes to 380 SAR instead of 750 SAR standard rate");

    // 8. Past dates closure verification (e.g., Nov 1 - Nov 9 when today is Nov 10)
    const mockRiyadhNow = {
      dateIso: "2026-11-10",
      timeString: "14:00",
      minutesNow: 840,
    };

    const pastSummaryNov05 = getCalendarDaySlotSummary({
      dateIso: "2026-11-05",
      existingBookings: [],
      slotConfig: noorSyncedConfigBySlug,
      hostBlockedDates: [],
      riyadhNow: mockRiyadhNow,
      effectiveStandardPrice: 750,
    });
    assert(pastSummaryNov05.isPast === true, "Past date 2026-11-05 is flagged as isPast = true");
    assert(pastSummaryNov05.overallStatus === "closed", "Past date 2026-11-05 overallStatus is strictly closed");
    assert(pastSummaryNov05.openWindows.length === 0, "Past date 2026-11-05 has zero open windows");
    assert(pastSummaryNov05.morningStatus === "disabled", "Past date 2026-11-05 morning status is disabled");
    assert(pastSummaryNov05.eveningStatus === "disabled", "Past date 2026-11-05 evening status is disabled");

    const pastSummaryNov09 = getCalendarDaySlotSummary({
      dateIso: "2026-11-09",
      existingBookings: [],
      slotConfig: noorSyncedConfigBySlug,
      hostBlockedDates: [],
      riyadhNow: mockRiyadhNow,
      effectiveStandardPrice: 750,
    });
    assert(pastSummaryNov09.isPast === true, "Past date 2026-11-09 is flagged as isPast = true");
    assert(pastSummaryNov09.overallStatus === "closed", "Past date 2026-11-09 overallStatus is strictly closed");
    assert(pastSummaryNov09.openWindows.length === 0, "Past date 2026-11-09 has zero open windows");

    const todaySummaryNov10 = getCalendarDaySlotSummary({
      dateIso: "2026-11-10",
      existingBookings: [],
      slotConfig: noorSyncedConfigBySlug,
      hostBlockedDates: [],
      riyadhNow: mockRiyadhNow,
      effectiveStandardPrice: 750,
    });
    assert(todaySummaryNov10.isPast !== true, "Today 2026-11-10 is not flagged as past");
    assert(todaySummaryNov10.overallStatus !== "closed", "Today 2026-11-10 is available for booking");
  } finally {
    if (hadStoreBefore && storeBackup !== null) {
      fs.writeFileSync(storeFilePath, storeBackup, "utf-8");
    } else if (!hadStoreBefore && fs.existsSync(storeFilePath)) {
      fs.unlinkSync(storeFilePath);
    }
  }

  console.log(`\nSUMMARY: Passed=${passed}, Failed=${failed}`);
  if (failed > 0) process.exit(1);
}

run();
