import * as crypto from "crypto";
import {
  hydrateSharedJsonFile,
  persistSharedJsonFile,
  readSharedJsonFile,
  writeSharedJsonFile,
} from "./serverJsonStore";
import { verifySaudiIdentityServer } from "./saudiIdentityStore";

export interface HelplineVerificationSession {
  token: string;
  phoneNumber: string;
  guestName?: string;
  nationalId?: string;
  idType?: "national_id" | "iqama";
  guestId?: string;
  guestEmail?: string;
  isExistingUser: boolean;
  isAccountActive: boolean;
  otpHash: string;
  otpAttempts?: number;
  otpSentAt: string;
  otpExpiresAt: string;
  otpVerified: boolean;
  otpVerifiedAt?: string;
  identityVerified: boolean;
  identityVerifiedAt?: string;
  identityProvider?: "yakeen" | "nafath" | "sandbox";
  verificationReference?: string;
  verificationMethod: "code" | "link";
  completed: boolean;
  consumedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicHelplineVerificationSession {
  token: string;
  phoneNumber: string;
  guestName?: string;
  nationalId: string | null;
  idType?: "national_id" | "iqama";
  isExistingUser: boolean;
  isAccountActive: boolean;
  otpSentAt: string;
  otpExpiresAt: string;
  otpVerified: boolean;
  otpVerifiedAt?: string;
  identityVerified: boolean;
  identityVerifiedAt?: string;
  identityProvider?: "yakeen" | "nafath" | "sandbox";
  verificationMethod: "code" | "link";
  completed: boolean;
  consumed: boolean;
}

export function maskNationalId(nid?: string): string | null {
  if (!nid) return null;
  const clean = nid.trim();
  if (clean.length < 6) return "****";
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

export function toPublicHelplineSession(
  session: HelplineVerificationSession
): PublicHelplineVerificationSession {
  return {
    token: session.token,
    phoneNumber: session.phoneNumber,
    guestName: session.guestName,
    nationalId: maskNationalId(session.nationalId),
    idType: session.idType,
    isExistingUser: session.isExistingUser,
    isAccountActive: session.isAccountActive,
    otpSentAt: session.otpSentAt,
    otpExpiresAt: session.otpExpiresAt,
    otpVerified: session.otpVerified,
    otpVerifiedAt: session.otpVerifiedAt,
    identityVerified: session.identityVerified,
    identityVerifiedAt: session.identityVerifiedAt,
    identityProvider: session.identityProvider,
    verificationMethod: session.verificationMethod,
    completed: session.completed,
    consumed: Boolean(session.consumedAt),
  };
}

export interface BankTransferClaim {
  bookingRef: string;
  guestId?: string;
  transferReference: string;
  bankName?: string;
  transferDate?: string;
  senderName?: string;
  amount: number;
  submittedAt: string;
  status: "pending_verification" | "confirmed" | "rejected";
  adminNotes?: string;
}

const VERIFICATIONS_FILE_NAME = "helpline-verifications.json";
const TRANSFER_CLAIMS_FILE_NAME = "helpline-transfer-claims.json";

const normalizeVerificationMap = (
  parsed: unknown
): Record<string, HelplineVerificationSession> =>
  parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, HelplineVerificationSession>)
    : {};

const normalizeClaimsMap = (parsed: unknown): Record<string, BankTransferClaim> =>
  parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, BankTransferClaim>)
    : {};

export async function hydrateHelplineVerificationStore(): Promise<void> {
  await Promise.all([
    hydrateSharedJsonFile<Record<string, HelplineVerificationSession>>(
      VERIFICATIONS_FILE_NAME,
      () => ({}),
      normalizeVerificationMap
    ),
    hydrateSharedJsonFile<Record<string, BankTransferClaim>>(
      TRANSFER_CLAIMS_FILE_NAME,
      () => ({}),
      normalizeClaimsMap
    ),
  ]);
}

export async function persistHelplineVerificationStore(): Promise<void> {
  await Promise.all([
    persistSharedJsonFile(VERIFICATIONS_FILE_NAME, loadVerifications()),
    persistSharedJsonFile(TRANSFER_CLAIMS_FILE_NAME, loadTransferClaims()),
  ]);
}

function loadVerifications(): Record<string, HelplineVerificationSession> {
  return readSharedJsonFile<Record<string, HelplineVerificationSession>>(
    VERIFICATIONS_FILE_NAME,
    () => ({}),
    normalizeVerificationMap
  );
}

function saveVerifications(records: Record<string, HelplineVerificationSession>) {
  writeSharedJsonFile(VERIFICATIONS_FILE_NAME, records);
}

function loadTransferClaims(): Record<string, BankTransferClaim> {
  return readSharedJsonFile<Record<string, BankTransferClaim>>(
    TRANSFER_CLAIMS_FILE_NAME,
    () => ({}),
    normalizeClaimsMap
  );
}

function saveTransferClaims(records: Record<string, BankTransferClaim>) {
  writeSharedJsonFile(TRANSFER_CLAIMS_FILE_NAME, records);
}

function hashOtp(token: string, code: string): string {
  return crypto.createHmac("sha256", token).update(code.trim()).digest("hex");
}

export async function dispatchHelplineSms(params: {
  phoneNumber: string;
  otpCode: string;
  verificationLink: string;
  method: "code" | "link";
}): Promise<{ dispatched: boolean; error?: string }> {
  const webhookUrl = process.env.HELPLINE_SMS_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    if (process.env.NODE_ENV === "production") {
      return {
        dispatched: false,
        error: "SMS gateway (HELPLINE_SMS_WEBHOOK_URL) is not configured for production delivery.",
      };
    }
    return { dispatched: true };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(webhookUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(process.env.HELPLINE_SMS_API_KEY?.trim()
          ? { Authorization: `Bearer ${process.env.HELPLINE_SMS_API_KEY.trim()}` }
          : {}),
      },
      body: JSON.stringify({
        to: params.phoneNumber,
        method: params.method,
        message:
          params.method === "link"
            ? `QafNest verification link: ${params.verificationLink}`
            : `Your QafNest verification code is ${params.otpCode}. Valid for 10 minutes.`,
      }),
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { dispatched: false, error: `SMS gateway responded with HTTP ${res.status}` };
    }
    return { dispatched: true };
  } catch (err) {
    return {
      dispatched: false,
      error: err instanceof Error ? err.message : "Failed to reach SMS gateway",
    };
  }
}

export function createVerificationSession(params: {
  phoneNumber: string;
  guestName?: string;
  nationalId?: string;
  guestId?: string;
  guestEmail?: string;
  isExistingUser?: boolean;
  isAccountActive?: boolean;
  method?: "code" | "link";
}): { session: HelplineVerificationSession; previewOtp?: string } {
  const records = loadVerifications();
  const token = `HV-${Date.now().toString(36)}-${crypto.randomBytes(8).toString("hex")}`;

  // CSPRNG 6-digit OTP; NEVER persisted in plaintext
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  let idType: "national_id" | "iqama" | undefined = undefined;
  if (params.nationalId) {
    if (params.nationalId.startsWith("1")) idType = "national_id";
    else if (params.nationalId.startsWith("2")) idType = "iqama";
  }

  const session: HelplineVerificationSession = {
    token,
    phoneNumber: params.phoneNumber.trim(),
    guestName: params.guestName?.trim(),
    nationalId: params.nationalId?.trim(),
    idType,
    guestId: params.guestId,
    guestEmail: params.guestEmail,
    isExistingUser: Boolean(params.isExistingUser),
    isAccountActive: params.isAccountActive !== undefined ? params.isAccountActive : true,
    otpHash: hashOtp(token, rawOtp),
    otpAttempts: 0,
    otpSentAt: now.toISOString(),
    otpExpiresAt: expires.toISOString(),
    otpVerified: false,
    identityVerified: false,
    verificationMethod: params.method || "code",
    completed: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  records[token] = session;
  saveVerifications(records);

  const allowPreview =
    process.env.NODE_ENV !== "production" && process.env.HELPLINE_ALLOW_TEST_OTP === "true";
  return {
    session,
    previewOtp: allowPreview ? rawOtp : undefined,
  };
}

export function verifySessionOtp(token: string, enteredCode: string): { success: boolean; error?: string; session?: HelplineVerificationSession } {
  const records = loadVerifications();
  const session = records[token];
  if (!session) {
    return { success: false, error: "Verification session not found" };
  }

  if (session.consumedAt) {
    return { success: false, error: "Verification session has already been consumed." };
  }

  if (new Date() > new Date(session.otpExpiresAt)) {
    return { success: false, error: "Verification code has expired. Please request a new code." };
  }

  const enteredHash = hashOtp(token, enteredCode);
  const attempts = Number(session.otpAttempts || 0);
  if (attempts >= 5) {
    return { success: false, error: "Too many failed verification attempts. Request a new link." };
  }

  const hashBuf = Buffer.from(enteredHash, "hex");
  const expectedBuf = Buffer.from(session.otpHash || "", "hex");
  const isMatch =
    hashBuf.length > 0 &&
    hashBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(hashBuf, expectedBuf);

  if (!isMatch) {
    session.otpAttempts = attempts + 1;
    session.updatedAt = new Date().toISOString();
    records[token] = session;
    saveVerifications(records);
    return { success: false, error: "Invalid 6-digit verification code" };
  }

  const now = new Date().toISOString();
  session.otpVerified = true;
  session.otpVerifiedAt = now;
  session.updatedAt = now;
  session.completed = session.otpVerified && session.identityVerified;

  records[token] = session;
  saveVerifications(records);
  return { success: true, session };
}

export async function verifySessionIdentity(
  token: string,
  params: {
    nationalId: string;
    fullName?: string;
    provider?: "yakeen" | "nafath" | "sandbox";
  }
): Promise<{ success: boolean; error?: string; statusCode?: number; session?: HelplineVerificationSession }> {
  const records = loadVerifications();
  const session = records[token];
  if (!session) {
    return { success: false, statusCode: 404, error: "Verification session not found" };
  }

  if (session.consumedAt) {
    return { success: false, statusCode: 400, error: "Verification session has already been used." };
  }

  if (!session.otpVerified) {
    return {
      success: false,
      statusCode: 400,
      error: "Mobile phone OTP must be verified before identity verification.",
    };
  }

  const nid = params.nationalId.trim().replace(/\D/g, "");
  const check = await verifySaudiIdentityServer({
    idNumber: nid,
    type: nid.startsWith("2") ? "iqama" : "national_id",
    fullName: params.fullName || session.guestName,
  });

  if (!check.verified) {
    return {
      success: false,
      statusCode: check.statusCode || 400,
      error: check.error || "National ID / Iqama verification failed.",
    };
  }

  const now = new Date().toISOString();
  session.nationalId = nid;
  session.idType = nid.startsWith("1") ? "national_id" : "iqama";
  if (params.fullName) {
    session.guestName = params.fullName.trim();
  }
  session.identityVerified = true;
  session.identityVerifiedAt = now;
  session.identityProvider = check.provider;
  session.verificationReference = check.reference;
  session.updatedAt = now;
  session.completed = session.otpVerified && session.identityVerified;

  records[token] = session;
  saveVerifications(records);
  return { success: true, session };
}

export function getVerificationSession(token: string): HelplineVerificationSession | null {
  const records = loadVerifications();
  return records[token] || null;
}

export function consumeVerificationToken(token: string): void {
  const records = loadVerifications();
  const session = records[token];
  if (!session) return;
  const now = new Date().toISOString();
  session.consumedAt = now;
  session.updatedAt = now;
  records[token] = session;
  saveVerifications(records);
}

export function validateBookingVerification(token: string): {
  valid: boolean;
  error?: string;
  session?: HelplineVerificationSession;
} {
  const records = loadVerifications();
  const session = records[token];
  if (!session) {
    return { valid: false, error: "Missing or invalid verification token." };
  }

  if (session.consumedAt) {
    return { valid: false, error: "Verification token has already been used for a booking." };
  }

  if (!session.isAccountActive) {
    return { valid: false, error: "Guest account is suspended or blocked by admin policy." };
  }

  if (!session.otpVerified) {
    return { valid: false, error: "Mobile number OTP has not been verified." };
  }

  if (!session.identityVerified) {
    return { valid: false, error: "Government National ID / Iqama has not been verified with Yakeen / Nafath." };
  }

  return { valid: true, session };
}

// ---------------- Transfer Claim Functions ----------------

export function recordTransferClaim(params: {
  bookingRef: string;
  guestId?: string;
  transferReference: string;
  bankName?: string;
  senderName?: string;
  amount: number;
}): BankTransferClaim {
  const claims = loadTransferClaims();
  const now = new Date().toISOString();
  const claim: BankTransferClaim = {
    bookingRef: params.bookingRef,
    guestId: params.guestId,
    transferReference: params.transferReference.trim(),
    bankName: params.bankName?.trim() || "Saudi National Bank (SNB)",
    senderName: params.senderName?.trim(),
    amount: params.amount,
    submittedAt: now,
    status: "pending_verification",
  };
  claims[params.bookingRef] = claim;
  saveTransferClaims(claims);
  return claim;
}

export function getTransferClaim(bookingRef: string): BankTransferClaim | null {
  const claims = loadTransferClaims();
  return claims[bookingRef] || null;
}

export function confirmTransferClaim(bookingRef: string, adminNotes?: string): BankTransferClaim | null {
  const claims = loadTransferClaims();
  const claim = claims[bookingRef];
  if (!claim) return null;
  claim.status = "confirmed";
  claim.adminNotes = adminNotes || "Confirmed by Helpline Admin desk.";
  claims[bookingRef] = claim;
  saveTransferClaims(claims);
  return claim;
}
