"use client";

import { useState, useRef, useEffect } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
import { getFirebaseErrorMessage, isFirebaseConfigured } from "@/lib/firebase/client";
import { checkSignupGuard, claimWelcomeBonus } from "@/lib/auth/deviceFingerprint";
import { normalizePhoneInput } from "@qafnest/shared/phone";
import {
  OTP_LENGTH,
  EMPTY_OTP,
  OtpChannel,
  resetRecaptcha,
  initGuestRecaptcha,
  executeSendOtp,
  executeVerifyOtp,
  executeEmailAuth,
  executeSavePhoneProfile,
} from "./authFlowHelpers";
import { useGuestOtpInput } from "./useGuestOtpInput";

export { OTP_LENGTH, EMPTY_OTP };
export type { OtpChannel };

interface UseGuestAuthFlowOptions {
  authModalOpen: boolean;
  closeAuthModal: () => void;
  refreshProfile: (userId?: string) => Promise<void>;
}

export function useGuestAuthFlow({
  authModalOpen,
  closeAuthModal,
  refreshProfile,
}: UseGuestAuthFlowOptions) {
  const supabase = createClient();

  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [phoneStep, setPhoneStep] = useState<"phone_input" | "otp_verify" | "profile_details">(
    "phone_input"
  );

  const [phone, setPhone] = useState("");
  const [sentPhoneDisplay, setSentPhoneDisplay] = useState("");
  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("sms");
  const [sentChannel, setSentChannel] = useState<OtpChannel>("sms");

  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetIdRef = useRef<(() => number | null) | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  const [otp, setOtp] = useState<string[]>(EMPTY_OTP);
  const { otpInputRefs, handleOtpChange, handleOtpKeyDown } = useGuestOtpInput({
    otp,
    setOtp,
  });
  const [timer, setTimer] = useState(45);

  const [isEmailSignIn, setIsEmailSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authModalOpen) {
      setPhoneStep("phone_input");
      setErrorMsg(null);
      setSuccessMsg(null);
      setOtp(EMPTY_OTP());
      setTimer(45);
      setFirstName("");
      setLastName("");
      setContactEmail("");
      confirmationResultRef.current = null;
    }
  }, [authModalOpen]);

  useEffect(() => {
    if (
      !authModalOpen ||
      authMethod !== "phone" ||
      phoneStep !== "phone_input" ||
      otpChannel !== "sms"
    ) {
      return;
    }

    const timerId = window.setTimeout(() => {
      const { verifier, getWidgetId, cleanup } = initGuestRecaptcha({
        container: recaptchaContainerRef.current,
        onSuccess: () => setErrorMsg(null),
        onExpired: () => setErrorMsg("reCAPTCHA expired. Please complete it again."),
        onError: (msg) => setErrorMsg(msg),
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
  }, [authModalOpen, authMethod, phoneStep, otpChannel]);

  useEffect(() => {
    if (!authModalOpen || authMethod !== "phone" || phoneStep !== "phone_input") {
      return;
    }

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
    if (!siteKey || typeof window === "undefined") return;

    let checkInterval: NodeJS.Timeout;
    const initTurnstile = () => {
      const turnstile = (
        window as unknown as {
          turnstile?: {
            render: (el: HTMLElement, opts: Record<string, unknown>) => string;
            remove: (id: string) => void;
          };
        }
      ).turnstile;

      if (!turnstile || !turnstileContainerRef.current) return false;

      try {
        if (turnstileWidgetIdRef.current) {
          try {
            turnstile.remove(turnstileWidgetIdRef.current);
          } catch {}
          turnstileWidgetIdRef.current = null;
        }
        turnstileContainerRef.current.innerHTML = "";
        const id = turnstile.render(turnstileContainerRef.current, {
          sitekey: siteKey,
          size: "invisible",
          callback: (token: string) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken(""),
          theme: "auto",
        });
        turnstileWidgetIdRef.current = id;
        return true;
      } catch (err) {
        console.warn("[Turnstile] invisible render warning:", err);
        return false;
      }
    };

    if (!initTurnstile()) {
      checkInterval = setInterval(() => {
        if (initTurnstile()) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (turnstileWidgetIdRef.current) {
        try {
          const turnstile = (
            window as unknown as { turnstile?: { remove: (id: string) => void } }
          ).turnstile;
          turnstile?.remove(turnstileWidgetIdRef.current);
        } catch {}
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [authModalOpen, authMethod, phoneStep]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phoneStep === "otp_verify" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phoneStep, timer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const formattedCheck = normalizePhoneInput(phone);
      if (formattedCheck) {
        const guard = await checkSignupGuard({
          phone: formattedCheck,
          mode: "otp",
          turnstileToken,
        });
        if (!guard.allowed) {
          throw new Error(
            guard.messageEn ||
              "Only 1 guest account & welcome bonus is allowed per device/IP."
          );
        }
      }

      const res = await executeSendOtp({
        phone,
        otpChannel,
        recaptchaVerifier: recaptchaVerifierRef.current,
        supabase,
      });
      confirmationResultRef.current = res.confirmationResult;
      setSentPhoneDisplay(res.formattedPhone);
      setSentChannel(res.sentChannel);
      setOtp(EMPTY_OTP());
      setPhoneStep("otp_verify");
      setTimer(45);
      window.setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (error) {
      resetRecaptcha(recaptchaWidgetIdRef.current ? recaptchaWidgetIdRef.current() : null);
      setErrorMsg(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await executeVerifyOtp({
        confirmationResult: confirmationResultRef.current,
        enteredCode: otp.join(""),
        sentPhoneDisplay,
        phone,
        supabase,
        refreshProfile,
      });

      setFirstName(res.nextFirstName);
      setLastName(res.nextLastName);
      setContactEmail(res.nextEmail);

      if (res.isComplete) {
        const bonus = await claimWelcomeBonus({ isNewSignup: true });
        setSuccessMsg(
          bonus.awarded
            ? `Welcome to QafNest! +${bonus.amountCredited} SAR welcome gift added to your wallet.`
            : "Welcome to QafNest!"
        );
        window.setTimeout(closeAuthModal, 900);
      } else {
        void claimWelcomeBonus({ isNewSignup: true });
        setPhoneStep("profile_details");
      }
    } catch (error) {
      setErrorMsg(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhoneProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const normalizedEmail = contactEmail.trim().toLowerCase();
    if (!firstName.trim() || !lastName.trim() || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setErrorMsg("Enter your first name, last name, and a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await executeSavePhoneProfile({
        supabase,
        firstName,
        lastName,
        contactEmail: normalizedEmail,
        phone,
        sentPhoneDisplay,
        refreshProfile,
      });

      const bonus = await claimWelcomeBonus({ isNewSignup: true });
      setSuccessMsg(
        bonus.awarded
          ? `Welcome to QafNest! +${bonus.amountCredited} SAR welcome gift credited to your wallet.`
          : "Welcome to QafNest!"
      );
      window.setTimeout(closeAuthModal, 900);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "Your details could not be saved. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (channel: OtpChannel) => {
    if (timer > 0 || loading) return;
    if (channel === "sms" && isFirebaseConfigured()) {
      confirmationResultRef.current = null;
      setOtp(EMPTY_OTP());
      setErrorMsg(null);
      setPhoneStep("phone_input");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const formattedPhone = sentPhoneDisplay || normalizePhoneInput(phone);
      if (!formattedPhone) throw new Error("Please enter a valid mobile number.");
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: { channel },
      });
      if (error) throw error;
      setSentChannel(channel);
      setTimer(45);
      setOtp(EMPTY_OTP());
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "We couldn't resend the code.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await executeEmailAuth({
        supabase,
        isEmailSignIn,
        email,
        password,
        fullName,
        phone,
      });

      setSuccessMsg(result.message);
      if (result.autoCloseDelay) {
        setTimeout(() => closeAuthModal(), result.autoCloseDelay);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return {
    authMethod,
    setAuthMethod,
    phoneStep,
    setPhoneStep,
    phone,
    setPhone,
    sentPhoneDisplay,
    fullName,
    setFullName,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    contactEmail,
    setContactEmail,
    otpChannel,
    setOtpChannel,
    sentChannel,
    recaptchaContainerRef,
    turnstileContainerRef,
    confirmationResultRef,
    otp,
    otpInputRefs,
    timer,
    isEmailSignIn,
    setIsEmailSignIn,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    handleSendOtp,
    handleOtpChange,
    handleOtpKeyDown,
    handleVerifyOtp,
    handleSavePhoneProfile,
    handleResendOtp,
    handleEmailSubmit,
  };
}
