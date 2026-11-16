import { NextResponse } from "next/server";
import { verifyGuestSession } from "@/lib/auth/serverAuth";
import { registerPendingTopUp } from "@/lib/services/walletService";
import { getCanonicalOrigin } from "@/lib/services/callbackRedirect";
import {
  executeMyFatoorahPayment,
  getMyFatoorahConfig,
  getSamsungPayWebConfig,
  resolveMyFatoorahPaymentMethodId,
  type MyFatoorahHostedMethod,
} from "@/lib/services/myfatoorah";
import { toMyFatoorahMobile } from "@qafnest/shared/phone";
import { resolveRequestLocale } from "@/lib/services/requestLocale";

const MAX_TOPUP_SAR = 50_000;

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
  if (!Number.isFinite(rawAmount) || rawAmount < 10 || rawAmount > MAX_TOPUP_SAR) {
    return NextResponse.json(
      { error: `Top-up amount must be between 10 and ${MAX_TOPUP_SAR.toLocaleString()} SAR` },
      { status: 400 }
    );
  }
  const roundedAmount = Math.round(rawAmount * 100) / 100;

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

  const config = getMyFatoorahConfig();
  if (!config.apiKey) {
    return NextResponse.json(
      { error: "Payment gateway is not configured for wallet top-ups." },
      { status: 503 }
    );
  }

  const reference = `TOPUP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

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
    roundedAmount,
    "SAR"
  );

  const canonicalOrigin = getCanonicalOrigin(request);
  const callBackUrl = `${canonicalOrigin}/api/wallet/topup/callback?ref=${encodeURIComponent(reference)}&method=${encodeURIComponent(method)}&locale=${resolvedLocale}`;
  const errorUrl = `${canonicalOrigin}/${resolvedLocale}/account?tab=wallet&topup_error=cancelled`;

  await registerPendingTopUp({
    reference,
    userId,
    amount: roundedAmount,
    method: resolvedTopupMethod,
  });

  try {
    const mfResponse = await executeMyFatoorahPayment({
      paymentMethodId: mfPaymentMethodId,
      invoiceValue: roundedAmount,
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
          itemName: `QafNest Wallet Credit Top-up (${roundedAmount.toFixed(2)} SAR)`,
          quantity: 1,
          unitPrice: roundedAmount,
        },
      ],
    });

    if (mfResponse.IsSuccess && mfResponse.Data?.PaymentURL) {
      return NextResponse.json({
        success: true,
        redirectUrl: mfResponse.Data.PaymentURL,
        invoiceId: mfResponse.Data.InvoiceId,
        reference,
        amount: roundedAmount,
      });
    }

    return NextResponse.json(
      { error: mfResponse.Message || "Payment gateway rejected top-up initiation." },
      { status: 400 }
    );
  } catch (err) {
    console.error("MyFatoorah wallet top-up gateway error:", err);
    return NextResponse.json(
      { error: "Unable to initiate wallet top-up payment right now." },
      { status: 502 }
    );
  }
}
