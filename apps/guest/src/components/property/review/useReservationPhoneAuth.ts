"use client";

import { useEffect, useRef, useState } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getFirebaseErrorMessage } from "@/lib/firebase/client";
import { checkSignupGuard, claimWelcomeBonus } from "@/lib/auth/deviceFingerprint";
import { normalizePhoneInput } from "@/lib/services/phone";
import type { OtpChannel, OtpStep } from "./types";
import { resetRecaptcha } from "./types";
import {
  resolveUserReservationIdentity,
  saveReservationGuestProfile,
} from "./reservationPhoneAuthHelpers";
import {
  initReservationRecaptcha,
  resendReservationOtpStep,
  sendReservationOtpStep,
  verifyReservationOtpStep,
} from "./reservationOtpService";

interface UseReservationPhoneAuthOptions {
  supabase: SupabaseClient;
  user: User | null;
  profile: { phone?: string | null; full_name?: string | null } | null;
  refreshProfile: (userId?: string) => Promise<void>;
  label: (english: string, arabic: string) => string;
}

export function useReservationPhoneAuth({
  supabase,
  user,
  profile,
  refreshProfile,
  label,
}: UseReservationPhoneAuthOptions) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sentPhone, setSentPhone] = useState<string | null>(null);
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("sms");
  const [sentChannel, setSentChannel] = useState<OtpChannel>("sms");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpStep, setOtpStep] = useState<OtpStep>("code");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [profileDetailsSaved, setProfileDetailsSaved] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSeconds, setOtpSeconds] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  const otpInputRef = useRef<HTMLInputElement>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetIdRef = useRef<(() => number | null) | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  const {
    accountPhone,
    savedFirstName,
    savedLastName,
    isUserLoggedIn,
    hasUserName,
    reservationPhone,
    effectiveName,
    effectiveEmail,
    effectivePhone,
    metadataName,
  } = resolveUserReservationIdentity({
    user,
    profile,
    verifiedPhone,
    firstName,
    lastName,
    contactEmail,
  });

  const profileDetailsComplete =
    profileDetailsSaved || hasUserName || Boolean(savedFirstName && savedLastName);
  const phoneOtpVerified = Boolean(isUserLoggedIn || verifiedPhone);
  const phoneVerified = Boolean(phoneOtpVerified && profileDetailsComplete);

  useEffect(() => {
    if (otpSeconds <= 0) return;
    const timer = window.setTimeout(() => setOtpSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [otpSeconds]);

  useEffect(() => {
    if (otpModalOpen && otpStep === "code") {
      window.requestAnimationFrame(() => otpInputRef.current?.focus());
    }
  }, [otpModalOpen, otpStep]);

  useEffect(() => {
    if (!otpModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [otpModalOpen]);

  useEffect(() => {
    if (!phoneNumber && accountPhone?.startsWith("+966")) {
      setPhoneNumber(accountPhone.slice(4));
    }
  }, [accountPhone, phoneNumber]);

  useEffect(() => {
    if (phoneVerified || phoneOtpVerified || otpChannel !== "sms") {
      return;
    }

    const timerId = window.setTimeout(() => {
      const { verifier, getWidgetId, cleanup } = initReservationRecaptcha({
        container: recaptchaContainerRef.current,
        onSuccess: () => setOtpError(null),
        onExpired: () => setOtpError("reCAPTCHA expired. Please complete it again."),
        onError: (msg) => setOtpError(msg),
      });
      recaptchaVerifierRef.current = verifier;
      recaptchaWidgetIdRef.current = getWidgetId ?? null;
      return cleanup;
    }, 50);

    return () => {
      window.clearTimeout(timerId);
      recaptchaVerifierRef.current = null;
      recaptchaWidgetIdRef.current = null;
    };
  }, [phoneVerified, phoneOtpVerified, otpChannel]);

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOtpError(null);
    setOtpBusy(true);
    try {
      const normalized = normalizePhoneInput(phoneNumber);
      if (normalized) {
        const guard = await checkSignupGuard({ phone: normalized, mode: "otp" });
        if (!guard.allowed) {
          throw new Error(
            label(
              guard.messageEn || "Only 1 guest account & welcome bonus is permitted per device/IP.",
              guard.messageAr || "يُسمح بحساب ضيف واحد ومكافأة ترحيبية واحدة فقط لكل جهاز أو شبكة."
            )
          );
        }
      }

      const res = await sendReservationOtpStep({
        phoneNumber,
        otpChannel,
        recaptchaVerifier: recaptchaVerifierRef.current,
        supabase,
        label,
      });
      confirmationResultRef.current = res.confirmationResult;
      setSentPhone(res.formattedPhone);
      setSentChannel(res.sentChannel);
      setOtpSent(true);
      setOtpCode("");
      setOtpSeconds(60);
      setOtpStep("code");
      setOtpModalOpen(true);
      setOtpError(null);
    } catch (error) {
      resetRecaptcha(recaptchaWidgetIdRef.current ? recaptchaWidgetIdRef.current() : null);
      setOtpError(getFirebaseErrorMessage(error));
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOtpError(null);
    setOtpBusy(true);
    try {
      const result = await verifyReservationOtpStep({
        confirmationResult: confirmationResultRef.current,
        otpCode,
        sentPhone: sentPhone || "",
        user,
        supabase,
        savedFirstName,
        savedLastName,
        metadataName,
        effectiveEmail,
        refreshProfile,
        label,
      });

      setVerifiedPhone(result.verifiedPhone);
      setOtpSent(false);
      setOtpCode("");
      setOtpError(null);
      setFirstName(result.nextFirstName);
      setLastName(result.nextLastName);
      setContactEmail(result.nextEmail);

      if (!result.needsProfile) {
        void claimWelcomeBonus({ isNewSignup: true });
        setProfileDetailsSaved(true);
        setOtpModalOpen(false);
      } else {
        void claimWelcomeBonus({ isNewSignup: true });
        setOtpStep("profile");
        setOtpModalOpen(true);
      }
    } catch (error) {
      setOtpError(getFirebaseErrorMessage(error));
    } finally {
      setOtpBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (!sentPhone || otpSeconds > 0) return;
    setOtpBusy(true);
    setOtpError(null);
    try {
      const nextConfirmation = await resendReservationOtpStep({
        sentPhone,
        sentChannel,
        recaptchaVerifier: recaptchaVerifierRef.current,
        supabase,
      });
      if (nextConfirmation) {
        confirmationResultRef.current = nextConfirmation;
      }
      setOtpCode("");
      setOtpSeconds(60);
    } catch (error) {
      resetRecaptcha(recaptchaWidgetIdRef.current ? recaptchaWidgetIdRef.current() : null);
      setOtpError(getFirebaseErrorMessage(error));
    } finally {
      setOtpBusy(false);
    }
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOtpError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setOtpError(label("Add your first name and last name.", "أدخل الاسم الأول واسم العائلة."));
      return;
    }
    const normalizedEmail = contactEmail.trim().toLowerCase();
    if (normalizedEmail && !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setOtpError(
        label("Enter a valid email address or leave it blank.", "أدخل بريداً إلكترونياً صحيحاً أو اتركه فارغاً.")
      );
      return;
    }

    setOtpBusy(true);
    try {
      const phoneIdentifier = verifiedPhone || sentPhone || accountPhone || "";
      await saveReservationGuestProfile({
        supabase,
        user,
        firstName,
        lastName,
        normalizedEmail,
        phoneIdentifier,
        refreshProfile,
      });
      void claimWelcomeBonus({ isNewSignup: true });
      setProfileDetailsSaved(true);
      setOtpModalOpen(false);
      setOtpStep("code");
      setOtpError(null);
    } catch (error) {
      setOtpError(
        error instanceof Error
          ? error.message
          : label("Your details could not be saved. Please try again.", "تعذر حفظ بياناتك. حاول مرة أخرى.")
      );
    } finally {
      setOtpBusy(false);
    }
  };

  return {
    phoneNumber,
    setPhoneNumber,
    sentPhone,
    otpChannel,
    setOtpChannel,
    sentChannel,
    otpCode,
    setOtpCode,
    otpSent,
    setOtpSent,
    otpModalOpen,
    setOtpModalOpen,
    otpStep,
    setOtpStep,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    contactEmail,
    setContactEmail,
    otpBusy,
    otpError,
    setOtpError,
    otpSeconds,
    phoneVerified,
    phoneOtpVerified,
    reservationPhone,
    effectiveName,
    effectiveEmail,
    effectivePhone,
    otpInputRef,
    recaptchaContainerRef,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    handleSaveProfile,
  };
}
