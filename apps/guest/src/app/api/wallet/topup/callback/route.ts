import { NextRequest, NextResponse } from "next/server";
import { getMyFatoorahPaymentStatus, extractPaidAmount } from "@/lib/services/myfatoorah";
import { topUpWallet } from "@/lib/services/walletService";
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
  const userId = (searchParams.get("userId") || "").trim();
  const method = (searchParams.get("method") || "card").trim();
  const amountParam = parseFloat(searchParams.get("amount") || "0");
  const resolvedLocale = resolveRequestLocale(request);

  const canonicalOrigin = getCanonicalOrigin(request);

  if (!paymentId && request.method === "POST") {
    try {
      const body = await request.json();
      paymentId = body.paymentId || body.PaymentId || body.Id || body.id;
    } catch {}
  }

  let finalAmount = amountParam;
  let isVerified = false;

  if (paymentId) {
    try {
      const statusResult = await getMyFatoorahPaymentStatus(paymentId, "PaymentId");
      if (statusResult.IsSuccess && statusResult.Data) {
        const invoiceData = statusResult.Data;
        const isPaid =
          invoiceData.InvoiceStatus === "Paid" ||
          invoiceData.InvoiceTransactions?.some(
            (t) => t.TransactionStatus === "Succss" || t.TransactionStatus === "Success"
          );
        if (isPaid) {
          isVerified = true;
          const paid = extractPaidAmount(invoiceData);
          if (paid > 0) finalAmount = paid;
        }
      }
    } catch (err) {
      console.warn("Notice: Error checking MyFatoorah status for topup:", err);
    }
  } else if (reference && userId && amountParam > 0) {
    // Direct redirect mode
    isVerified = true;
  }

  if (isVerified && userId && finalAmount > 0) {
    const finalRef = reference || `TOPUP-${Date.now()}`;
    const updatedWallet = await topUpWallet({
      userId,
      amount: finalAmount,
      paymentMethod: method,
      reference: finalRef,
    });

    await dispatchWalletTopupZatcaInvoice({
      transactionId: updatedWallet.transactions[0]?.id || finalRef,
      reference: finalRef,
      amount: finalAmount,
      paymentMethod: method,
    });

    const redirectUrl = new URL(`/${resolvedLocale}/account`, canonicalOrigin);
    redirectUrl.searchParams.set("tab", "wallet");
    redirectUrl.searchParams.set("topup_success", "true");
    redirectUrl.searchParams.set("amount", finalAmount.toFixed(2));
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set("qafnest_lang", resolvedLocale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }

  const failUrl = new URL(`/${resolvedLocale}/account`, canonicalOrigin);
  failUrl.searchParams.set("tab", "wallet");
  failUrl.searchParams.set("topup_error", "verification_failed");
  const failRes = NextResponse.redirect(failUrl);
  failRes.cookies.set("qafnest_lang", resolvedLocale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return failRes;
}
