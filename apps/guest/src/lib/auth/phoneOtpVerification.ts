"use client";

import type { Session } from "@supabase/supabase-js";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type Auth,
  type ConfirmationResult,
} from "firebase/auth";
import { normalizeSaudiPhone } from "@qafnest/shared/phone";
import { getFirebaseErrorMessage, isFirebaseConfigured } from "@/lib/firebase/client";
import { getGuestAuthorizationHeaders } from "@/lib/auth/clientAuthHeaders";

const SECONDARY_AUTH_APP_NAME = "qafnest-phone-otp-verify";

function getSecondaryPhoneVerifyAuth(): Auth {
  const existing = getApps().find((a) => a.name === SECONDARY_AUTH_APP_NAME);
  if (existing) return getAuth(existing);
  const primaryOpts = getApps().length
    ? getApp().options
    : {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      };
  return getAuth(initializeApp(primaryOpts, SECONDARY_AUTH_APP_NAME));
}

export function createPhoneChangeRecaptcha(params: {
  container: HTMLDivElement | null;
  onReady?: () => void;
  onExpired?: () => void;
  onError: (msg: string) => void;
}): { verifier: RecaptchaVerifier | null; cleanup: () => void } {
  if (!params.container || !isFirebaseConfigured()) {
    return { verifier: null, cleanup: () => {} };
  }
  let active = true;
  let verifier: RecaptchaVerifier | null = null;
  try {
    const auth = getSecondaryPhoneVerifyAuth();
    params.container.innerHTML = "";
    verifier = new RecaptchaVerifier(auth, params.container, {
      size: "invisible",
      callback: () => {
        if (active) params.onReady?.();
      },
      "expired-callback": () => {
        if (active) params.onExpired?.();
      },
    });
    void verifier.render().catch((err) => {
      if (active) params.onError(getFirebaseErrorMessage(err));
    });
  } catch (err) {
    if (active) params.onError(getFirebaseErrorMessage(err));
  }
  return {
    verifier,
    cleanup: () => {
      active = false;
      try {
        verifier?.clear();
      } catch {}
    },
  };
}

export async function sendPhoneChangeOtp(params: {
  rawPhone: string;
  verifier: RecaptchaVerifier | null;
  language: string;
}): Promise<{ formattedPhone: string; confirmationResult: ConfirmationResult }> {
  const formattedPhone = normalizeSaudiPhone(params.rawPhone.trim());
  if (!formattedPhone) {
    throw new Error(
      params.language === "ar"
        ? "أدخل رقم جوال سعودي صالح (مثال: 05XXXXXXXX)."
        : "Enter a valid Saudi mobile number starting with 5."
    );
  }
  if (!isFirebaseConfigured()) {
    throw new Error(
      params.language === "ar"
        ? "خدمة رسائل التحقق غير مهيأة حالياً."
        : "Phone OTP service is not configured."
    );
  }
  if (!params.verifier) {
    throw new Error(
      params.language === "ar"
        ? "يرجى إكمال التحقق الأمني reCAPTCHA أولاً."
        : "Please complete the reCAPTCHA challenge first."
    );
  }
  const auth = getSecondaryPhoneVerifyAuth();
  const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, params.verifier);
  return { formattedPhone, confirmationResult };
}

export async function confirmPhoneChangeOtp(params: {
  confirmationResult: ConfirmationResult;
  otpCode: string;
  newPhone: string;
  session: Session | null;
  language: string;
}): Promise<{ phone: string; identityResetRequired: boolean; message: string }> {
  const cleanCode = params.otpCode.trim().replace(/\D/g, "");
  if (cleanCode.length < 4) {
    throw new Error(
      params.language === "ar"
        ? "أدخل رمز التحقق المكون من 6 أرقام."
        : "Enter the complete OTP verification code."
    );
  }

  const credential = await params.confirmationResult.confirm(cleanCode);
  const firebaseToken = await credential.user.getIdToken();
  const secondaryAuth = getSecondaryPhoneVerifyAuth();
  await signOut(secondaryAuth).catch(() => {});

  const authHeaders = await getGuestAuthorizationHeaders(params.session);
  const res = await fetch("/api/profile/phone", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    credentials: "same-origin",
    body: JSON.stringify({
      phone: params.newPhone,
      firebaseToken,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    phone?: string;
    identityResetRequired?: boolean;
    message?: string;
    error?: string;
  };
  if (!res.ok || !data.success || !data.phone) {
    throw new Error(
      data.error ||
        (params.language === "ar"
          ? "تعذر تحديث رقم الجوال."
          : "Failed to verify and update mobile number.")
    );
  }
  return {
    phone: data.phone,
    identityResetRequired: Boolean(data.identityResetRequired),
    message:
      data.message ||
      (params.language === "ar"
        ? "تم تحديث رقم الجوال وتوثيقه بنجاح."
        : "Mobile number updated and verified."),
  };
}
