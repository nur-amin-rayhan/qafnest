import type { SupabaseClient, User } from "@supabase/supabase-js";
import { setCachedAuth, type Profile } from "@/context/auth/guestAuthStorage";

export async function executeSendEmailOtp({
  email,
  language = "en",
  turnstileToken,
}: {
  email: string;
  language?: "ar" | "en";
  turnstileToken?: string;
}): Promise<{ success: boolean; message: string; isExistingUser?: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
    throw new Error(
      language === "ar"
        ? "صيغة البريد الإلكتروني غير صحيحة."
        : "Please enter a valid email address."
    );
  }

  const res = await fetch("/api/auth/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "send_email_otp",
      email: normalizedEmail,
      language,
      turnstileToken,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || "Failed to send verification code to your email.");
  }

  return {
    success: true,
    message: data.message || "Verification code sent to your email.",
    isExistingUser: Boolean(data.isExistingUser),
  };
}

export async function executeVerifyEmailOtp({
  email,
  code,
  language = "en",
  refreshProfile,
}: {
  email: string;
  code: string;
  language?: "ar" | "en";
  refreshProfile?: (userId?: string) => Promise<void>;
}): Promise<{
  success: boolean;
  isComplete: boolean;
  message: string;
  user?: User;
  profile?: Profile;
}> {
  const res = await fetch("/api/auth/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "verify_email_otp",
      email: email.trim().toLowerCase(),
      code: code.trim(),
      language,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || "Invalid or expired verification code.");
  }

  if (data.user && data.profile) {
    setCachedAuth({ user: data.user, profile: data.profile });
    if (refreshProfile) {
      await refreshProfile(data.user.id);
    }
  }

  return {
    success: true,
    isComplete: Boolean(data.isComplete),
    message: data.message || "Email verified successfully.",
    user: data.user,
    profile: data.profile,
  };
}

export async function executeCompleteEmailProfile({
  email,
  firstName,
  lastName,
  language = "en",
  refreshProfile,
}: {
  email: string;
  firstName: string;
  lastName: string;
  language?: "ar" | "en";
  refreshProfile?: (userId?: string) => Promise<void>;
}): Promise<{
  success: boolean;
  message: string;
  user?: User;
  profile?: Profile;
}> {
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const res = await fetch("/api/auth/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "complete_email_profile",
      email: email.trim().toLowerCase(),
      fullName,
      language,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || "Failed to complete profile.");
  }

  if (data.user && data.profile) {
    setCachedAuth({ user: data.user, profile: data.profile });
    if (refreshProfile) {
      await refreshProfile(data.user.id);
    }
  }

  return {
    success: true,
    message: data.message || "Account ready!",
    user: data.user,
    profile: data.profile,
  };
}

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

