"use client";

import type { User, Session } from "@supabase/supabase-js";
import type { User as FirebaseUser } from "firebase/auth";
import {
  getFirebaseAuth,
  getStoredFirebaseProfile,
  isFirebaseConfigured,
} from "@/lib/firebase/client";

export type UserRole = "guest" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  national_id?: string | null;
  iqama?: string | null;
  id_type?: "national_id" | "iqama" | null;
  is_verified?: boolean;
  contact_email?: string | null;
  city?: string | null;
  role?: UserRole;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  role: UserRole;
  isHost: boolean;
  isAdmin: boolean;
  authModalOpen: boolean;
  authMode: "signin" | "signup";
  signupRole: "guest";
  openAuthModal: (mode?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
}

export const SESSION_CACHE_KEY = "qafnest_cached_guest_auth";
export const SESSION_COOKIE_KEY = "qafnest_has_session";

function clearLegacyClientSessionCookies() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `qafnest_verified_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export async function syncSessionCookie(tokenOrActive?: string | boolean | null): Promise<void> {
  if (typeof document === "undefined") return;
  try {
    if (typeof tokenOrActive === "string") {
      if (process.env.NODE_ENV !== "production" && tokenOrActive === "dev_guest_token") {
        // Dev login already receives an HttpOnly cookie from /api/auth/dev-login
        return;
      }
      if (tokenOrActive.length > 20) {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { Authorization: `Bearer ${tokenOrActive}` },
          credentials: "same-origin",
        }).catch(() => {});
      }
    } else if (tokenOrActive === true) {
      if (isFirebaseConfigured()) {
        const fbUser = getFirebaseAuth().currentUser;
        if (fbUser) {
          const token = await fbUser.getIdToken().catch(() => null);
          if (token) {
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              credentials: "same-origin",
            }).catch(() => {});
          }
          return;
        }
      }
      await fetch("/api/auth/session", {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => {});
    } else {
      clearLegacyClientSessionCookies();
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "same-origin",
      }).catch(() => {});
    }
  } catch {}
}

function sanitizeCachedGuestAuth(data: { user: User; profile: Profile }): { user: User; profile: Profile } {
  const safeUserMeta = {
    ...(data.user.user_metadata || {}),
    national_id: null,
    iqama: null,
  };
  return {
    user: {
      ...data.user,
      user_metadata: safeUserMeta,
    },
    profile: {
      ...data.profile,
      national_id: null,
      iqama: null,
    },
  };
}

export function getCachedAuth(): { user: User; profile: Profile } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed?.user) {
      // Purge any legacy national_id / iqama previously cached in localStorage
      if (
        parsed.profile?.national_id ||
        parsed.profile?.iqama ||
        parsed.user?.user_metadata?.national_id ||
        parsed.user?.user_metadata?.iqama
      ) {
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sanitizeCachedGuestAuth(parsed)));
      }
      return sanitizeCachedGuestAuth(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedAuth(data: { user: User; profile: Profile } | null) {
  if (typeof window === "undefined") return;
  try {
    if (data) {
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(sanitizeCachedGuestAuth(data)));
    } else {
      localStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch {}
}

export function mapFirebaseUser(fbUser: FirebaseUser): { user: User; profile: Profile } {
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
      id_type: stored?.id_type || null,
      city: stored?.city || null,
    },
    aud: "authenticated",
    created_at: fbUser.metadata.creationTime || confirmedAt,
    phone: phone || undefined,
    phone_confirmed_at: confirmedAt,
    email: contactEmail || undefined,
  };

  const mappedProfile: Profile = {
    id: fbUser.uid,
    full_name: displayName || null,
    phone: phone || null,
    avatar_url: fbUser.photoURL || null,
    id_type: stored?.id_type || null,
    is_verified: false,
    contact_email: contactEmail || null,
    city: stored?.city || null,
    role: "guest",
  };

  return { user: mappedUser, profile: mappedProfile };
}

export function buildFallbackGuestProfile(user: User): Profile {
  const meta = user.user_metadata;
  const appMeta = (user as { app_metadata?: Record<string, unknown> }).app_metadata || {};
  const name = typeof meta?.full_name === "string" ? meta.full_name : [meta?.first_name, meta?.last_name].filter(Boolean).join(" ");
  return {
    id: user.id,
    full_name: name || null,
    phone: user.phone || (typeof meta?.phone === "string" ? meta.phone : null),
    avatar_url: null,
    national_id: null,
    iqama: null,
    id_type: meta?.id_type || null,
    is_verified: Boolean(appMeta.is_verified),
    contact_email: meta?.contact_email || user.email || null,
    city: meta?.city || null,
    role: "guest",
  };
}

export function mapDbGuestProfile(
  data: {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    national_id?: string | null;
    iqama?: string | null;
    id_type?: "national_id" | "iqama" | null;
    is_verified?: boolean;
    city?: string | null;
  },
  currentUser?: User | null
): Profile {
  return {
    id: data.id,
    full_name: data.full_name,
    phone: data.phone,
    avatar_url: data.avatar_url,
    national_id: data.national_id,
    iqama: data.iqama,
    id_type: data.id_type,
    is_verified: data.is_verified,
    contact_email: currentUser?.user_metadata?.contact_email || currentUser?.email || null,
    city: data.city,
    role: "guest",
  };
}

