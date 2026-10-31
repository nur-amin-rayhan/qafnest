"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "guest" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  national_id: string | null;
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
  loginWithPhone: (phone: string, fullName?: string) => Promise<void>;
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

  const openAuthModal = (mode: "signin" | "signup" = "signin") => {
    setAuthMode(mode);
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
          national_id: null,
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
    const profileUserId = userId || user?.id;
    if (profileUserId) {
      await fetchProfile(profileUserId, userId ? undefined : user);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check localStorage cached session first
    try {
      const cached = localStorage.getItem("qafnest_auth_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.user) {
          setUser(parsed.user);
          setProfile(parsed.profile || null);
          setLoading(false);
        }
      }
    } catch {}

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id, initialSession.user, () => mounted);
        }
      } catch (err) {
        console.error("Auth init exception:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user, () => mounted);
        } else {
          setProfile(null);
          try {
            localStorage.removeItem("qafnest_auth_user");
          } catch {}
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const loginWithPhone = async (phoneInput: string, fullName?: string) => {
    const formattedPhone = phoneInput.startsWith("+966") ? phoneInput : `+966${phoneInput.replace(/^0+/, "")}`;
    const displayName = fullName || "Guest User";

    const mockUser: User = {
      id: "guest-" + Date.now(),
      app_metadata: { provider: "phone" },
      user_metadata: {
        full_name: displayName,
        phone: formattedPhone,
        role: "guest",
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: "",
      phone: formattedPhone,
    } as User;

    const mockProfile: Profile = {
      id: mockUser.id,
      full_name: displayName,
      phone: formattedPhone,
      national_id: null,
      avatar_url: null,
      role: "guest",
    };

    setUser(mockUser);
    setProfile(mockProfile);
    try {
      localStorage.setItem("qafnest_auth_user", JSON.stringify({ user: mockUser, profile: mockProfile }));
    } catch {}
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
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
        loginWithPhone,
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
