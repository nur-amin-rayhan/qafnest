/**
 * MyFatoorah Payment Gateway Integration Service
 * Official Documentation: https://docs.myfatoorah.com/docs/api-key
 */

import crypto from "crypto";

export interface MyFatoorahConfig {
  apiKey: string;
  isTest: boolean;
  baseUrl: string;
  callbackUrl?: string;
  errorUrl?: string;
  webhookSecret?: string;
}

export interface MyFatoorahInvoiceItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface ExecutePaymentInput {
  paymentMethodId?: number; // 0 = all gateway options, 2 = Visa/Mastercard, 6 = Mada, 11 = Apple Pay, etc.
  invoiceValue: number;
  customerName: string;
  customerMobile: string; // e.g. "552538488" or "+966552538488"
  customerEmail?: string;
  customerReference: string; // e.g. "QAF-XXXXXX"
  displayCurrencyIso?: string; // default "SAR"
  callBackUrl: string;
  errorUrl: string;
  language?: "ar" | "en";
  invoiceItems?: MyFatoorahInvoiceItem[];
  userDefinedField?: string;
}

export interface MyFatoorahExecutePaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors?: Array<{ Name: string; Error: string }> | null;
  Data?: {
    InvoiceId: number;
    IsDirectPayment: boolean;
    PaymentURL: string;
    CustomerReference?: string;
    UserDefinedField?: string;
    RecurringId?: string;
  };
}

export interface MyFatoorahTransaction {
  TransactionId: string;
  PaymentId: string;
  AuthorizationId?: string;
  TransactionStatus: "Succss" | "Failed" | "Canceled" | string;
  TransationValue: string | number;
  CustomerServiceCharge?: string | number;
  TotalServiceCharge?: string | number;
  DueValue?: string | number;
  PaidCurrency: string;
  PaidCurrencyValue: string | number;
  Currency?: string;
  Error?: string | null;
  PaymentGateway?: string;
  ReferenceId?: string;
  TrackId?: string;
  TransactionDate?: string;
  PaymentIdOrSessionId?: string;
}

export interface MyFatoorahPaymentStatusResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors?: Array<{ Name: string; Error: string }> | null;
  Data?: {
    InvoiceId: number;
    InvoiceStatus: "Paid" | "Pending" | "Failed" | "Canceled" | string;
    InvoiceReference: string;
    CustomerReference: string;
    CreatedDate: string;
    ExpiryDate: string;
    InvoiceValue: number;
    InvoiceDisplayValue?: string;
    Comments?: string;
    CustomerName: string;
    CustomerMobile: string;
    CustomerEmail: string;
    UserDefinedField?: string;
    InvoiceTransactions?: MyFatoorahTransaction[];
  };
}

export interface MyFatoorahPaymentMethod {
  PaymentMethodId: number;
  PaymentMethodAr: string;
  PaymentMethodEn: string;
  PaymentMethodCode: string;
  IsDirectPayment: boolean;
  ServiceCharge: number;
  TotalAmount: number;
  CurrencyIso: string;
  ImageUrl: string;
  IsEmbeddedSupported: boolean;
  PaymentCurrencyIso: string;
}

export interface MyFatoorahInitiatePaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors?: Array<{ Name: string; Error: string }> | null;
  Data?: {
    PaymentMethods: MyFatoorahPaymentMethod[];
  };
}

export type MyFatoorahHostedMethod = "card" | "mada" | "apple" | "google" | "stcpay";
export type MyFatoorahGatewayMethod = MyFatoorahHostedMethod | "samsung";

export const MYFATOORAH_METHOD_DEFAULTS: Record<
  MyFatoorahHostedMethod,
  { code: string; fallbackId: number }
> = {
  card: { code: "vm", fallbackId: 2 },
  mada: { code: "md", fallbackId: 6 },
  apple: { code: "ap", fallbackId: 11 },
  stcpay: { code: "stc", fallbackId: 14 },
  google: { code: "gp", fallbackId: 32 },
};

export interface SamsungPayWebConfig {
  enabled: boolean;
  available: boolean;
  serviceId: string;
  environment: "STAGE" | "STAGE_WITHOUT_APK" | "PRODUCTION";
}

export interface MyFatoorahV3PaymentInput {
  paymentMethod: "SAMSUNG_PAY" | "GOOGLE_PAY" | "APPLE_PAY" | "STC_PAY";
  invoiceValue: number;
  currencyIso?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  customerReference: string;
  callBackUrl: string;
  errorUrl: string;
  language?: "ar" | "en";
  token: string;
}

export interface MyFatoorahV3PaymentResponse {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors?: Array<{ Name: string; Error: string }> | null;
  Data?: {
    InvoiceId?: string | number;
    PaymentId?: string | null;
    PaymentURL?: string | null;
    PaymentCompleted?: boolean;
  } | null;
}

/**
 * Returns MyFatoorah configuration from environment variables
 */
export function getMyFatoorahConfig(): MyFatoorahConfig {
  const apiKey = (process.env.MYFATOORAH_API_KEY || "").trim();
  const isTest = process.env.MYFATOORAH_IS_TEST !== "false";
  const baseUrl = (process.env.MYFATOORAH_BASE_URL || "").trim() ||
    (isTest ? "https://apitest.myfatoorah.com/v2" : "https://api.myfatoorah.com/v2");

  const callbackUrl = process.env.MYFATOORAH_CALLBACK_URL || undefined;
  const errorUrl = process.env.MYFATOORAH_ERROR_URL || callbackUrl;
  const webhookSecret = (process.env.MYFATOORAH_WEBHOOK_SECRET || "").trim() || undefined;

  return {
    apiKey,
    isTest,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    callbackUrl,
    errorUrl,
    webhookSecret,
  };
}

/**
 * Derives the MyFatoorah v3 API base URL from the configured v2 base URL.
 */
export function getMyFatoorahV3BaseUrl(config = getMyFatoorahConfig()): string {
  return config.baseUrl.replace(/\/v\d+$/i, "") + "/v3";
}

/**
 * Reads Samsung Pay Web Checkout configuration and MyFatoorah onboarding toggle.
 * Requires Samsung Pay Portal Service ID and MYFATOORAH_SAMSUNG_PAY_ENABLED=true.
 */
export function getSamsungPayWebConfig(): SamsungPayWebConfig {
  const { isTest } = getMyFatoorahConfig();
  const serviceId = (process.env.NEXT_PUBLIC_SAMSUNG_PAY_SERVICE_ID || "").trim();
  const enabled = process.env.MYFATOORAH_SAMSUNG_PAY_ENABLED === "true";
  const rawEnv = (process.env.NEXT_PUBLIC_SAMSUNG_PAY_ENV || "").trim().toUpperCase();
  const environment: SamsungPayWebConfig["environment"] =
    rawEnv === "PRODUCTION" || rawEnv === "STAGE" || rawEnv === "STAGE_WITHOUT_APK"
      ? rawEnv
      : isTest
      ? "STAGE"
      : "PRODUCTION";

  return {
    enabled,
    available: Boolean(enabled && serviceId),
    serviceId,
    environment,
  };
}

/**
 * Authoritatively extracts the paid invoice amount in the display currency (SAR).
 * If the merchant account's home currency (e.g. KWD) differs from the customer
 * display currency (SAR), MyFatoorah returns the converted merchant amount in `InvoiceValue`
 * (e.g. 51.555 KD) and the original display amount in `InvoiceDisplayValue` (e.g. "636.760 SR").
 */
export function extractPaidAmount(invoiceData: {
  InvoiceValue?: number | string;
  InvoiceDisplayValue?: string;
} | null | undefined): number {
  if (invoiceData?.InvoiceDisplayValue) {
    // Convert Eastern Arabic numerals (٠-٩) to Latin digits (0-9) and strip thousand commas
    const normalized = String(invoiceData.InvoiceDisplayValue)
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
      .replace(/,/g, "");
    const match = normalized.match(/[\d.]+/);
    if (match) {
      const parsed = parseFloat(match[0]);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.round(parsed * 100) / 100;
      }
    }
  }
  return Number(invoiceData?.InvoiceValue) || 0;
}

/**
 * Validates the HMAC-SHA256 signature from MyFatoorah webhook notifications (SEC-04).
 * Uses constant-time comparison (crypto.timingSafeEqual) to prevent timing attacks.
 */
export function verifyMyFatoorahSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string
): boolean {
  if (!signature || !secret || typeof rawBody !== "string") return false;
  try {
    const cleanSig = signature.trim();
    const computedSignature = crypto
      .createHmac("sha256", secret.trim())
      .update(rawBody)
      .digest("base64");

    const sigBuf = Buffer.from(cleanSig);
    const compBuf = Buffer.from(computedSignature);

    if (sigBuf.length !== compBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, compBuf);
  } catch {
    return false;
  }
}

/**
 * Normalizes phone numbers for MyFatoorah.
 * MyFatoorah accepts mobile numbers without leading country code or standard clean digits.
 */
function normalizeCustomerMobile(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("966")) cleaned = cleaned.slice(3);
  if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
  return cleaned || "500000000";
}

/**
 * Resolves valid CallBackUrl and ErrorUrl for MyFatoorah payment gateway.
 * Guarantees fully-qualified, reachable absolute URLs and prevents
 * redirection to non-existent domains or unvalidated relative paths.
 */
export function resolveCallbackUrls(options: {
  origin?: string | null;
  propertyId?: string;
  bookingRef?: string;
  locale?: "ar" | "en";
}) {
  const safeLocale: "ar" | "en" = options.locale === "en" ? "en" : "ar";
  const config = getMyFatoorahConfig();

  // 1. Explicit configured callback URL has highest priority
  let base = (config.callbackUrl || "").trim().replace(/\/+$/, "");

  // 2. Derive from verified site environment variable or request origin
  if (!base) {
    const siteUrl = (process.env.NEXT_PUBLIC_GUEST_URL || process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
    if (siteUrl && siteUrl.startsWith("http") && !siteUrl.includes(" ") && !siteUrl.includes("relative")) {
      base = siteUrl;
    } else if (options.origin) {
      let optOrigin = options.origin.trim().replace(/\/+$/, "");
      if (!optOrigin.startsWith("http://") && !optOrigin.startsWith("https://")) {
        optOrigin = optOrigin.includes("localhost") || optOrigin.includes("127.0.0.1")
          ? `http://${optOrigin}`
          : `https://${optOrigin}`;
      }
      if (!optOrigin.includes(" ") && !optOrigin.includes("relative")) {
        base = optOrigin;
      }
    }
  }

  // 3. Safety fallback ensuring valid protocol & hostname (no placeholder or dead domains)
  if (!base || base.includes(" ") || base.includes("relative") || !base.startsWith("http")) {
    base = process.env.NODE_ENV === "production" ? "https://qafnest.com" : "http://localhost:3000";
  }

  const searchParams = new URLSearchParams();
  if (options.propertyId) {
    const cleanPropId = options.propertyId.trim();
    if (!cleanPropId.includes(" ") && !cleanPropId.includes("relative")) {
      searchParams.set("propertyId", cleanPropId);
    }
  }
  if (options.bookingRef) {
    searchParams.set("bookingRef", options.bookingRef.trim());
  }
  const qs = searchParams.toString();

  const callback = `${base}/api/payments/myfatoorah/callback${qs ? `?${qs}` : ""}`;
  const error = `${base}/api/payments/myfatoorah/callback?status=error${qs ? `&${qs}` : ""}`;

  const appendLocale = (rawUrl: string) => {
    try {
      const u = new URL(rawUrl);
      u.searchParams.set("locale", safeLocale);
      return u.toString();
    } catch {
      const sep = rawUrl.includes("?") ? "&" : "?";
      return `${rawUrl}${sep}locale=${safeLocale}`;
    }
  };
  return { callBackUrl: appendLocale(callback), errorUrl: appendLocale(error) };
}

/**
 * Initiates payment methods discovery from MyFatoorah
 */
export async function initiateMyFatoorahPayment(
  invoiceAmount: number,
  currencyIso = "SAR"
): Promise<MyFatoorahInitiatePaymentResponse> {
  const config = getMyFatoorahConfig();
  if (!config.apiKey) {
    throw new Error("MYFATOORAH_API_KEY is not configured.");
  }

  const endpoint = `${config.baseUrl}/InitiatePayment`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      InvoiceAmount: Number(invoiceAmount.toFixed(2)),
      CurrencyIso: currencyIso,
    }),
  });

  const data = (await response.json()) as MyFatoorahInitiatePaymentResponse;
  return data;
}

/**
 * Executes a payment invoice in MyFatoorah and returns the PaymentURL for redirection
 */
export async function executeMyFatoorahPayment(
  input: ExecutePaymentInput
): Promise<MyFatoorahExecutePaymentResponse> {
  const config = getMyFatoorahConfig();
  if (!config.apiKey) {
    throw new Error("MYFATOORAH_API_KEY is not configured.");
  }

  const endpoint = `${config.baseUrl}/ExecutePayment`;

  const payload: Record<string, unknown> = {
    PaymentMethodId: typeof input.paymentMethodId === "number" ? input.paymentMethodId : 0,
    InvoiceValue: Number(input.invoiceValue.toFixed(2)),
    CustomerName: (input.customerName || "QafNest Guest").slice(0, 100),
    CustomerMobile: normalizeCustomerMobile(input.customerMobile),
    CustomerReference: input.customerReference,
    DisplayCurrencyIso: input.displayCurrencyIso || "SAR",
    CallBackUrl: input.callBackUrl,
    ErrorUrl: input.errorUrl,
    Language: input.language || "ar",
  };

  // SEC-09: Do NOT hardcode dummy "guest@qafnest.com" email. Only supply valid customer email or configured notification address.
  const validEmail = input.customerEmail && input.customerEmail.includes("@")
    ? input.customerEmail.trim()
    : (process.env.MYFATOORAH_DEFAULT_EMAIL || "").trim();
  if (validEmail) {
    payload.CustomerEmail = validEmail;
  }

  if (input.userDefinedField) {
    payload.UserDefinedField = input.userDefinedField;
  }

  if (input.invoiceItems && input.invoiceItems.length > 0) {
    payload.InvoiceItems = input.invoiceItems.map((item) => ({
      ItemName: item.itemName,
      Quantity: item.quantity,
      UnitPrice: Number(item.unitPrice.toFixed(2)),
    }));
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as MyFatoorahExecutePaymentResponse;
  return result;
}

/**
 * Queries payment status by PaymentId or InvoiceId from MyFatoorah
 */
export async function getMyFatoorahPaymentStatus(
  key: string | number,
  keyType: "PaymentId" | "InvoiceId" = "PaymentId"
): Promise<MyFatoorahPaymentStatusResponse> {
  const config = getMyFatoorahConfig();
  if (!config.apiKey) {
    throw new Error("MYFATOORAH_API_KEY is not configured.");
  }

  const endpoint = `${config.baseUrl}/GetPaymentStatus`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      Key: String(key),
      KeyType: keyType,
    }),
  });

  const result = (await response.json()) as MyFatoorahPaymentStatusResponse;
  return result;
}

const INITIATE_CACHE_TTL_MS = 5 * 60 * 1000;
const initiateMethodsCache = new Map<
  string,
  { expiresAt: number; methods: MyFatoorahPaymentMethod[] }
>();

/**
 * Fetches and caches active payment methods enabled on the configured MyFatoorah merchant profile.
 */
export async function getAvailableMyFatoorahPaymentMethods(
  invoiceAmount = 100,
  currencyIso = "SAR"
): Promise<MyFatoorahPaymentMethod[]> {
  const config = getMyFatoorahConfig();
  if (!config.apiKey) return [];

  const cacheKey = `${config.baseUrl}:${currencyIso.toUpperCase()}`;
  const cached = initiateMethodsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.methods;
  }

  try {
    const res = await initiateMyFatoorahPayment(invoiceAmount, currencyIso);
    const methods = res.IsSuccess && Array.isArray(res.Data?.PaymentMethods)
      ? res.Data.PaymentMethods
      : [];
    if (methods.length > 0) {
      initiateMethodsCache.set(cacheKey, {
        expiresAt: Date.now() + INITIATE_CACHE_TTL_MS,
        methods,
      });
    }
    return methods;
  } catch (err) {
    console.warn("Notice: Could not query MyFatoorah InitiatePayment:", err);
    return [];
  }
}

/**
 * Resolves the authoritative MyFatoorah PaymentMethodId for a hosted method code
 * (e.g. "stc" -> 14, "gp" -> 32, "ap" -> 11, "md" -> 6, "vm" -> 2), falling back to known IDs.
 */
export async function resolveMyFatoorahPaymentMethodId(
  method: MyFatoorahHostedMethod,
  invoiceAmount = 100,
  currencyIso = "SAR"
): Promise<number> {
  const def = MYFATOORAH_METHOD_DEFAULTS[method];
  const methods = await getAvailableMyFatoorahPaymentMethods(invoiceAmount, currencyIso);
  const match = methods.find(
    (m) => m.PaymentMethodCode?.trim().toLowerCase() === def.code
  );
  return match?.PaymentMethodId ?? def.fallbackId;
}

/**
 * Summarizes live MyFatoorah + Samsung Pay Web capabilities for client checkout UI.
 */
export async function getSupportedGatewayCapabilities() {
  const config = getMyFatoorahConfig();
  const samsung = getSamsungPayWebConfig();
  const methods = await getAvailableMyFatoorahPaymentMethods(100, "SAR");

  const findHosted = (key: MyFatoorahHostedMethod) => {
    const def = MYFATOORAH_METHOD_DEFAULTS[key];
    const matched = methods.find(
      (m) => m.PaymentMethodCode?.trim().toLowerCase() === def.code
    );
    return {
      available: Boolean(config.apiKey && (methods.length === 0 || matched)),
      code: def.code,
      methodId: matched?.PaymentMethodId ?? def.fallbackId,
      isEmbedded: matched?.IsEmbeddedSupported ?? false,
      currency: matched?.PaymentCurrencyIso ?? "SAR",
      labelEn: matched?.PaymentMethodEn ?? key,
      labelAr: matched?.PaymentMethodAr ?? key,
    };
  };

  return {
    configured: Boolean(config.apiKey),
    isTest: config.isTest,
    methods: {
      card: findHosted("card"),
      mada: findHosted("mada"),
      apple: findHosted("apple"),
      google: findHosted("google"),
      stcpay: findHosted("stcpay"),
      samsung: {
        available: Boolean(config.apiKey && samsung.available),
        requiresSetup: !samsung.available,
        serviceId: samsung.available ? samsung.serviceId : null,
        environment: samsung.environment,
      },
    },
  };
}

/**
 * Executes a MyFatoorah v3 token-based payment (e.g. Samsung Pay Web/App SDK token).
 */
export async function executeMyFatoorahV3Payment(
  input: MyFatoorahV3PaymentInput
): Promise<MyFatoorahV3PaymentResponse> {
  const config = getMyFatoorahConfig();
  if (!config.apiKey) {
    throw new Error("MYFATOORAH_API_KEY is not configured.");
  }

  const endpoint = `${getMyFatoorahV3BaseUrl(config)}/payments`;
  const validEmail = input.customerEmail && input.customerEmail.includes("@")
    ? input.customerEmail.trim()
    : (process.env.MYFATOORAH_DEFAULT_EMAIL || "").trim();

  const payload: Record<string, unknown> = {
    PaymentMethod: input.paymentMethod,
    Order: {
      Amount: Number(input.invoiceValue.toFixed(2)),
      Currency: input.currencyIso || "SAR",
      ExternalIdentifier: input.customerReference,
    },
    Customer: {
      Name: (input.customerName || "QafNest Guest").slice(0, 100),
      Mobile: normalizeCustomerMobile(input.customerMobile),
      ...(validEmail ? { Email: validEmail } : {}),
    },
    SourceOfFund: {
      Token: input.token,
    },
    IntegrationUrls: {
      Redirection: input.callBackUrl,
      Error: input.errorUrl,
    },
    ProcessingDetails: {
      Language: input.language || "ar",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  return (await response.json()) as MyFatoorahV3PaymentResponse;
}

