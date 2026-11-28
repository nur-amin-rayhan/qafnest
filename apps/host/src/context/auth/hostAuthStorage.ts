"use client";

import type { User, Session } from "@supabase/supabase-js";
import type { User as FirebaseUser } from "firebase/auth";
import {
  getFirebaseAuth,
  getStoredFirebaseProfile,
  isFirebaseConfigured,
} from "@/lib/firebase/client";

export interface HostProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "host";
}

export interface HostAuthContextType {
  user: User | null;
  session: Session | null;
  profile: HostProfile | null;
  loading: boolean;
  isHost: boolean;
  hostAuthModalOpen: boolean;
  hostAuthMode: "signin" | "signup";
  hostReturnUrl: string;
  openHostAuthModal: (mode?: "signin" | "signup", returnUrl?: string) => void;
  closeHostAuthModal: () => void;
  setHostUser: (newUser: User, newProfile?: HostProfile | null) => void;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
  lang: "ar" | "en";
  setLang: (lang: "ar" | "en") => void;
  toggleLang: () => void;
  t: (en: string, ar: string) => string;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

export const HOST_CACHE_KEY = "qafnest_cached_host_auth";
export const HOST_COOKIE_KEY = "qafnest_has_host_session";

function clearLegacyHostCookies() {
  if (typeof document === "undefined") return;
  document.cookie = `${HOST_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `qafnest_host_dev=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export async function setHostSessionCookie(tokenOrActive: string | boolean): Promise<void> {
  if (typeof document === "undefined") return;
  try {
    const devHostId = process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002";
    const isDevMode = process.env.NODE_ENV !== "production";

    if (typeof tokenOrActive === "string" && tokenOrActive.length > 0) {
      if (isDevMode && tokenOrActive === "dev_host_token") {
        // Dev login already receives HttpOnly cookies from /api/host/auth/dev-login
        return;
      }
      await fetch("/api/host/auth/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenOrActive}` },
        credentials: "same-origin",
      }).catch(() => {});
    } else if (tokenOrActive === true) {
      if (isFirebaseConfigured()) {
        const fbUser = getFirebaseAuth().currentUser;
        if (fbUser) {
          const token = await fbUser.getIdToken().catch(() => null);
          if (token) {
            await fetch("/api/host/auth/session", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              credentials: "same-origin",
            }).catch(() => {});
          }
          return;
        }
      }
      if (isDevMode && typeof window !== "undefined") {
        const raw = localStorage.getItem(HOST_CACHE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.user?.id === devHostId) {
              return;
            }
          } catch {}
        }
      }
      await fetch("/api/host/auth/session", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => {});
    } else {
      clearLegacyHostCookies();
      await fetch("/api/host/auth/session", {
        method: "DELETE",
        credentials: "same-origin",
      }).catch(() => {});
    }
  } catch {}
}

export function getCachedHostAuth(): { user: User; profile: HostProfile } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(HOST_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed?.user) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedHostAuth(data: { user: User; profile: HostProfile } | null) {
  if (typeof window === "undefined") return;
  try {
    const devHostId = process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002";
    if (data) {
      localStorage.setItem(HOST_CACHE_KEY, JSON.stringify(data));
      if (process.env.NODE_ENV !== "production" && data.user?.id === devHostId) {
        return;
      }
      void setHostSessionCookie(true);
    } else {
      localStorage.removeItem(HOST_CACHE_KEY);
      void setHostSessionCookie(false);
    }
  } catch {}
}

export function mapFirebaseHostUser(fbUser: FirebaseUser): { user: User; profile: HostProfile } {
  const stored = getStoredFirebaseProfile(fbUser.uid);
  const displayName = stored?.full_name || fbUser.displayName || "";
  const nameParts = displayName.trim().split(/\s+/).filter(Boolean);
  const firstName = stored?.first_name || nameParts[0] || "";
  const lastName = stored?.last_name || nameParts.slice(1).join(" ") || "";
  const contactEmail = stored?.contact_email || fbUser.email || "";
  const phone = fbUser.phoneNumber || stored?.phone || "";
  const confirmedAt = fbUser.metadata.lastSignInTime || new Date().toISOString();

  const mappedUser: User = {
    id: fbUser.uid,
    app_metadata: { provider: "firebase_phone" },
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      full_name: displayName || null,
      contact_email: contactEmail || null,
      phone: phone || null,
      role: "host",
    },
    aud: "authenticated",
    created_at: fbUser.metadata.creationTime || confirmedAt,
    phone: phone || undefined,
    phone_confirmed_at: confirmedAt,
    email: contactEmail || undefined,
  };

  const mappedProfile: HostProfile = {
    id: fbUser.uid,
    full_name: displayName || null,
    phone: phone || null,
    avatar_url: fbUser.photoURL || null,
    role: "host",
  };

  return { user: mappedUser, profile: mappedProfile };
}

export function buildFallbackHostProfile(user: User): HostProfile {
  const meta = user.user_metadata;
  const name = typeof meta?.full_name === "string" ? meta.full_name : [meta?.first_name, meta?.last_name].filter(Boolean).join(" ");
  return {
    id: user.id,
    full_name: name || null,
    phone: user.phone || (typeof meta?.phone === "string" ? meta.phone : null),
    avatar_url: null,
    role: "host",
  };
}

export function mapDbHostProfile(data: {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}): HostProfile {
  return {
    id: data.id,
    full_name: data.full_name,
    phone: data.phone,
    avatar_url: data.avatar_url,
    role: "host",
  };
}

