import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminApi";
import {
  getAdminFinancialData,
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
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Error fetching admin financials" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ code: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, payoutId, payoutIds, status, holdReason, sarieTxnId, policy } = body;

    if (action === "process_settlement") {
      const result = processSarieSettlementBatch();
      return NextResponse.json({
        success: true,
        message: `Successfully processed SAMA SARIE settlement batch for ${result.settledCount} payouts.`,
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
      const updatedList = batchUpdatePayoutStatus(payoutIds, status);
      return NextResponse.json({
        success: true,
        message: `Batch updated ${updatedList.length} payouts to ${status}.`,
        payouts: updatedList,
      });
    }

    if (!payoutId || !["disbursed", "pending", "processing", "on_hold"].includes(status)) {
      return NextResponse.json({ code: "invalid_payload", message: "Invalid payout ID or status" }, { status: 400 });
    }

    const updated = await updatePayoutStatus(payoutId, status, holdReason, sarieTxnId);
    return NextResponse.json({
      success: true,
      message: `Payout ${updated?.reference} updated to ${status}.`,
      payout: updated,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Error updating payout" },
      { status: 500 }
    );
  }
}
