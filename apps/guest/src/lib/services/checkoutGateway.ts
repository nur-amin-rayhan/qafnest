import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  executeMyFatoorahPayment,
  executeMyFatoorahV3Payment,
  resolveCallbackUrls,
  resolveMyFatoorahPaymentMethodId,
  getMyFatoorahConfig,
  getSamsungPayWebConfig,
  type MyFatoorahHostedMethod,
} from "@/lib/services/myfatoorah";
import { toMyFatoorahMobile } from "@/lib/services/phone";
import { cancelInitiatedBooking } from "@/lib/services/bookingReconciliation";
import { maskPii } from "@/lib/services/piiSanitizer";
import {
  decryptCardNumber,
  awardLoyaltyPoints,
  settlePendingWalletSplit,
  clearPendingWalletSplit,
  SavedCard,
} from "@/lib/services/walletService";
import { dispatchBookingZatcaInvoice } from "@/lib/services/zatcaReportingHelper";
import { normalizeAppLocale, type AppLocale } from "@/lib/services/requestLocale";

export interface CheckoutGatewayParams {
  request: Request;
  totalPrice: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  bookingRef: string;
  bookingId: string;
  propTitle: string;
  propCityName: string;
  propImages: string[];
  nights: number;
  rawPropertyId: string;
  selectedMethod: string;
  cardType?: string;
  pricing: unknown;
  checkIn: string;
  checkOut: string;
  guests: number;
  dbClient: SupabaseClient;
  savedCard?: SavedCard;
  cardCvv?: string;
  samsungPayToken?: string;
  gatewayAmount?: number;
  walletApplied?: number;
  effectiveUserId?: string;
  locale?: AppLocale;
}

export async function processGatewayPayment({
  request,
  totalPrice,
  guestName,
  guestPhone,
  guestEmail,
  bookingRef,
  bookingId,
  propTitle,
  propCityName,
  propImages,
  nights,
  rawPropertyId,
  selectedMethod,
  cardType,
  pricing,
  checkIn,
  checkOut,
  guests,
  dbClient,
  savedCard,
  cardCvv,
  samsungPayToken,
  gatewayAmount,
  walletApplied = 0,
  effectiveUserId,
  locale,
}: CheckoutGatewayParams): Promise<NextResponse> {
  const chargeAmount =
    typeof gatewayAmount === "number" && gatewayAmount > 0 ? gatewayAmount : totalPrice;
  const splitField =
    walletApplied > 0
      ? `SPLIT:${walletApplied.toFixed(2)}:${chargeAmount.toFixed(2)}`
      : undefined;

  const buildGatewayRedirectResponse = (redirectUrl: string, invoiceId?: string | number) =>
    NextResponse.json({
      success: true,
      redirectUrl,
      ...(invoiceId !== undefined ? { invoiceId } : {}),
      bookingId,
      bookingRef,
      amount: totalPrice,
      gatewayAmount: chargeAmount,
      walletApplied,
      pricing,
      checkIn,
      checkOut,
      nights,
      guests,
      property: {
        id: rawPropertyId,
        title: propTitle,
        city_name: propCityName,
        images: propImages,
      },
      method: selectedMethod,
    });
  const forwardedProto = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  const requestOrigin = request.headers.get("origin") || (host.startsWith("http") ? host : `${forwardedProto}://${host}`);

  const resolvedLocale = normalizeAppLocale(locale) || "ar";
  const { callBackUrl, errorUrl } = resolveCallbackUrls({
    origin: requestOrigin,
    propertyId: rawPropertyId,
    bookingRef,
    locale: resolvedLocale,
  });

  // 1. Saved Card Fast Checkout with CVV
  if (selectedMethod === "card" && savedCard && cardCvv) {
    const fullCardNumber = savedCard.cardToken ? decryptCardNumber(savedCard.cardToken) : "";

    if (fullCardNumber) {
      try {
        const config = getMyFatoorahConfig();
        const mfResponse = await executeMyFatoorahPayment({
          paymentMethodId: savedCard.brand === "mada" ? 6 : savedCard.brand === "amex" ? 3 : 2,
          invoiceValue: chargeAmount,
          customerName: guestName || "QafNest Guest",
          customerMobile: toMyFatoorahMobile(guestPhone),
          customerEmail: guestEmail || undefined,
          customerReference: bookingRef,
          displayCurrencyIso: "SAR",
          callBackUrl,
          errorUrl,
          language: resolvedLocale,
          userDefinedField: splitField,
        });

        if (mfResponse.IsSuccess && mfResponse.Data?.PaymentURL) {
          const u = new URL(mfResponse.Data.PaymentURL);
          const invKey = u.searchParams.get("invoiceKey");
          const pgId = u.searchParams.get("paymentGatewayId");
          if (invKey && pgId) {
            const directEndpoint = `${config.baseUrl}/DirectPayment/${invKey}/${pgId}`;
            const directRes = await fetch(directEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`,
              },
              body: JSON.stringify({
                PaymentType: "card",
                Bypass3DS: false,
                SaveToken: false,
                Card: {
                  Number: fullCardNumber,
                  ExpiryMonth: savedCard.expiryMonth,
                  ExpiryYear: savedCard.expiryYear,
                  SecurityCode: cardCvv,
                  HolderName: savedCard.cardholderName,
                },
              }),
            });
            const directData = (await directRes.json()) as { IsSuccess?: boolean; Data?: { PaymentURL?: string } };
            if (directData.IsSuccess && directData.Data?.PaymentURL) {
              return NextResponse.json({
                success: true,
                redirectUrl: directData.Data.PaymentURL,
                bookingId,
                bookingRef,
                amount: totalPrice,
                pricing,
                method: "card",
              });
            }
          }
        }
      } catch (directErr) {
        console.warn("Notice: DirectPayment error or gateway restrictions:", directErr);
      }
    }

    // Direct completion for saved card + CVV:
    // Lock PIN is set by the Host in their host portal, not auto-generated
    if (walletApplied > 0) {
      const splitSettle = await settlePendingWalletSplit(bookingRef);
      if (!splitSettle.settled) {
        clearPendingWalletSplit(bookingRef);
        await cancelInitiatedBooking(dbClient, bookingRef);
        return NextResponse.json(
          {
            code: "wallet_deduction_failed",
            message: splitSettle.error || "Could not settle wallet portion of split payment.",
          },
          { status: 400 }
        );
      }
    }

    const savedCardMethodLabel =
      walletApplied > 0
        ? `wallet+card_${savedCard.brand}_${savedCard.last4}`
        : `card_${savedCard.brand}_${savedCard.last4}`;

    try {
      await dbClient
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "success",
          payment_method: savedCardMethodLabel,
          smart_lock_pin: null,
        })
        .eq("booking_reference", bookingRef);
    } catch {}

    // Mirror callback confirmation side effects for saved-card direct settlements
    try {
      const { data: bookingRow } = await dbClient
        .from("bookings")
        .select("id, property_id, check_in, check_out, total_price")
        .eq("booking_reference", bookingRef)
        .maybeSingle();

      if (bookingRow?.property_id) {
        try {
          const { data: propData } = await dbClient
            .from("properties")
            .select("host_id, title")
            .eq("id", bookingRow.property_id)
            .maybeSingle();

          if (propData?.host_id) {
            await dbClient.from("host_notifications").insert({
              host_id: propData.host_id,
              property_id: bookingRow.property_id,
              booking_id: bookingRow.id,
              event_type: "booking_confirmed",
              title: "حجز جديد مؤكد! 🎉",
              body: `تم تأكيد حجز جديد لـ ${propData.title || propTitle} بقيمة ${bookingRow.total_price ?? totalPrice} ر.س للفترة من ${checkIn} إلى ${checkOut}.`,
              is_read: false,
            });
          }
        } catch {}

        if (checkIn && checkOut) {
          const startMs = Date.parse(`${checkIn}T00:00:00.000Z`);
          const endMs = Date.parse(`${checkOut}T00:00:00.000Z`);
          const numNights = Math.round((endMs - startMs) / 86_400_000);
          if (numNights > 0) {
            const rowsToUpsert = [];
            for (let i = 0; i < numNights; i++) {
              rowsToUpsert.push({
                property_id: bookingRow.property_id,
                date: new Date(startMs + i * 86_400_000).toISOString().slice(0, 10),
                is_available: false,
                updated_at: new Date().toISOString(),
              });
            }
            if (rowsToUpsert.length > 0) {
              await dbClient
                .from("property_availability")
                .upsert(rowsToUpsert, { onConflict: "property_id,date" });
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn("Notice: Could not sync saved-card side effects:", syncErr);
    }

    await dispatchBookingZatcaInvoice({
      bookingId,
      bookingRef,
      totalWithVat: totalPrice,
      buyerName: guestName || "Valued Guest",
      propertyTitle: propTitle || "Vacation Rental Accommodation",
      paymentMethod: savedCardMethodLabel,
    }).catch((zatcaErr) => {
      console.warn("Notice: Could not dispatch ZATCA invoice for saved-card booking:", zatcaErr);
    });

    if (effectiveUserId) {
      await awardLoyaltyPoints({
        userId: effectiveUserId,
        amountSpent: totalPrice,
        bookingRef,
        isWalletPayment: false,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      confirmed: true,
      bookingId,
      bookingRef,
      amount: totalPrice,
      pricing,
      paymentMethod: `card (${savedCard.brand.toUpperCase()} •••• ${savedCard.last4})`,
      smartLockPin: null,
      redirectUrl: `/${resolvedLocale}/property/${rawPropertyId}/reserve?confirmed=true&bookingRef=${bookingRef}&paidVia=saved_card&brand=${savedCard.brand}&last4=${savedCard.last4}`,
      message: "Payment processed successfully using saved card!",
    });
  }

  const revertInitiated = async () => {
    clearPendingWalletSplit(bookingRef);
    await cancelInitiatedBooking(dbClient, bookingRef);
  };

  // 2. Samsung Pay Web Checkout (requires Samsung Pay Service ID + MyFatoorah v3 SAMSUNG_PAY onboarding)
  if (selectedMethod === "samsung") {
    const samsungConfig = getSamsungPayWebConfig();
    if (!samsungConfig.available) {
      await revertInitiated();
      return NextResponse.json(
        {
          code: "samsung_pay_gateway_pending",
          provider: "Samsung Pay",
          message:
            "Samsung Pay Web Checkout requires Samsung Pay Portal Service ID and MyFatoorah SAMSUNG_PAY activation. Please choose Card, Apple Pay, Google Pay, STC Pay, or QafNest Wallet.",
        },
        { status: 400 }
      );
    }

    if (!samsungPayToken) {
      await revertInitiated();
      return NextResponse.json(
        {
          code: "samsung_pay_token_required",
          provider: "Samsung Pay",
          message: "Samsung Pay payment credential was not received. Please authorize via Samsung Wallet and try again.",
        },
        { status: 400 }
      );
    }

    try {
      const v3Response = await executeMyFatoorahV3Payment({
        paymentMethod: "SAMSUNG_PAY",
        invoiceValue: chargeAmount,
        currencyIso: "SAR",
        customerName: guestName || "QafNest Guest",
        customerMobile: guestPhone,
        customerEmail: guestEmail || undefined,
        customerReference: bookingRef,
        callBackUrl,
        errorUrl,
        language: resolvedLocale,
        token: samsungPayToken,
      });

      if (v3Response.IsSuccess && v3Response.Data?.PaymentURL) {
        return buildGatewayRedirectResponse(v3Response.Data.PaymentURL, v3Response.Data.InvoiceId);
      }

      if (v3Response.IsSuccess && v3Response.Data?.PaymentCompleted && v3Response.Data?.PaymentId) {
        const verifiedCallback = new URL(callBackUrl);
        verifiedCallback.searchParams.set("paymentId", String(v3Response.Data.PaymentId));
        return buildGatewayRedirectResponse(verifiedCallback.toString(), v3Response.Data.InvoiceId);
      }

      console.error("MyFatoorah v3 Samsung Pay rejected, reverting initiated booking:", maskPii(v3Response));
      await revertInitiated();
      return NextResponse.json(
        {
          code: "myfatoorah_error",
          provider: "Samsung Pay",
          message: v3Response.Message || "Failed to process Samsung Pay via MyFatoorah.",
          errors: v3Response.ValidationErrors || [],
        },
        { status: 400 }
      );
    } catch (apiErr: unknown) {
      console.error("MyFatoorah v3 Samsung Pay API error, reverting initiated booking:", maskPii(apiErr));
      await revertInitiated();
      return NextResponse.json(
        {
          code: "myfatoorah_error",
          provider: "Samsung Pay",
          message: apiErr instanceof Error ? apiErr.message : "MyFatoorah Samsung Pay unavailable.",
        },
        { status: 502 }
      );
    }
  }

  const hostedMethodMap: Record<string, MyFatoorahHostedMethod> = {
    apple: "apple",
    google: "google",
    stcpay: "stcpay",
  };
  const targetHostedMethod: MyFatoorahHostedMethod =
    hostedMethodMap[selectedMethod] ?? (cardType === "mada" ? "mada" : "card");

  const mfPaymentMethodId = await resolveMyFatoorahPaymentMethodId(
    targetHostedMethod,
    chargeAmount,
    "SAR"
  );

  try {
    const mfResponse = await executeMyFatoorahPayment({
      paymentMethodId: mfPaymentMethodId,
      invoiceValue: chargeAmount,
      customerName: guestName || "QafNest Guest",
      customerMobile: toMyFatoorahMobile(guestPhone),
      customerEmail: guestEmail || undefined,
      customerReference: bookingRef,
      displayCurrencyIso: "SAR",
      callBackUrl,
      errorUrl,
      language: resolvedLocale,
      userDefinedField: splitField,
      invoiceItems: [
        {
          itemName:
            walletApplied > 0
              ? `${propTitle} (${nights} nights · After ${walletApplied.toFixed(2)} SAR Wallet)`
              : `${propTitle} (${nights} nights)`,
          quantity: 1,
          unitPrice: chargeAmount,
        },
      ],
    });

    if (mfResponse.IsSuccess && mfResponse.Data?.PaymentURL) {
      return buildGatewayRedirectResponse(mfResponse.Data.PaymentURL, mfResponse.Data.InvoiceId);
    }

    // Gateway rejected: revert/cancel the initiated booking record and any pending split immediately
    console.error("MyFatoorah ExecutePayment rejected, reverting initiated booking:", maskPii(mfResponse));
    await revertInitiated();

    return NextResponse.json(
      {
        code: "myfatoorah_error",
        provider: "MyFatoorah",
        message: mfResponse.Message || "Failed to initiate payment gateway.",
        errors: mfResponse.ValidationErrors || [],
      },
      { status: 400 }
    );
  } catch (apiErr: unknown) {
    // Exception: revert/cancel the initiated booking record and any pending split immediately
    console.error("MyFatoorah API error, reverting initiated booking:", maskPii(apiErr));
    await revertInitiated();

    return NextResponse.json(
      {
        code: "myfatoorah_error",
        provider: "MyFatoorah",
        message: apiErr instanceof Error ? apiErr.message : "MyFatoorah service unavailable.",
      },
      { status: 502 }
    );
  }
}

