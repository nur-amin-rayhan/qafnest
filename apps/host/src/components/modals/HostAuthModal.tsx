"use client";

import React from "react";
import { X, Phone, Mail, ShieldCheck, Globe } from "lucide-react";
import { useHostAuth } from "@/context/HostAuthContext";
import HostPhoneInputStep from "@/components/auth/HostPhoneInputStep";
import HostOtpVerifyStep from "@/components/auth/HostOtpVerifyStep";
import HostProfileDetailsStep from "@/components/auth/HostProfileDetailsStep";
import HostEmailAuthStep from "@/components/auth/HostEmailAuthStep";
import { useHostAuthFlow } from "@/components/auth/useHostAuthFlow";

export default function HostAuthModal() {
  const {
    hostAuthModalOpen,
    closeHostAuthModal,
    hostReturnUrl,
    lang,
    t,
    toggleLang,
  } = useHostAuth();

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
  } = useHostAuthFlow({
    effectiveLang: lang,
    returnUrl: hostReturnUrl || `/${lang}/app`,
    onSuccess: () => {
      closeHostAuthModal();
      if (hostReturnUrl) {
        window.location.href = hostReturnUrl;
      }
    },
  });

  if (!hostAuthModalOpen) return null;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-[480px] rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-violet-100 text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Top Controls: Language & Close */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-black text-[#4F2396] hover:bg-violet-50 transition cursor-pointer"
          >
            <Globe size={13} className="text-[#FF9750]" />
            <span>{lang === "ar" ? "English" : "العربية"}</span>
          </button>

          <button
            type="button"
            onClick={closeHostAuthModal}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ministry of Tourism Trust Badge */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1 text-xs font-black text-[#4F2396]">
          <ShieldCheck size={14} className="text-[#FF9750]" />
          <span>{t("Verified Host Portal · Saudi Ministry of Tourism", "بوابة المضيفين المعتمدة · وزارة السياحة")}</span>
        </div>

        {/* Card Title & Subtitle */}
        <h2 className="mt-3 text-xl sm:text-2xl font-black tracking-tight text-[#010112]">
          {phoneStep === "profile_details"
            ? t("Complete Host Profile", "إكمال ملف المضيف")
            : phoneStep === "otp_verify"
            ? t("Verify Mobile Number", "التحقق من رقم الجوال")
            : t("Host Partner Sign In", "تسجيل دخول المضيفين")}
        </h2>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
          {phoneStep === "profile_details"
            ? t("Add your name to finalize your host profile on QafNest.", "أدخل اسمك لاستكمال ملفك كمضيف معتمد على منصة قاف نست.")
            : phoneStep === "otp_verify"
            ? `${t("Enter the 6-digit verification code sent to ", "أدخل رمز التحقق المرسل إلى ")} ${sentPhoneDisplay}`
            : t("Access your host dashboard to manage your properties and bookings.", "أدر عقاراتك، حجوزاتك، والتوافر، وأرباحك الشهرية بأمان.")}
        </p>

        {/* Alerts */}
        {errorMsg && (
          <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div role="status" className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
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
                effectiveLang={lang}
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
                onSkip={() => {
                  closeHostAuthModal();
                  if (hostReturnUrl) window.location.href = hostReturnUrl;
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
            onDevHostFill={handleDevHostFill}
            loading={loading}
            onSubmit={handleEmailAuth}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
