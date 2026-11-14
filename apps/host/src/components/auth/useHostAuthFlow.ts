"use client";

import { useState, useEffect, useRef } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { createClient } from "@/lib/supabase/client";
import { getFirebaseErrorMessage } from "@/lib/firebase/client";
import { useHostAuth } from "@/context/HostAuthContext";
import {
  AuthTab,
  PhoneStep,
  OtpChannel,
  OTP_LENGTH,
  withLang,
  initHostRecaptcha,
  executeSendHostPhoneOtp,
  executeVerifyHostOtp,
  executeSaveHostProfile,
  executeHostEmailAuth,
} from "./hostAuthHelpers";
import { useHostOtpInput } from "./useHostOtpInput";

export type { AuthTab, PhoneStep, OtpChannel };
export { OTP_LENGTH, withLang };

interface UseHostAuthFlowOptions {
  effectiveLang: "ar" | "en";
  returnUrl?: string;
  onSuccess?: () => void;
}

export function useHostAuthFlow({
  effectiveLang,
  returnUrl = "/app",
  onSuccess,
}: UseHostAuthFlowOptions) {
  const { setHostUser } = useHostAuth();
  const [supabase] = useState(() => createClient());

  const [activeTab, setActiveTab] = useState<AuthTab>("phone");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone_input");
  const [otpChannel, setOtpChannel] = useState<OtpChannel>("sms");
  const [phone, setPhone] = useState("");
  const [sentPhoneDisplay, setSentPhoneDisplay] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const { otpInputRefs, handleOtpChange, handleOtpKeyDown } = useHostOtpInput({ otp, setOtp });
  const [otpTimer, setOtpTimer] = useState(0);

  // New Host Profile Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Email login state
  const [isEmailSignIn, setIsEmailSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hostBusinessName, setHostBusinessName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  // Resend OTP countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  // Initialize Firebase reCAPTCHA for phone authentication
  useEffect(() => {
    if (phoneStep !== "phone_input") return;
    let mounted = true;
    const timerId = window.setTimeout(() => {
      if (!mounted || !recaptchaContainerRef.current) return;
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = initHostRecaptcha({
          container: recaptchaContainerRef.current,
          effectiveLang,
          onError: (msg) => setErrorMsg(msg),
        });
      }
    }, 100);

    return () => {
      mounted = false;
      window.clearTimeout(timerId);
    };
  }, [phoneStep, effectiveLang]);

  // Navigate after success
  const finishAuth = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      setTimeout(() => {
        window.location.replace(withLang(returnUrl, effectiveLang));
      }, 350);
    }
  };

  // 1. Send OTP
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await executeSendHostPhoneOtp({
        phone,
        otpChannel,
        recaptchaVerifier: recaptchaVerifierRef.current,
        effectiveLang,
        supabase,
      });
      confirmationResultRef.current = res.confirmationResult;
      setSentPhoneDisplay(res.formattedPhone);
      setPhoneStep("otp_verify");
      setOtpTimer(60);
      setSuccessMsg(
        effectiveLang === "ar"
          ? `تم إرسال رمز التحقق بنجاح إلى ${res.formattedPhone}`
          : `Verification code sent successfully to ${res.formattedPhone}`
      );
    } catch (err: unknown) {
      setErrorMsg(getFirebaseErrorMessage(err));
      try {
        recaptchaVerifierRef.current?.render();
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const enteredCode = otp.join("");
    if (enteredCode.length !== OTP_LENGTH) {
      setErrorMsg(
        effectiveLang === "ar"
          ? `يرجى إدخال رمز التحقق المكون من ${OTP_LENGTH} أرقام.`
          : `Please enter the complete ${OTP_LENGTH}-digit verification code.`
      );
      return;
    }

    setLoading(true);
    try {
      const { nextFirstName, nextLastName, nextEmail, shouldFinish } = await executeVerifyHostOtp({
        confirmationResult: confirmationResultRef.current,
        enteredCode,
        sentPhoneDisplay,
        phone,
        effectiveLang,
        supabase,
        setHostUser,
      });

      setFirstName(nextFirstName);
      setLastName(nextLastName);
      setContactEmail(nextEmail);

      if (shouldFinish) {
        setSuccessMsg(
          effectiveLang === "ar"
            ? "تم تسجيل الدخول بنجاح! جارٍ تحويلك إلى لوحة التحكم..."
            : "Signed in successfully! Redirecting to dashboard..."
        );
        finishAuth();
      } else {
        setPhoneStep("profile_details");
      }
    } catch (err: unknown) {
      setErrorMsg(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Complete Profile Details
  const handleSaveHostProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg(
        effectiveLang === "ar"
          ? "يرجى إدخال اسم المضيف أو الاسم التجاري واسم العائلة."
          : "Please enter your first and last name."
      );
      return;
    }
    const normalizedEmail = contactEmail.trim().toLowerCase();
    if (normalizedEmail && !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setErrorMsg(
        effectiveLang === "ar"
          ? "يرجى إدخال بريد إلكتروني صحيح أو تركه فارغاً."
          : "Please enter a valid email address or leave it blank."
      );
      return;
    }

    setLoading(true);
    try {
      await executeSaveHostProfile({
        firstName,
        lastName,
        contactEmail,
        phone,
        sentPhoneDisplay,
        effectiveLang,
        setHostUser,
      });

      setSuccessMsg(
        effectiveLang === "ar"
          ? "تم حفظ البيانات بنجاح! جارٍ التحويل إلى لوحة التحكم..."
          : "Profile saved successfully! Redirecting to dashboard..."
      );
      finishAuth();
    } catch {
      setErrorMsg(
        effectiveLang === "ar"
          ? "حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى."
          : "Failed to save profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // 4. Email Auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await executeHostEmailAuth({
        supabase,
        isEmailSignIn,
        email,
        password,
        hostBusinessName,
        effectiveLang,
        setHostUser,
      });

      setSuccessMsg(result.message);
      if (result.shouldFinish) {
        finishAuth();
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : effectiveLang === "ar"
          ? "فشل تسجيل الدخول بالبريد الإلكتروني."
          : "Email sign-in failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick Dev Login
  const handleDevHostFill = () => {
    setEmail(process.env.NEXT_PUBLIC_DEV_HOST_EMAIL || "host.dev@qafnest.com");
    setPassword(process.env.NEXT_PUBLIC_DEV_HOST_PASSWORD || "QafNest@Dev2026!");
    setIsEmailSignIn(true);
    setActiveTab("email");
  };

  return {
    activeTab, setActiveTab, phoneStep, setPhoneStep,
    otpChannel, setOtpChannel, phone, setPhone,
    sentPhoneDisplay, otp, otpTimer,
    firstName, setFirstName, lastName, setLastName,
    contactEmail, setContactEmail,
    isEmailSignIn, setIsEmailSignIn,
    email, setEmail, password, setPassword,
    hostBusinessName, setHostBusinessName,
    loading, errorMsg, setErrorMsg, successMsg,
    recaptchaContainerRef, otpInputRefs,
    handleSendPhoneOtp, handleOtpChange, handleOtpKeyDown,
    handleVerifyOtp, handleSaveHostProfile, handleEmailAuth,
    handleDevHostFill, finishAuth,
  };
}
