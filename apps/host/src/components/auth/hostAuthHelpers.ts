"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { setHostSessionCookie } from "@/context/HostAuthContext";
import type { HostProfile } from "@/context/HostAuthContext";
import {
  DEFAULT_HOST_LOCALE,
  localizeHostPath,
  normalizeHostLocale,
} from "@/lib/hostLocale";

export type AuthTab = "phone" | "email";
export type PhoneStep = "phone_input" | "otp_verify" | "profile_details";
export type OtpChannel = "sms" | "whatsapp";

export const OTP_LENGTH = 6;

export function withLang(url: string, currentLang: string): string {
  const locale = normalizeHostLocale(currentLang) ?? DEFAULT_HOST_LOCALE;
  try {
    const parsed = new URL(
      url,
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3001"
    );
    parsed.searchParams.delete("lang");
    const localized = localizeHostPath(
      `${parsed.pathname}${parsed.search}${parsed.hash}`,
      locale
    );
    return localized;
  } catch {
    return localizeHostPath(url || "/app", locale);
  }
}

export async function executeHostEmailAuth({
  supabase,
  isEmailSignIn,
  email,
  password,
  hostBusinessName,
  effectiveLang,
  setHostUser,
}: {
  supabase: SupabaseClient;
  isEmailSignIn: boolean;
  email: string;
  password: string;
  hostBusinessName: string;
  effectiveLang: "ar" | "en";
  setHostUser: (user: User, profile?: HostProfile | null) => void;
}): Promise<{ success: boolean; message: string; shouldFinish: boolean }> {
  if (isEmailSignIn) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session?.access_token) {
        setHostSessionCookie(data.session.access_token);
      } else {
        setHostSessionCookie(true);
      }
      if (data.user) setHostUser(data.user);
      return {
        success: true,
        message:
          effectiveLang === "ar" ? "مرحباً بعودتك! جارٍ الدخول..." : "Welcome back! Signing in...",
        shouldFinish: true,
      };
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        const res = await fetch("/api/host/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }).catch(() => null);
        if (res?.ok) {
          const devData = (await res.json()) as {
            success?: boolean;
            user?: User;
            profile?: HostProfile | null;
          };
          if (devData?.success && devData.user) {
            setHostSessionCookie("dev_host_token");
            setHostUser(devData.user, devData.profile ?? null);
            return {
              success: true,
              message:
                effectiveLang === "ar"
                  ? "مرحباً بعودتك! تم الدخول بنجاح بحساب مضيف التطوير."
                  : "Welcome back! Signed in as Dev Host Partner.",
              shouldFinish: true,
            };
          }
        }
      }
      throw err;
    }
  } else {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL("/auth/callback", siteUrl).toString(),
        data: {
          full_name: hostBusinessName || (effectiveLang === "ar" ? "شريك مضيف" : "Host Partner"),
          role: "host",
        },
      },
    });
    if (error) throw error;
    if (data.session && data.user) {
      setHostSessionCookie(true);
      setHostUser(data.user);
      return {
        success: true,
        message:
          effectiveLang === "ar"
            ? "تم إنشاء حساب المضيف بنجاح!"
            : "Host account created successfully!",
        shouldFinish: true,
      };
    } else {
      return {
        success: true,
        message:
          effectiveLang === "ar"
            ? "تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني لتأكيد التسجيل والدخول."
            : "Account created! Please check your email to verify and sign in.",
        shouldFinish: false,
      };
    }
  }
}

export {
  initHostRecaptcha,
  executeSendHostPhoneOtp,
  executeVerifyHostOtp,
  executeSaveHostProfile,
} from "./hostOtpService";
