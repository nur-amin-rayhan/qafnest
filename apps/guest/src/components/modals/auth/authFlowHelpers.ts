"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  type ConfirmationResult,
} from "firebase/auth";
import {
  getFirebaseAuth,
  getFirebaseErrorMessage,
  getStoredFirebaseProfile,
  isFirebaseConfigured,
  saveStoredFirebaseProfile,
} from "@/lib/firebase/client";
import { normalizePhoneInput } from "@qafnest/shared/phone";

export const OTP_LENGTH = process.env.NEXT_PUBLIC_SUPABASE_OTP_LENGTH === "4" ? 4 : 6;
export const EMPTY_OTP = () => Array.from({ length: OTP_LENGTH }, () => "");
export type OtpChannel = "sms" | "whatsapp";

export function resetRecaptcha(widgetId: number | null) {
  if (widgetId === null || typeof window === "undefined") return;
  const grecaptcha = (
    window as unknown as { grecaptcha?: { reset: (id?: number) => void } }
  ).grecaptcha;
  grecaptcha?.reset(widgetId);
}

export function initGuestRecaptcha({
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
      size: "invisible",
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

export async function executeSendOtp({
  phone,
  otpChannel,
  recaptchaVerifier,
  supabase,
}: {
  phone: string;
  otpChannel: OtpChannel;
  recaptchaVerifier: RecaptchaVerifier | null;
  supabase: SupabaseClient;
}): Promise<{
  confirmationResult: ConfirmationResult | null;
  formattedPhone: string;
  sentChannel: OtpChannel;
}> {
  const formattedPhone = normalizePhoneInput(phone);
  if (!formattedPhone) {
    throw new Error(
      "Please enter a valid mobile number (e.g. 50 123 4567 or international format +8801...)."
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
          ? "WhatsApp OTP is not configured in Supabase yet. Please switch to SMS above to sign in with Firebase Phone Auth."
          : "Phone provider is not configured in Supabase. Please check your Firebase configuration in .env.local."
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

export async function executeVerifyOtp({
  confirmationResult,
  enteredCode,
  sentPhoneDisplay,
  phone,
  supabase,
  refreshProfile,
}: {
  confirmationResult: ConfirmationResult | null;
  enteredCode: string;
  sentPhoneDisplay: string;
  phone: string;
  supabase: SupabaseClient;
  refreshProfile: (userId?: string) => Promise<void>;
}): Promise<{
  nextFirstName: string;
  nextLastName: string;
  nextEmail: string;
  isComplete: boolean;
}> {
  if (enteredCode.length !== OTP_LENGTH) {
    throw new Error(`Please enter the complete ${OTP_LENGTH}-digit verification code.`);
  }

  if (confirmationResult) {
    const credential = await confirmationResult.confirm(enteredCode);
    const fbUser = credential.user;
    const storedProfile = getStoredFirebaseProfile(fbUser.uid);
    const existingName = storedProfile?.full_name || fbUser.displayName || "";
    const nameParts = existingName.trim().split(/\s+/).filter(Boolean);
    const nextFirstName = storedProfile?.first_name || nameParts[0] || "";
    const nextLastName = storedProfile?.last_name || nameParts.slice(1).join(" ");
    const nextEmail = storedProfile?.contact_email || fbUser.email || "";

    const isComplete = Boolean(nextFirstName.trim() && nextLastName.trim() && nextEmail.trim());
    if (isComplete) {
      await refreshProfile(fbUser.uid);
    }
    return { nextFirstName, nextLastName, nextEmail, isComplete };
  }

  const formattedPhone = sentPhoneDisplay || normalizePhoneInput(phone);
  if (!formattedPhone) throw new Error("Please enter a valid mobile number.");

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token: enteredCode,
    type: "sms",
  });
  if (error) throw error;
  if (!data.user) throw new Error("Phone verification did not complete.");

  const metadata = data.user.user_metadata || {};
  const { data: storedProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  const existingName =
    typeof metadata.full_name === "string" ? metadata.full_name : storedProfile?.full_name || "";
  const nameParts = existingName.trim().split(/\s+/).filter(Boolean);
  const nextFirstName =
    typeof metadata.first_name === "string" ? metadata.first_name : nameParts[0] || "";
  const nextLastName =
    typeof metadata.last_name === "string" ? metadata.last_name : nameParts.slice(1).join(" ");
  const nextEmail =
    typeof metadata.contact_email === "string" ? metadata.contact_email : data.user.email || "";

  const isComplete = Boolean(nextFirstName.trim() && nextLastName.trim() && nextEmail.trim());
  if (isComplete) {
    await refreshProfile(data.user.id);
  }
  return { nextFirstName, nextLastName, nextEmail, isComplete };
}

import { executeEmailAuth } from "./guestEmailAuth";
export { executeEmailAuth };

export async function executeSavePhoneProfile({
  supabase,
  firstName,
  lastName,
  contactEmail,
  phone,
  sentPhoneDisplay,
  refreshProfile,
}: {
  supabase: SupabaseClient;
  firstName: string;
  lastName: string;
  contactEmail: string;
  phone: string;
  sentPhoneDisplay: string;
  refreshProfile: (userId?: string) => Promise<void>;
}): Promise<void> {
  const normalizedEmail = contactEmail.trim().toLowerCase();
  const fullNameValue = `${firstName.trim()} ${lastName.trim()}`;

  if (isFirebaseConfigured()) {
    const fbAuth = getFirebaseAuth();
    if (fbAuth.currentUser) {
      const fbUser = fbAuth.currentUser;
      await updateProfile(fbUser, { displayName: fullNameValue });
      saveStoredFirebaseProfile(fbUser.uid, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: fullNameValue,
        contact_email: normalizedEmail,
        phone: fbUser.phoneNumber || sentPhoneDisplay || normalizePhoneInput(phone) || "",
      });
      await refreshProfile(fbUser.uid);
      return;
    }
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: fullNameValue,
      contact_email: normalizedEmail,
    },
  });
  if (error) throw error;
  if (!data.user)
    throw new Error("Your verified account is unavailable. Please sign in again.");

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: data.user.id,
      full_name: fullNameValue,
      phone: data.user.phone || sentPhoneDisplay || normalizePhoneInput(phone),
    },
    { onConflict: "id" }
  );
  if (profileError) throw profileError;

  await refreshProfile(data.user.id);
}
