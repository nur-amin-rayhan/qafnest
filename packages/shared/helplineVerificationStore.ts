import * as crypto from "crypto";
import {
  hydrateSharedJsonFile,
  persistSharedJsonFile,
  readSharedJsonFile,
  writeSharedJsonFile,
} from "./serverJsonStore";

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
  devOtpCode?: string; // stored for local dev convenience when SMS provider is in sandbox
  otpSentAt: string;
  otpExpiresAt: string;
  otpVerified: boolean;
  otpVerifiedAt?: string;
  identityVerified: boolean;
  identityVerifiedAt?: string;
  identityProvider?: "yakeen" | "nafath" | "sandbox";
  verificationMethod: "code" | "link";
  completed: boolean;
  createdAt: string;
  updatedAt: string;
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

function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
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
}): HelplineVerificationSession {
  const records = loadVerifications();
  const token = `HV-${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}`;
  
  // Generate random 6-digit OTP
  const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

  // Identify national id type if provided
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
    otpHash: hashOtp(rawOtp),
    devOtpCode: rawOtp, // visible in dev / helpline agent preview for quick testing
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
  return session;
}

export function verifySessionOtp(token: string, enteredCode: string): { success: boolean; error?: string; session?: HelplineVerificationSession } {
  const records = loadVerifications();
  const session = records[token];
  if (!session) {
    return { success: false, error: "Verification session not found" };
  }

  if (new Date() > new Date(session.otpExpiresAt)) {
    return { success: false, error: "Verification code has expired. Please request a new code." };
  }

  const enteredHash = hashOtp(enteredCode);
  const attempts = Number((session as { otpAttempts?: number }).otpAttempts || 0);
  if (attempts >= 5) {
    return { success: false, error: "Too many failed verification attempts. Request a new link." };
  }
  const allowDevBypass =
    typeof process !== "undefined" &&
    process.env.NODE_ENV !== "production" &&
    process.env.HELPLINE_ALLOW_TEST_OTP === "true" &&
    enteredCode === session.devOtpCode;

  if (enteredHash !== session.otpHash && !allowDevBypass) {
    (session as { otpAttempts?: number }).otpAttempts = attempts + 1;
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

export function verifySessionIdentity(
  token: string,
  params: {
    nationalId: string;
    fullName?: string;
    provider?: "yakeen" | "nafath" | "sandbox";
  }
): { success: boolean; error?: string; session?: HelplineVerificationSession } {
  const records = loadVerifications();
  const session = records[token];
  if (!session) {
    return { success: false, error: "Verification session not found" };
  }

  const nid = params.nationalId.trim();
  if (!/^(1|2)\d{9}$/.test(nid)) {
    return {
      success: false,
      error: "National ID must start with 1 (Citizen) or 2 (Resident Iqama) and contain exactly 10 digits.",
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
  session.identityProvider = params.provider || "yakeen";
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
