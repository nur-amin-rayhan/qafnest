"use client";

import React from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

interface HostOtpVerifyStepProps {
  otp: string[];
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleOtpChange: (index: number, value: string) => void;
  handleOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  otpTimer: number;
  onResendOtp: (e: React.FormEvent) => void;
  onChangeNumber: () => void;
  t: (en: string, ar: string) => string;
}

export default function HostOtpVerifyStep({
  otp,
  otpInputRefs,
  handleOtpChange,
  handleOtpKeyDown,
  loading,
  onSubmit,
  otpTimer,
  onResendOtp,
  onChangeNumber,
  t,
}: HostOtpVerifyStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
        <span>{t("Enter 6-digit verification code", "أدخل رمز التحقق المكون من 6 أرقام")}</span>
        <button
          type="button"
          onClick={onChangeNumber}
          className="text-[#4F2396] hover:underline cursor-pointer"
        >
          {t("Change Number", "تغيير الرقم")}
        </button>
      </div>

      {/* 6 OTP Boxes */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5" dir="ltr">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              otpInputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            autoFocus={index === 0}
            className="h-12 w-11 sm:h-14 sm:w-12 rounded-2xl border border-slate-200 bg-slate-50 text-center text-xl font-black text-[#4F2396] outline-none focus:border-[#4F2396] focus:bg-white focus:ring-2 focus:ring-violet-200 transition"
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={loading || otp.join("").length !== otp.length}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4F2396] hover:bg-[#3d1a78] py-3.5 text-sm font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      >
        {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CheckCircle2 size={16} />}
        <span>{loading ? t("Verifying code...", "جارٍ التحقق…") : t("Verify & Sign In", "تأكيد والدخول")}</span>
      </button>

      <div className="text-center">
        {otpTimer > 0 ? (
          <span className="text-xs font-bold text-slate-400">
            {t("Resend code in ", "إعادة الإرسال بعد ")} {otpTimer} {t("s", "ثانية")}
          </span>
        ) : (
          <button
            type="button"
            onClick={onResendOtp}
            className="text-xs font-black text-[#4F2396] hover:underline cursor-pointer"
          >
            {t("Resend Verification Code", "إعادة إرسال رمز التحقق")}
          </button>
        )}
      </div>
    </form>
  );
}

