import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminOrServerClient } from "@/lib/supabase/service";
import { getMyFatoorahConfig, getSamsungPayWebConfig } from "@/lib/services/myfatoorah";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { calculatePricingBreakdown, CouponDefinition } from "@/lib/services/pricing";
import { validateAuthoritativeCoupon } from "@/lib/services/couponService";
import {
  isIsoDate,
  generateBookingReference,
  resolveCheckoutProperty,
  checkDatesAndCalculateRate,
  persistBookingToDatabase,
} from "@/lib/services/checkoutHelpers";
import { validateGuestCheckoutIdentity } from "@/lib/services/checkoutIdentity";
import {
  reconcileStaleBookings,
  cancelPreviousInitiatedGuestBookings,
} from "@/lib/services/bookingReconciliation";
import { resolveRequestLocale } from "@/lib/services/requestLocale";
import { processGatewayPayment } from "@/lib/services/checkoutGateway";
import {
  DEFAULT_CHECKIN_TIME,
  DEFAULT_CHECKOUT_TIME,
  getRiyadhNowInfo,
  isSameDayTwelveHourStay,
} from "@qafnest/shared";
import { acquirePropertyBookingLock } from "@qafnest/shared/bookingSlotStore";
import { getServerEffectiveGuestFeeConfig } from "@qafnest/shared/platformFeeStore";
import {
  getUserWallet,
  getUserSavedCards,
  registerPendingWalletSplit,
  SavedCard,
} from "@/lib/services/walletService";
import {
  checkMandatorySaudiIdentity,
  executeDirectWalletCheckout,
  recordCheckoutFinancialSnapshot,
} from "./checkoutSettlement";

const paymentMethods = ["card", "apple", "google", "stcpay", "samsung", "tabby", "tamara", "wallet"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

export async function POST(request: Request) {
  try {
    return await executeCheckoutPost(request);
  } catch (err) {
    console.error("[payments/checkout] Unhandled checkout error:", err);
    const rawMessage = err instanceof Error ? err.message : String(err || "Unknown error");
    if (/lock timeout/i.test(rawMessage)) {
      return NextResponse.json(
        {
          code: "checkout_busy",
          message: "Another checkout for this property is finishing. Please try again in a few seconds.",
          messageAr: "توجد عملية دفع أخرى جارية لهذه الوحدة حالياً. يرجى المحاولة بعد ثوانٍ.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        code: "checkout_internal_error",
        message: "Unable to initialize payment checkout right now. Please try again.",
        messageAr: "تعذر تهيئة عملية الدفع حالياً. يرجى المحاولة مرة أخرى.",
      },
      { status: 500 }
    );
  }
}

async function executeCheckoutPost(request: Request) {
  let body: Record<string, unknown>;
  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ code: "invalid_request" }, { status: 400 });
    }
    body = payload as Record<string, unknown>;
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const method = body.method;
  if (typeof method !== "string" || !paymentMethods.includes(method as PaymentMethod)) {
    return NextResponse.json({ code: "unsupported_payment_method" }, { status: 400 });
  }
  const selectedMethod = method as PaymentMethod;
  const resolvedLocale = resolveRequestLocale(request, body.locale ?? body.lang);

  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json(
      {
        code: "authentication_required",
        message: "You must be signed in with a verified account to proceed with checkout.",
      },
      { status: 401 }
    );
  }

  const identityCheck = validateGuestCheckoutIdentity(authUser, body);
  if (!identityCheck.success) {
    return NextResponse.json(
      { code: identityCheck.error.code, message: identityCheck.error.message },
      { status: identityCheck.error.status }
    );
  }
  const { guestPhone, guestSubject, guestId, guestName, guestEmail } = identityCheck.identity;

  const mandatoryIdentityError = await checkMandatorySaudiIdentity(authUser.id);
  if (mandatoryIdentityError) return mandatoryIdentityError;

  const rawPropertyId = body.propertyId;
  const checkIn = body.checkIn;
  const checkOut = body.checkOut;
  const guests = body.guests;
  const checkinTime =
    typeof body.checkinTime === "string"
      ? body.checkinTime.slice(0, 5)
      : typeof body.checkInTime === "string"
      ? body.checkInTime.slice(0, 5)
      : DEFAULT_CHECKIN_TIME;
  const checkoutTime =
    typeof body.checkoutTime === "string"
      ? body.checkoutTime.slice(0, 5)
      : typeof body.checkOutTime === "string"
      ? body.checkOutTime.slice(0, 5)
      : DEFAULT_CHECKOUT_TIME;

  if (typeof rawPropertyId !== "string" || !isIsoDate(checkIn) || !isIsoDate(checkOut) || !Number.isInteger(guests)) {
    return NextResponse.json({ code: "invalid_booking" }, { status: 400 });
  }

  const supabase = await createClient();
  const propInfo = await resolveCheckoutProperty(rawPropertyId, supabase);
  if (!propInfo) {
    return NextResponse.json({ code: "property_unavailable" }, { status: 404 });
  }

  const {
    propTitle,
    propCityName,
    propImages,
    propBasePrice,
    propWeekdayPrice,
    propWeekendPrice,
    customDayPricing,
    propCapacity,
    resolvedDbPropertyId,
    propSlug,
    propCategory,
    slotConfig,
  } = propInfo;

  const isSameDay12h = isSameDayTwelveHourStay({ checkIn, checkOut, checkinTime, checkoutTime });
  const rawDurationDays = Math.round((Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`)) / 86_400_000);
  const nights = isSameDay12h ? 1 : rawDurationDays;
  const { dateIso: todayRiyadh } = getRiyadhNowInfo();
  if ((!isSameDay12h && rawDurationDays < 1) || nights > 90 || Number(guests) < 1 || Number(guests) > propCapacity || checkIn < todayRiyadh) {
    return NextResponse.json({ code: "invalid_booking" }, { status: 400 });
  }

  if (selectedMethod === "tabby" || selectedMethod === "tamara") {
    const providerName = selectedMethod === "tabby" ? "Tabby" : "Tamara";
    return NextResponse.json(
      {
        code: "bnpl_gateway_pending",
        provider: providerName,
        message: `${providerName} installments are currently under onboarding. Please choose Card, Apple Pay, Google Pay, STC Pay, or QafNest Wallet.`,
      },
      { status: 400 }
    );
  }

  const rawSamsungToken = body.samsungPayToken;
  const samsungPayToken =
    typeof rawSamsungToken === "string"
      ? rawSamsungToken.trim()
      : rawSamsungToken && typeof rawSamsungToken === "object"
      ? JSON.stringify(rawSamsungToken)
      : undefined;

  if (selectedMethod === "samsung") {
    if (!getSamsungPayWebConfig().available) {
      return NextResponse.json(
        {
          code: "samsung_pay_gateway_pending",
          provider: "Samsung Pay",
          message:
            "Samsung Pay Web Checkout is awaiting Samsung Pay Portal Service ID and MyFatoorah SAMSUNG_PAY activation. Please choose Card, Apple Pay, Google Pay, STC Pay, or QafNest Wallet.",
        },
        { status: 400 }
      );
    }
    if (!samsungPayToken) {
      return NextResponse.json(
        { code: "samsung_pay_token_required", provider: "Samsung Pay", message: "Samsung Pay payment credential is required." },
        { status: 400 }
      );
    }
  }

  const cardType = (typeof body.cardType === "string" ? body.cardType : typeof body.paymentType === "string" ? body.paymentType : "") || undefined;
  const savedCardId = typeof body.savedCardId === "string" ? body.savedCardId : undefined;
  const cardCvv = typeof body.cardCvv === "string" ? body.cardCvv : undefined;

  let savedCard: SavedCard | undefined;
  if (selectedMethod === "card" && savedCardId) {
    savedCard = (await getUserSavedCards(authUser.id)).find((c) => c.id === savedCardId);
    if (!savedCard) {
      return NextResponse.json({ code: "card_not_found", message: "Selected saved card could not be found." }, { status: 404 });
    }
    if (savedCard.supportsDirectCharge && (!cardCvv || cardCvv.length < 3)) {
      return NextResponse.json(
        { code: "cvv_required", message: "Card CVV security code is required for saved card payments." },
        { status: 400 }
      );
    }
  }

  const dbClient = await getAdminOrServerClient();
  const bookingRef = generateBookingReference();
  const useWalletCredit = Boolean(body.useWalletCredit);
  const effectiveUserId = guestId || authUser.id;
  const rawCouponCode = typeof body.couponCode === "string" ? body.couponCode.trim() : null;

  const lockOutcome = await acquirePropertyBookingLock(
    [resolvedDbPropertyId, propSlug, rawPropertyId],
    async (): Promise<
      | { immediateResponse: NextResponse }
      | {
          bookingId: string;
          pricing: ReturnType<typeof calculatePricingBreakdown>;
          totalPrice: number;
          gatewayAmount: number;
          walletApplied: number;
        }
    > => {
      await reconcileStaleBookings(dbClient);
      await cancelPreviousInitiatedGuestBookings(dbClient, guestId, guestSubject);

      const rateCalculation = await checkDatesAndCalculateRate({
        checkIn,
        checkOut,
        checkinTime,
        checkoutTime,
        nights,
        resolvedDbPropertyId,
        propWeekdayPrice,
        propWeekendPrice,
        propBasePrice,
        customDayPricing,
        slotConfig,
        supabase: dbClient,
        currentGuestId: guestId,
        currentGuestSubject: guestSubject,
      });

      if (rateCalculation.error) {
        return {
          immediateResponse: NextResponse.json(
            {
              code: rateCalculation.error.code,
              message: rateCalculation.error.message,
              messageAr: rateCalculation.error.messageAr,
            },
            { status: rateCalculation.error.status }
          ),
        };
      }

      const baseStayRate = rateCalculation.baseStayRate;
      if (!Number.isFinite(baseStayRate) || baseStayRate <= 0) {
        return { immediateResponse: NextResponse.json({ code: "invalid_booking_price" }, { status: 400 }) };
      }

      let validatedCouponDef: CouponDefinition | null = null;
      let customCouponDiscount: number | null = null;
      if (rawCouponCode) {
        const couponValidation = await validateAuthoritativeCoupon({
          code: rawCouponCode,
          baseRate: baseStayRate,
          nights,
          dbClient: supabase,
        });
        if (!couponValidation.valid) {
          return {
            immediateResponse: NextResponse.json(
              {
                code: couponValidation.error || "invalid_coupon",
                message: couponValidation.messageEn,
                messageAr: couponValidation.messageAr,
              },
              { status: 422 }
            ),
          };
        }
        validatedCouponDef = couponValidation.coupon || null;
        customCouponDiscount = couponValidation.discountAmount;
      }

      const guestFee = getServerEffectiveGuestFeeConfig(propCategory);
      const pricing = calculatePricingBreakdown({
        baseRate: baseStayRate,
        nights,
        couponCode: rawCouponCode,
        validatedCoupon: validatedCouponDef,
        customDiscount: customCouponDiscount,
        serviceFeeRate: guestFee.serviceFeeRate,
        feeMode: guestFee.feeMode,
        fixedFeeAmountSar: guestFee.fixedFeeAmountSar,
        vatRate: guestFee.vatRatePercent / 100,
        category: propCategory,
      });
      const totalPrice = pricing.total;

      let walletApplied = 0;
      let estimatedWelcomeBonusUsed = 0;
      let gatewayAmount = totalPrice;
      const checkoutWallet =
        selectedMethod === "wallet" || useWalletCredit ? await getUserWallet(effectiveUserId) : null;

      if (selectedMethod === "wallet") {
        walletApplied = totalPrice;
        gatewayAmount = 0;
        if (checkoutWallet && checkoutWallet.balance >= totalPrice) {
          estimatedWelcomeBonusUsed =
            Math.round(Math.min(checkoutWallet.welcomeBonusBalance || 0, totalPrice) * 100) / 100;
        }
      } else if (useWalletCredit && checkoutWallet && checkoutWallet.balance > 0) {
        walletApplied = Math.min(Math.round(checkoutWallet.balance * 100) / 100, totalPrice);
        gatewayAmount = Math.round((totalPrice - walletApplied) * 100) / 100;
        estimatedWelcomeBonusUsed =
          Math.round(Math.min(checkoutWallet.welcomeBonusBalance || 0, walletApplied) * 100) / 100;
      }

      if (selectedMethod === "wallet" || (useWalletCredit && gatewayAmount <= 0)) {
        return {
          immediateResponse: await executeDirectWalletCheckout({
            dbClient,
            checkoutWallet,
            effectiveUserId,
            resolvedDbPropertyId,
            propTitle,
            rawPropertyId,
            checkIn,
            checkOut,
            checkinTime,
            checkoutTime,
            nights,
            guests: Number(guests),
            totalPrice,
            pricing,
            bookingRef,
            guestSubject,
            guestName,
            rawCouponCode,
            guestFee,
            resolvedLocale,
          }),
        };
      }

      if (!getMyFatoorahConfig().apiKey) {
        return {
          immediateResponse: NextResponse.json(
            {
              code: "payment_provider_not_configured",
              provider: "MyFatoorah",
              message: "Payment gateway is not configured. Please check MYFATOORAH_API_KEY.",
            },
            { status: 503 }
          ),
        };
      }

      const { bookingId, bookingPersisted, overlapConflict } = await persistBookingToDatabase({
        dbClient,
        resolvedDbPropertyId,
        checkIn,
        checkOut,
        checkinTime,
        checkoutTime,
        nights,
        guests: Number(guests),
        totalPrice,
        pricing,
        guestId,
        bookingRef,
        guestSubject,
      });

      if (!bookingPersisted) {
        return {
          immediateResponse: NextResponse.json(
            overlapConflict
              ? {
                  code: "dates_unavailable",
                  message: "This time slot was just reserved by another guest.",
                  messageAr: "تم حجز هذه الفترة للتو من قِبل نزيل آخر.",
                }
              : {
                  code: "booking_persistence_failed",
                  message: "Unable to create booking reservation. Please try again or contact support.",
                },
            { status: overlapConflict ? 409 : 500 }
          ),
        };
      }

      recordCheckoutFinancialSnapshot({
        bookingRef,
        bookingId,
        pricing,
        rawCouponCode,
        guestFee,
        walletAppliedSar: walletApplied,
        welcomeBonusUsedSar: estimatedWelcomeBonusUsed,
        gatewayPaidSar: gatewayAmount,
      });

      if (walletApplied > 0 && gatewayAmount > 0) {
        await registerPendingWalletSplit({
          bookingRef,
          userId: effectiveUserId,
          walletAmount: walletApplied,
          welcomeBonusAmount: estimatedWelcomeBonusUsed,
          gatewayAmount,
          totalAmount: totalPrice,
          gatewayMethod: selectedMethod,
          propertyTitle: propTitle,
        });
      }

      return { bookingId, pricing, totalPrice, gatewayAmount, walletApplied };
    }
  );

  if ("immediateResponse" in lockOutcome) return lockOutcome.immediateResponse;

  return processGatewayPayment({
    request,
    totalPrice: lockOutcome.totalPrice,
    guestName,
    guestPhone,
    guestEmail,
    bookingRef,
    bookingId: lockOutcome.bookingId,
    propTitle,
    propCityName,
    propImages,
    nights,
    rawPropertyId,
    selectedMethod,
    cardType,
    pricing: lockOutcome.pricing,
    checkIn,
    checkOut,
    guests: Number(guests),
    dbClient,
    savedCard,
    cardCvv,
    samsungPayToken,
    gatewayAmount: lockOutcome.gatewayAmount,
    walletApplied: lockOutcome.walletApplied,
    effectiveUserId,
    locale: resolvedLocale,
  });
}
