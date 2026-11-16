import { NextRequest, NextResponse } from "next/server";
import {
  getServerZatcaConfig,
  updateServerZatcaConfig,
  testZatcaGatewayHandshake,
  reportInvoiceToZatca,
  onboardZatcaComplianceCsid,
  upgradeToProductionCsid,
  getZatcaInvoiceRecords,
  hydrateZatcaState,
} from "@qafnest/shared/zatcaStore";
import { persistSharedJsonFile } from "@qafnest/shared/serverJsonStore";
import type { ZatcaConfig } from "@qafnest/shared";
import { isAdminRequest } from "@/lib/adminApi";

const CONFIGURED_SENTINEL = "__CONFIGURED__";

function redactZatcaConfig(cfg: ZatcaConfig) {
  return {
    ...cfg,
    otp: cfg.otp ? CONFIGURED_SENTINEL : "",
    csidSecret: cfg.csidSecret ? CONFIGURED_SENTINEL : "",
    privateKeyPem: undefined,
    hasPrivateKey: Boolean(cfg.privateKeyPem),
    hasCsidSecret: Boolean(cfg.csidSecret),
  };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await hydrateZatcaState();
    const config = getServerZatcaConfig();
    const recentInvoices = getZatcaInvoiceRecords(50).map((inv) => ({
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
      config: redactZatcaConfig(config),
      recentInvoices,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load ZATCA configuration";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await hydrateZatcaState();
    const existing = getServerZatcaConfig();
    const body = await request.json();
    const action = body.action || "save_config";

    const preserveSecrets = (raw: Partial<ZatcaConfig> = {}): Partial<ZatcaConfig> => ({
      ...raw,
      ...(raw.otp === CONFIGURED_SENTINEL ? { otp: existing.otp } : {}),
      ...(raw.csidSecret === CONFIGURED_SENTINEL ? { csidSecret: existing.csidSecret } : {}),
      ...(raw.privateKeyPem === undefined ? {} : raw.privateKeyPem ? { privateKeyPem: raw.privateKeyPem } : {}),
    });

    if (action === "onboard_csid") {
      const onboardResult = await onboardZatcaComplianceCsid(preserveSecrets(body.configOverride));
      await persistSharedJsonFile("zatca-config.json", onboardResult.config);
      return NextResponse.json({
        ...onboardResult,
        config: redactZatcaConfig(onboardResult.config),
        message: "Successfully onboarded EGS CSR & received live ZATCA Compliance CSID!",
      });
    }

    if (action === "upgrade_production_csid") {
      const prodResult = await upgradeToProductionCsid();
      await persistSharedJsonFile("zatca-config.json", prodResult.config);
      return NextResponse.json({
        success: true,
        requestID: prodResult.requestID,
        dispositionMessage: prodResult.dispositionMessage,
        config: redactZatcaConfig(prodResult.config),
        message: "Upgraded to ZATCA Production CSID cleanly.",
      });
    }

    if (action === "test_handshake") {
      const handshake = await testZatcaGatewayHandshake(preserveSecrets(body.configOverride));
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
      await persistSharedJsonFile("zatca-config.json", getServerZatcaConfig());
      await persistSharedJsonFile("zatca-invoices.json", getZatcaInvoiceRecords(500));

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? "Test invoice validated & reported to ZATCA Phase 2 API cleanly."
          : "ZATCA returned validation/auth feedback — inspect details below.",
        result,
      });
    }

    const updates = preserveSecrets((body.config || body) as Partial<ZatcaConfig>);
    const updated = updateServerZatcaConfig(updates);
    await persistSharedJsonFile("zatca-config.json", updated);

    return NextResponse.json({
      success: true,
      message: "ZATCA E-Invoicing configuration synchronized successfully.",
      config: redactZatcaConfig(updated),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process ZATCA request";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
