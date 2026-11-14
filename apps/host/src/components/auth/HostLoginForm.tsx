"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Mail, ShieldCheck, Globe, Home, Check } from "lucide-react";
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
}

export default function HostLoginForm({
  initialLang = "ar",
  initialReturnUrl,
}: HostLoginFormProps) {
  const router = useRouter();
  const { user, loading: authLoading, lang: contextLang, setLang } = useHostAuth();

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
    handleDevHostFill,
    finishAuth,
  } = useHostAuthFlow({
    effectiveLang,
    returnUrl,
  });

  return (
    <div
      dir={effectiveLang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/30 text-slate-900 flex flex-col justify-center items-center px-4 py-8 sm:py-12"
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-[480px] flex items-center justify-between mb-6 px-1">
        <Link href={localizeHostPath("/", effectiveLang)} className="inline-flex items-center gap-1.5 select-none group">
          <span className="text-[26px] sm:text-[28px] font-black tracking-[-0.05em] text-[#4F2396]">
            Qaf<span className="text-[#7c3aed]">Nest</span>
            <span className="text-[#FF9750]">.</span>
          </span>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black tracking-wider uppercase text-[#4F2396]">
            {t("BUSINESS", "أعمال")}
          </span>
        </Link>

        {/* Language Switcher Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLanguageToggle}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-black text-[#4F2396] hover:bg-violet-50 shadow-xs transition cursor-pointer"
            title={effectiveLang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Globe size={13} className="text-[#FF9750]" />
            <span>{effectiveLang === "ar" ? "English" : "العربية"}</span>
          </button>

          <Link
            href={localizeHostPath("/", effectiveLang)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-xs transition cursor-pointer"
            title={t("Back to home", "العودة للرئيسية")}
          >
            <Home size={13} />
          </Link>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-[480px] rounded-[32px] bg-white p-7 sm:p-9 shadow-[0_20px_70px_rgba(79,35,150,0.08)] border border-violet-100 text-slate-900">
        {/* Ministry of Tourism Trust Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1 text-xs font-black text-[#4F2396]">
          <ShieldCheck size={14} className="text-[#FF9750]" />
          <span>{t("Verified Host Portal · Saudi Ministry of Tourism", "بوابة المضيفين المعتمدة · وزارة السياحة")}</span>
        </div>

        {/* Card Title & Subtitle */}
        <h1 className="mt-4 text-2xl font-black tracking-tight text-[#010112]">
          {phoneStep === "profile_details"
            ? t("Complete Host Profile", "إكمال ملف المضيف")
            : phoneStep === "otp_verify"
            ? t("Verify Mobile Number", "التحقق من رقم الجوال")
            : t("Host Partner Sign In", "تسجيل دخول المضيفين")}
        </h1>
        <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-500">
          {phoneStep === "profile_details"
            ? t("Add your name to finalize your host profile on QafNest.", "أدخل اسمك لاستكمال ملفك كمضيف معتمد على منصة قاف نست.")
            : phoneStep === "otp_verify"
            ? `${t("Enter the 6-digit verification code sent to ", "أدخل رمز التحقق المرسل إلى ")} ${sentPhoneDisplay}`
            : t("Access your host dashboard to manage your properties, reservations, and payouts securely.", "أدر عقاراتك، حجوزاتك، والتوافر، وأرباحك الشهرية بأمان.")}
        </p>

        {/* Alerts */}
        {errorMsg && (
          <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold leading-5 text-rose-700">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div role="status" className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold leading-5 text-emerald-800">
            {successMsg}
          </div>
        )}

        {/* Tab Switcher: Phone vs Email */}
        <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1 text-xs font-black">
          <button
            type="button"
            onClick={() => {
              setActiveTab("phone");
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition cursor-pointer ${
              activeTab === "phone"
                ? "bg-white text-[#4F2396] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Phone size={14} />
            <span>{t("Mobile (OTP)", "رقم الجوال")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("email");
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition cursor-pointer ${
              activeTab === "email"
                ? "bg-white text-[#4F2396] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mail size={14} />
            <span>{t("Email & Password", "البريد الإلكتروني")}</span>
          </button>
        </div>

        {/* TAB 1: PHONE LOGIN */}
        {activeTab === "phone" && (
          <div className="mt-5">
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
        {activeTab === "email" && (
          <HostEmailAuthStep
            isEmailSignIn={isEmailSignIn}
            setIsEmailSignIn={setIsEmailSignIn}
            hostBusinessName={hostBusinessName}
            setHostBusinessName={setHostBusinessName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            onDevHostFill={handleDevHostFill}
            loading={loading}
            onSubmit={handleEmailAuth}
            t={t}
          />
        )}

        {/* Security & Support Guarantee */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <Check size={12} className="text-emerald-600" />
            {t("256-bit Encrypted Session", "جلسة آمنة ومشفرة 256-bit")}
          </span>
          <a
            href="https://wa.me/966576707709"
            target="_blank"
            rel="noreferrer"
            className="text-[#4F2396] hover:underline"
          >
            {t("24/7 Host Support: 0576707709", "دعم المضيفين 24/7: 0576707709")}
          </a>
        </div>
      </div>
    </div>
  );
}
