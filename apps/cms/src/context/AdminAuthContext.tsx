"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

import { cmsPath } from "@/lib/cmsUrl";
export interface AdminUser {
  email: string;
  name: string;
  role: "admin";
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(cmsPath("/api/admin/auth"), { method: "GET" });
      if (res.ok) {
        const data = (await res.json()) as { authenticated: boolean; user: AdminUser };
        if (data.authenticated && data.user) {
          setUser(data.user);
          return true;
        }
      }
      setUser(null);
      return false;
    } catch {
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(cmsPath("/api/admin/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as { success?: boolean; message?: string; user?: AdminUser };

      if (!res.ok || !data.success) {
        return { success: false, error: data.message || "Invalid credentials." };
      }

      if (data.user) {
        setUser(data.user);
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Connection error." };
    }
  };

  const signOut = async () => {
    try {
      await fetch(cmsPath("/api/admin/auth"), { method: "DELETE" });
    } catch {}
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.replace(cmsPath("/login"));
    }
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, signIn, signOut, checkAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

