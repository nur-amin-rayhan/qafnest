import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getHostServiceRoleClient } from "@/lib/supabase/service";
import { normalizeSaudiPhone, normalizePhoneInput } from "@qafnest/shared/phone";
import {
  parseCookieValue,
  verifyPortalSessionTokenEdge,
} from "@qafnest/shared/portalSessionEdge";
import {
  getRegisteredPortalRole,
  registerPortalAccount,
} from "@qafnest/shared/portalRegistryStore";
import { readSharedJsonFile } from "@qafnest/shared/serverJsonStore";

export interface VerifiedHostUser {
  id: string;
  phone: string | null;
  isPhoneVerified: boolean;
  email: string | null;
  name: string | null;
  role: string;
  provider: "supabase" | "firebase";
}

interface CertCache {
  certs: Record<string, string>;
  expiresAt: number;
}
let googleCertCache: CertCache | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  if (googleCertCache && Date.now() < googleCertCache.expiresAt) {
    return googleCertCache.certs;
  }
  try {
    const res = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Google cert fetch failed with status ${res.status}`);

    let maxAgeMs = 3600 * 1000;
    const cacheControl = res.headers.get("cache-control");
    if (cacheControl) {
      const match = cacheControl.match(/max-age=(\d+)/i);
      if (match && match[1]) {
        maxAgeMs = parseInt(match[1], 10) * 1000;
      }
    }

    const certs = (await res.json()) as Record<string, string>;
    googleCertCache = {
      certs,
      expiresAt: Date.now() + Math.max(300000, maxAgeMs),
    };
    return certs;
  } catch (err) {
    console.error("Failed to fetch Google public certs:", err);
    if (googleCertCache?.certs) return googleCertCache.certs;
    return {};
  }
}

export async function verifyFirebaseTokenPayload(
  token: string
): Promise<Omit<VerifiedHostUser, "role" | "provider"> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));

    if (header.alg !== "RS256" || !header.kid) return null;

    const certs = await getGooglePublicCerts();
    const cert = certs[header.kid];
    if (!cert) return null;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${headerB64}.${payloadB64}`);
    const isSignatureValid = verifier.verify(cert, signatureB64, "base64url");
    if (!isSignatureValid) {
      console.warn("Firebase token signature verification failed");
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < nowSec - 60) {
      return null;
    }
    if (typeof payload.auth_time !== "number" || payload.auth_time > nowSec + 300) {
      return null;
    }

    const expectedProjectId =
      process.env.FIREBASE_PROJECT_ID?.trim() ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    if (!expectedProjectId) {
      if (process.env.NODE_ENV === "production") {
        console.error("Missing FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID in production.");
        return null;
      }
      if (!payload.iss?.startsWith("https://securetoken.google.com/")) return null;
    } else {
      if (payload.aud !== expectedProjectId) return null;
      if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) return null;
    }

    if (!payload.sub || typeof payload.sub !== "string") return null;

    const rawPhone =
      typeof payload.phone_number === "string" && payload.phone_number.trim()
        ? payload.phone_number.trim()
        : null;
    const phone = rawPhone
      ? normalizeSaudiPhone(rawPhone) || normalizePhoneInput(rawPhone)
      : null;

    return {
      id: payload.sub,
      phone,
      isPhoneVerified: Boolean(phone),
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch (err) {
    console.warn("Exception during Firebase ID token verification:", err);
    return null;
  }
}

export async function authorizeHostPortalAccount({
  uid,
  provider,
  appMeta,
  userMeta,
  hasSignedHostCookie = false,
  allowEnrollment = false,
}: {
  uid: string;
  provider: "supabase" | "firebase";
  appMeta?: Record<string, unknown> | null;
  userMeta?: Record<string, unknown> | null;
  hasSignedHostCookie?: boolean;
  allowEnrollment?: boolean;
}): Promise<boolean> {
  const devGuestId =
    process.env.NEXT_PUBLIC_DEV_GUEST_ID || "00000000-0000-0000-0000-000000000001";
  if (!uid || uid === devGuestId) return false;
  if (appMeta?.role === "guest" || appMeta?.role === "admin" || userMeta?.role === "guest") {
    return false;
  }

  const registeredRole = await getRegisteredPortalRole(uid);
  if (registeredRole === "guest") return false;

  if (appMeta?.role === "host" || registeredRole === "host" || hasSignedHostCookie) {
    if (!registeredRole) {
      const reg = await registerPortalAccount(uid, "host", provider);
      if (!reg.ok) return false;
    }
    return true;
  }

  // Check guest/host footprint in database and Firebase guest store
  const fbGuestMap = readSharedJsonFile<Record<string, unknown>>(
    "firebase-guest-profiles.json",
    () => ({})
  );
  if (fbGuestMap && typeof fbGuestMap === "object" && uid in fbGuestMap) {
    await registerPortalAccount(uid, "guest", provider);
    return false;
  }

  const adminDb = getHostServiceRoleClient();
  if (adminDb) {
    try {
      const { data: ownedProp } = await adminDb
        .from("properties")
        .select("id")
        .eq("host_id", uid)
        .limit(1)
        .maybeSingle();
      if (ownedProp?.id) {
        const reg = await registerPortalAccount(uid, "host", provider);
        return reg.ok;
      }

      const { data: guestBooking } = await adminDb
        .from("bookings")
        .select("id")
        .eq("guest_id", uid)
        .limit(1)
        .maybeSingle();
      if (guestBooking?.id) {
        await registerPortalAccount(uid, "guest", provider);
        return false;
      }

      const { data: guestWallet } = await adminDb
        .from("wallets")
        .select("user_id")
        .eq("user_id", uid)
        .limit(1)
        .maybeSingle();
      if (guestWallet?.user_id) {
        await registerPortalAccount(uid, "guest", provider);
        return false;
      }
    } catch {}
  }

  // Only explicit host session onboarding endpoints (/api/host/auth/session, /auth/callback) may enroll new hosts
  if (!allowEnrollment) {
    return false;
  }

  const reg = await registerPortalAccount(uid, "host", provider);
  if (!reg.ok) return false;

  if (provider === "supabase" && adminDb) {
    try {
      await adminDb.auth.admin.updateUserById(uid, {
        app_metadata: { ...(appMeta || {}), role: "host" },
      });
    } catch {}
  }

  return true;
}

export async function verifyFirebaseIdToken(token: string): Promise<VerifiedHostUser | null> {
  const verified = await verifyFirebaseTokenPayload(token);
  if (!verified) return null;
  const allowed = await authorizeHostPortalAccount({
    uid: verified.id,
    provider: "firebase",
    allowEnrollment: false,
  });
  if (!allowed) return null;
  return {
    ...verified,
    role: "host",
    provider: "firebase",
  };
}

export async function verifyHostSession(request: Request): Promise<VerifiedHostUser | null> {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const cookieHeader = request.headers.get("cookie") || "";
  const hostSessionCookie = parseCookieValue(cookieHeader, "qafnest_has_host_session");

  const signedHostCookie = hostSessionCookie
    ? await verifyPortalSessionTokenEdge(hostSessionCookie, "host")
    : null;
  if (signedHostCookie) {
    const allowed = await authorizeHostPortalAccount({
      uid: signedHostCookie.sub,
      provider: signedHostCookie.provider === "firebase" ? "firebase" : "supabase",
      hasSignedHostCookie: true,
    });
    if (!allowed) return null;
  }

  // 1. Check Authorization Bearer token via Firebase first, then Supabase
  if (bearer && bearer !== "dev_host_token") {
    const fbPayload = await verifyFirebaseTokenPayload(bearer);
    if (fbPayload) {
      const allowed = await authorizeHostPortalAccount({
        uid: fbPayload.id,
        provider: "firebase",
        hasSignedHostCookie: signedHostCookie?.sub === fbPayload.id,
        allowEnrollment: false,
      });
      if (!allowed) return null;
      return {
        ...fbPayload,
        role: "host",
        provider: "firebase",
      };
    }

    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser(bearer);
      if (!error && user) {
        const allowed = await authorizeHostPortalAccount({
          uid: user.id,
          provider: "supabase",
          appMeta: (user.app_metadata || {}) as Record<string, unknown>,
          userMeta: (user.user_metadata || {}) as Record<string, unknown>,
          hasSignedHostCookie: signedHostCookie?.sub === user.id,
          allowEnrollment: false,
        });
        if (allowed) {
          const rawPhone =
            user.phone ||
            (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null);
          const phone = rawPhone
            ? normalizeSaudiPhone(rawPhone) || normalizePhoneInput(rawPhone)
            : null;
          return {
            id: user.id,
            phone,
            isPhoneVerified: Boolean(user.phone_confirmed_at || phone),
            email: user.email || null,
            name:
              (typeof user.user_metadata?.full_name === "string"
                ? user.user_metadata.full_name
                : null) || null,
            role: "host",
            provider: "supabase",
          };
        }
      }
    } catch {}
  }

  // 2. Check SSR Supabase Auth session cookie
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      const allowed = await authorizeHostPortalAccount({
        uid: user.id,
        provider: "supabase",
        appMeta: (user.app_metadata || {}) as Record<string, unknown>,
        userMeta: (user.user_metadata || {}) as Record<string, unknown>,
        hasSignedHostCookie: signedHostCookie?.sub === user.id,
        allowEnrollment: false,
      });
      if (allowed) {
        const rawPhone =
          user.phone ||
          (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null);
        const phone = rawPhone
          ? normalizeSaudiPhone(rawPhone) || normalizePhoneInput(rawPhone)
          : null;
        return {
          id: user.id,
          phone,
          isPhoneVerified: Boolean(user.phone_confirmed_at || phone),
          email: user.email || null,
          name:
            (typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : null) || null,
          role: "host",
          provider: "supabase",
        };
      }
    }
  } catch {}

  // 3. Check signed HttpOnly host portal session cookie
  if (signedHostCookie) {
    return {
      id: signedHostCookie.sub,
      phone: signedHostCookie.phone,
      isPhoneVerified: Boolean(signedHostCookie.phone),
      email: signedHostCookie.email,
      name: signedHostCookie.name,
      role: "host",
      provider: signedHostCookie.provider === "firebase" ? "firebase" : "supabase",
    };
  }

  // 4. Local development fallback strictly when NOT in production
  if (process.env.NODE_ENV !== "production") {
    const devHostId =
      process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002";
    const devHeader = request.headers.get("x-dev-host-id");
    const devCookieFlag = parseCookieValue(cookieHeader, "qafnest_host_dev");
    if (
      bearer === "dev_host_token" ||
      bearer === devHostId ||
      devHeader === devHostId ||
      devCookieFlag === "1" ||
      hostSessionCookie === "dev_host_token"
    ) {
      return {
        id: devHostId,
        phone: process.env.NEXT_PUBLIC_DEV_HOST_PHONE || "",
        isPhoneVerified: Boolean(process.env.NEXT_PUBLIC_DEV_HOST_PHONE),
        email: process.env.NEXT_PUBLIC_DEV_HOST_EMAIL || "host.dev@qafnest.com",
        name: process.env.NEXT_PUBLIC_DEV_HOST_NAME || "Dev Host",
        role: "host",
        provider: "supabase",
      };
    }
  }

  return null;
}
