import type { SupabaseClient, User } from "@supabase/supabase-js";
import { setCachedAuth, type Profile } from "@/context/auth/guestAuthStorage";

export async function executeEmailAuth({
  supabase,
  isEmailSignIn,
  email,
  password,
  fullName,
  phone,
}: {
  supabase: SupabaseClient;
  isEmailSignIn: boolean;
  email: string;
  password: string;
  fullName: string;
  phone: string;
}): Promise<{ success: boolean; message: string; autoCloseDelay?: number }> {
  if (isEmailSignIn) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (process.env.NODE_ENV !== "production") {
        const res = await fetch("/api/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }).catch(() => null);
        if (res?.ok) {
          const devData = (await res.json()) as {
            success?: boolean;
            user?: User;
            profile?: Profile;
          };
          if (devData?.success && devData.user && devData.profile) {
            setCachedAuth({ user: devData.user, profile: devData.profile });
            if (typeof window !== "undefined") {
              setTimeout(() => window.location.reload(), 650);
            }
            return { success: true, message: "Welcome back! Signing you in...", autoCloseDelay: 600 };
          }
        }
      }
      if (error.message.toLowerCase().includes("email not confirmed")) {
        throw new Error(
          "Please confirm your email address. A confirmation link was sent from notifications@qafnest.com."
        );
      }
      throw error;
    }
    return { success: true, message: "Welcome back! Signing you in...", autoCloseDelay: 800 };
  } else {
    const res = await fetch("/api/auth/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "signup",
        email,
        password,
        fullName,
        phone,
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result.error) {
      throw new Error(result.error || "Failed to create account.");
    }
    return {
      success: true,
      message:
        result.message ||
        "Account created! A confirmation email has been sent from notifications@qafnest.com to your inbox.",
    };
  }
}
