"use client";

import React from "react";
import { Smartphone, MessageCircle, LoaderCircle } from "lucide-react";
import type { OtpChannel } from "../types";
import { OTP_LENGTH } from "../types";

interface ReservationOtpCodeStepProps {
  handleVerifyOtp: (event: React.FormEvent<HTMLFormElement>) => void;
  sentChannel: OtpChannel;
  sentPhone: string | null;
  otpInputRef: React.Ref<HTMLInputElement>;
  otpCode: string;
  setOtpCode: (code: string) => void;
  otpSeconds: number;
  handleResendOtp: (channel: OtpChannel) => void;
  otpBusy: boolean;
  otpError: string | null;
  onResetPhoneState: () => void;
  label: (en: string, ar: string) => string;
}

export function ReservationOtpCodeStep({
  handleVerifyOtp,
  sentChannel,
  sentPhone,
  otpInputRef,
  otpCode,
  setOtpCode,
  otpSeconds,
  handleResendOtp,
  otpBusy,
  otpError,
  onResetPhoneState,
  label,
}: ReservationOtpCodeStepProps) {
  return (
    <form onSubmit={handleVerifyOtp} className="mt-6">
      <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
        {label(
          `Enter the ${OTP_LENGTH}-digit code sent by`,
          `أدخل الرمز المكون من ${OTP_LENGTH} أرقام المرسل عبر`
        )}{" "}
        <strong className="text-gray-900 dark:text-white">
          {sentChannel === "sms" ? "SMS" : "WhatsApp"}
        </strong>{" "}
        {label("to", "إلى")}{" "}
        <strong dir="ltr" className="whitespace-nowrap text-gray-900 dark:text-white">
          {sentPhone}
        </strong>
      </p>
      <div className="mx-auto mt-7 w-full max-w-[360px]" dir="ltr">
        <label htmlFor="reservation-otp-code" className="sr-only">
          {label(
            `${OTP_LENGTH}-digit verification code`,
            `رمز التحقق المكون من ${OTP_LENGTH} أرقام`
          )}
        </label>
        <div className="relative">
          <input
            ref={otpInputRef}
            id="reservation-otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={OTP_LENGTH}
            value={otpCode}
            onChange={(event) =>
              setOtpCode(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
            }
            className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
            aria-label={label(
              `Enter the ${OTP_LENGTH}-digit SMS or WhatsApp code`,
              `أدخل رمز SMS أو واتساب المكون من ${OTP_LENGTH} أرقام`
            )}
            required
          />
          <div
            aria-hidden="true"
            className={`grid gap-2 ${OTP_LENGTH === 4 ? "grid-cols-4" : "grid-cols-6"}`}
          >
            {Array.from({ length: OTP_LENGTH }, (_, index) => (
              <span
                key={index}
                className={`flex h-14 items-center justify-center rounded-2xl border font-mono text-xl font-bold text-gray-950 transition dark:text-white sm:h-16 ${
                  index === otpCode.length
                    ? "border-violet-500 ring-2 ring-violet-100 dark:ring-violet-400/20"
                    : otpCode[index]
                    ? "border-violet-300 bg-violet-50 dark:border-violet-400/30 dark:bg-violet-400/10"
                    : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.02]"
                }`}
              >
                {otpCode[index] ||
                  (index === otpCode.length ? (
                    <span className="h-6 w-0.5 animate-pulse bg-violet-600" />
                  ) : (
                    ""
                  ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{label("Didn't receive the message?", "لم تصلك الرسالة؟")}</span>
        {otpSeconds > 0 && (
          <span className="font-bold tabular-nums text-gray-800 dark:text-gray-200">
            ({`00:${String(otpSeconds).padStart(2, "0")}`})
          </span>
        )}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleResendOtp("sms")}
          disabled={otpBusy || otpSeconds > 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-xs font-bold text-gray-700 transition hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:text-gray-200 dark:hover:bg-violet-400/10 cursor-pointer"
        >
          {otpBusy && sentChannel === "sms" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Smartphone className="h-4 w-4 text-violet-600 dark:text-violet-300" />
          )}
          {label("Resend via SMS", "إعادة الإرسال عبر SMS")}
        </button>
        <button
          type="button"
          onClick={() => handleResendOtp("whatsapp")}
          disabled={otpBusy || otpSeconds > 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-xs font-bold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:text-gray-200 dark:hover:bg-emerald-400/10 cursor-pointer"
        >
          {otpBusy && sentChannel === "whatsapp" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
          )}
          {label("Resend via WhatsApp", "إعادة الإرسال عبر واتساب")}
        </button>
      </div>

      {otpError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
        >
          {otpError}
        </p>
      )}
      <button
        type="submit"
        disabled={otpBusy || otpCode.length !== OTP_LENGTH}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/15 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {otpBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {label("Verify phone", "تحقق من الهاتف")}
      </button>
      <button
        type="button"
        onClick={onResetPhoneState}
        className="mt-3 w-full text-center text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300 cursor-pointer"
      >
        {label("Change phone number", "تغيير رقم الهاتف")}
      </button>
    </form>
  );
}

