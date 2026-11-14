"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import { claimWelcomeBonus } from "@/lib/auth/deviceFingerprint";
import {
  SESSION_CACHE_KEY,
  SESSION_COOKIE_KEY,
  syncSessionCookie,
  getCachedAuth,
  setCachedAuth,
  mapFirebaseUser,
  buildFallbackGuestProfile,
  mapDbGuestProfile,
  Profile,
  UserRole,
  AuthContextType,
} from "./auth/guestAuthStorage";

export type { Profile, UserRole };
export { SESSION_COOKIE_KEY, syncSessionCookie };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasSupabaseSessionRef = useRef(false);
  const claimedWelcomeUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    if (claimedWelcomeUserRef.current === user.id) return;
    claimedWelcomeUserRef.current = user.id;
    void claimWelcomeBonus({ accessToken: session?.access_token || null });
  }, [user?.id, session?.access_token]);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const openAuthModal = useCallback((mode: "signin" | "signup" = "signin") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const updateUserAndProfile = useCallback((newUser: User | null, newProfile: Profile | null) => {
    setUser(newUser);
    setProfile(newProfile);
    if (newUser) {
      setCachedAuth({
        user: newUser,
        profile: newProfile || buildFallbackGuestProfile(newUser),
      });
    } else {
      setCachedAuth(null);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null, isMounted?: () => boolean) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url, national_id")
        .eq("id", userId)
        .single();

      if (isMounted && !isMounted()) return;

      if (error || !data) {
        updateUserAndProfile(currentUser || null, currentUser ? buildFallbackGuestProfile(currentUser) : null);
        return;
      }

      const meta = (currentUser?.user_metadata || {}) as Record<string, unknown>;
      const resolvedIdType =
        meta.id_type === "national_id" || meta.id_type === "iqama" ? meta.id_type : null;
      updateUserAndProfile(
        currentUser || null,
        mapDbGuestProfile(
          {
            ...data,
            iqama: typeof meta.iqama === "string" ? meta.iqama : null,
            id_type: resolvedIdType,
            is_verified: typeof meta.is_verified === "boolean" ? meta.is_verified : undefined,
            city: typeof meta.city === "string" ? meta.city : null,
          },
          currentUser
        )
      );
    } catch {
      if (isMounted && !isMounted()) return;
      updateUserAndProfile(currentUser || null, null);
    }
  }, [supabase, updateUserAndProfile]);

  const refreshProfile = useCallback(async (userId?: string) => {
    const id = userId || user?.id;
    if (id) await fetchProfile(id, user);
  }, [fetchProfile, user]);

  useEffect(() => {
    let mounted = true;
    let unsubscribeFirebase: (() => void) | undefined;

    const syncFirebaseUser = () => {
      if (!isFirebaseConfigured()) return false;
      try {
        const fbAuth = getFirebaseAuth();
        if (fbAuth.currentUser) {
          const mapped = mapFirebaseUser(fbAuth.currentUser);
          setSession(null);
          updateUserAndProfile(mapped.user, mapped.profile);
          return true;
        }
      } catch {}
      return false;
    };

    const initializeAuth = async () => {
      try {
        const cachedAuth = getCachedAuth();
        if (cachedAuth?.user && mounted) {
          updateUserAndProfile(cachedAuth.user, cachedAuth.profile);
          setLoading(false);
        }

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error || !initialSession?.user) {
          if (!syncFirebaseUser() && !cachedAuth?.user) updateUserAndProfile(null, null);
          setLoading(false);
          return;
        }

        // Strictly enforce guest portal decoupling: reject pure host sessions
        const isHost = initialSession.user.user_metadata?.role === "host" || initialSession.user.id === "00000000-0000-0000-0000-000000000002";
        if (isHost) {
          await supabase.auth.signOut().catch(() => {});
          updateUserAndProfile(null, null);
          setLoading(false);
          return;
        }

        hasSupabaseSessionRef.current = true;
        setSession(initialSession);
        updateUserAndProfile(initialSession.user, null);
        await fetchProfile(initialSession.user.id, initialSession.user, () => mounted);
      } catch {
        const cachedAuth = getCachedAuth();
        if (mounted && !syncFirebaseUser() && !cachedAuth?.user) updateUserAndProfile(null, null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initializeAuth();

    if (isFirebaseConfigured()) {
      try {
        const fbAuth = getFirebaseAuth();
        unsubscribeFirebase = onAuthStateChanged(fbAuth, (fbUser) => {
          if (!mounted || hasSupabaseSessionRef.current) return;
          if (fbUser) {
            void fbUser.getIdToken().then((token) => syncSessionCookie(token));
            const mapped = mapFirebaseUser(fbUser);
            setSession(null);
            updateUserAndProfile(mapped.user, mapped.profile);
          } else if (!hasSupabaseSessionRef.current) {
            syncSessionCookie(false);
            setSession(null);
            updateUserAndProfile(null, null);
          }
          setLoading(false);
        });
      } catch (err) {
        console.warn("Firebase Auth listener notice:", err);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        if (newSession?.user) {
          const isHost = newSession.user.user_metadata?.role === "host" || newSession.user.id === "00000000-0000-0000-0000-000000000002";
          if (isHost) {
            await supabase.auth.signOut().catch(() => {});
            updateUserAndProfile(null, null);
            setLoading(false);
            return;
          }
          hasSupabaseSessionRef.current = true;
          setSession(newSession);
          updateUserAndProfile(newSession.user, null);
          await fetchProfile(newSession.user.id, newSession.user, () => mounted);
        } else if (!syncFirebaseUser()) {
          hasSupabaseSessionRef.current = false;
          setSession(null);
          updateUserAndProfile(null, null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      unsubscribeFirebase?.();
    };
  }, [supabase, fetchProfile, updateUserAndProfile]);

  const signOut = async () => {
    setAuthModalOpen(false);
    hasSupabaseSessionRef.current = false;
    updateUserAndProfile(null, null);
    setSession(null);
    syncSessionCookie(false);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(SESSION_CACHE_KEY);
        window.sessionStorage.setItem("qafnest_is_logging_out", "1");
      } catch {}
      window.location.replace("/");
    }

    try {
      void supabase.auth.signOut().catch(() => {});
    } catch {}
    if (isFirebaseConfigured()) {
      try {
        void firebaseSignOut(getFirebaseAuth()).catch(() => {});
      } catch {}
    }
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
