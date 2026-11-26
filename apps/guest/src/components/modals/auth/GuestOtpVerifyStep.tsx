"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Loader2, MessageCircle } from "lucide-react";

interface GuestOtpVerifyStepProps {
  otp: string[];
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleOtpChange: (index: number, value: string) => void;
  handleOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  timer: number;
  handleResendOtp: (channel: "sms" | "whatsapp") => void;
  sentPhoneDisplay: string;
  phone: string;
  sentChannel: "sms" | "whatsapp";
  onChangeNumber: () => void;
  errorMsg: string | null;
  successMsg: string | null;
  language: "ar" | "en";
  otpLength: number;
}

export default function GuestOtpVerifyStep({
  otp,
  otpInputRefs,
  handleOtpChange,
  handleOtpKeyDown,
  loading,
  onSubmit,
  timer,
  handleResendOtp,
  sentPhoneDisplay,
  phone,
  sentChannel,
  onChangeNumber,
  errorMsg,
  successMsg,
  language,
  otpLength,
}: GuestOtpVerifyStepProps) {
  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {language === "ar" ? "أدخل رمز التحقق" : "Enter Verification Code"}
        </h3>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
          <span>
            {language === "ar"
              ? `أدخل الرمز المكون من ${otpLength} أرقام المرسل عبر ${
                  sentChannel === "sms" ? "SMS" : "واتساب"
                } إلى `
              : `Enter the ${otpLength}-digit code sent via ${
                  sentChannel === "sms" ? "SMS" : "WhatsApp"
                } to `}
          </span>
          <bdi dir="ltr" className="font-bold text-gray-900 dark:text-white mx-1">
            {sentPhoneDisplay || `+966 ${phone}`}
          </bdi>
          <button
            type="button"
            onClick={onChangeNumber}
            className="inline-flex items-center text-purple-600 dark:text-purple-400 underline font-bold ms-1 cursor-pointer"
          >
            {language === "ar" ? "تغيير الرقم" : "Change"}
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* OTP boxes with responsive scaling to prevent overflow */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full max-w-sm mx-auto" dir="ltr">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                otpInputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(index, e)}
              className="w-11 h-12 sm:w-13 sm:h-14 flex-1 min-w-0 max-w-[50px] text-center font-mono text-lg sm:text-xl font-bold rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
            />
          ))}
        </div>

        {/* Resend Timer & Channels */}
        <div className="text-center text-xs text-gray-500 space-y-2.5">
          {timer > 0 ? (
            <div className="text-gray-400 dark:text-gray-500">
              {language === "ar"
                ? `إعادة إرسال الرمز بعد 00:${String(timer).padStart(2, "0")}`
                : `Resend code in 00:${String(timer).padStart(2, "0")}`}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleResendOtp(sentChannel)}
                disabled={loading}
                className="font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                {language === "ar"
                  ? `إعادة إرسال الرمز عبر ${sentChannel === "sms" ? "SMS" : "WhatsApp"}`
                  : `Resend via ${sentChannel === "sms" ? "SMS" : "WhatsApp"}`}
              </button>
            </div>
          )}

          {/* WhatsApp option if sent via SMS */}
          {sentChannel === "sms" && (
            <div>
              <button
                type="button"
                onClick={() => handleResendOtp("whatsapp")}
                disabled={loading}
                className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer py-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>
                  {language === "ar"
                    ? "أو استلام رمز التحقق عبر واتساب (WhatsApp)"
                    : "Or receive verification code via WhatsApp"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Error & Success */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 break-words">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 break-words">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || otp.join("").length !== otpLength}
          className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>{language === "ar" ? "تحقق ومتابعة" : "Verify & Continue"}</span>
          )}
        </button>
      </form>
    </div>
  );
}

