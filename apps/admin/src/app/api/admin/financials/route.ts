import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, isAdminRequest } from "@/lib/adminApi";
import { validateLegalTransactionNumber } from "@qafnest/shared";
import {
  getAdminFinancialData,
  reviewAdminPayoutRequest,
  updatePayoutStatus,
  batchUpdatePayoutStatus,
  processSarieSettlementBatch,
  sendHostPayoutReminders,
  saveAdminPayoutPolicy,
  probeMyFatoorahMultiVendor,
  generateSarieCsvString,
} from "@/lib/services/adminFinancialsService";
import {
  getLiveAdminInvoices,
  generateZatcaJournalCsv,
} from "@/lib/services/adminInvoicesService";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format");
  const check = searchParams.get("check");

  if (check === "suppliers") {
    const supplierProbe = await probeMyFatoorahMultiVendor();
    return NextResponse.json({ success: true, supplierProbe });
  }

  if (format === "csv") {
    const csvData = generateSarieCsvString();
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="qafnest-payouts-sarie-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (format === "tax_journal_csv") {
    const invoices = await getLiveAdminInvoices();
    const csvData = generateZatcaJournalCsv(invoices);
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="qafnest-zatca-tax-journal-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  try {
    const [data, invoices] = await Promise.all([
      getAdminFinancialData(),
      getLiveAdminInvoices(),
    ]);
    return NextResponse.json({
      success: true,
      ...data,
      invoices,
    });
  } catch (err: unknown) {
    console.error("[admin financials GET] error:", err);
    return NextResponse.json(
      { code: "server_error", message: "Error fetching admin financials." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    await import("@qafnest/shared/hostPayoutStore").then((m) => m.hydrateHostPayoutStore());
    const body = await request.json();
    const { action, payoutId, payoutIds, status, holdReason, sarieTxnId, policy, reason, rejectionReason } = body;
    const adminSession = getAdminSession(request);

    if (action === "approve_request" || action === "reject_request") {
      if (!payoutId) {
        return NextResponse.json({ code: "invalid_payload", message: "Payout ID is required." }, { status: 400 });
      }
      const decision = action === "approve_request" ? "approved" : "rejected";
      const updated = await reviewAdminPayoutRequest(
        payoutId,
        decision,
        adminSession?.email || "Admin Operations",
        rejectionReason || reason
      );
      if (!updated) {
        return NextResponse.json({ code: "not_found", message: "Payout request not found." }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message:
          decision === "approved"
            ? `Payout request ${updated.reference} approved & queued for Finance payment.`
            : `Payout request ${updated.reference} declined.`,
        payout: updated,
      });
    }

    if (action === "process_settlement") {
      let effectiveTxnId = sarieTxnId;
      let txnCheck = validateLegalTransactionNumber(effectiveTxnId);
      if (!txnCheck.valid) {
        if (process.env.NODE_ENV === "production") {
          return NextResponse.json(
            {
              code: "invalid_sarie_txn_id",
              message: txnCheck.errorEn || "Valid SARIE / Bank Transaction Reference is required in production.",
            },
            { status: 400 }
          );
        }
        effectiveTxnId = `SARIE-${Math.floor(10000000 + Math.random() * 90000000)}`;
        txnCheck = validateLegalTransactionNumber(effectiveTxnId);
      }
      const result = processSarieSettlementBatch(txnCheck.cleaned);
      return NextResponse.json({
        success: true,
        message: `Settled ${result.settledCount} post-checkout payout(s) under Legal Txn #${result.transactionNumber}.${
          result.skippedEscrowCount > 0
            ? ` (${result.skippedEscrowCount} pre-checkout escrow payout(s) skipped)`
            : ""
        }`,
        ...result,
      });
    }

    if (action === "send_reminder") {
      const result = await sendHostPayoutReminders(Array.isArray(payoutIds) ? payoutIds : undefined);
      return NextResponse.json({
        success: true,
        message: `Dispatched 24h payout reminder for ${result.remindedCount} host payout(s).`,
        ...result,
      });
    }

    if (action === "update_policy" && policy) {
      const updatedPolicy = saveAdminPayoutPolicy(policy);
      return NextResponse.json({
        success: true,
        message: "24-hour host payout policy updated & synchronized.",
        policy: updatedPolicy,
      });
    }

    if (action === "batch_update_status" && Array.isArray(payoutIds)) {
      if (!["disbursed", "pending", "processing", "on_hold"].includes(status)) {
        return NextResponse.json({ code: "invalid_payload", message: "Invalid status" }, { status: 400 });
      }
      let cleanedTxn: string | undefined;
      if (status === "disbursed") {
        const txnCheck = validateLegalTransactionNumber(sarieTxnId);
        if (!txnCheck.valid) {
          if (process.env.NODE_ENV !== "production" || !sarieTxnId) {
            cleanedTxn = `SARIE-${Date.now().toString().slice(-8)}`;
          } else {
            return NextResponse.json(
              { code: "missing_transaction_number", message: txnCheck.errorEn },
              { status: 400 }
            );
          }
        } else {
          cleanedTxn = txnCheck.cleaned;
        }
      }
      const result = batchUpdatePayoutStatus(payoutIds, status, cleanedTxn);
      return NextResponse.json({
        success: true,
        message: `Updated ${result.updated.length} payout(s) to ${status}.${
          result.skippedEscrowCount > 0
            ? ` (${result.skippedEscrowCount} held in escrow until guest check-out)`
            : ""
        }`,
        payouts: result.updated,
        skippedEscrowCount: result.skippedEscrowCount,
      });
    }

    if (!payoutId || !["disbursed", "pending", "processing", "on_hold"].includes(status)) {
      return NextResponse.json({ code: "invalid_payload", message: "Invalid payout ID or status" }, { status: 400 });
    }

    let effectiveTxnId = sarieTxnId;
    if (status === "disbursed") {
      const txnCheck = validateLegalTransactionNumber(sarieTxnId);
      if (!txnCheck.valid) {
        if (process.env.NODE_ENV !== "production" || !sarieTxnId) {
          effectiveTxnId = `SARIE-${Date.now().toString().slice(-8)}`;
        } else {
          return NextResponse.json(
            { code: "missing_transaction_number", message: txnCheck.errorEn },
            { status: 400 }
          );
        }
      } else {
        effectiveTxnId = txnCheck.cleaned;
      }
    }

    const updated = await updatePayoutStatus(payoutId, status, holdReason, effectiveTxnId);
    if (!updated) {
      return NextResponse.json({ code: "not_found", message: "Payout record not found." }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: `Payout ${updated.reference} updated to ${status}.`,
      payout: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating payout";
    const isValidationOrEscrow =
      msg.includes("Escrow Lock") ||
      msg.includes("Transaction Number") ||
      msg.includes("Declined") ||
      msg.includes("cannot be");
    return NextResponse.json(
      { code: isValidationOrEscrow ? "settlement_blocked" : "server_error", message: msg },
      { status: isValidationOrEscrow ? 400 : 500 }
    );
  }
}
