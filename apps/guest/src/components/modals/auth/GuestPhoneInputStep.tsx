"use client";

import React from "react";
import { AlertCircle, ArrowRight, Loader2, MessageCircle, Smartphone } from "lucide-react";

interface GuestPhoneInputStepProps {
  phone: string;
  setPhone: (val: string) => void;
  otpChannel: "sms" | "whatsapp";
  setOtpChannel: (val: "sms" | "whatsapp") => void;
  setErrorMsg: (msg: string | null) => void;
  recaptchaContainerRef: React.Ref<HTMLDivElement>;
  errorMsg: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  language: "ar" | "en";
}

export default function GuestPhoneInputStep({
  phone,
  setPhone,
  otpChannel,
  setOtpChannel,
  setErrorMsg,
  recaptchaContainerRef,
  errorMsg,
  loading,
  onSubmit,
  language,
}: GuestPhoneInputStepProps) {
  return (
    <>
      <div className="mb-5">
        <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {language === "ar" ? "تسجيل الدخول أو إنشاء حساب" : "Login or Sign up"}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
          {language === "ar"
            ? "أدخل رقم جوالك لتصلك رسالة نصية برمز التحقق للدخول الفوري"
            : "Enter your mobile number to receive a verification code"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Mobile Number Input */}
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
            {language === "ar" ? "رقم الجوال السعودي" : "Mobile Number"}
          </label>
          <div className="flex items-center gap-2" dir="ltr">
            {/* Country Prefix Box */}
            <div className="px-3 py-3 rounded-2xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center gap-1.5 shrink-0 select-none">
              <span className="text-base">🇸🇦</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">+966</span>
            </div>

            {/* Phone Input */}
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
              placeholder="5X XXX XXXX"
              maxLength={16}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 transition"
            />
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
            {language === "ar" ? "إرسال رمز التحقق عبر:" : "Send verification code via:"}
          </span>
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label={language === "ar" ? "قناة رمز التحقق" : "Verification code channel"}
          >
            <button
              type="button"
              role="radio"
              aria-checked={otpChannel === "sms"}
              onClick={() => {
                setOtpChannel("sms");
                setErrorMsg(null);
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                otpChannel === "sms"
                  ? "border-purple-500 bg-purple-50 text-purple-800 ring-1 ring-purple-500 dark:bg-purple-400/10 dark:text-purple-200"
                  : "border-gray-200 text-gray-600 hover:border-purple-300 dark:border-white/10 dark:text-gray-300"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>{language === "ar" ? "رسالة SMS" : "SMS"}</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={otpChannel === "whatsapp"}
              onClick={() => {
                setOtpChannel("whatsapp");
                setErrorMsg(null);
              }}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                otpChannel === "whatsapp"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-200"
                  : "border-gray-200 text-gray-600 hover:border-emerald-300 dark:border-white/10 dark:text-gray-300"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{language === "ar" ? "واتساب WhatsApp" : "WhatsApp"}</span>
            </button>
          </div>
        </div>

        {/* Firebase reCAPTCHA container for SMS */}
        {otpChannel === "sms" && (
          <div className="flex justify-center overflow-x-auto py-1">
            <div ref={recaptchaContainerRef} />
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 break-words">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{language === "ar" ? "متابعة" : "Continue"}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </>
          )}
        </button>
      </form>
    </>
  );
}

