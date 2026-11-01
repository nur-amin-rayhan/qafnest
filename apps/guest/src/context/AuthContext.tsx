"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
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
  role?: UserRole;
}

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseUser(fbUser: FirebaseUser): { user: User; profile: Profile } {
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
    role: "guest",
  };

  return { user: mappedUser, profile: mappedProfile };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasSupabaseSessionRef = useRef(false);

  // Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const openAuthModal = (mode: "signin" | "signup" = "signin") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);

  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null, isMounted?: () => boolean) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url")
        .eq("id", userId)
        .single();

      if (isMounted && !isMounted()) return;

      if (error) {
        console.warn("Profile fetch note:", error.message);
        const metadataName = typeof currentUser?.user_metadata?.full_name === "string"
          ? currentUser.user_metadata.full_name
          : [currentUser?.user_metadata?.first_name, currentUser?.user_metadata?.last_name].filter(Boolean).join(" ");
        setProfile({
          id: userId,
          full_name: metadataName || null,
          phone: currentUser?.phone || currentUser?.user_metadata?.phone || null,
          avatar_url: null,
          role: "guest",
        });
      } else if (data) {
        setProfile({
          ...data,
          role: "guest",
        } as Profile);
      }
    } catch (err) {
      console.error("Error in fetchProfile:", err);
    }
  }, [supabase]);

  const refreshProfile = async (userId?: string) => {
    if (!hasSupabaseSessionRef.current && isFirebaseConfigured()) {
      try {
        const fbAuth = getFirebaseAuth();
        if (fbAuth.currentUser) {
          const mapped = mapFirebaseUser(fbAuth.currentUser);
          setUser(mapped.user);
          setProfile(mapped.profile);
          return;
        }
      } catch {}
    }

    const profileUserId = userId || user?.id;
    if (profileUserId) {
      await fetchProfile(profileUserId, userId ? undefined : user);
    }
  };

  useEffect(() => {
    let mounted = true;
    let unsubscribeFirebase: (() => void) | undefined;

    try {
      localStorage.removeItem("qafnest_auth_user");
    } catch {}

    const syncFirebaseUser = () => {
      if (!isFirebaseConfigured()) return false;
      try {
        const fbAuth = getFirebaseAuth();
        if (fbAuth.currentUser) {
          const mapped = mapFirebaseUser(fbAuth.currentUser);
          setSession(null);
          setUser(mapped.user);
          setProfile(mapped.profile);
          return true;
        }
      } catch {}
      return false;
    };

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (initialSession) {
          hasSupabaseSessionRef.current = true;
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id, initialSession.user, () => mounted);
        } else {
          hasSupabaseSessionRef.current = false;
          if (!syncFirebaseUser()) {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.error("Auth init exception:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    if (isFirebaseConfigured()) {
      try {
        const fbAuth = getFirebaseAuth();
        unsubscribeFirebase = onAuthStateChanged(fbAuth, (fbUser) => {
          if (!mounted || hasSupabaseSessionRef.current) return;
          if (fbUser) {
            const mapped = mapFirebaseUser(fbUser);
            setSession(null);
            setUser(mapped.user);
            setProfile(mapped.profile);
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        });
      } catch (err) {
        console.warn("Firebase Auth listener warning:", err);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        hasSupabaseSessionRef.current = Boolean(newSession);
        setSession(newSession);

        if (newSession?.user) {
          setUser(newSession.user);
          await fetchProfile(newSession.user.id, newSession.user, () => mounted);
        } else if (!syncFirebaseUser()) {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      unsubscribeFirebase?.();
    };
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    if (isFirebaseConfigured()) {
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {}
    }
    hasSupabaseSessionRef.current = false;
    setUser(null);
    setSession(null);
    setProfile(null);
    try {
      localStorage.removeItem("qafnest_auth_user");
    } catch {}
  };

  const role: UserRole = "guest";
  const isHost = false;
  const isAdmin = false;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        role,
        isHost,
        isAdmin,
        authModalOpen,
        authMode,
        signupRole: "guest",
        openAuthModal,
        closeAuthModal,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
