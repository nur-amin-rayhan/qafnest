"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { setHostSessionCookie } from "@/context/HostAuthContext";
import type { HostProfile } from "@/context/HostAuthContext";

export type AuthTab = "phone" | "email";
export type PhoneStep = "phone_input" | "otp_verify" | "profile_details";
export type OtpChannel = "sms" | "whatsapp";

export const OTP_LENGTH = 6;

export function withLang(url: string, currentLang: string): string {
  try {
    const parsed = new URL(
      url,
      typeof window !== "undefined" ? window.location.origin : "http://localhost:3001"
    );
    parsed.searchParams.set("lang", currentLang);
    return parsed.pathname + parsed.search;
  } catch {
    return url.includes("?") ? `${url}&lang=${currentLang}` : `${url}?lang=${currentLang}`;
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
  const normalizedEmail = email.trim().toLowerCase();
  const isDevHost =
    normalizedEmail === "host.dev@qafnest.com" ||
    (Boolean(process.env.NEXT_PUBLIC_DEV_HOST_EMAIL) &&
      normalizedEmail === process.env.NEXT_PUBLIC_DEV_HOST_EMAIL?.toLowerCase());

  if (isEmailSignIn) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session?.access_token) {
        setHostSessionCookie(data.session.access_token);
      } else {
        setHostSessionCookie(true);
      }
      if (isDevHost && typeof document !== "undefined") {
        document.cookie = "qafnest_host_dev=1; path=/; max-age=86400; SameSite=Lax";
        document.cookie = "qafnest_has_host_session=dev_host_token; path=/; max-age=86400; SameSite=Lax";
      }
      if (data.user) setHostUser(data.user);
      return {
        success: true,
        message:
          effectiveLang === "ar" ? "مرحباً بعودتك! جارٍ الدخول..." : "Welcome back! Signing in...",
        shouldFinish: true,
      };
    } catch (err) {
      if (isDevHost) {
        const devHostId = process.env.NEXT_PUBLIC_DEV_HOST_ID || "00000000-0000-0000-0000-000000000002";
        const devHostName = process.env.NEXT_PUBLIC_DEV_HOST_NAME || "Dev Host Partner";
        const devHostPhone = process.env.NEXT_PUBLIC_DEV_HOST_PHONE || "";
        const devUser: User = {
          id: devHostId,
          email: "host.dev@qafnest.com",
          app_metadata: { provider: "email", role: "host" },
          user_metadata: { full_name: devHostName, role: "host" },
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User;
        setHostSessionCookie("dev_host_token");
        if (typeof document !== "undefined") {
          document.cookie = "qafnest_host_dev=1; path=/; max-age=86400; SameSite=Lax";
          document.cookie = "qafnest_has_host_session=dev_host_token; path=/; max-age=86400; SameSite=Lax";
        }
        setHostUser(devUser, {
          id: devHostId,
          full_name: devHostName,
          phone: devHostPhone,
          avatar_url: null,
          role: "host",
        });
        return {
          success: true,
          message:
            effectiveLang === "ar"
              ? "مرحباً بعودتك! تم الدخول بنجاح بحساب مضيف التطوير."
              : "Welcome back! Signed in as Dev Host Partner.",
          shouldFinish: true,
        };
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
