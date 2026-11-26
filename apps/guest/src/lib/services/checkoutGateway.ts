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
import { toMyFatoorahMobile } from "@qafnest/shared/phone";
import { cancelInitiatedBooking } from "@/lib/services/bookingReconciliation";
import { maskPii } from "@/lib/services/piiSanitizer";
import {
  attachGatewayTokenToCard,
  decryptCardNumber,
  clearPendingWalletSplit,
  refundSettledWalletSplit,
  SavedCard,
} from "@/lib/services/walletService";
import { normalizeAppLocale, type AppLocale } from "@/lib/services/requestLocale";
import { getCanonicalOrigin } from "@/lib/services/callbackRedirect";

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
  const requestOrigin = getCanonicalOrigin(request);

  const resolvedLocale = normalizeAppLocale(locale) || "ar";
  const { callBackUrl, errorUrl } = resolveCallbackUrls({
    origin: requestOrigin,
    propertyId: rawPropertyId,
    bookingRef,
    locale: resolvedLocale,
  });

  const revertInitiated = async () => {
    await refundSettledWalletSplit(bookingRef, "Gateway payment initiation failed");
    await clearPendingWalletSplit(bookingRef);
    await cancelInitiatedBooking(dbClient, bookingRef);
  };

  // 1. Saved Card Checkout (tokenized MyFatoorah DirectPayment, else pre-selected MyFatoorah gateway)
  if (selectedMethod === "card" && savedCard) {
    const gatewayToken = savedCard.gatewayToken ? decryptCardNumber(savedCard.gatewayToken) : "";
    const effectiveCvv = cardCvv && /^\d{3,4}$/.test(cardCvv.trim()) ? cardCvv.trim() : "";
    const canTryDirectCharge = Boolean(
      savedCard.supportsDirectCharge && effectiveCvv && gatewayToken
    );

    if (canTryDirectCharge) {
      try {
        const config = getMyFatoorahConfig();
        const directMethodTarget: MyFatoorahHostedMethod =
          savedCard.brand === "mada" ? "mada" : "card";
        const resolvedMethodId = await resolveMyFatoorahPaymentMethodId(
          directMethodTarget,
          chargeAmount,
          "SAR"
        );
        const mfResponse = await executeMyFatoorahPayment({
          paymentMethodId: resolvedMethodId,
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
          const paymentUrl = mfResponse.Data.PaymentURL;
          let directEndpoint = "";
          if (/\/DirectPayment\//i.test(paymentUrl)) {
            directEndpoint = paymentUrl;
          } else {
            const u = new URL(paymentUrl);
            const invKey = u.searchParams.get("invoiceKey");
            const pgId = u.searchParams.get("paymentGatewayId");
            if (invKey && pgId) {
              directEndpoint = `${config.baseUrl}/DirectPayment/${invKey}/${pgId}`;
            }
          }

          if (directEndpoint) {
            const directPayload = {
              PaymentType: "token",
              Token: gatewayToken,
              SecurityCode: effectiveCvv,
              Bypass3DS: false,
            };
            const directRes = await fetch(directEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.apiKey}`,
              },
              body: JSON.stringify(directPayload),
            });
            const directData = (await directRes.json()) as {
              IsSuccess?: boolean;
              Message?: string;
              ValidationErrors?: Array<{ Name?: string; Error?: string }>;
              Data?: { PaymentURL?: string; Token?: string };
            };

            if (directData.IsSuccess && directData.Data?.PaymentURL) {
              if (directData.Data.Token && savedCard.userId) {
                await attachGatewayTokenToCard(
                  savedCard.userId,
                  savedCard.id,
                  directData.Data.Token
                ).catch(() => undefined);
              }
              return buildGatewayRedirectResponse(
                directData.Data.PaymentURL,
                mfResponse.Data.InvoiceId
              );
            }

            const errText = [
              directData.Message || "",
              ...(directData.ValidationErrors || []).map((e) => `${e.Name || ""}: ${e.Error || ""}`),
            ].join(" ");
            const isAccountFeatureDisabled = /direct\s*payment\s*is\s*not\s*enabled|not\s*allowed|not\s*enabled/i.test(
              errText
            );
            if (!isAccountFeatureDisabled) {
              // Real card decline / invalid card details: let user immediately switch to another card
              console.warn("Saved card DirectPayment declined:", maskPii(directData));
              await revertInitiated();
              return NextResponse.json(
                {
                  code: "saved_card_declined",
                  provider: "MyFatoorah",
                  message:
                    directData.Message ||
                    "Your saved card was declined. Please choose another saved card or pay with a new card.",
                  messageAr:
                    "تم رفض البطاقة المحفوظة. يرجى اختيار بطاقة أخرى أو الدفع ببطاقة جديدة.",
                  errors: directData.ValidationErrors || [],
                },
                { status: 400 }
              );
            }
          }
        }
      } catch (directErr) {
        console.warn("Notice: DirectPayment unavailable, falling back to MyFatoorah hosted gateway:", directErr);
      }
    }
  }

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
    mada: "mada",
  };
  const targetHostedMethod: MyFatoorahHostedMethod =
    hostedMethodMap[selectedMethod] ??
    (savedCard?.brand === "mada" || cardType === "mada" ? "mada" : "card");

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

