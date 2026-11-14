import { NextRequest, NextResponse } from "next/server";
import {
  getServerZatcaConfig,
  updateServerZatcaConfig,
  testZatcaGatewayHandshake,
  reportInvoiceToZatca,
  onboardZatcaComplianceCsid,
  getZatcaInvoiceRecords,
} from "@qafnest/shared/zatcaStore";
import type { ZatcaConfig } from "@qafnest/shared";

export async function GET() {
  try {
    const config = getServerZatcaConfig();
    const recentInvoices = getZatcaInvoiceRecords(25).map((inv) => ({
      uuid: inv.uuid,
      invoiceNumber: inv.invoiceNumber,
      bookingReference: inv.bookingReference,
      icv: inv.icv,
      environment: inv.environment,
      endpoint: inv.endpoint,
      totalWithVat: inv.totalWithVat,
      httpStatus: inv.httpStatus,
      clearanceStatus: inv.clearanceStatus,
      validationStatus: inv.validationStatus,
      invoiceHash: inv.invoiceHash,
      reportedAt: inv.reportedAt,
      requestId: inv.requestId,
    }));

    return NextResponse.json({
      success: true,
      config,
      recentInvoices,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load ZATCA configuration";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || "save_config";

    if (action === "onboard_csid") {
      const onboardResult = await onboardZatcaComplianceCsid(body.configOverride);
      return NextResponse.json({
        ...onboardResult,
        message: "Successfully onboarded EGS CSR & received live ZATCA Compliance CSID!",
      });
    }

    if (action === "test_handshake") {
      const handshake = await testZatcaGatewayHandshake(body.configOverride);
      return NextResponse.json({
        success: true,
        handshake,
      });
    }

    if (action === "report_test_invoice") {
      const testInvoiceId = crypto.randomUUID();
      const testInvoiceNumber = `INV-TEST-${Date.now().toString().slice(-6)}`;
      const result = await reportInvoiceToZatca({
        invoiceId: testInvoiceId,
        invoiceNumber: testInvoiceNumber,
        bookingReference: `TEST-${testInvoiceNumber}`,
        buyerName: "ZATCA Developer Sandbox Probe",
        lineItems: [
          {
            name: "QafNest Test Stay Accommodation / إقامة تجريبية",
            quantity: 1,
            unitPrice: 1000.0,
            subtotal: 1000.0,
            vatRate: 0.15,
            vatAmount: 150.0,
            total: 1150.0,
          },
        ],
        taxableAmount: 1000.0,
        vatAmount: 150.0,
        totalWithVat: 1150.0,
        type: "simplified",
      });

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? "Test invoice validated & reported to ZATCA Phase 2 API cleanly."
          : "ZATCA returned validation/auth feedback — inspect details below.",
        result,
      });
    }

    // Default: Save configuration updates
    const updates: Partial<ZatcaConfig> = body.config || body;
    const updated = updateServerZatcaConfig(updates);

    return NextResponse.json({
      success: true,
      message: "ZATCA E-Invoicing configuration synchronized successfully.",
      config: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process ZATCA request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
