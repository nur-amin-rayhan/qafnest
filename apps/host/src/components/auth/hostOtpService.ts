"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import {
  getFirebaseAuth,
  isFirebaseConfigured,
  getStoredFirebaseProfile,
  saveStoredFirebaseProfile,
} from "@/lib/firebase/client";
import { normalizeSaudiPhone } from "@/lib/phone";
import { setHostSessionCookie } from "@/context/HostAuthContext";
import type { HostProfile } from "@/context/HostAuthContext";
import type { OtpChannel } from "./hostAuthHelpers";

export function initHostRecaptcha({
  container,
  effectiveLang,
  onError,
}: {
  container: HTMLDivElement | null;
  effectiveLang: "ar" | "en";
  onError: (msg: string) => void;
}) {
  if (!container || !isFirebaseConfigured()) return null;

  try {
    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, container, {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        onError(
          effectiveLang === "ar"
            ? "انتهت صلاحية التحقق الأمني (reCAPTCHA)، يرجى إعادة المحاولة."
            : "reCAPTCHA verification expired. Please try again."
        );
      },
    });
    void verifier.render().catch(() => {});
    return verifier;
  } catch {
    return null;
  }
}

export async function executeSendHostPhoneOtp({
  phone,
  otpChannel,
  recaptchaVerifier,
  effectiveLang,
  supabase,
}: {
  phone: string;
  otpChannel: OtpChannel;
  recaptchaVerifier: RecaptchaVerifier | null;
  effectiveLang: "ar" | "en";
  supabase: SupabaseClient;
}): Promise<{
  confirmationResult: ConfirmationResult | null;
  formattedPhone: string;
}> {
  const formattedPhone = normalizeSaudiPhone(phone);
  if (!formattedPhone) {
    throw new Error(
      effectiveLang === "ar"
        ? "يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 5 (مثال: 501234567)."
        : "Please enter a valid 9-digit Saudi mobile number starting with 5 (e.g. 501234567)."
    );
  }

  if (isFirebaseConfigured()) {
    const auth = getFirebaseAuth();
    if (!recaptchaVerifier) {
      throw new Error(
        effectiveLang === "ar"
          ? "يرجى تأكيد أنك لست روبوت (reCAPTCHA) قبل المتابعة."
          : "Please complete reCAPTCHA verification before continuing."
      );
    }
    const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    return {
      confirmationResult: confirmation,
      formattedPhone,
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
    options: { channel: otpChannel },
  });
  if (error) throw error;

  return {
    confirmationResult: null,
    formattedPhone,
  };
}

export async function executeVerifyHostOtp({
  confirmationResult,
  enteredCode,
  sentPhoneDisplay,
  phone,
  effectiveLang,
  supabase,
  setHostUser,
}: {
  confirmationResult: ConfirmationResult | null;
  enteredCode: string;
  sentPhoneDisplay: string;
  phone: string;
  effectiveLang: "ar" | "en";
  supabase: SupabaseClient;
  setHostUser: (user: User, profile?: HostProfile | null) => void;
}): Promise<{
  nextFirstName: string;
  nextLastName: string;
  nextEmail: string;
  shouldFinish: boolean;
}> {
  if (confirmationResult) {
    const credential = await confirmationResult.confirm(enteredCode);
    const fbUser = credential.user;
    const storedProfile = getStoredFirebaseProfile(fbUser.uid);
    const existingName = storedProfile?.full_name || fbUser.displayName || "";
    const nameParts = existingName.trim().split(/\s+/).filter(Boolean);
    const nextFirstName = storedProfile?.first_name || nameParts[0] || "";
    const nextLastName = storedProfile?.last_name || nameParts.slice(1).join(" ");
    const nextEmail = storedProfile?.contact_email || fbUser.email || "";

    const formattedPhone =
      sentPhoneDisplay || fbUser.phoneNumber || normalizeSaudiPhone(phone) || "";
    const fullName =
      existingName ||
      (nextFirstName
        ? `${nextFirstName} ${nextLastName}`.trim()
        : `${effectiveLang === "ar" ? "مضيف" : "Host"} (${formattedPhone.slice(-4)})`);

    saveStoredFirebaseProfile(fbUser.uid, {
      first_name: nextFirstName || (effectiveLang === "ar" ? "مضيف" : "Host"),
      last_name: nextLastName || (effectiveLang === "ar" ? "شريك" : "Partner"),
      full_name: fullName,
      contact_email: nextEmail || "",
      phone: formattedPhone,
    });

    setHostSessionCookie(true);

    const mappedUser = {
      id: fbUser.uid,
      app_metadata: { provider: "firebase_phone" },
      user_metadata: {
        first_name: nextFirstName || (effectiveLang === "ar" ? "مضيف" : "Host"),
        last_name: nextLastName || (effectiveLang === "ar" ? "شريك" : "Partner"),
        full_name: fullName,
        contact_email: nextEmail || null,
        phone: formattedPhone || null,
        role: "host",
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      phone: formattedPhone || undefined,
    } as unknown as User;

    const mappedProfile = {
      id: fbUser.uid,
      full_name: fullName,
      phone: formattedPhone || null,
      avatar_url: fbUser.photoURL || null,
      role: "host" as const,
    };
    setHostUser(mappedUser, mappedProfile);

    const shouldFinish = Boolean(nextFirstName.trim() && nextLastName.trim());
    return { nextFirstName, nextLastName, nextEmail, shouldFinish };
  }

  // Supabase SMS verification path
  const formattedPhone = sentPhoneDisplay || normalizeSaudiPhone(phone);
  if (!formattedPhone) {
    throw new Error(effectiveLang === "ar" ? "رقم الجوال غير صالح." : "Invalid mobile number.");
  }
  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token: enteredCode,
    type: "sms",
  });
  if (error) throw error;
  if (!data.user) {
    throw new Error(
      effectiveLang === "ar" ? "تعذر إكمال التحقق." : "Unable to complete verification."
    );
  }

  const metadata = data.user.user_metadata || {};
  const { data: storedProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  const existingName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : storedProfile?.full_name || "";
  const nameParts = existingName.trim().split(/\s+/).filter(Boolean);
  const nextFirstName =
    typeof metadata.first_name === "string" ? metadata.first_name : nameParts[0] || "";
  const nextLastName =
    typeof metadata.last_name === "string" ? metadata.last_name : nameParts.slice(1).join(" ");
  const nextEmail =
    typeof metadata.contact_email === "string"
      ? metadata.contact_email
      : data.user.email || "";

  const fullName =
    existingName ||
    (nextFirstName
      ? `${nextFirstName} ${nextLastName}`.trim()
      : `${effectiveLang === "ar" ? "مضيف" : "Host"} (${formattedPhone.slice(-4)})`);

  setHostSessionCookie(true);
  setHostUser(data.user, {
    id: data.user.id,
    full_name: fullName,
    phone: formattedPhone,
    avatar_url: null,
    role: "host",
  });

  const shouldFinish = Boolean(nextFirstName.trim() && nextLastName.trim());
  return { nextFirstName, nextLastName, nextEmail, shouldFinish };
}

export async function executeSaveHostProfile({
  firstName,
  lastName,
  contactEmail,
  phone,
  sentPhoneDisplay,
  effectiveLang: _effectiveLang,
  setHostUser,
}: {
  firstName: string;
  lastName: string;
  contactEmail: string;
  phone: string;
  sentPhoneDisplay: string;
  effectiveLang: "ar" | "en";
  setHostUser: (user: User, profile?: HostProfile | null) => void;
}): Promise<void> {
  const formattedPhone = sentPhoneDisplay || normalizeSaudiPhone(phone) || "";
  const fullName = `${firstName.trim()} ${lastName.trim()}`;
  const normalizedEmail = contactEmail.trim().toLowerCase();

  if (isFirebaseConfigured()) {
    const auth = getFirebaseAuth();
    const fbUser = auth.currentUser;
    if (fbUser) {
      saveStoredFirebaseProfile(fbUser.uid, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: fullName,
        contact_email: normalizedEmail || "",
        phone: formattedPhone,
      });

      setHostUser(
        {
          id: fbUser.uid,
          app_metadata: { provider: "firebase_phone" },
          user_metadata: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullName,
            contact_email: normalizedEmail || null,
            phone: formattedPhone || null,
            role: "host",
          },
          aud: "authenticated",
          created_at: new Date().toISOString(),
          phone: formattedPhone || undefined,
        } as unknown as User,
        {
          id: fbUser.uid,
          full_name: fullName,
          phone: formattedPhone,
          avatar_url: fbUser.photoURL || null,
          role: "host",
        }
      );
    }
  }

  setHostSessionCookie(true);
}

