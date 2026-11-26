"use client";

import { X, ShieldCheck, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";

import GuestPhoneInputStep from "./auth/GuestPhoneInputStep";
import GuestOtpVerifyStep from "./auth/GuestOtpVerifyStep";
import GuestProfileDetailsStep from "./auth/GuestProfileDetailsStep";
import GuestEmailAuthStep from "./auth/GuestEmailAuthStep";
import { useGuestAuthFlow, OTP_LENGTH } from "./auth/useGuestAuthFlow";

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, refreshProfile } = useAuth();
  const { language } = useApp();

  const {
    authMethod,
    setAuthMethod,
    phoneStep,
    setPhoneStep,
    phone,
    setPhone,
    sentPhoneDisplay,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    contactEmail,
    setContactEmail,
    sentChannel,
    recaptchaContainerRef,
    turnstileContainerRef,
    confirmationResultRef,
    otp,
    otpInputRefs,
    timer,
    email,
    setEmail,
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
  } = useGuestAuthFlow({
    authModalOpen,
    closeAuthModal,
    refreshProfile,
  });

  if (!authModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
      onClick={closeAuthModal}
    >
      <div
        dir={language === "ar" ? "rtl" : "ltr"}
        className="w-full max-w-[460px] rounded-3xl p-6 sm:p-8 relative shadow-2xl bg-white dark:bg-[#0E0E1A] border border-gray-100 dark:border-white/10 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Ministry Badge (Start) & Close Button (End) */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 shrink min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="truncate">
              {language === "ar"
                ? "معتمد ومرخص من وزارة السياحة"
                : "Saudi Tourism Verified"}
            </span>
          </span>

          <button
            onClick={closeAuthModal}
            className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label={language === "ar" ? "إغلاق النافذة" : "Close modal"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PHONE NUMBER AUTH FLOW */}
        {authMethod === "phone" && (
          <div>
            {phoneStep === "phone_input" && (
              <GuestPhoneInputStep
                phone={phone}
                setPhone={setPhone}
                recaptchaContainerRef={recaptchaContainerRef}
                turnstileContainerRef={turnstileContainerRef}
                errorMsg={errorMsg}
                loading={loading}
                onSubmit={handleSendOtp}
                language={language}
              />
            )}

            {phoneStep === "otp_verify" && (
              <GuestOtpVerifyStep
                otp={otp}
                otpInputRefs={otpInputRefs}
                handleOtpChange={handleOtpChange}
                handleOtpKeyDown={handleOtpKeyDown}
                loading={loading}
                onSubmit={handleVerifyOtp}
                timer={timer}
                handleResendOtp={handleResendOtp}
                sentPhoneDisplay={sentPhoneDisplay}
                phone={phone}
                sentChannel={sentChannel}
                onChangeNumber={() => {
                  confirmationResultRef.current = null;
                  setErrorMsg(null);
                  setPhoneStep("phone_input");
                }}
                errorMsg={errorMsg}
                successMsg={successMsg}
                language={language}
                otpLength={OTP_LENGTH}
              />
            )}

            {phoneStep === "profile_details" && (
              <GuestProfileDetailsStep
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                contactEmail={contactEmail}
                setContactEmail={setContactEmail}
                errorMsg={errorMsg}
                successMsg={successMsg}
                loading={loading}
                onSubmit={handleSavePhoneProfile}
                language={language}
              />
            )}

            {/* Switch to Email Button */}
            {phoneStep === "phone_input" && (
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("email");
                    setPhoneStep("phone_input");
                    setErrorMsg(null);
                  }}
                  className="text-xs font-semibold text-gray-500 hover:text-purple-700 dark:hover:text-purple-400 transition-colors inline-flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    {language === "ar"
                      ? "أو المتابعة عبر البريد الإلكتروني"
                      : "Or continue with Email"}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* PASSWORDLESS EMAIL AUTH FLOW */}
        {authMethod === "email" && (
          <div>
            {phoneStep === "phone_input" && (
              <GuestEmailAuthStep
                email={email}
                setEmail={setEmail}
                onSwitchToPhone={() => {
                  setAuthMethod("phone");
                  setPhoneStep("phone_input");
                  setErrorMsg(null);
                }}
                errorMsg={errorMsg}
                successMsg={successMsg}
                loading={loading}
                onSubmit={handleEmailSubmit}
                language={language}
                turnstileContainerRef={turnstileContainerRef}
              />
            )}

            {phoneStep === "otp_verify" && (
              <GuestOtpVerifyStep
                otp={otp}
                otpInputRefs={otpInputRefs}
                handleOtpChange={handleOtpChange}
                handleOtpKeyDown={handleOtpKeyDown}
                loading={loading}
                onSubmit={handleVerifyOtp}
                timer={timer}
                handleResendOtp={handleResendOtp}
                sentPhoneDisplay={sentPhoneDisplay}
                phone={phone}
                sentChannel={sentChannel}
                onChangeNumber={() => {
                  setErrorMsg(null);
                  setPhoneStep("phone_input");
                }}
                errorMsg={errorMsg}
                successMsg={successMsg}
                language={language}
                otpLength={OTP_LENGTH}
              />
            )}

            {phoneStep === "profile_details" && (
              <GuestProfileDetailsStep
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                contactEmail={contactEmail || email}
                setContactEmail={setContactEmail}
                errorMsg={errorMsg}
                successMsg={successMsg}
                loading={loading}
                onSubmit={handleSavePhoneProfile}
                language={language}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
