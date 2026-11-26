import {
  SaudiIdentityConfig,
  DEFAULT_IDENTITY_CONFIG,
  isValidSaudiIdDigits,
} from "./saudiIdentity";
import {
  hydrateSharedJsonFile,
  persistSharedJsonFile,
  readSharedJsonFile,
  writeSharedJsonFile,
} from "./serverJsonStore";

export * from "./saudiIdentity";
export const DEFAULT_SAUDI_IDENTITY_CONFIG = DEFAULT_IDENTITY_CONFIG;

const SAUDI_IDENTITY_FILE = "saudi-identity-config.json";
const VERIFIED_IDENTITIES_FILE = "saudi-verified-identities.json";

export interface VerifiedIdentityBinding {
  userId: string;
  idType: "national_id" | "iqama";
  idNumber: string;
  phone: string;
  verifiedFullName: string;
  provider: "yakeen" | "nafath" | "sandbox";
  authority: string;
  reference: string;
  verifiedAt: string;
}

function normalizePhoneDigits(phone: string | undefined | null): string {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

function extractRegistryFullName(data: Record<string, unknown>): string | undefined {
  const direct = [data.fullName, data.arabicFullName, data.englishFullName, data.name]
    .find((v) => typeof v === "string" && v.trim().length > 1) as string | undefined;
  if (direct) return direct.trim();

  const composed = [data.firstName, data.fatherName, data.grandFatherName, data.familyName]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .join(" ");
  return composed || undefined;
}

const SANDBOX_CITIZEN_NAMES = [
  "عبدالله بن فهد العتيبي",
  "خالد بن عبدالعزيز القحطاني",
  "فيصل بن محمد الدوسري",
  "سعد بن ناصر الشمري",
];

const SANDBOX_RESIDENT_NAMES = [
  "Tariq Mahmood Al-Rashid",
  "Imran Hassan Siddiqui",
  "Faisal Karim Mansour",
  "Bilal Ahmad Qureshi",
];

function resolveSandboxRegistryName(
  cleanedId: string,
  inferredType: "national_id" | "iqama",
  existingName?: string
): string {
  const trimmed = String(existingName || "").trim();
  if (trimmed && !/^dev test user$/i.test(trimmed) && !/^qafnest guest$/i.test(trimmed)) {
    return trimmed;
  }
  const pool = inferredType === "iqama" ? SANDBOX_RESIDENT_NAMES : SANDBOX_CITIZEN_NAMES;
  const idx = Math.abs(parseInt(cleanedId.slice(-2), 10) || 0) % pool.length;
  return pool[idx];
}

export async function hydrateVerifiedIdentityStore(): Promise<Record<string, VerifiedIdentityBinding>> {
  return hydrateSharedJsonFile<Record<string, VerifiedIdentityBinding>>(
    VERIFIED_IDENTITIES_FILE,
    () => ({}),
    (parsed) =>
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, VerifiedIdentityBinding>)
        : {}
  );
}

function readVerifiedIdentityMap(): Record<string, VerifiedIdentityBinding> {
  return readSharedJsonFile<Record<string, VerifiedIdentityBinding>>(
    VERIFIED_IDENTITIES_FILE,
    () => ({}),
    (parsed) =>
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, VerifiedIdentityBinding>)
        : {}
  );
}

export function getVerifiedIdentityByUser(userId: string): VerifiedIdentityBinding | null {
  if (!userId) return null;
  return readVerifiedIdentityMap()[userId] || null;
}

export function checkIdentityPhoneConflict(params: {
  userId: string;
  idNumber: string;
  phone: string;
}): { conflict: boolean; reasonEn?: string; reasonAr?: string } {
  const map = readVerifiedIdentityMap();
  const targetPhone = normalizePhoneDigits(params.phone);
  for (const [uid, entry] of Object.entries(map)) {
    if (!entry) continue;
    const entryPhone = normalizePhoneDigits(entry.phone);
    if (entry.idNumber === params.idNumber && entryPhone && targetPhone && entryPhone !== targetPhone) {
      return {
        conflict: true,
        reasonEn:
          "This National ID / Iqama is registered under a different mobile number in Nafath / Elm Yaqeen.",
        reasonAr:
          "رقم الهوية أو الإقامة مرتبط برقم جوال آخر في نفاذ / علم يقين. يرجى استخدام الجوال المطابق.",
      };
    }
    if (uid !== params.userId && entry.idNumber === params.idNumber) {
      return {
        conflict: true,
        reasonEn: "This National ID / Iqama is already linked to another QafNest guest account.",
        reasonAr: "رقم الهوية أو الإقامة مرتبط مسبقاً بحساب ضيف آخر في قاف نست.",
      };
    }
    if (targetPhone && entryPhone === targetPhone && entry.idNumber && entry.idNumber !== params.idNumber) {
      return {
        conflict: true,
        reasonEn:
          "This verified mobile number is already linked to a different National ID / Iqama.",
        reasonAr:
          "رقم الجوال الموثق مرتبط برقم هوية أو إقامة مختلف، يرجى إدخال الرقم المطابق للجوال.",
      };
    }
  }
  return { conflict: false };
}

export async function saveVerifiedIdentityBinding(
  binding: VerifiedIdentityBinding
): Promise<void> {
  const current = await hydrateVerifiedIdentityStore();
  const next = { ...current, [binding.userId]: binding };
  writeSharedJsonFile(VERIFIED_IDENTITIES_FILE, next);
  await persistSharedJsonFile(VERIFIED_IDENTITIES_FILE, next);
}

export async function invalidateVerifiedIdentityForUser(userId: string): Promise<void> {
  if (!userId) return;
  const current = await hydrateVerifiedIdentityStore();
  if (!(userId in current)) return;
  const next = { ...current };
  delete next[userId];
  writeSharedJsonFile(VERIFIED_IDENTITIES_FILE, next);
  await persistSharedJsonFile(VERIFIED_IDENTITIES_FILE, next);
}

export async function verifySaudiIdentityServer(params: {
  idNumber: string;
  type?: "national_id" | "iqama";
  fullName?: string;
  phoneNumber?: string;
}): Promise<{
  verified: boolean;
  provider: "yakeen" | "nafath" | "sandbox";
  authority: string;
  reference: string;
  verifiedFullName?: string;
  error?: string;
  statusCode?: number;
}> {
  const cleaned = params.idNumber.trim().replace(/\D/g, "");
  const inferredType = params.type || (cleaned.startsWith("2") ? "iqama" : "national_id");
  const expectedPrefix = inferredType === "iqama" ? "2" : "1";

  if (!isValidSaudiIdDigits(cleaned, expectedPrefix)) {
    return {
      verified: false,
      provider: "sandbox",
      authority: "Validation",
      reference: "",
      statusCode: 400,
      error:
        inferredType === "iqama"
          ? "Saudi Iqama number must be a valid 10-digit checksum ID starting with 2."
          : "Saudi National ID must be a valid 10-digit checksum ID starting with 1.",
    };
  }

  await hydrateSharedJsonFile(SAUDI_IDENTITY_FILE, () => DEFAULT_IDENTITY_CONFIG);
  const config = getServerSaudiIdentityConfig();

  if (config.activeProvider === "yakeen") {
    const appId = config.yakeen.appId?.trim() || process.env.YAKEEN_APP_ID?.trim() || "";
    const appKey = config.yakeen.appKey?.trim() || process.env.YAKEEN_APP_KEY?.trim() || "";
    const baseUrl = (config.yakeen.baseUrl || "https://yakeen.elm.sa/api").trim().replace(/\/+$/, "");
    if (!appId || !appKey || !/^https:\/\/[a-z0-9.-]+/i.test(baseUrl)) {
      return {
        verified: false,
        provider: "yakeen",
        authority: "Elm Yakeen Registry",
        reference: "",
        statusCode: 503,
        error: "Elm Yakeen credentials are not configured.",
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${baseUrl}/v1/verify`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "APP-ID": appId,
          "APP-KEY": appKey,
        },
        body: JSON.stringify({
          idNumber: cleaned,
          idType: inferredType,
          mobileNumber: params.phoneNumber || undefined,
          organizationNumber: config.yakeen.organizationNumber,
          fullName: params.fullName,
        }),
      });
      clearTimeout(timeout);

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok || data.verified === false || data.valid === false) {
        return {
          verified: false,
          provider: "yakeen",
          authority: "Yakeen Central Service (Elm)",
          reference: "",
          statusCode: res.ok ? 422 : 502,
          error: String(data.message || data.error || "Yakeen registry could not verify identity."),
        };
      }

      return {
        verified: true,
        provider: "yakeen",
        authority: "Yakeen Central Service (علم / يقين) · Saudi NIC",
        reference: String(data.reference || data.requestId || `YKN-${Date.now().toString(36).toUpperCase()}`),
        verifiedFullName: extractRegistryFullName(data) || params.fullName,
      };
    } catch {
      return {
        verified: false,
        provider: "yakeen",
        authority: "Elm Yakeen Registry",
        reference: "",
        statusCode: 502,
        error: "Elm Yakeen gateway is unreachable.",
      };
    }
  }

  if (config.activeProvider === "nafath") {
    const appId = config.nafath.appId?.trim() || process.env.NAFATH_APP_ID?.trim() || "";
    const appKey = config.nafath.appKey?.trim() || process.env.NAFATH_APP_KEY?.trim() || "";
    const baseUrl = (config.nafath.baseUrl || "https://nafath.api.elm.sa").trim().replace(/\/+$/, "");
    if (!appId || !appKey || !/^https:\/\/[a-z0-9.-]+/i.test(baseUrl)) {
      return {
        verified: false,
        provider: "nafath",
        authority: "Nafath Digital Identity",
        reference: "",
        statusCode: 503,
        error: "Nafath API credentials are not configured.",
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${baseUrl}/api/v1/mfa/request`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "APP-ID": appId,
          "APP-KEY": appKey,
        },
        body: JSON.stringify({
          nationalId: cleaned,
          mobileNumber: params.phoneNumber || undefined,
          service: "Login",
        }),
      });
      clearTimeout(timeout);

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok || data.verified === false) {
        return {
          verified: false,
          provider: "nafath",
          authority: "Nafath Digital Identity (نفاذ) · DGA / NIC",
          reference: "",
          statusCode: res.ok ? 422 : 502,
          error: String(data.message || data.error || "Nafath verification failed."),
        };
      }

      return {
        verified: true,
        provider: "nafath",
        authority: "Nafath Digital Identity (نفاذ) · DGA / NIC",
        reference: String(data.transId || data.reference || `NAFATH-${Date.now().toString(36).toUpperCase()}`),
        verifiedFullName: extractRegistryFullName(data) || params.fullName,
      };
    } catch {
      return {
        verified: false,
        provider: "nafath",
        authority: "Nafath Digital Identity",
        reference: "",
        statusCode: 502,
        error: "Nafath gateway is unreachable.",
      };
    }
  }

  // Sandbox mode is strictly disallowed in production builds
  if (process.env.NODE_ENV === "production") {
    return {
      verified: false,
      provider: "sandbox",
      authority: "Configuration Required",
      reference: "",
      statusCode: 503,
      error: "Live Elm Yakeen or Nafath identity provider must be configured in production.",
    };
  }

  return {
    verified: true,
    provider: "sandbox",
    authority: "Nafath / Elm Yaqeen Sandbox Gateway · Saudi NIC",
    reference: `NAFATH-${inferredType === "national_id" ? "SA" : "IQ"}-${Date.now().toString(36).toUpperCase()}`,
    verifiedFullName: resolveSandboxRegistryName(cleaned, inferredType, params.fullName),
  };
}

export function getServerSaudiIdentityConfig(): SaudiIdentityConfig {
  return readSharedJsonFile<SaudiIdentityConfig>(
    SAUDI_IDENTITY_FILE,
    () => DEFAULT_IDENTITY_CONFIG,
    (parsed) => {
      const candidate = parsed as Partial<SaudiIdentityConfig> | null;
      if (candidate && typeof candidate.isMandatoryForGuests === "boolean") {
        return { ...DEFAULT_IDENTITY_CONFIG, ...candidate };
      }
      return DEFAULT_IDENTITY_CONFIG;
    }
  );
}

export function writeServerSaudiIdentityConfig(config: SaudiIdentityConfig): void {
  writeSharedJsonFile(SAUDI_IDENTITY_FILE, config);
}

export function updateServerSaudiIdentityConfig(
  updates: Partial<SaudiIdentityConfig>
): SaudiIdentityConfig {
  const current = getServerSaudiIdentityConfig();
  const nextConfig: SaudiIdentityConfig = {
    ...current,
    ...updates,
    yakeen: {
      ...current.yakeen,
      ...(updates.yakeen || {}),
    },
    nafath: {
      ...current.nafath,
      ...(updates.nafath || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  writeServerSaudiIdentityConfig(nextConfig);
  return nextConfig;
}
