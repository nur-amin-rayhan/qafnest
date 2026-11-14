"use client";

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  getFirebaseAuth,
  getFirebaseErrorMessage,
  getStoredFirebaseProfile,
  isFirebaseConfigured,
} from "@/lib/firebase/client";
import { normalizePhoneInput } from "@/lib/services/phone";
import type { OtpChannel } from "./types";
import { OTP_LENGTH } from "./types";

export function initReservationRecaptcha({
  container,
  onSuccess,
  onExpired,
  onError,
}: {
  container: HTMLDivElement | null;
  onSuccess: () => void;
  onExpired: () => void;
  onError: (msg: string) => void;
}) {
  if (!container || !isFirebaseConfigured()) {
    return { verifier: null, cleanup: () => {} };
  }

  let mounted = true;
  let verifier: RecaptchaVerifier | null = null;
  let widgetId: number | null = null;

  try {
    const auth = getFirebaseAuth();
    container.innerHTML = "";
    verifier = new RecaptchaVerifier(auth, container, {
      size: "normal",
      callback: () => {
        if (mounted) onSuccess();
      },
      "expired-callback": () => {
        if (mounted) onExpired();
      },
    });

    void verifier
      .render()
      .then((id) => {
        if (mounted) widgetId = id;
      })
      .catch((reason: unknown) => {
        if (mounted) onError(getFirebaseErrorMessage(reason));
      });
  } catch (reason: unknown) {
    if (mounted) onError(getFirebaseErrorMessage(reason));
  }

  return {
    verifier,
    getWidgetId: () => widgetId,
    cleanup: () => {
      mounted = false;
      try {
        verifier?.clear();
      } catch {}
    },
  };
}

export async function sendReservationOtpStep({
  phoneNumber,
  otpChannel,
  recaptchaVerifier,
  supabase,
  label,
}: {
  phoneNumber: string;
  otpChannel: OtpChannel;
  recaptchaVerifier: RecaptchaVerifier | null;
  supabase: SupabaseClient;
  label: (english: string, arabic: string) => string;
}): Promise<{
  confirmationResult: ConfirmationResult | null;
  formattedPhone: string;
  sentChannel: OtpChannel;
}> {
  const formattedPhone = normalizePhoneInput(phoneNumber);
  if (!formattedPhone) {
    throw new Error(
      label(
        "Enter a valid mobile number, for example 5X XXX XXXX.",
        "أدخل رقم جوال صالحاً، مثل 5X XXX XXXX."
      )
    );
  }

  if (otpChannel === "sms" && isFirebaseConfigured()) {
    const auth = getFirebaseAuth();
    if (!recaptchaVerifier) {
      throw new Error("reCAPTCHA is still loading. Please wait a moment and try again.");
    }
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    return {
      confirmationResult,
      formattedPhone,
      sentChannel: "sms",
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
    options: { channel: otpChannel },
  });
  if (error) {
    if (error.message.toLowerCase().includes("unsupported phone provider")) {
      throw new Error(
        otpChannel === "whatsapp"
          ? "WhatsApp OTP is not configured in Supabase yet. Please switch to SMS to verify with Firebase Phone Auth."
          : "Phone provider is not configured in Supabase."
      );
    }
    throw error;
  }

  return {
    confirmationResult: null,
    formattedPhone,
    sentChannel: otpChannel,
  };
}

export async function verifyReservationOtpStep({
  confirmationResult,
  otpCode,
  sentPhone,
  user,
  supabase,
  savedFirstName,
  savedLastName,
  metadataName,
  effectiveEmail,
  refreshProfile,
  label,
}: {
  confirmationResult: ConfirmationResult | null;
  otpCode: string;
  sentPhone: string;
  user: User | null;
  supabase: SupabaseClient;
  savedFirstName: string;
  savedLastName: string;
  metadataName: string;
  effectiveEmail: string;
  refreshProfile: (userId?: string) => Promise<void>;
  label: (english: string, arabic: string) => string;
}): Promise<{
  verifiedPhone: string;
  nextFirstName: string;
  nextLastName: string;
  nextEmail: string;
  needsProfile: boolean;
}> {
  if (!sentPhone || otpCode.length !== OTP_LENGTH) {
    throw new Error(
      label(
        `Enter the ${OTP_LENGTH}-digit code sent to your phone.`,
        `أدخل الرمز المكون من ${OTP_LENGTH} أرقام المرسل إلى هاتفك.`
      )
    );
  }

  if (confirmationResult) {
    const credential = await confirmationResult.confirm(otpCode);
    const fbUser = credential.user;
    const confirmedPhone = fbUser.phoneNumber || sentPhone;

    if (user?.id) {
      try {
        await supabase.from("profiles").update({ phone: confirmedPhone }).eq("id", user.id);
      } catch {}
    }

    const stored = getStoredFirebaseProfile(fbUser.uid);
    const metadataFullName = stored?.full_name || fbUser.displayName || metadataName || "";
    const fullNameParts = metadataFullName.trim().split(/\s+/).filter(Boolean);
    const nextFirstName = stored?.first_name || fullNameParts[0] || savedFirstName || "";
    const nextLastName =
      stored?.last_name || fullNameParts.slice(1).join(" ") || savedLastName || "";
    const nextEmail = stored?.contact_email || fbUser.email || effectiveEmail || "";

    await refreshProfile(user?.id || fbUser.uid);

    const needsProfile = !(nextFirstName.trim() && nextLastName.trim());
    return {
      verifiedPhone: confirmedPhone,
      nextFirstName,
      nextLastName,
      nextEmail,
      needsProfile,
    };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone: sentPhone,
    token: otpCode,
    type: "sms",
  });
  if (error) throw error;

  const verifiedNumber = data.user?.phone || sentPhone;
  await refreshProfile(data.user?.id || user?.id);

  const nextFirstName =
    (typeof data.user?.user_metadata?.first_name === "string"
      ? data.user.user_metadata.first_name.trim()
      : "") ||
    savedFirstName ||
    "";
  const nextLastName =
    (typeof data.user?.user_metadata?.last_name === "string"
      ? data.user.user_metadata.last_name.trim()
      : "") ||
    savedLastName ||
    "";
  const nextEmail =
    (typeof data.user?.user_metadata?.contact_email === "string"
      ? data.user.user_metadata.contact_email.trim()
      : "") ||
    data.user?.email ||
    effectiveEmail ||
    "";

  const needsProfile = !(nextFirstName.trim() && nextLastName.trim());
  return {
    verifiedPhone: verifiedNumber,
    nextFirstName,
    nextLastName,
    nextEmail,
    needsProfile,
  };
}

export async function resendReservationOtpStep({
  sentPhone,
  sentChannel,
  recaptchaVerifier,
  supabase,
}: {
  sentPhone: string;
  sentChannel: OtpChannel;
  recaptchaVerifier: RecaptchaVerifier | null;
  supabase: SupabaseClient;
}): Promise<ConfirmationResult | null> {
  if (sentChannel === "sms" && isFirebaseConfigured()) {
    const auth = getFirebaseAuth();
    if (!recaptchaVerifier) {
      throw new Error("reCAPTCHA is still loading. Please wait a moment and try again.");
    }
    return signInWithPhoneNumber(auth, sentPhone, recaptchaVerifier);
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: sentPhone,
    options: { channel: sentChannel },
  });
  if (error) throw error;
  return null;
}

