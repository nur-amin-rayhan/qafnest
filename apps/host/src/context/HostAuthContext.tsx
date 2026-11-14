"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import {
  HostProfile,
  HOST_CACHE_KEY,
  HOST_COOKIE_KEY,
  setHostSessionCookie,
  getCachedHostAuth,
  setCachedHostAuth,
  mapFirebaseHostUser,
  buildFallbackHostProfile,
  mapDbHostProfile,
  HostAuthContextType,
} from "./auth/hostAuthStorage";
import { useHostLanguage } from "./auth/useHostLanguage";

export type { HostProfile, HostAuthContextType };
export { HOST_COOKIE_KEY, setHostSessionCookie };

const HostAuthContext = createContext<HostAuthContextType | undefined>(undefined);

export function HostAuthProvider({
  children,
  initialLang = "ar",
}: {
  children: React.ReactNode;
  initialLang?: "ar" | "en";
}) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasSupabaseSessionRef = useRef(false);

  // Localization State
  const { lang, applyLang, toggleLang, t } = useHostLanguage(initialLang);

  // Modal State
  const [hostAuthModalOpen, setHostAuthModalOpen] = useState(false);
  const [hostAuthMode, setHostAuthMode] = useState<"signin" | "signup">("signin");
  const [hostReturnUrl, setHostReturnUrl] = useState("/app");

  const openHostAuthModal = useCallback((mode: "signin" | "signup" = "signin", returnUrl: string = "/app") => {
    setHostAuthMode(mode);
    setHostReturnUrl(returnUrl);
    setHostAuthModalOpen(true);
  }, []);

  const closeHostAuthModal = useCallback(() => {
    setHostAuthModalOpen(false);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("auth") || url.searchParams.has("returnUrl")) {
          url.searchParams.delete("auth");
          url.searchParams.delete("returnUrl");
          const cleanUrl = url.pathname + (url.search ? url.search : "");
          window.history.replaceState(null, "", cleanUrl);
        }
      } catch {}
    }
  }, []);

  const updateUserAndProfile = useCallback((newUser: User | null, newProfile: HostProfile | null) => {
    setUser(newUser);
    setProfile(newProfile);
    if (newUser) {
      setCachedHostAuth({
        user: newUser,
        profile: newProfile || buildFallbackHostProfile(newUser),
      });
    } else {
      setCachedHostAuth(null);
    }
  }, []);

  const setHostUser = useCallback((newUser: User, newProfile?: HostProfile | null) => {
    const prof = newProfile || buildFallbackHostProfile(newUser);
    setUser(newUser);
    setProfile(prof);
    setLoading(false);
    setCachedHostAuth({ user: newUser, profile: prof });
    setHostSessionCookie(true);
  }, []);

  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null, isMounted?: () => boolean) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_url")
        .eq("id", userId)
        .single();

      if (isMounted && !isMounted()) return;

      if (error || !data) {
        updateUserAndProfile(currentUser || null, currentUser ? buildFallbackHostProfile(currentUser) : null);
        return;
      }

      updateUserAndProfile(currentUser || null, mapDbHostProfile(data));
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
          const mapped = mapFirebaseHostUser(fbAuth.currentUser);
          setSession(null);
          updateUserAndProfile(mapped.user, mapped.profile);
          return true;
        }
      } catch {}
      return false;
    };

    const devHostId = process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002";

    const isCurrentDevHost = () => {
      if (typeof window === "undefined") return false;
      const cached = getCachedHostAuth();
      if (cached?.user?.id === devHostId || cached?.user?.email === "host.dev@qafnest.com") return true;
      if (typeof document !== "undefined" && document.cookie.includes("qafnest_host_dev=1")) return true;
      return false;
    };

    const initializeAuth = async () => {
      try {
        const cachedAuth = getCachedHostAuth();
        if (cachedAuth?.user && mounted) {
          updateUserAndProfile(cachedAuth.user, cachedAuth.profile);
          setLoading(false);
        }

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error || !initialSession?.user) {
          if (!syncFirebaseUser() && !cachedAuth?.user && !isCurrentDevHost()) {
            updateUserAndProfile(null, null);
          }
          setLoading(false);
          return;
        }

        // Strictly enforce host portal decoupling: reject guest sessions
        const isGuest = initialSession.user.user_metadata?.role === "guest" || initialSession.user.id === "00000000-0000-0000-0000-000000000001";
        if (isGuest) {
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
        const cachedAuth = getCachedHostAuth();
        if (mounted && !syncFirebaseUser() && !cachedAuth?.user && !isCurrentDevHost()) {
          updateUserAndProfile(null, null);
        }
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
            void fbUser.getIdToken().then((token) => setHostSessionCookie(token));
            const mapped = mapFirebaseHostUser(fbUser);
            setSession(null);
            updateUserAndProfile(mapped.user, mapped.profile);
          } else if (!hasSupabaseSessionRef.current && !isCurrentDevHost()) {
            const cached = getCachedHostAuth();
            if (!cached?.user) {
              setHostSessionCookie(false);
              setSession(null);
              updateUserAndProfile(null, null);
            }
          }
          setLoading(false);
        });
      } catch (err) {
        console.warn("Host Firebase Auth listener notice:", err);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        if (newSession?.user) {
          // Reject guest accounts on host platform
          const isGuest = newSession.user.user_metadata?.role === "guest" || newSession.user.id === "00000000-0000-0000-0000-000000000001";
          if (isGuest) {
            await supabase.auth.signOut().catch(() => {});
            updateUserAndProfile(null, null);
            setLoading(false);
            return;
          }
          hasSupabaseSessionRef.current = true;
          setSession(newSession);
          updateUserAndProfile(newSession.user, null);
          await fetchProfile(newSession.user.id, newSession.user, () => mounted);
        } else if (!syncFirebaseUser() && !isCurrentDevHost()) {
          const cached = getCachedHostAuth();
          if (!cached?.user) {
            hasSupabaseSessionRef.current = false;
            setSession(null);
            updateUserAndProfile(null, null);
          }
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
    setHostAuthModalOpen(false);
    hasSupabaseSessionRef.current = false;
    updateUserAndProfile(null, null);
    setSession(null);
    setHostSessionCookie(false);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(HOST_CACHE_KEY);
        window.sessionStorage.setItem("qafnest_host_is_logging_out", "1");
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

  return (
    <HostAuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isHost: true,
        hostAuthModalOpen,
        hostAuthMode,
        hostReturnUrl,
        openHostAuthModal,
        closeHostAuthModal,
        setHostUser,
        signOut,
        refreshProfile,
        lang,
        setLang: applyLang,
        toggleLang,
        t,
      }}
    >
      {children}
    </HostAuthContext.Provider>
  );
}

export function useHostAuth() {
  const context = useContext(HostAuthContext);
  if (!context) {
    throw new Error("useHostAuth must be used within a HostAuthProvider");
  }
  return context;
}
