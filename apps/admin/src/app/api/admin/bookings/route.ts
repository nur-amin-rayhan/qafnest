import { NextRequest, NextResponse } from "next/server";
import { createAdminDataClient, getAdminSession, isAdminRequest } from "@/lib/adminApi";
import { recordUserActivity } from "@qafnest/shared/userActivityStore";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  computeSlotAwareStayRate,
  doTimeSlotsOverlap,
  isSameDayTwelveHourStay,
  type GranularWeeklyPricing,
  type TimeSlotBooking,
} from "@qafnest/shared";
import {
  acquirePropertyBookingLock,
  getServerPropertySlotConfig,
} from "@qafnest/shared/bookingSlotStore";
import { getServerPlatformFeeConfig } from "@qafnest/shared/platformFeeStore";
import { saveBookingFinancialSnapshot } from "@qafnest/shared/bookingFinancialsStore";
import {
  calculateBookingSettlement,
  getEffectiveGuestFeeConfig,
  getEffectiveHostCommissionPercent,
} from "@qafnest/shared/platformFee";
import {
  syncConfirmedBookingsToPayouts,
  voidCancelledBookingPayout,
} from "@qafnest/shared/hostPayoutStore";
import {
  consumeVerificationToken,
  hydrateHelplineVerificationStore,
  persistHelplineVerificationStore,
  validateBookingVerification,
  confirmTransferClaim,
} from "@qafnest/shared/helplineVerificationStore";
import {
  calculateCancellationRefundQuote,
  createBookingRefundRecord,
  markRefundDisbursed,
} from "@qafnest/shared/bookingRefundStore";

function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function isIsoDate(val: unknown): val is string {
  if (typeof val !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const d = new Date(`${val}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
}

function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "QAF-";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

function buildCustomDayPricing(prop: Record<string, unknown>): GranularWeeklyPricing | null {
  if (prop.custom_day_pricing && typeof prop.custom_day_pricing === "object") {
    return prop.custom_day_pricing as GranularWeeklyPricing;
  }
  if (prop.sunday_price || prop.friday_price) {
    return {
      sunday: Number(prop.sunday_price) || undefined,
      monday: Number(prop.monday_price) || undefined,
      tuesday: Number(prop.tuesday_price) || undefined,
      wednesday: Number(prop.wednesday_price) || undefined,
      thursday: Number(prop.thursday_price) || undefined,
      friday: Number(prop.friday_price) || undefined,
      saturday: Number(prop.saturday_price) || undefined,
    };
  }
  return null;
}

async function fetchPropertyAndCheckSlot(params: {
  supabase: NonNullable<ReturnType<typeof createAdminDataClient>>;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  checkinTime: string;
  checkoutTime: string;
  overrideListingPrice?: number | null;
}) {
  const {
    supabase,
    propertyId,
    checkIn,
    checkOut,
    checkinTime,
    checkoutTime,
    overrideListingPrice,
  } = params;

  const { data: prop, error: propErr } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .maybeSingle();

  if (propErr || !prop) {
    return { error: "Property not found", status: 404 as const };
  }

  const slotConfig = getServerPropertySlotConfig({
    propertyId: prop.id,
    slug: prop.slug || undefined,
    dbCustomDayPricing: buildCustomDayPricing(prop as Record<string, unknown>),
  });

  let existingRows: any[] | null = null;
  const primaryQuery = await supabase
    .from("bookings")
    .select("id, booking_reference, auth_subject, check_in, check_out, checkin_time, checkout_time, status, payment_status")
    .eq("property_id", prop.id)
    .neq("status", "cancelled");

  if (primaryQuery.error) {
    console.warn("[admin bookings availability] primary query fallback:", primaryQuery.error.message);
    const fallbackQuery = await supabase
      .from("bookings")
      .select("id, booking_reference, auth_subject, check_in, check_out, status, payment_status")
      .eq("property_id", prop.id)
      .neq("status", "cancelled");

    if (fallbackQuery.error) {
      console.error("[admin bookings availability] fallback query failed:", fallbackQuery.error.message);
      return { error: "Unable to verify slot availability", status: 500 as const };
    }
    existingRows = fallbackQuery.data;
  } else {
    existingRows = primaryQuery.data;
  }

  const activeBookings = (existingRows || []).filter(
    (b: any) =>
      !(
        b.status === "pending" &&
        b.payment_status === "initiated" &&
        !String(b.auth_subject || "").includes("|")
      )
  );

  const requestedSlot: TimeSlotBooking = {
    checkIn,
    checkOut,
    checkinTime,
    checkoutTime,
  };

  let conflictingRef: string | null = null;
  for (const b of activeBookings) {
    const slotB: TimeSlotBooking = {
      checkIn: String(b.check_in || ""),
      checkOut: String(b.check_out || ""),
      checkinTime: b.checkin_time ? String(b.checkin_time).slice(0, 5) : DEFAULT_CHECKIN_TIME,
      checkoutTime: b.checkout_time ? String(b.checkout_time).slice(0, 5) : DEFAULT_CHECKOUT_TIME,
      bookingRef: b.booking_reference || undefined,
      status: b.status || undefined,
    };
    if (slotB.checkIn && slotB.checkOut && doTimeSlotsOverlap(requestedSlot, slotB)) {
      conflictingRef = b.booking_reference || b.id.slice(0, 8);
      break;
    }
  }

  // Also verify host blocked dates across stay window
  const checkInMs = Date.parse(`${checkIn}T00:00:00.000Z`);
  const checkOutMs = Date.parse(`${checkOut}T00:00:00.000Z`);
  const rawNights = Math.round((checkOutMs - checkInMs) / 86_400_000);
  const nights = checkIn === checkOut ? 1 : Math.max(1, rawNights);

  let blockedDateConflict: string | null = null;
  for (let i = 0; i < nights; i++) {
    const dIso = new Date(checkInMs + i * 86_400_000).toISOString().slice(0, 10);
    if (
      (slotConfig.hostBlockedDates || []).includes(dIso) ||
      slotConfig.dateSlotOverrides?.[dIso]?.fullDayClosed
    ) {
      blockedDateConflict = dIso;
      break;
    }
  }

  const basePrice = Number(prop.base_price) || 0;
  const weekdayPrice = Number(prop.weekday_price || basePrice) || basePrice;
  const weekendPrice = Number(prop.weekend_price || basePrice) || basePrice;
  const rateCalc = computeSlotAwareStayRate({
    checkIn,
    checkOut,
    checkinTime,
    checkoutTime,
    pricingOptions: {
      masterBasePrice: basePrice,
      weekdayPrice,
      weekendPrice,
      weeklyPricing: buildCustomDayPricing(prop as Record<string, unknown>),
    },
    slotConfig,
  });

  const listingAmountSar =
    typeof overrideListingPrice === "number" && overrideListingPrice > 0
      ? round2(overrideListingPrice)
      : round2(rateCalc.baseStayRate);

  const feeCfg = getServerPlatformFeeConfig();
  const guestFeeCfg = getEffectiveGuestFeeConfig(prop.category, feeCfg);
  const hostCommissionPercent = getEffectiveHostCommissionPercent(prop.category, feeCfg, false);

  const guestServiceFeeSar =
    guestFeeCfg.feeMode === "fixed_amount"
      ? round2(guestFeeCfg.fixedFeeAmountSar)
      : round2(listingAmountSar * (guestFeeCfg.serviceFeePercent / 100));

  const vatRatePercent = round2(feeCfg.vatRatePercent ?? 15);
  const taxableSubtotalSar = round2(listingAmountSar + guestServiceFeeSar);
  const vatAmountSar = round2(taxableSubtotalSar * (vatRatePercent / 100));
  const guestTotalSar = round2(taxableSubtotalSar + vatAmountSar);

  const settlement = calculateBookingSettlement({
    listingAmountSar,
    guestServiceFeeSar,
    vatAmountSar,
    hostCommissionPercent,
    vatRatePercent,
  });

  return {
    prop,
    available: !conflictingRef && !blockedDateConflict,
    conflictingRef,
    blockedDateConflict,
    nights,
    stayType: rateCalc.stayType,
    pricing: {
      listingAmountSar,
      calculatedListingSar: round2(rateCalc.baseStayRate),
      guestFeeMode: guestFeeCfg.feeMode,
      guestServiceFeePercent: guestFeeCfg.serviceFeePercent,
      guestServiceFeeSar,
      taxableSubtotalSar,
      vatRatePercent,
      vatAmountSar,
      guestTotalSar,
      hostCommissionPercent,
      hostCommissionAmountSar: settlement.hostCommissionAmountSar,
      hostNetPayoutSar: settlement.hostNetPayoutSar,
      platformNetRevenueSar: settlement.platformNetRevenueSar,
    },
    settlement,
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  const sp = request.nextUrl.searchParams;
  const propertyId = sp.get("propertyId") || "";
  const checkIn = sp.get("checkIn") || "";
  const checkOut = sp.get("checkOut") || "";
  const checkinTime = (sp.get("checkinTime") || DEFAULT_CHECKIN_TIME).slice(0, 5);
  const checkoutTime = (sp.get("checkoutTime") || DEFAULT_CHECKOUT_TIME).slice(0, 5);
  const customRaw = sp.get("overrideListingPrice");
  const overrideListingPrice = customRaw && Number(customRaw) > 0 ? Number(customRaw) : null;

  if (!propertyId || !isIsoDate(checkIn) || !isIsoDate(checkOut)) {
    return NextResponse.json({ code: "invalid_parameters" }, { status: 400 });
  }
  if (checkOut < checkIn || (checkOut === checkIn && !isSameDayTwelveHourStay({ checkIn, checkOut, checkinTime, checkoutTime }))) {
    return NextResponse.json(
      { code: "invalid_dates", message: "Check-out date must be after check-in (or select 12h Same-Day slot)." },
      { status: 400 }
    );
  }

  const res = await fetchPropertyAndCheckSlot({
    supabase,
    propertyId,
    checkIn,
    checkOut,
    checkinTime,
    checkoutTime,
    overrideListingPrice,
  });

  if ("error" in res) {
    return NextResponse.json({ code: "not_found", message: res.error }, { status: res.status });
  }

  return NextResponse.json({
    success: true,
    propertyTitle: res.prop.title,
    available: res.available,
    conflictingRef: res.conflictingRef,
    blockedDateConflict: res.blockedDateConflict,
    nights: res.nights,
    stayType: res.stayType,
    pricing: res.pricing,
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const propertyId = String(body.propertyId || "").trim();
    const guestName = String(body.guestName || "").trim();
    const guestPhone = String(body.guestPhone || "").trim();
    const guestEmail = String(body.guestEmail || "").trim();
    const checkIn = String(body.checkIn || "").trim();
    const checkOut = String(body.checkOut || "").trim();
    const checkinTime = String(body.checkinTime || DEFAULT_CHECKIN_TIME).slice(0, 5);
    const checkoutTime = String(body.checkoutTime || DEFAULT_CHECKOUT_TIME).slice(0, 5);
    const guestsCount = Math.max(1, Number(body.guestsCount) || 2);
    const paymentMode =
      body.paymentMode === "confirmed_paid" ? "confirmed_paid" : "pending_sadad";
    const sadadBillNumber = String(body.sadadBillNumber || "").trim();
    const overrideListingPrice =
      body.overrideListingPrice && Number(body.overrideListingPrice) > 0
        ? Number(body.overrideListingPrice)
        : null;

    if (!propertyId || !guestName || !guestPhone) {
      return NextResponse.json(
        { code: "invalid_payload", message: "Property, customer name, and phone number are required." },
        { status: 400 }
      );
    }

    const verificationToken = String(body.verificationToken || "").trim();
    if (!verificationToken) {
      return NextResponse.json(
        {
          code: "verification_required",
          message: "Caller identity and phone verification is mandatory. Please complete OTP and Yakeen/Nafath ID verification before booking.",
        },
        { status: 403 }
      );
    }

    await hydrateHelplineVerificationStore();
    const verificationResult = validateBookingVerification(verificationToken);
    if (!verificationResult.valid || !verificationResult.session) {
      return NextResponse.json(
        {
          code: "verification_incomplete",
          message: verificationResult.error || "Caller verification is incomplete or failed.",
        },
        { status: 403 }
      );
    }

    const verifiedSession = verificationResult.session;

    if (!isIsoDate(checkIn) || !isIsoDate(checkOut)) {
      return NextResponse.json(
        { code: "invalid_dates", message: "Please select valid check-in and check-out dates." },
        { status: 400 }
      );
    }

    const sameDay12h = isSameDayTwelveHourStay({ checkIn, checkOut, checkinTime, checkoutTime });
    if (checkOut < checkIn || (checkOut === checkIn && !sameDay12h)) {
      return NextResponse.json(
        { code: "invalid_dates", message: "Check-out must be after check-in (or choose 12-hour same-day stay)." },
        { status: 400 }
      );
    }

    return await acquirePropertyBookingLock(propertyId, async () => {
      const check = await fetchPropertyAndCheckSlot({
        supabase,
        propertyId,
        checkIn,
        checkOut,
        checkinTime,
        checkoutTime,
        overrideListingPrice,
      });

      if ("error" in check) {
        return NextResponse.json({ code: "not_found", message: check.error }, { status: check.status || 404 });
      }

      if (!check.available) {
        const msg = check.conflictingRef
          ? `Dates conflict with existing booking #${check.conflictingRef}.`
          : `Property is manually blocked on ${check.blockedDateConflict}.`;
        return NextResponse.json({ code: "slot_unavailable", message: msg }, { status: 409 });
      }

      // Match existing guest profile by verified session, Phone OTP digits, or Email — or auto-create verified guest account for New Callers
      const normalizeSaudiE164 = (raw: string): string => {
        const d = String(raw || "").replace(/\D/g, "");
        if (!d) return "";
        if (d.startsWith("00966") && d.length >= 12) return `+966${d.slice(5)}`;
        if (d.startsWith("966") && d.length >= 11) return `+${d}`;
        if (d.startsWith("05") && d.length === 10) return `+966${d.slice(1)}`;
        if (d.startsWith("5") && d.length === 9) return `+966${d}`;
        if (raw.trim().startsWith("+") && d.length >= 8) return `+${d}`;
        return "";
      };

      const rawPhoneDigits = guestPhone.replace(/\D/g, "");
      const phoneDigits9 = rawPhoneDigits.length >= 8 ? rawPhoneDigits.slice(-9) : rawPhoneDigits;
      const e164Phone = normalizeSaudiE164(guestPhone);
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)
        ? guestEmail.toLowerCase()
        : "";

      let matchedGuestId: string | null =
        verifiedSession.guestId ||
        (typeof body.guestId === "string" && body.guestId.trim() ? body.guestId.trim() : null);
      let autoCreatedGuest = false;

      if (!matchedGuestId && phoneDigits9.length >= 8) {
        const { data: matchedProfile } = await supabase
          .from("profiles")
          .select("id")
          .ilike("phone", `%${phoneDigits9}%`)
          .limit(1)
          .maybeSingle();
        if (matchedProfile?.id) {
          matchedGuestId = String(matchedProfile.id);
        }
      }

      if (!matchedGuestId && typeof supabase.auth?.admin?.listUsers === "function") {
        try {
          const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 500 });
          const authUsers = listData?.users || [];
          const existingAuthUser = authUsers.find((au) => {
            const auPhoneDigits = String(au.phone || au.user_metadata?.phone || "")
              .replace(/\D/g, "")
              .slice(-9);
            if (phoneDigits9.length >= 8 && auPhoneDigits === phoneDigits9) return true;
            const auEmail = String(au.email || "").toLowerCase();
            const metaEmail = String(au.user_metadata?.contact_email || "").toLowerCase();
            if (validEmail && (auEmail === validEmail || metaEmail === validEmail)) return true;
            return false;
          });

          if (existingAuthUser?.id) {
            matchedGuestId = existingAuthUser.id;
            await supabase
              .from("profiles")
              .upsert(
                {
                  id: matchedGuestId,
                  full_name: guestName,
                  phone: e164Phone || guestPhone,
                  national_id: verifiedSession.nationalId || null,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
              );
          }
        } catch {}
      }

      if (!matchedGuestId && typeof supabase.auth?.admin?.createUser === "function") {
        const fallbackSynthEmail = `caller_${phoneDigits9 || Date.now()}_${Date.now().toString(36)}@phone.qafnest.sa`;
        const authEmail = validEmail || `caller_${phoneDigits9 || Date.now()}@phone.qafnest.sa`;
        const hasValidE164 = /^\+[1-9]\d{7,14}$/.test(e164Phone);
        const nowIso = new Date().toISOString();
        const userMetadataPayload: Record<string, unknown> = {
          full_name: guestName,
          phone: e164Phone || guestPhone,
          ...(validEmail ? { contact_email: validEmail } : {}),
          ...(verifiedSession.nationalId ? { national_id: verifiedSession.nationalId } : {}),
          ...(verifiedSession.idType === "iqama" && verifiedSession.nationalId
            ? { iqama: verifiedSession.nationalId }
            : {}),
          id_type: verifiedSession.idType || "national_id",
          is_verified: true,
          nafath_verified_at: verifiedSession.identityVerifiedAt || verifiedSession.otpVerifiedAt || nowIso,
          role: "guest",
          account_type: "guest",
          created_via: "admin_helpline",
        };

        try {
          let createRes = await supabase.auth.admin.createUser({
            email: authEmail,
            email_confirm: true,
            ...(hasValidE164 ? { phone: e164Phone, phone_confirm: true } : {}),
            user_metadata: userMetadataPayload,
          });

          if ((createRes.error || !createRes.data?.user?.id) && (validEmail || hasValidE164)) {
            createRes = await supabase.auth.admin.createUser({
              email: fallbackSynthEmail,
              email_confirm: true,
              user_metadata: userMetadataPayload,
            });
          }

          if (createRes.data?.user?.id) {
            matchedGuestId = createRes.data.user.id;
            autoCreatedGuest = true;
            await supabase
              .from("profiles")
              .upsert(
                {
                  id: matchedGuestId,
                  full_name: guestName,
                  phone: e164Phone || guestPhone,
                  national_id: verifiedSession.nationalId || null,
                  updated_at: nowIso,
                },
                { onConflict: "id" }
              );
          }
        } catch {}
      }

      const bookingRef = generateBookingReference();
      const isPaidNow = paymentMode === "confirmed_paid";
      const smartLockPin: string | null = null;
      const modeTag = isPaidNow ? "HELPLINE_PAID" : "SADAD_HOLD";
      const idTag = verifiedSession.nationalId ? `NID:${verifiedSession.nationalId}` : "ID_VERIFIED";
      const authSubject = `${guestName} | ${guestPhone} | ${modeTag} | ${idTag}${guestEmail ? ` | ${guestEmail}` : ""}`;

      const bookingPayload: Record<string, unknown> = {
        property_id: check.prop.id,
        booking_reference: bookingRef,
        auth_subject: authSubject,
        check_in: checkIn,
        check_out: checkOut,
        checkin_time: checkinTime,
        checkout_time: checkoutTime,
        total_nights: check.nights,
        guests_count: guestsCount,
        total_price: check.pricing.guestTotalSar,
        status: isPaidNow ? "confirmed" : "pending",
        payment_status: isPaidNow ? "success" : "initiated",
        payment_method: isPaidNow ? "admin_helpline_paid" : "sadad",
        smart_lock_pin: smartLockPin,
      };
      if (matchedGuestId) {
        bookingPayload.guest_id = matchedGuestId;
      }

      let insertRes = await supabase
        .from("bookings")
        .insert(bookingPayload)
        .select("id, booking_reference, status, payment_status, total_price, check_in, check_out, created_at")
        .maybeSingle();

      if (insertRes.error && String(insertRes.error.message || "").includes("column")) {
        const safePayload = { ...bookingPayload };
        delete safePayload.checkin_time;
        delete safePayload.checkout_time;
        delete safePayload.payment_method;
        insertRes = await supabase
          .from("bookings")
          .insert(safePayload)
          .select("id, booking_reference, status, payment_status, total_price, check_in, check_out, created_at")
          .maybeSingle();
      }

      if (insertRes.error || !insertRes.data) {
        console.error("[admin bookings POST] insert failed:", insertRes.error);
        return NextResponse.json(
          {
            code: "insert_failed",
            message: "Could not create helpline booking in database.",
          },
          { status: 500 }
        );
      }

      const createdBooking = insertRes.data;

      saveBookingFinancialSnapshot({
        bookingRef,
        bookingId: String(createdBooking.id),
        listingAmountSar: check.pricing.listingAmountSar,
        guestServiceFeeSar: check.pricing.guestServiceFeeSar,
        guestFeeMode: check.pricing.guestFeeMode,
        guestServiceFeePercent: check.pricing.guestServiceFeePercent,
        promoDiscountSar: 0,
        taxableSubtotalSar: check.pricing.taxableSubtotalSar,
        vatRatePercent: check.pricing.vatRatePercent,
        vatAmountSar: check.pricing.vatAmountSar,
        totalPriceSar: check.pricing.guestTotalSar,
        hostCommissionPercent: check.pricing.hostCommissionPercent,
        hostCommissionAmountSar: check.pricing.hostCommissionAmountSar,
        hostNetPayoutSar: check.pricing.hostNetPayoutSar,
        walletAppliedSar: 0,
        welcomeBonusUsedSar: 0,
        gatewayPaidSar: check.pricing.guestTotalSar,
        platformGrossRevenueSar: check.settlement.platformGrossEarningsSar,
        platformNetRevenueSar: check.settlement.platformNetRevenueSar,
        recordedAt: new Date().toISOString(),
      });

      if (isPaidNow) {
        syncConfirmedBookingsToPayouts([
          {
            id: String(createdBooking.id),
            booking_reference: bookingRef,
            total_price: check.pricing.guestTotalSar,
            status: "confirmed",
            payment_status: "paid",
            check_in: checkIn,
            check_out: checkOut,
            total_nights: check.nights,
            created_at: createdBooking.created_at,
            guest_name: guestName,
            property: {
              id: check.prop.id,
              title: check.prop.title,
              category: check.prop.category,
              price_per_night: check.prop.base_price,
              host_id: check.prop.host_id,
              host_name: "",
              host_phone: "",
            },
          },
        ]);
      }

      const adminSession = getAdminSession(request);
      consumeVerificationToken(verificationToken);
      await persistHelplineVerificationStore().catch(() => undefined);
      try {
        if (autoCreatedGuest && matchedGuestId) {
          recordUserActivity({
            userId: matchedGuestId,
            userName: guestName,
            role: "guest",
            category: "auth",
            action: "auto_created_via_helpline",
            title: `Verified guest account created via Helpline`,
            details: `${e164Phone || guestPhone}${validEmail ? ` · ${validEmail}` : ""}`,
            targetId: matchedGuestId,
            targetLabel: guestName,
            actor: adminSession?.email || "Admin Helpline",
          });
        }
        recordUserActivity({
          userId: matchedGuestId || guestPhone,
          userName: guestName,
          role: "guest",
          category: "booking",
          action: isPaidNow ? "helpline_booking_confirmed" : "helpline_booking_held",
          title: isPaidNow
            ? `Helpline booking #${bookingRef} confirmed`
            : `Helpline hold #${bookingRef} created (Pending SADAD)`,
          details: `${check.prop.title} (${checkIn} → ${checkOut}) · SAR ${check.pricing.guestTotalSar.toFixed(2)}`,
          targetId: createdBooking.id,
          targetLabel: bookingRef,
          actor: adminSession?.email || "Admin Helpline",
        });
      } catch {}

      return NextResponse.json({
        success: true,
        autoCreatedGuest,
        guestId: matchedGuestId,
        message: isPaidNow
          ? `Helpline booking #${bookingRef} confirmed & locked for ${guestName}.`
          : `Helpline reservation #${bookingRef} held awaiting SADAD payment for ${guestName}.`,
        booking: {
          ...createdBooking,
          guest_id: matchedGuestId,
          guest_name: guestName,
          guest_phone: e164Phone || guestPhone,
          guest_email: validEmail || null,
          property_title: check.prop.title,
          sadadBillNumber: sadadBillNumber || null,
          smart_lock_pin: smartLockPin,
          pricing: check.pricing,
        },
      });
    });
  } catch (err: unknown) {
    console.error("[admin bookings POST] server error:", err);
    return NextResponse.json(
      {
        code: "server_error",
        message: "Failed to create manual booking.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminDataClient();
  if (!supabase) {
    return NextResponse.json({ code: "admin_database_not_configured" }, { status: 503 });
  }

  try {
    await Promise.all([
      import("@qafnest/shared/hostPayoutStore").then((m) => m.hydrateHostPayoutStore()),
      import("@qafnest/shared/bookingRefundStore").then((m) => m.hydrateBookingRefundStore()),
      import("@qafnest/shared/helplineVerificationStore").then((m) =>
        m.hydrateHelplineVerificationStore()
      ),
      import("@qafnest/shared/userActivityStore").then((m) => m.hydrateUserGovernanceStore()),
    ]);

    const body = (await request.json()) as Record<string, unknown>;
    const idOrRef = String(body.bookingId || body.bookingReference || "").trim();
    const action = typeof body.action === "string" ? body.action.trim() : "";

    if (!idOrRef) {
      return NextResponse.json({ code: "invalid_payload", message: "Booking ID or reference required." }, { status: 400 });
    }

    if (!["confirm_payment", "cancel", "mark_refund_disbursed"].includes(action)) {
      return NextResponse.json(
        { code: "invalid_action", message: "Unsupported booking administrative action." },
        { status: 400 }
      );
    }

    const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrRef);
    const { data: existing, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, booking_reference, total_price, status, payment_status, check_in, check_out, total_nights, property_id, guest_id, auth_subject, created_at, properties(id, title, category, base_price, host_id)")
      .eq(isUuidLike ? "id" : "booking_reference", idOrRef)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ code: "not_found", message: "Booking not found." }, { status: 404 });
    }

    if (action === "mark_refund_disbursed") {
      const { validateLegalTransactionNumber } = await import("@qafnest/shared");
      const rawTxn =
        typeof body.transactionNumber === "string"
          ? body.transactionNumber
          : typeof body.sarieTxnId === "string"
          ? body.sarieTxnId
          : "";
      const txnCheck = validateLegalTransactionNumber(rawTxn);
      if (!txnCheck.valid) {
        return NextResponse.json(
          { code: "missing_transaction_number", message: txnCheck.errorEn },
          { status: 400 }
        );
      }
      const adminNotes = String(body.adminNotes || "Disbursed via Saudi banking payment rail by Admin Helpline.");
      const updatedRefund = markRefundDisbursed(existing.booking_reference, adminNotes, txnCheck.cleaned);
      if (!updatedRefund) {
        return NextResponse.json({ code: "refund_not_found", message: "No refund record found for this booking." }, { status: 404 });
      }

      try {
        const adminSession = getAdminSession(request);
        recordUserActivity({
          userId: String(existing.guest_id || existing.booking_reference),
          userName: String(existing.auth_subject || "Guest").split(" | ")[0],
          role: "guest",
          category: "payment",
          action: "refund_disbursed",
          title: `Refund disbursed for #${existing.booking_reference} (${updatedRefund.refundAmount} SAR · Txn #${txnCheck.cleaned})`,
          details: `Remitted via ${updatedRefund.refundMethod} (Txn #${txnCheck.cleaned}). ${adminNotes}`,
          targetId: existing.id,
          targetLabel: existing.booking_reference,
          actor: adminSession?.email || "Admin Helpline",
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Refund #${updatedRefund.id} (${updatedRefund.refundAmount} SAR) settled with Txn #${txnCheck.cleaned}!`,
        refund: updatedRefund,
      });
    }

    let nextUpdates: Record<string, unknown> = {};
    let refundRecord = null;
    let quote = null;

    if (action === "cancel") {
      const wasPaid = existing.payment_status === "success" || existing.payment_status === "paid";
      quote = calculateCancellationRefundQuote({
        createdAt: existing.created_at,
        checkIn: existing.check_in,
        totalPrice: Number(existing.total_price || 0),
        isAdminOverride: Boolean(body.isAdminOverride),
        adminOverridePercent: typeof body.adminOverridePercent === "number" ? body.adminOverridePercent : undefined,
      });

      const nextPaymentStatus =
        wasPaid && quote.refundAmount > 0
          ? "refunded"
          : existing.payment_status === "initiated"
          ? "failed"
          : existing.payment_status;

      nextUpdates = {
        status: "cancelled",
        payment_status: nextPaymentStatus,
      };

      // Void or freeze host payout and create refund record ONLY when an exceptional manual refund > 0% is approved
      if (quote.refundPercentage > 0) {
        voidCancelledBookingPayout(existing.booking_reference, quote.refundPercentage);
      }

      if (wasPaid && quote.refundAmount > 0) {
        refundRecord = createBookingRefundRecord({
          bookingRef: existing.booking_reference,
          guestId: existing.guest_id,
          totalBookingPrice: Number(existing.total_price || 0),
          refundAmount: quote.refundAmount,
          refundPercentage: quote.refundPercentage,
          penaltyAmount: quote.penaltyAmount,
          cancellationReason: String(body.reason || "Exceptional manual refund approved by admin"),
          actor: "admin",
          policyTier: quote.policyTier,
        });
      }
    } else if (action === "confirm_payment") {
      if (existing.status === "cancelled" || existing.payment_status === "refunded") {
        return NextResponse.json(
          {
            code: "invalid_state_transition",
            message: `Cannot confirm payment for a booking in '${existing.status}' / '${existing.payment_status}' state.`,
          },
          { status: 409 }
        );
      }
      const sadadTxn =
        typeof body.sadadBillNumber === "string" && body.sadadBillNumber.trim()
          ? body.sadadBillNumber.trim()
          : "";
      const updatedSubject = sadadTxn
        ? `${String(existing.auth_subject || "Guest")} | SADAD:${sadadTxn}`
        : undefined;
      nextUpdates = {
        status: "confirmed",
        payment_status: "success",
        ...(updatedSubject ? { auth_subject: updatedSubject } : {}),
      };
      confirmTransferClaim(existing.booking_reference, "Confirmed by Admin Helpline");
    }

    const { data: updated, error: updErr } = await supabase
      .from("bookings")
      .update(nextUpdates)
      .eq("id", existing.id)
      .select("id, booking_reference, status, payment_status, smart_lock_pin")
      .maybeSingle();

    if (updErr || !updated) {
      console.error("[admin bookings PATCH] update failed:", updErr);
      return NextResponse.json(
        { code: "update_failed", message: "Could not update booking." },
        { status: 500 }
      );
    }

    if (action === "cancel" && existing.property_id && existing.check_in && existing.check_out && existing.check_out > existing.check_in) {
      try {
        const { addDaysToIsoDate } = await import("@qafnest/shared");
        const { data: siblingActive } = await supabase
          .from("bookings")
          .select("check_in, check_out")
          .eq("property_id", existing.property_id)
          .in("status", ["confirmed", "checked_in", "completed"])
          .neq("id", existing.id);

        const occupiedBySibling = new Set<string>();
        for (const sb of siblingActive || []) {
          if (!sb.check_in || !sb.check_out || sb.check_out <= sb.check_in) continue;
          let c = String(sb.check_in).slice(0, 10);
          const end = String(sb.check_out).slice(0, 10);
          let g = 0;
          while (c < end && g < 180) {
            occupiedBySibling.add(c);
            c = addDaysToIsoDate(c, 1);
            g++;
          }
        }

        const releaseDates: string[] = [];
        let cursor = String(existing.check_in).slice(0, 10);
        const endIso = String(existing.check_out).slice(0, 10);
        let guard = 0;
        while (cursor < endIso && guard < 180) {
          if (!occupiedBySibling.has(cursor)) {
            releaseDates.push(cursor);
          }
          cursor = addDaysToIsoDate(cursor, 1);
          guard++;
        }
        if (releaseDates.length > 0) {
          await supabase
            .from("property_availability")
            .update({ is_available: true, updated_at: new Date().toISOString() })
            .eq("property_id", existing.property_id)
            .in("date", releaseDates);
        }
      } catch (releaseErr) {
        console.warn("[admin/bookings] cancellation availability release warning:", releaseErr);
      }
    }

    if (action === "confirm_payment") {
      const prop = Array.isArray(existing.properties) ? existing.properties[0] : existing.properties;
      const guestNameOnly = String(existing.auth_subject || "Guest").split(" | ")[0];
      syncConfirmedBookingsToPayouts([
        {
          id: existing.id,
          booking_reference: existing.booking_reference,
          total_price: existing.total_price,
          status: "confirmed",
          payment_status: "paid",
          check_in: existing.check_in,
          check_out: existing.check_out,
          total_nights: existing.total_nights,
          created_at: existing.created_at,
          guest_name: guestNameOnly,
          property: prop
            ? {
                id: prop.id,
                title: prop.title,
                category: prop.category,
                price_per_night: prop.base_price,
                host_id: prop.host_id,
              }
            : null,
        },
      ]);
    }

    try {
      const adminSession = getAdminSession(request);
      const guestNameOnly = String(existing.auth_subject || "Guest").split(" | ")[0];
      recordUserActivity({
        userId: String(existing.guest_id || guestNameOnly),
        userName: guestNameOnly,
        role: "guest",
        category: "payment",
        action: action === "cancel" ? "helpline_booking_cancelled" : "helpline_payment_confirmed",
        title:
          action === "cancel"
            ? `Helpline booking #${updated.booking_reference} cancelled${refundRecord ? ` (${refundRecord.refundAmount} SAR refund)` : ""}`
            : `SADAD payment confirmed for #${updated.booking_reference}`,
        details: `${existing.check_in} → ${existing.check_out} · SAR ${Number(existing.total_price || 0).toFixed(2)}${quote ? ` (${quote.summaryEn})` : ""}`,
        targetId: updated.id,
        targetLabel: updated.booking_reference,
        actor: adminSession?.email || "Admin Operations",
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message:
        action === "cancel"
          ? `Booking #${updated.booking_reference} cancelled.${refundRecord ? ` Refund created: ${refundRecord.refundAmount} SAR (${refundRecord.policyTier}).` : " Room slot released."}`
          : `Booking #${updated.booking_reference} payment confirmed!`,
      booking: updated,
      refund: refundRecord,
      policyQuote: quote,
    });
  } catch (err: unknown) {
    console.error("[admin bookings PATCH] server error:", err);
    return NextResponse.json(
      { code: "server_error", message: "Failed to update booking." },
      { status: 500 }
    );
  }
}
