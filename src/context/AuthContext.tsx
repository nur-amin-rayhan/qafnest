"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "guest" | "host" | "admin";
export type HostStatus = "none" | "pending" | "verified" | "suspended";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  host_status: HostStatus;
  tourism_license_no: string | null;
  national_id: string | null;
  avatar_url: string | null;
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
  signupRole: "guest" | "host";
  openAuthModal: (mode?: "signin" | "signup", defaultRole?: "guest" | "host") => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [signupRole, setSignupRole] = useState<"guest" | "host">("guest");

  const openAuthModal = (mode: "signin" | "signup" = "signin", defaultRole: "guest" | "host" = "guest") => {
    setAuthMode(mode);
    setSignupRole(defaultRole);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);

  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null, isMounted?: () => boolean) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Guard against updating unmounted component
      if (isMounted && !isMounted()) return;

      if (error) {
        console.warn("Profile fetch note:", error.message);
        // Fallback default profile if table empty or trigger not yet run
        const metadataName = typeof currentUser?.user_metadata?.full_name === "string"
          ? currentUser.user_metadata.full_name
          : [currentUser?.user_metadata?.first_name, currentUser?.user_metadata?.last_name].filter(Boolean).join(" ");
        setProfile({
          id: userId,
          full_name: metadataName || null,
          phone: currentUser?.phone || currentUser?.user_metadata?.phone || null,
          role: (currentUser?.user_metadata?.role as UserRole) || "guest",
          host_status: (currentUser?.user_metadata?.role === "host" ? "pending" : "none") as HostStatus,
          tourism_license_no: null,
          national_id: null,
          avatar_url: null,
        });
      } else if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error("Error in fetchProfile:", err);
    }
  }, [supabase]);

  const refreshProfile = async (userId?: string) => {
    const profileUserId = userId || user?.id;
    if (profileUserId) await fetchProfile(profileUserId, userId ? undefined : user);
  };

  useEffect(() => {
    let isMounted = true;
    const checkMounted = () => isMounted;

    // Drop sessions written by the previous client-side OTP simulator.
    try { localStorage.removeItem("qafnest_auth_user"); } catch {}

    // 1. Initial Session Check with isMounted guard
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user ?? null);
        if (currentSession.user) {
          fetchProfile(currentSession.user.id, currentSession.user, checkMounted);
        }
      }
      setLoading(false);
    });

    // 2. Auth State Change Listener with unsubscribe cleanup
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user ?? null);
        if (newSession.user) {
          await fetchProfile(newSession.user.id, newSession.user, checkMounted);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
    setProfile(null);
    try { localStorage.removeItem("qafnest_auth_user"); } catch {}
  };

  const role: UserRole = profile?.role || (user?.user_metadata?.role as UserRole) || "guest";
  const isHost = role === "host" || role === "admin";
  const isAdmin = role === "admin";

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
        signupRole,
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
