import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { normalizeSaudiPhone, normalizePhoneInput } from "@qafnest/shared/phone";

export interface VerifiedGuestUser {
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

export async function verifyFirebaseIdToken(token: string): Promise<VerifiedGuestUser | null> {
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

    const expectedProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (expectedProjectId) {
      if (payload.aud !== expectedProjectId) return null;
      if (payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) return null;
    } else {
      if (!payload.iss?.startsWith("https://securetoken.google.com/")) return null;
    }

    if (!payload.sub || typeof payload.sub !== "string") return null;

    const rawPhone = typeof payload.phone_number === "string" && payload.phone_number.trim()
      ? payload.phone_number.trim()
      : null;
    const phone = rawPhone ? (normalizeSaudiPhone(rawPhone) || normalizePhoneInput(rawPhone)) : null;

    return {
      id: payload.sub,
      phone,
      isPhoneVerified: Boolean(phone),
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
      role: "guest",
      provider: "firebase",
    };
  } catch (err) {
    console.warn("Exception during Firebase ID token verification:", err);
    return null;
  }
}

export async function verifyGuestSession(request: Request): Promise<VerifiedGuestUser | null> {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (bearer) {
    const fbUser = await verifyFirebaseIdToken(bearer);
    if (fbUser) return fbUser;

    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser(bearer);
      if (!error && user) {
        const isHost = user.user_metadata?.role === "host" || user.id === "00000000-0000-0000-0000-000000000002";
        if (!isHost) {
          let rawPhone = user.phone || (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null);
          let rawName = (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) || null;

          if (!rawPhone || !rawName) {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("phone, full_name")
                .eq("id", user.id)
                .maybeSingle();
              if (profile) {
                if (!rawPhone && profile.phone) rawPhone = profile.phone;
                if (!rawName && profile.full_name) rawName = profile.full_name;
              }
            } catch {}
          }

          const phone = rawPhone ? (normalizeSaudiPhone(rawPhone) || normalizePhoneInput(rawPhone)) : null;
          return {
            id: user.id,
            phone,
            isPhoneVerified: Boolean(user.phone_confirmed_at || phone),
            email: user.email || null,
            name: rawName,
            role: "guest",
            provider: "supabase",
          };
        }
      }
    } catch {}
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      const isHost = user.user_metadata?.role === "host" || user.id === "00000000-0000-0000-0000-000000000002";
      if (!isHost) {
        let rawPhone = user.phone || (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null);
        let rawName = (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) || null;

        if (!rawPhone || !rawName) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("phone, full_name")
              .eq("id", user.id)
              .maybeSingle();
            if (profile) {
              if (!rawPhone && profile.phone) rawPhone = profile.phone;
              if (!rawName && profile.full_name) rawName = profile.full_name;
            }
          } catch {}
        }

        const phone = rawPhone ? (normalizeSaudiPhone(rawPhone) || normalizePhoneInput(rawPhone)) : null;
        return {
          id: user.id,
          phone,
          isPhoneVerified: Boolean(user.phone_confirmed_at || phone),
          email: user.email || null,
          name: rawName,
          role: "guest",
          provider: "supabase",
        };
      }
    }
  } catch {}

  if (process.env.NODE_ENV !== "production") {
    const cookieHeader = request.headers.get("cookie") || "";
    if (cookieHeader.includes("qafnest_has_session=dev_guest_token")) {
      const devGuestId = process.env.NEXT_PUBLIC_DEV_GUEST_ID || "00000000-0000-0000-0000-000000000001";
      return {
        id: devGuestId,
        phone: process.env.NEXT_PUBLIC_DEV_GUEST_PHONE || "+966552538488",
        isPhoneVerified: true,
        email: process.env.NEXT_PUBLIC_DEV_GUEST_EMAIL || "guest.dev@qafnest.com",
        name: process.env.NEXT_PUBLIC_DEV_GUEST_NAME || "Dev Guest User",
        role: "guest",
        provider: "supabase",
      };
    }
  }

  return null;
}
