"use client";

const DEVICE_STORAGE_KEY = "qafnest_device_id_v1";

function hashString(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `fp-${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0).toString(16).padStart(8, "0")}`;
}

export function getOrCreateDeviceIdentity(): {
  deviceId: string;
  fingerprintHash: string;
} {
  if (typeof window === "undefined") {
    return { deviceId: "server-ssr", fingerprintHash: "server-ssr" };
  }

  let deviceId = "";
  try {
    deviceId = window.localStorage.getItem(DEVICE_STORAGE_KEY) || "";
  } catch {
    deviceId = "";
  }

  if (!deviceId) {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)qafnest_device_id=([^;]+)/);
    if (cookieMatch?.[1]) {
      deviceId = decodeURIComponent(cookieMatch[1]);
    }
  }

  if (!deviceId) {
    const rand =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    deviceId = `dev-${rand}`;
  }

  try {
    window.localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
    document.cookie = `qafnest_device_id=${encodeURIComponent(deviceId)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {
    // Ignore storage quota / private mode restriction
  }

  const rawTraits = [
    navigator.userAgent || "",
    navigator.language || "",
    navigator.platform || "",
    String(navigator.hardwareConcurrency || ""),
    `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  ].join("|");

  return {
    deviceId,
    fingerprintHash: hashString(rawTraits),
  };
}

export async function checkSignupGuard(params: {
  email?: string | null;
  phone?: string | null;
  mode?: "signup" | "otp";
}): Promise<{
  allowed: boolean;
  existingAccount?: boolean;
  code?: string;
  messageEn?: string;
  messageAr?: string;
}> {
  try {
    const { deviceId, fingerprintHash } = getOrCreateDeviceIdentity();
    const res = await fetch("/api/auth/signup-guard", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        fingerprintHash,
        email: params.email || null,
        phone: params.phone || null,
        mode: params.mode || "signup",
      }),
    });
    const data = await res.json();
    if (!res.ok || data.allowed === false) {
      return {
        allowed: false,
        code: data.code,
        messageEn: data.messageEn || data.message || "Sign-up restricted by security policy.",
        messageAr: data.messageAr,
      };
    }
    return {
      allowed: true,
      existingAccount: Boolean(data.existingAccount),
      code: data.code,
    };
  } catch {
    return { allowed: true };
  }
}

export async function claimWelcomeBonus(params?: {
  isNewSignup?: boolean;
  accessToken?: string | null;
}): Promise<{
  awarded: boolean;
  alreadyCredited?: boolean;
  amountCredited: number;
  balance?: number;
  blocked?: boolean;
  message?: string;
}> {
  try {
    const { deviceId, fingerprintHash } = getOrCreateDeviceIdentity();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (params?.accessToken) {
      headers.Authorization = `Bearer ${params.accessToken}`;
    }

    const res = await fetch("/api/auth/welcome-bonus", {
      method: "POST",
      cache: "no-store",
      headers,
      body: JSON.stringify({
        deviceId,
        fingerprintHash,
        isNewSignup: Boolean(params?.isNewSignup),
      }),
    });
    const data = await res.json();

    if (typeof window !== "undefined" && data.awarded) {
      window.dispatchEvent(
        new CustomEvent("qafnest:wallet-updated", {
          detail: {
            balance: data.balance,
            awarded: true,
            amountCredited: data.amountCredited,
          },
        })
      );
    }

    return {
      awarded: Boolean(data.awarded),
      alreadyCredited: Boolean(data.alreadyCredited),
      amountCredited: Number(data.amountCredited) || 0,
      balance: typeof data.balance === "number" ? data.balance : undefined,
      blocked: Boolean(data.blocked || res.status === 403),
      message: data.messageEn || data.message,
    };
  } catch {
    return { awarded: false, amountCredited: 0 };
  }
}
