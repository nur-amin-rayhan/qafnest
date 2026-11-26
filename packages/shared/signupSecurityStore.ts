import crypto from "crypto";
import {
  hydrateSharedJsonFile,
  persistSharedJsonFile,
  readSharedJsonFile,
  writeSharedJsonFile,
} from "./serverJsonStore";

export interface SignupDeviceRecord {
  id: string;
  userId: string;
  email?: string | null;
  phone?: string | null;
  ip: string;
  deviceId: string;
  fingerprintHash?: string | null;
  userAgent?: string | null;
  welcomeBonusAwarded: boolean;
  welcomeBonusAmount: number;
  createdAt: string;
}

export interface BlockedEntityRecord {
  value: string; // IP address or deviceId
  type: "ip" | "device";
  reason: string;
  blockedAt: string;
  blockedBy: string;
  autoBlocked: boolean;
}

export interface SignupSecurityAlert {
  id: string;
  ip: string;
  deviceId: string;
  fingerprintHash?: string | null;
  email?: string | null;
  phone?: string | null;
  reason: string;
  attemptedAt: string;
  actionTaken: "blocked" | "auto_ip_blocked" | "flagged";
}

export interface SignupSecurityPolicy {
  enforceSingleAccountPerIp: boolean;
  enforceSingleAccountPerDevice: boolean;
  autoBlockRepeatIps: boolean;
  welcomeBonusAmountSar: number;
  welcomeBonusEnabled: boolean;
}

export interface SignupSecurityStoreDoc {
  policy: SignupSecurityPolicy;
  registrations: SignupDeviceRecord[];
  blockedIps: BlockedEntityRecord[];
  blockedDevices: BlockedEntityRecord[];
  alerts: SignupSecurityAlert[];
}

const DEFAULT_POLICY: SignupSecurityPolicy = {
  enforceSingleAccountPerIp: true,
  enforceSingleAccountPerDevice: true,
  autoBlockRepeatIps: true,
  welcomeBonusAmountSar: 50,
  welcomeBonusEnabled: true,
};

const SIGNUP_SECURITY_FILE = "signup-security.json";

function defaultSignupSecurityDoc(): SignupSecurityStoreDoc {
  return {
    policy: { ...DEFAULT_POLICY },
    registrations: [],
    blockedIps: [],
    blockedDevices: [],
    alerts: [],
  };
}

const normalizeSignupSecurityDoc = (parsed: unknown): SignupSecurityStoreDoc => {
  const candidate = (parsed || {}) as Partial<SignupSecurityStoreDoc>;
  return {
    policy: { ...DEFAULT_POLICY, ...(candidate.policy || {}) },
    registrations: Array.isArray(candidate.registrations) ? candidate.registrations : [],
    blockedIps: Array.isArray(candidate.blockedIps) ? candidate.blockedIps : [],
    blockedDevices: Array.isArray(candidate.blockedDevices) ? candidate.blockedDevices : [],
    alerts: Array.isArray(candidate.alerts) ? candidate.alerts : [],
  };
};

export async function hydrateSignupSecurityStore(): Promise<SignupSecurityStoreDoc> {
  return hydrateSharedJsonFile<SignupSecurityStoreDoc>(
    SIGNUP_SECURITY_FILE,
    defaultSignupSecurityDoc,
    normalizeSignupSecurityDoc
  );
}

export async function persistSignupSecurityStore(): Promise<boolean> {
  return persistSharedJsonFile(SIGNUP_SECURITY_FILE, readDoc());
}

function readDoc(): SignupSecurityStoreDoc {
  return readSharedJsonFile<SignupSecurityStoreDoc>(
    SIGNUP_SECURITY_FILE,
    defaultSignupSecurityDoc,
    normalizeSignupSecurityDoc
  );
}

function writeDoc(doc: SignupSecurityStoreDoc): void {
  writeSharedJsonFile(SIGNUP_SECURITY_FILE, doc);
}

export function extractClientIp(request: Request): string {
  // Only trust edge-injected IP headers from trusted edge runtimes (Cloudflare / Vercel / reverse proxy)
  if (process.env.TRUST_CF_CONNECTING_IP === "true") {
    const cfIp = request.headers.get("cf-connecting-ip")?.trim();
    if (cfIp) return cfIp.replace(/^::ffff:/, "");
  }
  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelIp) return vercelIp.replace(/^::ffff:/, "");

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.replace(/^::ffff:/, "");

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    // Use rightmost proxy-appended IP so client-forged leading X-Forwarded-For values cannot bypass IP locks
    const candidate = parts[parts.length - 1];
    if (candidate) return candidate.replace(/^::ffff:/, "");
  }
  return "127.0.0.1";
}

export function normalizeDeviceId(rawDeviceId?: string | null, userAgent?: string | null): string {
  const cleaned = (rawDeviceId || "").trim();
  if (cleaned) return cleaned;
  return `ua-${crypto.createHash("sha256").update(userAgent || "unknown-device").digest("hex").slice(0, 16)}`;
}

export interface SignupGuardResult {
  allowed: boolean;
  code:
    | "ok"
    | "ip_blocked"
    | "device_blocked"
    | "ip_account_limit"
    | "device_account_limit";
  messageEn: string;
  messageAr: string;
  ip: string;
  deviceId: string;
  autoBlockedIp?: boolean;
}

export function evaluateAndRecordSignupAttempt(params: {
  ip: string;
  deviceId: string;
  fingerprintHash?: string | null;
  email?: string | null;
  phone?: string | null;
  existingUserId?: string | null;
  recordAttemptOnReject?: boolean;
}): SignupGuardResult {
  const doc = readDoc();
  const cleanIp = params.ip.trim();
  const cleanDevice = params.deviceId.trim();
  const cleanFp = (params.fingerprintHash || "").trim() || null;

  // 1. Hard IP / Device block check
  const blockedIp = doc.blockedIps.find((b) => b.value === cleanIp);
  if (blockedIp) {
    return {
      allowed: false,
      code: "ip_blocked",
      messageEn: "Sign-up from this network IP is blocked due to multiple account security rules.",
      messageAr: "تم حظر إنشاء حسابات جديدة من عنوان الشبكة (IP) هذا بسبب قيود الأمان.",
      ip: cleanIp,
      deviceId: cleanDevice,
    };
  }

  const blockedDevice = doc.blockedDevices.find(
    (b) => b.value === cleanDevice || (cleanFp && b.value === cleanFp)
  );
  if (blockedDevice) {
    return {
      allowed: false,
      code: "device_blocked",
      messageEn: "This device is restricted from creating additional accounts.",
      messageAr: "هذا الجهاز مقيد من إنشاء حسابات إضافية.",
      ip: cleanIp,
      deviceId: cleanDevice,
    };
  }

  // If this verified user ALREADY registered before, always allow login/idempotent check
  if (params.existingUserId) {
    const sameUser = doc.registrations.find((r) => r.userId === params.existingUserId);
    if (sameUser) {
      return {
        allowed: true,
        code: "ok",
        messageEn: "Verified existing user.",
        messageAr: "حساب موثق مسبقاً.",
        ip: cleanIp,
        deviceId: cleanDevice,
      };
    }
  }

  // 2. Single account per Device / Fingerprint check
  if (doc.policy.enforceSingleAccountPerDevice) {
    const existingForDevice = doc.registrations.find(
      (r) =>
        (r.deviceId === cleanDevice || (cleanFp && r.fingerprintHash === cleanFp)) &&
        r.userId !== params.existingUserId
    );
    if (existingForDevice) {
      if (params.recordAttemptOnReject !== false) {
        const shouldAutoBlock = doc.policy.autoBlockRepeatIps;
        doc.alerts.unshift({
          id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ip: cleanIp,
          deviceId: cleanDevice,
          fingerprintHash: cleanFp,
          email: params.email || null,
          phone: params.phone || null,
          reason: `Duplicate signup attempt detected on device already bound to ${existingForDevice.email || existingForDevice.phone || existingForDevice.userId}`,
          attemptedAt: new Date().toISOString(),
          actionTaken: shouldAutoBlock ? "auto_ip_blocked" : "blocked",
        });
        doc.alerts = doc.alerts.slice(0, 200);
        if (shouldAutoBlock && !doc.blockedIps.some((b) => b.value === cleanIp)) {
          doc.blockedIps.unshift({
            value: cleanIp,
            type: "ip",
            reason: "Auto-blocked: multiple signup attempts detected from same device",
            blockedAt: new Date().toISOString(),
            blockedBy: "Automated Fraud Guard",
            autoBlocked: true,
          });
        }
        writeDoc(doc);
      }

      return {
        allowed: false,
        code: "device_account_limit",
        messageEn:
          "Security policy allows only 1 QafNest guest account & welcome bonus per device. Multiple account attempts are blocked.",
        messageAr:
          "تسمح سياسة الأمان بحساب ضيف واحد ومكافأة ترحيبية واحدة فقط لكل جهاز. تم رصد محاولة مكررة وإيقافها.",
        ip: cleanIp,
        deviceId: cleanDevice,
        autoBlockedIp: doc.policy.autoBlockRepeatIps,
      };
    }
  }

  // 3. Single account per IP check
  if (doc.policy.enforceSingleAccountPerIp) {
    const existingForIp = doc.registrations.find(
      (r) => r.ip === cleanIp && r.userId !== params.existingUserId
    );
    if (existingForIp) {
      if (params.recordAttemptOnReject !== false) {
        const shouldAutoBlock = doc.policy.autoBlockRepeatIps;
        doc.alerts.unshift({
          id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ip: cleanIp,
          deviceId: cleanDevice,
          fingerprintHash: cleanFp,
          email: params.email || null,
          phone: params.phone || null,
          reason: `Multiple account registration attempted from IP ${cleanIp} (existing account: ${existingForIp.email || existingForIp.phone || existingForIp.userId})`,
          attemptedAt: new Date().toISOString(),
          actionTaken: shouldAutoBlock ? "auto_ip_blocked" : "blocked",
        });
        doc.alerts = doc.alerts.slice(0, 200);
        if (shouldAutoBlock && !doc.blockedIps.some((b) => b.value === cleanIp)) {
          doc.blockedIps.unshift({
            value: cleanIp,
            type: "ip",
            reason: "Auto-blocked: exceeded 1 account per IP limit",
            blockedAt: new Date().toISOString(),
            blockedBy: "Automated Fraud Guard",
            autoBlocked: true,
          });
        }
        writeDoc(doc);
      }

      return {
        allowed: false,
        code: "ip_account_limit",
        messageEn:
          "Only 1 new guest account is permitted per IP address. This network IP has been flagged for multiple registrations.",
        messageAr:
          "يُسمح بإنشاء حساب ضيف واحد فقط لكل عنوان شبكة (IP). تم رصد محاولة تسجيل متعددة من نفس الشبكة.",
        ip: cleanIp,
        deviceId: cleanDevice,
        autoBlockedIp: doc.policy.autoBlockRepeatIps,
      };
    }
  }

  return {
    allowed: true,
    code: "ok",
    messageEn: "Device and IP verified.",
    messageAr: "تم التحقق من الجهاز وعنوان الشبكة بنجاح.",
    ip: cleanIp,
    deviceId: cleanDevice,
  };
}

export function recordApprovedSignupDevice(params: {
  userId: string;
  email?: string | null;
  phone?: string | null;
  ip: string;
  deviceId: string;
  fingerprintHash?: string | null;
  userAgent?: string | null;
  welcomeBonusAwarded: boolean;
  welcomeBonusAmount: number;
}): SignupDeviceRecord {
  const doc = readDoc();
  const existing = doc.registrations.find((r) => r.userId === params.userId);
  if (existing) {
    return existing;
  }

  const record: SignupDeviceRecord = {
    id: `reg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: params.userId,
    email: params.email || null,
    phone: params.phone || null,
    ip: params.ip.trim(),
    deviceId: params.deviceId.trim(),
    fingerprintHash: params.fingerprintHash?.trim() || null,
    userAgent: params.userAgent || null,
    welcomeBonusAwarded: params.welcomeBonusAwarded,
    welcomeBonusAmount: params.welcomeBonusAmount,
    createdAt: new Date().toISOString(),
  };

  doc.registrations.unshift(record);
  writeDoc(doc);
  return record;
}

export function getSignupSecurityOverview(): SignupSecurityStoreDoc {
  return readDoc();
}

export function blockIpAddress(ip: string, reason: string, blockedBy = "Super Admin"): SignupSecurityStoreDoc {
  const doc = readDoc();
  const cleanIp = ip.trim();
  if (cleanIp && !doc.blockedIps.some((b) => b.value === cleanIp)) {
    doc.blockedIps.unshift({
      value: cleanIp,
      type: "ip",
      reason: reason || "Blocked manually by Admin",
      blockedAt: new Date().toISOString(),
      blockedBy,
      autoBlocked: false,
    });
    writeDoc(doc);
  }
  return doc;
}

export function unblockIpAddress(ip: string): SignupSecurityStoreDoc {
  const doc = readDoc();
  const cleanIp = ip.trim();
  doc.blockedIps = doc.blockedIps.filter((b) => b.value !== cleanIp);
  writeDoc(doc);
  return doc;
}

export function clearIpRegistrationLock(ip: string): SignupSecurityStoreDoc {
  const doc = readDoc();
  const cleanIp = ip.trim();
  doc.blockedIps = doc.blockedIps.filter((b) => b.value !== cleanIp);
  doc.registrations = doc.registrations.filter((r) => r.ip !== cleanIp);
  writeDoc(doc);
  return doc;
}

export function clearDeviceRegistrationLock(deviceId: string): SignupSecurityStoreDoc {
  const doc = readDoc();
  const cleanDevice = deviceId.trim();
  doc.blockedDevices = doc.blockedDevices.filter((b) => b.value !== cleanDevice);
  doc.registrations = doc.registrations.filter((r) => r.deviceId !== cleanDevice);
  writeDoc(doc);
  return doc;
}

export function updateSignupSecurityPolicy(
  updates: Partial<SignupSecurityPolicy>
): SignupSecurityStoreDoc {
  const doc = readDoc();
  doc.policy = {
    ...doc.policy,
    ...updates,
  };
  writeDoc(doc);
  return doc;
}
