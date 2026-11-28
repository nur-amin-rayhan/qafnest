"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Mail, Globe, Home, Sun, Moon } from "lucide-react";
import { useHostAuth } from "@/context/HostAuthContext";
import HostPhoneInputStep from "./HostPhoneInputStep";
import HostOtpVerifyStep from "./HostOtpVerifyStep";
import HostProfileDetailsStep from "./HostProfileDetailsStep";
import HostEmailAuthStep from "./HostEmailAuthStep";
import { useHostAuthFlow, withLang } from "./useHostAuthFlow";
import { localizeHostPath } from "@/lib/hostLocale";

interface HostLoginFormProps {
  initialLang?: "ar" | "en";
  initialReturnUrl?: string;
  initialAuthMode?: "signin" | "signup";
}

export default function HostLoginForm({
  initialLang = "ar",
  initialReturnUrl,
  initialAuthMode = "signin",
}: HostLoginFormProps) {
  const router = useRouter();
  const { user, loading: authLoading, lang: contextLang, setLang, theme, toggleTheme } = useHostAuth();

  const effectiveLang = contextLang || initialLang;
  const t = (en: string, ar: string) => (effectiveLang === "ar" ? ar : en);
  const returnUrl = withLang(initialReturnUrl || "/app", effectiveLang);

  // If already authenticated, redirect
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(returnUrl);
    }
  }, [user, authLoading, router, returnUrl]);

  // Switch Language handler (navigates to /ar/login or /en/login)
  const handleLanguageToggle = () => {
    const nextLang = effectiveLang === "ar" ? "en" : "ar";
    setLang(nextLang);
  };

  const {
    authMode,
    toggleAuthMode,
    activeTab,
    setActiveTab,
    phoneStep,
    setPhoneStep,
    otpChannel,
    setOtpChannel,
    phone,
    setPhone,
    sentPhoneDisplay,
    otp,
    otpTimer,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    contactEmail,
    setContactEmail,
    isEmailSignIn,
    setIsEmailSignIn,
    email,
    setEmail,
    password,
    setPassword,
    hostBusinessName,
    setHostBusinessName,
    loading,
    errorMsg,
    setErrorMsg,
    successMsg,
    recaptchaContainerRef,
    otpInputRefs,
    handleSendPhoneOtp,
    handleOtpChange,
    handleOtpKeyDown,
    handleVerifyOtp,
    handleSaveHostProfile,
    handleEmailAuth,
    finishAuth,
  } = useHostAuthFlow({
    effectiveLang,
    returnUrl,
    initialAuthMode,
  });

  return (
    <div
      dir={effectiveLang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50/70 dark:bg-[#0b0c16] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 transition-colors duration-200"
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-[440px] flex items-center justify-between mb-5 px-1">
        <Link href={localizeHostPath("/", effectiveLang)} className="inline-flex items-center gap-1.5 select-none group">
          <span className="text-[24px] sm:text-[26px] font-black tracking-[-0.05em] text-[#4F2396] dark:text-purple-400">
            Qaf<span className="text-[#7c3aed] dark:text-purple-300">Nest</span>
            <span className="text-[#FF9750]">.</span>
          </span>
          <span className="rounded-md bg-violet-100/80 dark:bg-purple-950/60 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase text-[#4F2396] dark:text-purple-300">
            {t("BUSINESS", "أعمال")}
          </span>
        </Link>

        {/* Controls: Theme Toggle, Language Switcher, Back Home */}
        <div className="flex items-center gap-2">
          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              title={theme === "dark" ? t("Switch to Light Mode", "التحويل للوضع النهاري") : t("Switch to Dark Mode", "التحويل للوضع الليلي")}
            >
              {theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
            </button>
          )}

          <button
            type="button"
            onClick={handleLanguageToggle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title={effectiveLang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Globe size={13} className="text-slate-500 dark:text-slate-400" />
            <span>{effectiveLang === "ar" ? "English" : "العربية"}</span>
          </button>

          <Link
            href={localizeHostPath("/", effectiveLang)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title={t("Back to home", "العودة للرئيسية")}
          >
            <Home size={14} />
          </Link>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-[450px] rounded-2xl bg-white dark:bg-[#12101a] p-7 sm:p-9 shadow-xs border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Card Title (Centered) */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-center mb-6">
          {phoneStep === "profile_details"
            ? t("Complete your profile", "استكمال ملف المضيف")
            : phoneStep === "otp_verify"
            ? t("Verify your phone number", "التحقق من رقم الجوال")
            : authMode === "signup"
            ? t("Register as Host Partner", "تسجيل شريك مضيف جديد")
            : t("Host Partner Sign In", "تسجيل دخول المضيفين")}
        </h1>
        {phoneStep === "otp_verify" && (
          <p className="-mt-4 mb-6 text-center text-xs text-slate-500 dark:text-slate-400 font-normal">{sentPhoneDisplay}</p>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/40 p-3.5 text-xs font-medium leading-relaxed text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div role="status" className="mb-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 text-xs font-medium leading-relaxed text-emerald-800 dark:text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Tab Switcher: Phone vs Email */}
        {phoneStep === "phone_input" && (
          <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 p-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => {
                setActiveTab("phone");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition cursor-pointer ${
                activeTab === "phone"
                  ? "bg-white dark:bg-[#1f1a30] text-slate-900 dark:text-white font-semibold shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Phone size={13} />
              <span>{t("Mobile OTP", "رقم الجوال")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("email");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition cursor-pointer ${
                activeTab === "email"
                  ? "bg-white dark:bg-[#1f1a30] text-slate-900 dark:text-white font-semibold shadow-2xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Mail size={13} />
              <span>{t("Email & Password", "البريد الإلكتروني")}</span>
            </button>
          </div>
        )}

        {/* TAB 1: PHONE LOGIN */}
        {activeTab === "phone" && (
          <div>
            {phoneStep === "phone_input" && (
              <HostPhoneInputStep
                phone={phone}
                setPhone={setPhone}
                otpChannel={otpChannel}
                setOtpChannel={setOtpChannel}
                recaptchaContainerRef={recaptchaContainerRef}
                loading={loading}
                onSubmit={handleSendPhoneOtp}
                t={t}
                effectiveLang={effectiveLang}
                authMode={authMode}
                onToggleAuthMode={toggleAuthMode}
              />
            )}

            {phoneStep === "otp_verify" && (
              <HostOtpVerifyStep
                otp={otp}
                otpInputRefs={otpInputRefs}
                handleOtpChange={handleOtpChange}
                handleOtpKeyDown={handleOtpKeyDown}
                loading={loading}
                onSubmit={handleVerifyOtp}
                otpTimer={otpTimer}
                onResendOtp={handleSendPhoneOtp}
                onChangeNumber={() => setPhoneStep("phone_input")}
                t={t}
                authMode={authMode}
              />
            )}

            {phoneStep === "profile_details" && (
              <HostProfileDetailsStep
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                contactEmail={contactEmail}
                setContactEmail={setContactEmail}
                loading={loading}
                onSubmit={handleSaveHostProfile}
                onSkip={() => finishAuth()}
                t={t}
                effectiveLang={effectiveLang}
              />
            )}
          </div>
        )}

        {/* TAB 2: EMAIL LOGIN */}
        {activeTab === "email" && phoneStep === "phone_input" && (
          <HostEmailAuthStep
            isEmailSignIn={isEmailSignIn}
            setIsEmailSignIn={setIsEmailSignIn}
            hostBusinessName={hostBusinessName}
            setHostBusinessName={setHostBusinessName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            onSubmit={handleEmailAuth}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
