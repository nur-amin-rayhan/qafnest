import type { SupabaseClient, User } from "@supabase/supabase-js";
import { checkSignupGuard, claimWelcomeBonus } from "@/lib/auth/deviceFingerprint";
import { setCachedAuth, syncSessionCookie, type Profile } from "@/context/auth/guestAuthStorage";

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
            syncSessionCookie("dev_guest_token");
            if (typeof window !== "undefined") {
              setTimeout(() => window.location.reload(), 650);
            }
            return { success: true, message: "Welcome back! Signing you in...", autoCloseDelay: 600 };
          }
        }
      }
      throw error;
    }
    return { success: true, message: "Welcome back! Signing you in...", autoCloseDelay: 800 };
  } else {
    const guard = await checkSignupGuard({ email, phone, mode: "signup" });
    if (!guard.allowed) {
      throw new Error(
        guard.messageEn ||
          "Only 1 guest account & welcome bonus is allowed per device/IP."
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: new URL("/auth/callback", siteUrl).toString(),
        data: {
          full_name: fullName,
          phone: phone,
          role: "guest",
        },
      },
    });
    if (error) throw error;
    if (data.session) {
      const bonus = await claimWelcomeBonus({
        isNewSignup: true,
        accessToken: data.session.access_token,
      });
      const bonusMsg = bonus.awarded
        ? ` Account created & ${bonus.amountCredited} SAR welcome gift added to your wallet!`
        : " Account created successfully!";
      return { success: true, message: bonusMsg.trim(), autoCloseDelay: 1200 };
    } else {
      return {
        success: true,
        message: "Account created. Check your email to confirm your address and receive your 50 SAR welcome bonus.",
      };
    }
  }
}
