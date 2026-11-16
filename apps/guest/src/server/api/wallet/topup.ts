import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { topUpWallet } from "@/lib/services/walletService";
import {
  executeMyFatoorahPayment,
  getMyFatoorahConfig,
  getSamsungPayWebConfig,
  resolveMyFatoorahPaymentMethodId,
  type MyFatoorahHostedMethod,
} from "@/lib/services/myfatoorah";
import { toMyFatoorahMobile } from "@qafnest/shared/phone";
import { dispatchWalletTopupZatcaInvoice } from "@/lib/services/zatcaReportingHelper";
import { resolveRequestLocale } from "@/lib/services/requestLocale";

export async function POST(request: Request) {
  const authUser = await verifyGuestSession(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 });
  }

  const rawAmount = Number(body.amount);
  if (isNaN(rawAmount) || rawAmount < 10) {
    return NextResponse.json(
      { error: "Minimum top-up amount is 10 SAR" },
      { status: 400 }
    );
  }

  const method = typeof body.method === "string" ? body.method : "card";
  const resolvedLocale = resolveRequestLocale(request, body.locale ?? body.lang);
  const userId = authUser.id;
  const userName = authUser.name || authUser.email?.split("@")[0] || "Valued Guest";
  const userPhone = authUser.phone || "0500000000";
  const userEmail = authUser.email || undefined;

  if (method === "samsung" && !getSamsungPayWebConfig().available) {
    return NextResponse.json(
      {
        error:
          "Samsung Pay top-up requires Samsung Pay Portal Service ID and MyFatoorah SAMSUNG_PAY activation.",
      },
      { status: 400 }
    );
  }

  const reference = `TOPUP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Resolve MyFatoorah payment method ID dynamically (Mada, Apple Pay, Google Pay, STC Pay, Visa/MC)
  const topupMethodMap: Record<string, MyFatoorahHostedMethod> = {
    apple: "apple",
    mada: "mada",
    google: "google",
    stcpay: "stcpay",
    card: "card",
  };
  const resolvedTopupMethod: MyFatoorahHostedMethod = topupMethodMap[method] || "card";
  const mfPaymentMethodId = await resolveMyFatoorahPaymentMethodId(
    resolvedTopupMethod,
    rawAmount,
    "SAR"
  );

  const forwardedProto = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host") || "localhost:3000";
  const requestOrigin = request.headers.get("origin") || (host.startsWith("http") ? host : `${forwardedProto}://${host}`);

  const callBackUrl = `${requestOrigin}/api/wallet/topup/callback?ref=${reference}&amount=${rawAmount}&userId=${userId}&method=${method}&locale=${resolvedLocale}`;
  const errorUrl = `${requestOrigin}/${resolvedLocale}/account?tab=wallet&topup_error=cancelled`;

  const config = getMyFatoorahConfig();

  // If MyFatoorah API key is configured and not in dev instant mode
  if (config.apiKey && !body.instant) {
    try {
      const mfResponse = await executeMyFatoorahPayment({
        paymentMethodId: mfPaymentMethodId,
        invoiceValue: rawAmount,
        customerName: userName,
        customerMobile: toMyFatoorahMobile(userPhone),
        customerEmail: userEmail,
        customerReference: reference,
        displayCurrencyIso: "SAR",
        callBackUrl,
        errorUrl,
        language: resolvedLocale,
        invoiceItems: [
          {
            itemName: `QafNest Wallet Credit Top-up (${rawAmount} SAR)`,
            quantity: 1,
            unitPrice: rawAmount,
          },
        ],
      });

      if (mfResponse.IsSuccess && mfResponse.Data?.PaymentURL) {
        return NextResponse.json({
          success: true,
          redirectUrl: mfResponse.Data.PaymentURL,
          invoiceId: mfResponse.Data.InvoiceId,
          reference,
          amount: rawAmount,
        });
      }
    } catch (err) {
      console.warn("MyFatoorah topup attempt failed, falling back to direct topup:", err);
    }
  }

  // Instant top-up (development / simulation / demo mode)
  const updatedWallet = await topUpWallet({
    userId,
    amount: rawAmount,
    paymentMethod: method,
    reference,
  });

  // Report real-money top-up tax receipt to ZATCA Phase 2 API
  const zatcaResult = await dispatchWalletTopupZatcaInvoice({
    transactionId: updatedWallet.transactions[0]?.id || reference,
    reference,
    amount: rawAmount,
    buyerName: userName,
    paymentMethod: method,
  });

  return NextResponse.json({
    success: true,
    instant: true,
    wallet: updatedWallet,
    reference,
    amount: rawAmount,
    zatcaStatus: zatcaResult?.clearanceStatus || null,
    zatcaInvoiceNumber: zatcaResult?.invoiceNumber || null,
    message: "Wallet topped up successfully!",
  });
}
