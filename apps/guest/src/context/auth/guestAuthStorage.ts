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

export function syncSessionCookie(tokenOrActive?: string | boolean | null) {
  if (typeof document === "undefined") return;
  try {
    if (typeof tokenOrActive === "string" && tokenOrActive.length > 20) {
      document.cookie = `${SESSION_COOKIE_KEY}=${tokenOrActive}; path=/; max-age=3600; SameSite=Lax`;
    } else if (tokenOrActive === true) {
      if (isFirebaseConfigured()) {
        const fbUser = getFirebaseAuth().currentUser;
        if (fbUser) {
          void fbUser.getIdToken().then((token) => {
            document.cookie = `${SESSION_COOKIE_KEY}=${token}; path=/; max-age=3600; SameSite=Lax`;
          });
        }
      }
    } else {
      document.cookie = `${SESSION_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `qafnest_verified_guest=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  } catch {}
}

export function getCachedAuth(): { user: User; profile: Profile } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) {
      syncSessionCookie(false);
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed?.user) {
      syncSessionCookie(true);
      return parsed;
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
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
      syncSessionCookie(true);
    } else {
      localStorage.removeItem(SESSION_CACHE_KEY);
      syncSessionCookie(false);
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
      national_id: stored?.national_id || null,
      iqama: stored?.iqama || null,
      id_type: stored?.id_type || null,
      is_verified: stored?.is_verified ?? false,
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
    national_id: stored?.national_id || null,
    iqama: stored?.iqama || null,
    id_type: stored?.id_type || null,
    is_verified: stored?.is_verified ?? false,
    contact_email: contactEmail || null,
    city: stored?.city || null,
    role: "guest",
  };

  return { user: mappedUser, profile: mappedProfile };
}

export function buildFallbackGuestProfile(user: User): Profile {
  const meta = user.user_metadata;
  const name = typeof meta?.full_name === "string" ? meta.full_name : [meta?.first_name, meta?.last_name].filter(Boolean).join(" ");
  return {
    id: user.id,
    full_name: name || null,
    phone: user.phone || (typeof meta?.phone === "string" ? meta.phone : null),
    avatar_url: null,
    national_id: meta?.national_id || null,
    iqama: meta?.iqama || null,
    id_type: meta?.id_type || null,
    is_verified: meta?.is_verified ?? false,
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

