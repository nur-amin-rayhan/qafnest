"use client";

import React, { useEffect } from "react";
import { X, Phone, Mail, Globe } from "lucide-react";
import { useHostAuth } from "@/context/HostAuthContext";
import { localizeHostPath, sanitizeHostReturnPath } from "@/lib/hostLocale";
import HostPhoneInputStep from "@/components/auth/HostPhoneInputStep";
import HostOtpVerifyStep from "@/components/auth/HostOtpVerifyStep";
import HostProfileDetailsStep from "@/components/auth/HostProfileDetailsStep";
import HostEmailAuthStep from "@/components/auth/HostEmailAuthStep";
import { useHostAuthFlow } from "@/components/auth/useHostAuthFlow";

export default function HostAuthModal() {
  const {
    hostAuthModalOpen,
    hostAuthMode,
    closeHostAuthModal,
    hostReturnUrl,
    lang,
    t,
    toggleLang,
  } = useHostAuth();

  // Close modal on Escape key press
  useEffect(() => {
    if (!hostAuthModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeHostAuthModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hostAuthModalOpen, closeHostAuthModal]);

  const safeReturnTarget = hostReturnUrl
    ? localizeHostPath(sanitizeHostReturnPath(hostReturnUrl, "/app"), lang)
    : localizeHostPath("/app", lang);

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
  } = useHostAuthFlow({
    effectiveLang: lang,
    returnUrl: safeReturnTarget,
    initialAuthMode: hostAuthMode,
    onSuccess: () => {
      closeHostAuthModal();
      if (hostReturnUrl) {
        window.location.href = safeReturnTarget;
      }
    },
  });

  if (!hostAuthModalOpen) return null;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeHostAuthModal();
      }}
    >
      <div className="relative w-full max-w-[440px] rounded-2xl bg-white p-7 sm:p-8 shadow-2xl border border-slate-200/90 text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Top Controls: Brand, Language & Close */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="inline-flex items-center gap-1.5 select-none">
            <span className="text-[20px] font-black tracking-[-0.05em] text-[#4F2396]">
              Qaf<span className="text-[#7c3aed]">Nest</span>
              <span className="text-[#FF9750]">.</span>
            </span>
            <span className="rounded-md bg-violet-100/80 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase text-[#4F2396]">
              {t("BUSINESS", "أعمال")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Globe size={13} className="text-slate-500" />
              <span>{lang === "ar" ? "English" : "العربية"}</span>
            </button>

            <button
              type="button"
              onClick={closeHostAuthModal}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Card Title (Centered) */}
        <h2 className="mt-5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 text-center mb-6">
          {phoneStep === "profile_details"
            ? t("Complete your profile", "استكمال ملف المضيف")
            : phoneStep === "otp_verify"
            ? t("Verify your phone number", "التحقق من رقم الجوال")
            : authMode === "signup"
            ? t("Register Your Property", "سجل عقارك وابدأ الاستضافة")
            : t("Host Partner Sign In", "تسجيل دخول المضيفين")}
        </h2>
        {phoneStep === "otp_verify" && (
          <p className="-mt-4 mb-6 text-center text-xs text-slate-500 font-normal">{sentPhoneDisplay}</p>
        )}

        {/* Alerts */}
        {errorMsg && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs font-medium leading-relaxed text-red-700">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs font-medium leading-relaxed text-emerald-800">
            {successMsg}
          </div>
        )}

        {/* Tab Switcher: Phone vs Email */}
        {phoneStep === "phone_input" && (
          <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1.5 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => {
                setActiveTab("phone");
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 transition cursor-pointer ${
                activeTab === "phone"
                  ? "bg-white text-slate-900 font-semibold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
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
                  ? "bg-white text-slate-900 font-semibold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Mail size={13} />
              <span>{t("Email & Password", "البريد الإلكتروني")}</span>
            </button>
          </div>
        )}

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
                effectiveLang={lang}
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
                onSkip={() => {
                  closeHostAuthModal();
                  if (hostReturnUrl) window.location.href = safeReturnTarget;
                }}
                t={t}
                effectiveLang={lang}
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
            loading={loading}
            onSubmit={handleEmailAuth}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
