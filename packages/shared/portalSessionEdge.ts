/**
 * Edge-safe signed portal session tokens (Web Crypto HMAC-SHA256) and cookie parsing.
 * Zero Node.js imports so Next.js Edge Middleware and Node API routes share one implementation.
 */

export const PORTAL_TOKEN_PREFIX = "qf.";

export type PortalRole = "guest" | "host";

export interface PortalSessionPayload {
  sub: string;
  role: PortalRole;
  provider: "supabase" | "firebase" | "dev";
  phone: string | null;
  email: string | null;
  name: string | null;
  iat: number;
  exp: number;
}

export function parseCookieValue(cookieHeader: string, cookieName: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = part.slice(0, eqIdx).trim();
    if (key !== cookieName) continue;
    const rawVal = part.slice(eqIdx + 1).trim();
    try {
      return decodeURIComponent(rawVal);
    } catch {
      return rawVal;
    }
  }
  return null;
}

function getPortalSigningSecret(): string | null {
  const candidates = [
    process.env.PORTAL_SESSION_SECRET,
    process.env.AUTH_SESSION_SECRET,
    process.env.ADMIN_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  ];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed && trimmed.length >= 24) {
      return `${trimmed}:qafnest-portal-v1`;
    }
  }
  if (process.env.NODE_ENV !== "production") {
    return "qafnest-local-dev-portal-signing-secret-only-not-for-prod";
  }
  return null;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function signPortalSessionToken(
  claims: Omit<PortalSessionPayload, "iat" | "exp">,
  ttlSeconds = 3600
): Promise<string | null> {
  const secret = getPortalSigningSecret();
  if (!secret || !claims.sub) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const payload: PortalSessionPayload = {
    ...claims,
    iat: nowSec,
    exp: nowSec + Math.max(60, ttlSeconds),
  };

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const payloadB64 = bytesToBase64Url(payloadBytes);
  const key = await importHmacKey(secret, "sign");
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  return `${PORTAL_TOKEN_PREFIX}${payloadB64}.${bytesToBase64Url(new Uint8Array(sigBuf))}`;
}

export async function verifyPortalSessionTokenEdge(
  token: string | null | undefined,
  expectedRole: PortalRole
): Promise<PortalSessionPayload | null> {
  if (!token || typeof token !== "string" || !token.startsWith(PORTAL_TOKEN_PREFIX)) {
    return null;
  }
  const secret = getPortalSigningSecret();
  if (!secret) return null;

  const body = token.slice(PORTAL_TOKEN_PREFIX.length);
  const dotIdx = body.indexOf(".");
  if (dotIdx <= 0 || dotIdx >= body.length - 1) return null;

  const payloadB64 = body.slice(0, dotIdx);
  const sigB64 = body.slice(dotIdx + 1);
  if (sigB64.includes(".")) return null;

  try {
    const key = await importHmacKey(secret, "verify");
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(sigB64) as unknown as BufferSource,
      new TextEncoder().encode(payloadB64) as unknown as BufferSource
    );
    if (!isValid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadB64))
    ) as PortalSessionPayload;

    const nowSec = Math.floor(Date.now() / 1000);
    if (
      !payload ||
      typeof payload.sub !== "string" ||
      !payload.sub ||
      payload.role !== expectedRole ||
      typeof payload.exp !== "number" ||
      payload.exp < nowSec
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function signBookingSlipToken(
  bookingRef: string,
  paymentId: string,
  ttlSeconds = 900
): Promise<string | null> {
  const secret = getPortalSigningSecret();
  if (!secret || !bookingRef || !paymentId) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const payloadBytes = new TextEncoder().encode(
    JSON.stringify({
      ref: bookingRef,
      pid: paymentId,
      exp: nowSec + Math.max(60, ttlSeconds),
    })
  );
  const payloadB64 = bytesToBase64Url(payloadBytes);
  const key = await importHmacKey(secret, "sign");
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`slip:${payloadB64}`)
  );
  return `qs.${payloadB64}.${bytesToBase64Url(new Uint8Array(sigBuf))}`;
}

export async function verifyBookingSlipToken(
  token: string | null | undefined,
  expectedBookingRef: string,
  expectedPaymentId?: string | null
): Promise<boolean> {
  if (!token || typeof token !== "string" || !token.startsWith("qs.") || !expectedBookingRef) {
    return false;
  }
  const secret = getPortalSigningSecret();
  if (!secret) return false;

  const body = token.slice(3);
  const dotIdx = body.indexOf(".");
  if (dotIdx <= 0 || dotIdx >= body.length - 1) return false;

  const payloadB64 = body.slice(0, dotIdx);
  const sigB64 = body.slice(dotIdx + 1);
  if (sigB64.includes(".")) return false;

  try {
    const key = await importHmacKey(secret, "verify");
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(sigB64) as unknown as BufferSource,
      new TextEncoder().encode(`slip:${payloadB64}`) as unknown as BufferSource
    );
    if (!isValid) return false;

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadB64))
    ) as { ref?: unknown; pid?: unknown; exp?: unknown };

    const nowSec = Math.floor(Date.now() / 1000);
    if (
      payload.ref !== expectedBookingRef ||
      typeof payload.exp !== "number" ||
      payload.exp < nowSec
    ) {
      return false;
    }
    if (expectedPaymentId && payload.pid !== expectedPaymentId) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
