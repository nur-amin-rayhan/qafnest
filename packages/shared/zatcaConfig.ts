/**
 * ZATCA Phase 2 E-Invoicing Configuration Specifications
 * Compliant with Saudi Zakat, Tax and Customs Authority (ZATCA / Fatoorah Phase 2)
 */

export type ZatcaEnvironment = "sandbox" | "simulation" | "production";

export interface ZatcaConfig {
  environment: ZatcaEnvironment;
  portalUrl: string;
  sellerNameAr: string;
  sellerNameEn: string;
  vatNumber: string;
  crNumber: string;
  licenseNumber: string;
  vatRate: number; // 0.15
  otp: string; // One-Time-Password for onboarding CSID with ZATCA Portal (123345 for Sandbox Developer Portal)
  csidToken: string; // Binary Security Token / Compliance or Production CSID
  csidSecret: string; // API Secret returned by ZATCA /compliance or /production/csids
  privateKeyPem?: string; // ECDSA secp256k1 private key matching CSR public key
  complianceRequestId?: string | number;
  csidIssuedAt?: string;
  deviceUuid?: string;
  egsSerialNumber: string;
  autoReport: boolean;
  currentIcv: number;
  latestPih: string;
  totalReportedCount: number;
  lastReportingTimestamp?: string;
  lastHandshake?: {
    connected: boolean;
    authenticated?: boolean;
    latencyMs: number;
    httpStatus: number;
    timestamp: string;
    server?: string;
    message?: string;
  };
  updatedAt?: string;
}

export interface ZatcaInvoiceAuditRecord {
  uuid: string;
  invoiceNumber: string;
  bookingReference?: string;
  icv: number;
  pih: string;
  issueDate: string;
  issueTime: string;
  environment: ZatcaEnvironment;
  endpoint: string;
  type: "simplified" | "standard";
  invoiceTypeCode: "388" | "381" | "383";
  buyerName: string;
  taxableAmount: number;
  vatAmount: number;
  totalWithVat: number;
  httpStatus: number;
  clearanceStatus: "REPORTED" | "CLEARED" | "NOT_REPORTED" | "ERROR";
  validationStatus: "PASS" | "WARNING" | "ERROR";
  invoiceHash: string;
  digitalSignature: string;
  qrPayload: string;
  signedXml?: string;
  requestId?: string;
  validationMessages?: Array<{ code: string; message: string; status: string; type?: string }>;
  reportedAt: string;
}

export const ZATCA_ENVIRONMENT_URLS: Record<ZatcaEnvironment, string> = {
  sandbox: "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
  simulation: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
  production: "https://gw-fatoora.zatca.gov.sa/e-invoicing/core",
};

export const DEFAULT_ZATCA_CONFIG: ZatcaConfig = {
  environment: "sandbox",
  portalUrl: ZATCA_ENVIRONMENT_URLS.sandbox,
  sellerNameAr: "شركة منصة قاف نست للضيافة ذ.م.م",
  sellerNameEn: "QafNest Hospitality Platform LLC",
  vatNumber: "310123456700003",
  crNumber: "0000000000",
  licenseNumber: "",
  vatRate: 0.15,
  otp: "123345",
  csidToken: "",
  csidSecret: "",
  deviceUuid: "9d48b11a-8210-482a-bc92-748291048291",
  egsSerialNumber: "QAFNEST-EGS-RIYADH-01",
  autoReport: true,
  currentIcv: 42,
  latestPih: "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMjRiNWRjNmE2ZjBlMGE3",
  totalReportedCount: 38,
  lastReportingTimestamp: "2026-11-09T20:30:00Z",
};
