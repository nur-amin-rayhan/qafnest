import { NextRequest, NextResponse } from "next/server";
import { verifyHostSession } from "@/lib/auth/serverAuth";
import {
  getHostFinancialData,
  updateHostIban,
  createPayoutRequest,
  updateSettlementSettings,
  generateSettlementCsvString,
} from "@/lib/services/hostFinancialsService";

export async function GET(request: NextRequest) {
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format");
  const propertyId = searchParams.get("propertyId") || undefined;

  try {
    const data = await getHostFinancialData(authUser.id, propertyId);

    if (format === "statement_csv") {
      const csv = generateSettlementCsvString(data);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="qafnest-settlement-statement-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, ...data });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Error fetching financials" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authUser = await verifyHostSession(request);
  if (!authUser) {
    return NextResponse.json(
      { code: "unauthorized", message: "Host authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "update_iban") {
      const { iban, accountHolder } = body;
      if (!iban || !accountHolder) {
        return NextResponse.json(
          { code: "invalid_payload", message: "IBAN and account holder name are required." },
          { status: 400 }
        );
      }
      const updated = updateHostIban(authUser.id, iban, accountHolder);
      return NextResponse.json({
        success: true,
        message: "IBAN updated and verified successfully with Saudi Central Bank (SAMA).",
        iban: updated,
      });
    }

    if (action === "request_payout") {
      const amount = Number(body.amount);
      if (!amount || amount < 100) {
        return NextResponse.json(
          { code: "invalid_amount", message: "Minimum payout amount is 100 SAR." },
          { status: 400 }
        );
      }
      const remittance = createPayoutRequest(authUser.id, amount);
      return NextResponse.json({
        success: true,
        message: "Payout transfer request submitted. Disbursing to your verified IBAN.",
        remittance,
      });
    }

    if (action === "update_settlement_settings") {
      const { settings } = body;
      if (!settings) {
        return NextResponse.json({ code: "invalid_payload", message: "Settings object required" }, { status: 400 });
      }
      const updated = updateSettlementSettings(authUser.id, settings);
      return NextResponse.json({
        success: true,
        message: "Settlement schedule preferences updated successfully.",
        settings: updated,
      });
    }

    return NextResponse.json({ code: "unknown_action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "server_error", message: err instanceof Error ? err.message : "Error processing request" },
      { status: 500 }
    );
  }
}

