import { NextRequest, NextResponse } from "next/server";
import { getMyFatoorahPaymentStatus, extractPaidAmount } from "@/lib/services/myfatoorah";
import {
  getPendingTopUp,
  isTopUpPaymentProcessed,
  markTopUpPaymentProcessed,
  topUpWallet,
} from "@/lib/services/walletService";
import { getCanonicalOrigin } from "@/lib/services/callbackRedirect";
import { dispatchWalletTopupZatcaInvoice } from "@/lib/services/zatcaReportingHelper";
import { resolveRequestLocale } from "@/lib/services/requestLocale";

export async function GET(request: NextRequest) {
  return handleTopUpCallback(request);
}

export async function POST(request: NextRequest) {
  return handleTopUpCallback(request);
}

async function handleTopUpCallback(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  let paymentId =
    searchParams.get("paymentId") ||
    searchParams.get("PaymentId") ||
    searchParams.get("Id") ||
    searchParams.get("id");

  const reference = (searchParams.get("ref") || "").trim();
  const method = (searchParams.get("method") || "card").trim();
  const resolvedLocale = resolveRequestLocale(request);
  const canonicalOrigin = getCanonicalOrigin(request);

  if (!paymentId && request.method === "POST") {
    try {
      const body = await request.json();
      paymentId = body.paymentId || body.PaymentId || body.Id || body.id;
    } catch {}
  }

  const redirectFailure = (reason = "verification_failed") => {
    const failUrl = new URL(`/${resolvedLocale}/account`, canonicalOrigin);
    failUrl.searchParams.set("tab", "wallet");
    failUrl.searchParams.set("topup_error", reason);
    const failRes = NextResponse.redirect(failUrl);
    failRes.cookies.set("qafnest_lang", resolvedLocale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return failRes;
  };

  if (!paymentId || !String(paymentId).trim()) {
    return redirectFailure("missing_payment_id");
  }
  const cleanPaymentId = String(paymentId).trim();

  if (await isTopUpPaymentProcessed(cleanPaymentId)) {
    const dupUrl = new URL(`/${resolvedLocale}/account`, canonicalOrigin);
    dupUrl.searchParams.set("tab", "wallet");
    dupUrl.searchParams.set("topup_success", "true");
    return NextResponse.redirect(dupUrl);
  }

  let finalAmount = 0;
  let resolvedRef = reference;

  try {
    const statusResult = await getMyFatoorahPaymentStatus(cleanPaymentId, "PaymentId");
    if (!statusResult.IsSuccess || !statusResult.Data) {
      return redirectFailure("gateway_verification_failed");
    }

    const invoiceData = statusResult.Data;
    const isPaid =
      invoiceData.InvoiceStatus === "Paid" ||
      invoiceData.InvoiceTransactions?.some(
        (t) => t.TransactionStatus === "Succss" || t.TransactionStatus === "Success"
      );
    if (!isPaid) {
      return redirectFailure("payment_not_completed");
    }

    const gatewayRef = String(invoiceData.CustomerReference || "").trim();
    if (!gatewayRef || !gatewayRef.startsWith("TOPUP-")) {
      return redirectFailure("invalid_topup_reference");
    }
    if (reference && gatewayRef !== reference) {
      return redirectFailure("reference_mismatch");
    }
    resolvedRef = gatewayRef;

    finalAmount = extractPaidAmount(invoiceData);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return redirectFailure("invalid_amount");
    }
  } catch (err) {
    console.warn("Notice: Error checking MyFatoorah status for topup:", err);
    return redirectFailure("gateway_error");
  }

  const intent = await getPendingTopUp(resolvedRef);
  if (!intent || intent.settled || !intent.userId) {
    return redirectFailure("topup_intent_invalid");
  }

  if (Math.abs(finalAmount - intent.amount) > 0.05) {
    return redirectFailure("amount_mismatch");
  }

  await markTopUpPaymentProcessed({ paymentId: cleanPaymentId, reference: resolvedRef });

  const updatedWallet = await topUpWallet({
    userId: intent.userId,
    amount: intent.amount,
    paymentMethod: intent.method || method,
    reference: resolvedRef,
  });

  await dispatchWalletTopupZatcaInvoice({
    transactionId: updatedWallet.transactions[0]?.id || resolvedRef,
    reference: resolvedRef,
    amount: intent.amount,
    paymentMethod: intent.method || method,
  });

  const redirectUrl = new URL(`/${resolvedLocale}/account`, canonicalOrigin);
  redirectUrl.searchParams.set("tab", "wallet");
  redirectUrl.searchParams.set("topup_success", "true");
  redirectUrl.searchParams.set("amount", intent.amount.toFixed(2));
  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set("qafnest_lang", resolvedLocale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return res;
}
