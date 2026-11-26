import {
  getServerZatcaConfig,
  getZatcaInvoiceRecords,
  testZatcaGatewayHandshake as sharedTestHandshake,
  reportInvoiceToZatca as sharedReportInvoice,
} from "@qafnest/shared/zatcaStore";
import { buildAndSignZatcaPhase2Invoice } from "@qafnest/shared/zatcaCrypto";
import type { ZatcaPhase2InvoiceData } from "@qafnest/shared";
import { getLiveAdminInvoices, DEFAULT_TEST_ADMIN_INVOICE } from "./adminInvoicesService";

export interface ZatcaEgsDeviceState {
  deviceUuid: string;
  egsSerialNumber: string;
  organizationName: string;
  vatNumber: string;
  crNumber: string;
  environment: "Simulation Sandbox" | "Production Portal" | "Developer Portal";
  csidStatus: "Active & Valid" | "Pending Renewal";
  csidExpiry: string;
  csidIssuer: string;
  currentIcv: number;
  latestPih: string;
  totalReportedCount: number;
  totalClearedCount: number;
  lastReportingTimestamp: string;
  gatewayUrl: string;
}

export function getZatcaEgsState(): ZatcaEgsDeviceState {
  const cfg = getServerZatcaConfig();
  const auditRecords = getZatcaInvoiceRecords(500);
  const totalClearedCount = auditRecords.filter(
    (r) => r.clearanceStatus === "CLEARED"
  ).length;

  return {
    deviceUuid: cfg.deviceUuid || "",
    egsSerialNumber: cfg.egsSerialNumber,
    organizationName: cfg.sellerNameAr,
    vatNumber: cfg.vatNumber,
    crNumber: cfg.crNumber,
    environment:
      cfg.environment === "production"
        ? "Production Portal"
        : cfg.environment === "simulation"
        ? "Simulation Sandbox"
        : "Developer Portal",
    csidStatus: cfg.csidToken ? "Active & Valid" : "Pending Renewal",
    csidExpiry: cfg.csidToken ? "2027-10-31T23:59:59Z" : "",
    csidIssuer:
      cfg.environment === "sandbox"
        ? "ZATCA Developer Portal Sub-CA (eInvoicing)"
        : "Saudi ZATCA Sub-CA for E-Invoicing",
    currentIcv: cfg.currentIcv || 0,
    latestPih: cfg.latestPih || "",
    totalReportedCount: cfg.totalReportedCount || 0,
    totalClearedCount,
    lastReportingTimestamp: cfg.lastReportingTimestamp || "",
    gatewayUrl: cfg.portalUrl,
  };
}

export async function testZatcaGatewayHandshake() {
  const res = await sharedTestHandshake();
  return {
    connected: res.connected,
    authenticated: res.authenticated,
    gatewayUrl: res.gatewayUrl,
    httpStatus: res.httpStatus,
    latencyMs: res.latencyMs,
    requestId: res.requestId || `req_${Date.now()}`,
    server: res.server,
    timestamp: res.timestamp,
    statusMessage: res.message,
  };
}

export async function generateInvoiceUblXmlForRecord(invoiceId: string) {
  const invoices = await getLiveAdminInvoices();
  let inv = invoices.find((i) => i.id === invoiceId);
  if (
    !inv &&
    process.env.NODE_ENV !== "production" &&
    (invoiceId === "inv_adm_001" || invoiceId === DEFAULT_TEST_ADMIN_INVOICE.id)
  ) {
    inv = DEFAULT_TEST_ADMIN_INVOICE;
  }
  if (!inv) {
    throw new Error(`Tax invoice '${invoiceId}' not found.`);
  }
  const cfg = getServerZatcaConfig();

  const data: ZatcaPhase2InvoiceData = {
    uuid: inv.id,
    invoiceNumber: inv.invoiceNumber,
    icv: cfg.currentIcv || 0,
    pih: cfg.latestPih,
    issueDate: inv.issueDate,
    issueTime: "14:30:00",
    type: inv.type === "guest_stay" ? "simplified" : "standard",
    sellerNameAr: cfg.sellerNameAr,
    sellerVatNumber: cfg.vatNumber,
    buyerName: inv.clientName,
    lineItems: [
      {
        name: inv.propertyTitle,
        quantity: 1,
        unitPrice: inv.taxableAmount,
        subtotal: inv.taxableAmount,
        vatRate: inv.vatRate,
        vatAmount: inv.vatAmount,
        total: inv.totalAmount,
      },
    ],
    taxableAmount: inv.taxableAmount,
    vatAmount: inv.vatAmount,
    totalWithVat: inv.totalAmount,
  };

  const signed = buildAndSignZatcaPhase2Invoice(data, {
    csidToken: cfg.csidToken,
    privateKeyPem: cfg.privateKeyPem,
  });

  return {
    xml: signed.signedXml,
    hash: signed.invoiceHash,
    signature: signed.digitalSignature,
    qrPayload: signed.qrPayload,
    filename: `${inv.invoiceNumber}-UBL2.1.xml`,
    invoiceRecord: inv,
  };
}

export async function reportInvoiceToZatcaApi(invoiceId: string) {
  const invoices = await getLiveAdminInvoices();
  let inv = invoices.find((i) => i.id === invoiceId);
  if (
    !inv &&
    process.env.NODE_ENV !== "production" &&
    (invoiceId === "inv_adm_001" || invoiceId === DEFAULT_TEST_ADMIN_INVOICE.id)
  ) {
    inv = DEFAULT_TEST_ADMIN_INVOICE;
  }
  if (!inv) {
    throw new Error(`Tax invoice '${invoiceId}' not found.`);
  }

  return await sharedReportInvoice({
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    bookingReference: inv.bookingReference,
    issueDate: inv.issueDate,
    issueTime: "14:30:00",
    buyerName: inv.clientName,
    lineItems: [
      {
        name: inv.propertyTitle,
        quantity: 1,
        unitPrice: inv.taxableAmount,
        subtotal: inv.taxableAmount,
        vatRate: inv.vatRate,
        vatAmount: inv.vatAmount,
        total: inv.totalAmount,
      },
    ],
    taxableAmount: inv.taxableAmount,
    vatAmount: inv.vatAmount,
    totalWithVat: inv.totalAmount,
    type: inv.type === "guest_stay" ? "simplified" : "standard",
  });
}
