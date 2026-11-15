import crypto from "crypto";
import {
  ZatcaConfig,
  ZatcaInvoiceAuditRecord,
  DEFAULT_ZATCA_CONFIG,
  ZATCA_ENVIRONMENT_URLS,
} from "./zatcaConfig";
import type { ZatcaPhase2InvoiceData } from "./zatcaPhase2";
import {
  generateZatcaCsrAndKeyPair,
  buildAndSignZatcaPhase2Invoice,
} from "./zatcaCrypto";
import { readSharedJsonFile, writeSharedJsonFile } from "./serverJsonStore";

export * from "./zatcaConfig";

const ZATCA_CONFIG_FILE = "zatca-config.json";
const ZATCA_INVOICES_FILE = "zatca-invoices.json";

function normalizeGatewayUrl(url: string | undefined, env: ZatcaConfig["environment"]): string {
  if (!url) return ZATCA_ENVIRONMENT_URLS[env];
  // Auto-heal legacy typo domain zatca.sa -> zatca.gov.sa
  return url.replace("gw-fatoora.zatca.sa", "gw-fatoora.zatca.gov.sa").trim();
}

export function getServerZatcaConfig(): ZatcaConfig {
  return readSharedJsonFile<ZatcaConfig>(
    ZATCA_CONFIG_FILE,
    () => DEFAULT_ZATCA_CONFIG,
    (parsed) => {
      const candidate = parsed as Partial<ZatcaConfig> | null;
      if (candidate && typeof candidate.vatNumber === "string") {
        const merged: ZatcaConfig = { ...DEFAULT_ZATCA_CONFIG, ...candidate };
        merged.portalUrl = normalizeGatewayUrl(merged.portalUrl, merged.environment);
        if (merged.csidToken === "QAFNEST_ZATCA_SANDBOX_CSID_TOKEN_2026") {
          merged.csidToken = "";
          merged.csidSecret = "";
        }
        return merged;
      }
      return DEFAULT_ZATCA_CONFIG;
    }
  );
}

export function writeServerZatcaConfig(config: ZatcaConfig): void {
  writeSharedJsonFile(ZATCA_CONFIG_FILE, config);
}

export function updateServerZatcaConfig(updates: Partial<ZatcaConfig>): ZatcaConfig {
  const current = getServerZatcaConfig();
  const nextEnv = updates.environment || current.environment;
  const nextConfig: ZatcaConfig = {
    ...current,
    ...updates,
    portalUrl: normalizeGatewayUrl(
      updates.portalUrl !== undefined
        ? updates.portalUrl
        : updates.environment && updates.environment !== current.environment
        ? ZATCA_ENVIRONMENT_URLS[updates.environment]
        : current.portalUrl,
      nextEnv
    ),
    updatedAt: new Date().toISOString(),
  };

  writeServerZatcaConfig(nextConfig);
  return nextConfig;
}

// --- Persistent Invoice Audit Ledger ---

export function getZatcaInvoiceRecords(limit = 100): ZatcaInvoiceAuditRecord[] {
  const records = readSharedJsonFile<ZatcaInvoiceAuditRecord[]>(
    ZATCA_INVOICES_FILE,
    () => [],
    (parsed) => (Array.isArray(parsed) ? (parsed as ZatcaInvoiceAuditRecord[]) : [])
  );
  return records.slice(0, limit);
}

export function findZatcaInvoiceRecord(lookup: {
  invoiceNumber?: string;
  uuid?: string;
  bookingReference?: string;
}): ZatcaInvoiceAuditRecord | null {
  const records = getZatcaInvoiceRecords(500);
  return (
    records.find((r) => {
      if (lookup.invoiceNumber && r.invoiceNumber === lookup.invoiceNumber) return true;
      if (lookup.uuid && r.uuid === lookup.uuid) return true;
      if (lookup.bookingReference && r.bookingReference === lookup.bookingReference) return true;
      return false;
    }) || null
  );
}

function appendZatcaInvoiceRecord(record: ZatcaInvoiceAuditRecord): void {
  const existing = getZatcaInvoiceRecords(500).filter(
    (r) => r.invoiceNumber !== record.invoiceNumber && r.uuid !== record.uuid
  );
  const updated = [record, ...existing].slice(0, 250);
  writeSharedJsonFile(ZATCA_INVOICES_FILE, updated);
}

/**
 * Generates ECDSA secp256k1 CSR + Private Key and onboards directly against ZATCA /compliance API
 */
export async function onboardZatcaComplianceCsid(configOverride?: Partial<ZatcaConfig>) {
  const config = updateServerZatcaConfig(configOverride || {});
  const targetUrl = normalizeGatewayUrl(config.portalUrl, config.environment);
  const otp = (config.otp || "123345").trim();
  const deviceUuid = config.deviceUuid || crypto.randomUUID();

  const csrData = generateZatcaCsrAndKeyPair({
    environment: config.environment,
    commonName: config.egsSerialNumber || "QAFNEST-EGS-RIYADH-01",
    organizationName: config.sellerNameEn || "QafNest Hospitality Platform LLC",
    organizationalUnit: "Riyadh Operations",
    vatNumber: config.vatNumber || "310123456700003",
    egsSerialNumber: config.egsSerialNumber || "QAFNEST-EGS-RIYADH-01",
    deviceUuid,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const res = await fetch(`${targetUrl}/compliance`, {
    method: "POST",
    headers: {
      "Accept-Version": "V2",
      "Content-Type": "application/json",
      OTP: otp,
    },
    body: JSON.stringify({ csr: csrData.csrBase64 }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  const rawText = await res.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = { message: rawText };
  }

  if (!res.ok || !parsed.binarySecurityToken || !parsed.secret) {
    throw new Error(
      `ZATCA /compliance onboarding failed (HTTP ${res.status}): ${rawText.slice(0, 240)}`
    );
  }

  const updated = updateServerZatcaConfig({
    deviceUuid,
    csidToken: String(parsed.binarySecurityToken),
    csidSecret: String(parsed.secret),
    privateKeyPem: csrData.privateKeyPem,
    complianceRequestId: parsed.requestID as string | number,
    csidIssuedAt: new Date().toISOString(),
  });

  return {
    success: true,
    requestID: parsed.requestID,
    dispositionMessage: parsed.dispositionMessage || "ISSUED",
    environment: updated.environment,
    portalUrl: updated.portalUrl,
    csidIssuedAt: updated.csidIssuedAt,
    config: updated,
  };
}

/**
 * Exchanges Compliance CSID for a Production CSID after compliance checks pass
 */
export async function upgradeToProductionCsid() {
  const config = getServerZatcaConfig();
  if (!config.csidToken || !config.csidSecret || !config.complianceRequestId) {
    throw new Error("Onboard Compliance CSID first before requesting Production CSID.");
  }

  const targetUrl = normalizeGatewayUrl(config.portalUrl, config.environment);
  const basicAuth = Buffer.from(`${config.csidToken}:${config.csidSecret}`).toString("base64");

  const res = await fetch(`${targetUrl}/production/csids`, {
    method: "POST",
    headers: {
      "Accept-Version": "V2",
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({ compliance_request_id: config.complianceRequestId }),
  });

  const data = await res.json();
  if (!res.ok || !data.binarySecurityToken) {
    throw new Error(`Production CSID request failed (HTTP ${res.status}): ${JSON.stringify(data)}`);
  }

  return {
    success: true,
    requestID: data.requestID,
    dispositionMessage: data.dispositionMessage,
    binarySecurityToken: data.binarySecurityToken,
    secret: data.secret,
  };
}

/**
 * Tests live connectivity AND CSID authentication against ZATCA Gateway
 */
export async function testZatcaGatewayHandshake(configOverride?: Partial<ZatcaConfig>) {
  const config = { ...getServerZatcaConfig(), ...configOverride };
  const targetUrl = normalizeGatewayUrl(config.portalUrl, config.environment);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const hasCreds = Boolean(config.csidToken && config.csidSecret);
    const headers: Record<string, string> = {
      "Accept-Version": "V2",
      "Content-Type": "application/json",
    };
    if (hasCreds) {
      headers.Authorization = `Basic ${Buffer.from(`${config.csidToken}:${config.csidSecret}`).toString("base64")}`;
    }

    const res = await fetch(`${targetUrl}/compliance/invoices`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const latencyMs = Date.now() - startTime;
    const serverHeader = res.headers.get("server") || "Saudi ZATCA Fatoorah Gateway";

    // HTTP 400 (missing body) means Basic Auth SUCCEEDED; HTTP 401 means gateway reachable but CSID missing/invalid!
    const authenticated = res.status !== 401 && res.status !== 403;

    const handshakeResult = {
      connected: true,
      authenticated,
      gatewayUrl: targetUrl,
      httpStatus: res.status,
      latencyMs,
      server: serverHeader,
      requestId: res.headers.get("x-request-id") || undefined,
      timestamp: new Date().toISOString(),
      message: authenticated
        ? `ZATCA ${config.environment.toUpperCase()} API connected & CSID authenticated cleanly (${latencyMs}ms).`
        : `ZATCA ${config.environment.toUpperCase()} gateway reachable (HTTP ${res.status}, ${latencyMs}ms), but CSID authentication needs onboarding.`,
    };

    updateServerZatcaConfig({
      lastHandshake: handshakeResult,
    });

    return handshakeResult;
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "Network probe unreachable";

    const handshakeResult = {
      connected: false,
      authenticated: false,
      gatewayUrl: targetUrl,
      httpStatus: 0,
      latencyMs,
      server: "Network Error",
      requestId: undefined as string | undefined,
      timestamp: new Date().toISOString(),
      message: `ZATCA API unreachable: ${errorMsg}`,
    };

    updateServerZatcaConfig({
      lastHandshake: handshakeResult,
    });

    return handshakeResult;
  }
}

/**
 * Signs UBL 2.1 XML invoice & reports it directly to the active ZATCA API
 */
export async function reportInvoiceToZatca(params: {
  invoiceId: string;
  invoiceNumber: string;
  bookingReference?: string;
  issueDate?: string;
  issueTime?: string;
  buyerName?: string;
  buyerVatNumber?: string;
  lineItems: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    total: number;
  }>;
  totalWithVat: number;
  vatAmount: number;
  taxableAmount: number;
  type?: "simplified" | "standard";
  invoiceTypeCode?: "388" | "381" | "383";
  billingReferenceId?: string;
  paymentMeansCode?: string;
}) {
  let config = getServerZatcaConfig();

  // In Sandbox Developer Portal, auto-onboard a real Compliance CSID if none has been issued yet
  if (
    config.environment === "sandbox" &&
    (!config.csidToken || !config.csidSecret || !config.privateKeyPem)
  ) {
    try {
      const onboarded = await onboardZatcaComplianceCsid();
      config = onboarded.config;
    } catch (onboardErr) {
      console.warn("[ZATCA Auto-Onboard Warning]:", onboardErr);
    }
  }

  // Ensure UUID is RFC-4122 valid (ZATCA rejects non-UUID strings in cbc:UUID / body.uuid)
  const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    params.invoiceId
  )
    ? params.invoiceId
    : crypto
        .createHash("md5")
        .update(params.invoiceId || params.invoiceNumber)
        .digest("hex")
        .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-4$3-a$4-$5");

  const nextIcv = (config.currentIcv || 0) + 1;
  const previousHash =
    config.latestPih || "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMjRiNWRjNmE2ZjBlMGE3";

  const nowIso = new Date().toISOString();
  const issueDate = params.issueDate || nowIso.split("T")[0];
  const issueTime = params.issueTime || nowIso.slice(11, 19);
  const invType = params.type || "simplified";

  const invoiceData: ZatcaPhase2InvoiceData & {
    invoiceTypeCode?: "388" | "381" | "383";
    billingReferenceId?: string;
    paymentMeansCode?: string;
  } = {
    uuid: validUuid,
    invoiceNumber: params.invoiceNumber,
    icv: nextIcv,
    pih: previousHash,
    issueDate,
    issueTime,
    type: invType,
    sellerNameAr: config.sellerNameAr,
    sellerVatNumber: config.vatNumber,
    buyerName: params.buyerName || "Valued Guest",
    buyerVatNumber: params.buyerVatNumber,
    lineItems: params.lineItems,
    taxableAmount: params.taxableAmount,
    vatAmount: params.vatAmount,
    totalWithVat: params.totalWithVat,
    invoiceTypeCode: params.invoiceTypeCode || "388",
    billingReferenceId: params.billingReferenceId,
    paymentMeansCode: params.paymentMeansCode || "48",
  };

  const signed = buildAndSignZatcaPhase2Invoice(invoiceData, {
    csidToken: config.csidToken,
    privateKeyPem: config.privateKeyPem,
  });

  const targetUrl = normalizeGatewayUrl(config.portalUrl, config.environment);
  // Developer Portal Sandbox tests and validates invoices via /compliance/invoices using Compliance CSID
  const apiPath =
    config.environment === "sandbox"
      ? "/compliance/invoices"
      : invType === "standard"
      ? "/invoices/clearance/single"
      : "/invoices/reporting/single";
  const endpointUrl = `${targetUrl}${apiPath}`;

  const encodedXmlBase64 = Buffer.from(signed.signedXml, "utf8").toString("base64");
  const requestBody = {
    invoiceHash: signed.invoiceHash,
    uuid: validUuid,
    invoice: encodedXmlBase64,
  };

  const basicAuth = Buffer.from(`${config.csidToken}:${config.csidSecret}`).toString("base64");

  let httpStatus = 0;
  let requestId: string | undefined;
  let clearanceStatus: ZatcaInvoiceAuditRecord["clearanceStatus"] = "NOT_REPORTED";
  let validationStatus: ZatcaInvoiceAuditRecord["validationStatus"] = "ERROR";
  let validationMessages: Array<{ code: string; message: string; status: string; type?: string }> = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept-Version": "V2",
      "Accept-Language": "en",
      Authorization: `Basic ${basicAuth}`,
    };
    if (apiPath !== "/compliance/invoices") {
      headers["Clearance-Status"] = invType === "standard" ? "1" : "0";
    }

    const res = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    httpStatus = res.status;
    requestId = res.headers.get("x-request-id") || undefined;

    const rawText = await res.text();
    let resJson: Record<string, any> = {};
    try {
      resJson = rawText ? JSON.parse(rawText) : {};
    } catch {
      resJson = { message: rawText };
    }

    const valRes = resJson.validationResults || {};
    validationMessages = [
      ...(valRes.infoMessages || []),
      ...(valRes.warningMessages || []),
      ...(valRes.errorMessages || []),
    ];

    if (res.ok && (resJson.reportingStatus === "REPORTED" || resJson.clearanceStatus === "CLEARED")) {
      clearanceStatus = resJson.clearanceStatus === "CLEARED" ? "CLEARED" : "REPORTED";
      validationStatus = valRes.status === "WARNING" ? "WARNING" : "PASS";
    } else {
      clearanceStatus = res.status === 401 ? "ERROR" : "NOT_REPORTED";
      validationStatus = "ERROR";
      if (validationMessages.length === 0) {
        validationMessages.push({
          code: `HTTP_${res.status}`,
          type: "ERROR",
          status: "ERROR",
          message:
            res.status === 401
              ? "Unauthorized CSID credentials on ZATCA API. Please re-onboard CSID in CMS."
              : rawText.slice(0, 200) || `ZATCA returned HTTP ${res.status}`,
        });
      }
    }
  } catch (err: unknown) {
    httpStatus = 0;
    clearanceStatus = "ERROR";
    validationStatus = "ERROR";
    validationMessages = [
      {
        code: "NETWORK_UNREACHABLE",
        type: "ERROR",
        status: "ERROR",
        message: err instanceof Error ? err.message : "Failed to reach ZATCA Gateway",
      },
    ];
  }

  const reportedAt = new Date().toISOString();
  const auditRecord: ZatcaInvoiceAuditRecord = {
    uuid: validUuid,
    invoiceNumber: params.invoiceNumber,
    bookingReference: params.bookingReference,
    icv: nextIcv,
    pih: previousHash,
    issueDate,
    issueTime,
    environment: config.environment,
    endpoint: endpointUrl,
    type: invType,
    invoiceTypeCode: params.invoiceTypeCode || "388",
    buyerName: params.buyerName || "Valued Guest",
    taxableAmount: params.taxableAmount,
    vatAmount: params.vatAmount,
    totalWithVat: params.totalWithVat,
    httpStatus,
    clearanceStatus,
    validationStatus,
    invoiceHash: signed.invoiceHash,
    digitalSignature: signed.digitalSignature,
    qrPayload: signed.qrPayload,
    signedXml: signed.signedXml,
    requestId,
    validationMessages,
    reportedAt,
  };

  appendZatcaInvoiceRecord(auditRecord);

  // Advance ICV and update PIH only if ZATCA accepted the invoice
  if (clearanceStatus === "REPORTED" || clearanceStatus === "CLEARED") {
    updateServerZatcaConfig({
      currentIcv: nextIcv,
      latestPih: signed.invoiceHash,
      totalReportedCount: (config.totalReportedCount || 0) + 1,
      lastReportingTimestamp: reportedAt,
    });
  }

  return {
    success: clearanceStatus === "REPORTED" || clearanceStatus === "CLEARED",
    invoiceNumber: params.invoiceNumber,
    uuid: validUuid,
    icv: nextIcv,
    clearanceStatus,
    reportingTimestamp: reportedAt,
    invoiceHash: signed.invoiceHash,
    digitalSignature: signed.digitalSignature,
    qrPayload: signed.qrPayload,
    xml: signed.signedXml,
    gateway: {
      httpStatus,
      requestId,
      gatewayEndpoint: endpointUrl,
      mode: config.environment,
    },
    validationResults: {
      status: validationStatus,
      infoMessages: validationMessages.filter((m) => m.status === "PASS" || m.type === "INFO"),
      warningMessages: validationMessages.filter((m) => m.status === "WARNING" || m.type === "WARNING"),
      errorMessages: validationMessages.filter((m) => m.status === "ERROR" || m.type === "ERROR"),
    },
  };
}
