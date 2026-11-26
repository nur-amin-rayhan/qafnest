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
import { getGuestAuthorizationHeaders } from "@/lib/auth/clientAuthHeaders";
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
  const sessionRef = useRef<Session | null>(null);
  const userRef = useRef<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasSupabaseSessionRef = useRef(false);
  const claimedWelcomeUserRef = useRef<string | null>(null);
  const syncedCookieUserRef = useRef<string | null>(null);

  const updateSessionStable = useCallback((nextSession: Session | null) => {
    const prev = sessionRef.current;
    sessionRef.current = nextSession;
    if (
      prev?.access_token === nextSession?.access_token &&
      prev?.user?.id === nextSession?.user?.id
    ) {
      return;
    }
    setSession(nextSession);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    if (claimedWelcomeUserRef.current === user.id) return;
    claimedWelcomeUserRef.current = user.id;
    void claimWelcomeBonus({ accessToken: sessionRef.current?.access_token || null }).then((res) => {
      if (res.status === 401) {
        claimedWelcomeUserRef.current = null;
      }
    });
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
    userRef.current = newUser;
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

  const fetchServerProfileOverlay = useCallback(async (activeSession?: Session | null) => {
    try {
      const headers = await getGuestAuthorizationHeaders(activeSession);
      const res = await fetch("/api/profile", {
        headers,
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) return null;
      return (await res.json()) as {
        id?: string;
        full_name?: string | null;
        phone?: string | null;
        national_id?: string | null;
        iqama?: string | null;
        id_type?: "national_id" | "iqama" | null;
        city?: string | null;
        email?: string | null;
        is_verified?: boolean;
        avatar_url?: string | null;
      };
    } catch {
      return null;
    }
  }, []);

  const fetchProfile = useCallback(async (
    userId: string,
    currentUser?: User | null,
    isMounted?: () => boolean,
    activeSession?: Session | null
  ) => {
    try {
      const resolvedSession = activeSession !== undefined ? activeSession : sessionRef.current;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      const [dbRes, serverOverlay] = await Promise.all([
        isUuid
          ? supabase
              .from("profiles")
              .select("id, full_name, phone, avatar_url")
              .eq("id", userId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        fetchServerProfileOverlay(resolvedSession),
      ]);

      if (isMounted && !isMounted()) return;

      const dbData = dbRes.data;
      if (!dbData && !serverOverlay && !currentUser) {
        updateUserAndProfile(null, null);
        return;
      }

      const meta = (currentUser?.user_metadata || {}) as Record<string, unknown>;
      const resolvedIdType =
        serverOverlay?.id_type ||
        (meta.id_type === "national_id" || meta.id_type === "iqama" ? meta.id_type : null);
      const isServerVerified = Boolean(
        serverOverlay?.is_verified || currentUser?.app_metadata?.is_verified
      );
      const syncedUser: User | null = currentUser
        ? {
            ...currentUser,
            phone: serverOverlay?.phone || dbData?.phone || currentUser.phone,
            app_metadata: {
              ...(currentUser.app_metadata || {}),
              is_verified: isServerVerified,
            },
            user_metadata: {
              ...(currentUser.user_metadata || {}),
              ...(serverOverlay?.full_name ? { full_name: serverOverlay.full_name } : {}),
              ...(serverOverlay?.phone ? { phone: serverOverlay.phone } : {}),
              ...(serverOverlay?.city ? { city: serverOverlay.city } : {}),
              ...(resolvedIdType ? { id_type: resolvedIdType } : {}),
            },
          }
        : null;

      updateUserAndProfile(
        syncedUser,
        mapDbGuestProfile(
          {
            id: userId,
            full_name:
              serverOverlay?.full_name ||
              dbData?.full_name ||
              (typeof meta.full_name === "string" ? meta.full_name : null),
            phone: serverOverlay?.phone || dbData?.phone || currentUser?.phone || null,
            avatar_url: serverOverlay?.avatar_url || dbData?.avatar_url || null,
            national_id:
              serverOverlay?.national_id ||
              (typeof meta.national_id === "string" ? meta.national_id : null),
            iqama:
              serverOverlay?.iqama ||
              (typeof meta.iqama === "string" ? meta.iqama : null),
            id_type: resolvedIdType,
            is_verified: isServerVerified,
            city: serverOverlay?.city || (typeof meta.city === "string" ? meta.city : null),
          },
          syncedUser
        )
      );
    } catch {
      if (isMounted && !isMounted()) return;
      updateUserAndProfile(currentUser || null, currentUser ? buildFallbackGuestProfile(currentUser) : null);
    }
  }, [supabase, fetchServerProfileOverlay, updateUserAndProfile]);

  const refreshProfile = useCallback(async (userId?: string) => {
    const activeUser = userRef.current;
    const id = userId || activeUser?.id;
    if (id) {
      await fetchProfile(id, activeUser, undefined, sessionRef.current);
    }
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;
    let unsubscribeFirebase: (() => void) | undefined;

    const syncFirebaseUser = () => {
      if (!isFirebaseConfigured()) return false;
      try {
        const fbAuth = getFirebaseAuth();
        if (fbAuth.currentUser) {
          const mapped = mapFirebaseUser(fbAuth.currentUser);
          updateSessionStable(null);
          updateUserAndProfile(mapped.user, mapped.profile);
          return true;
        }
      } catch {}
      return false;
    };

    const isDevUserRecord = (targetUser?: User | null) =>
      process.env.NODE_ENV !== "production" &&
      Boolean(
        targetUser &&
          (targetUser.id === (process.env.NEXT_PUBLIC_DEV_GUEST_ID || "00000000-0000-0000-0000-000000000001") ||
            targetUser.app_metadata?.provider === "dev" ||
            targetUser.email === (process.env.DEV_GUEST_EMAIL || process.env.NEXT_PUBLIC_DEV_GUEST_EMAIL || "guest.dev@qafnest.com"))
      );

    const initializeAuth = async () => {
      try {
        const cachedAuth = getCachedAuth();
        if (cachedAuth?.user && mounted) {
          updateUserAndProfile(cachedAuth.user, cachedAuth.profile);
          setLoading(false);
        }

        const isDevCachedGuest = isDevUserRecord(cachedAuth?.user);

        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error || !initialSession?.user) {
          if (isDevCachedGuest && cachedAuth?.user) {
            hasSupabaseSessionRef.current = false;
            updateUserAndProfile(cachedAuth.user, cachedAuth.profile);
            await fetchProfile(cachedAuth.user.id, cachedAuth.user, () => mounted, null);
          } else if (!syncFirebaseUser()) {
            updateUserAndProfile(null, null);
          }
          setLoading(false);
          return;
        }

        // Strictly enforce guest portal decoupling: reject host sessions
        const devHostId = process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002";
        const isHost =
          initialSession.user.app_metadata?.role === "host" ||
          initialSession.user.user_metadata?.role === "host" ||
          initialSession.user.id === devHostId;
        if (isHost) {
          await supabase.auth.signOut().catch(() => {});
          updateUserAndProfile(null, null);
          setLoading(false);
          return;
        }

        hasSupabaseSessionRef.current = true;
        updateSessionStable(initialSession);
        if (syncedCookieUserRef.current !== initialSession.user.id) {
          syncedCookieUserRef.current = initialSession.user.id;
          void syncSessionCookie(true);
        }
        await fetchProfile(initialSession.user.id, initialSession.user, () => mounted, initialSession);
      } catch {
        const cachedAuth = getCachedAuth();
        const isDevCachedGuest =
          process.env.NODE_ENV !== "production" &&
          cachedAuth?.user?.id === (process.env.NEXT_PUBLIC_DEV_GUEST_ID || "00000000-0000-0000-0000-000000000001");
        if (mounted && !syncFirebaseUser() && !isDevCachedGuest) updateUserAndProfile(null, null);
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
            const mapped = mapFirebaseUser(fbUser);
            updateSessionStable(null);
            updateUserAndProfile(mapped.user, mapped.profile);
            void fbUser.getIdToken().then(async (token) => {
              if (syncedCookieUserRef.current !== fbUser.uid) {
                syncedCookieUserRef.current = fbUser.uid;
                await syncSessionCookie(token);
              }
              await fetchProfile(fbUser.uid, mapped.user, () => mounted, null);
              const bonusRes = await claimWelcomeBonus({ accessToken: token });
              if (!bonusRes.status || bonusRes.status !== 401) {
                claimedWelcomeUserRef.current = fbUser.uid;
              }
            });
          } else if (!hasSupabaseSessionRef.current) {
            const cached = getCachedAuth();
            const isDevUser = isDevUserRecord(userRef.current) || isDevUserRecord(cached?.user);
            if (isDevUser) {
              setLoading(false);
              return;
            }
            if (syncedCookieUserRef.current !== null) {
              syncedCookieUserRef.current = null;
              void syncSessionCookie(false);
            }
            updateSessionStable(null);
            updateUserAndProfile(null, null);
          }
          setLoading(false);
        });
      } catch (err) {
        console.warn("Firebase Auth listener notice:", err);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted || event === "INITIAL_SESSION") return;
        if (newSession?.user) {
          const devHostId = process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002";
          const isHost =
            newSession.user.app_metadata?.role === "host" ||
            newSession.user.user_metadata?.role === "host" ||
            newSession.user.id === devHostId;
          if (isHost) {
            await supabase.auth.signOut().catch(() => {});
            updateSessionStable(null);
            updateUserAndProfile(null, null);
            setLoading(false);
            return;
          }
          hasSupabaseSessionRef.current = true;
          updateSessionStable(newSession);
          if (syncedCookieUserRef.current !== newSession.user.id) {
            syncedCookieUserRef.current = newSession.user.id;
            void syncSessionCookie(true);
          }
          await fetchProfile(newSession.user.id, newSession.user, () => mounted, newSession);
        } else if (!syncFirebaseUser()) {
          const cached = getCachedAuth();
          const isDevUser = isDevUserRecord(userRef.current) || isDevUserRecord(cached?.user);
          if (isDevUser) {
            setLoading(false);
            return;
          }
          hasSupabaseSessionRef.current = false;
          if (syncedCookieUserRef.current !== null) {
            syncedCookieUserRef.current = null;
            void syncSessionCookie(false);
          }
          updateSessionStable(null);
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
  }, [supabase, fetchProfile, updateUserAndProfile, updateSessionStable]);

  const signOut = async () => {
    setAuthModalOpen(false);
    hasSupabaseSessionRef.current = false;
    syncedCookieUserRef.current = null;
    updateUserAndProfile(null, null);
    updateSessionStable(null);

    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(SESSION_CACHE_KEY);
        window.sessionStorage.setItem("qafnest_is_logging_out", "1");
      } catch {}
    }

    const signOutTasks: Promise<unknown>[] = [syncSessionCookie(false)];
    try {
      signOutTasks.push(supabase.auth.signOut().catch(() => {}));
    } catch {}
    if (isFirebaseConfigured()) {
      try {
        signOutTasks.push(firebaseSignOut(getFirebaseAuth()).catch(() => {}));
      } catch {}
    }
    if (signOutTasks.length > 0) {
      await Promise.race([
        Promise.allSettled(signOutTasks),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);
    }

    if (typeof window !== "undefined") {
      const seg = window.location.pathname.split("/").filter(Boolean)[0];
      window.location.replace(seg === "en" ? "/en" : "/ar");
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
