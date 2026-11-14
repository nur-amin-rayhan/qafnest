"use client";

import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Mail,
  LoaderCircle,
  Smartphone,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import type { OtpChannel } from "./types";

interface ReservationGuestVerificationProps {
  phoneVerified: boolean;
  phoneOtpVerified: boolean;
  effectiveName: string;
  reservationPhone: string;
  effectiveEmail: string;
  user: unknown;
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  otpChannel: OtpChannel;
  setOtpChannel: (channel: OtpChannel) => void;
  otpBusy: boolean;
  otpSent: boolean;
  otpError: string | null;
  setOtpError: (err: string | null) => void;
  handleSendOtp: (event: React.FormEvent<HTMLFormElement>) => void;
  onOpenProfileStep: () => void;
  onOpenCodeStep: () => void;
  recaptchaContainerRef: React.Ref<HTMLDivElement>;
  label: (en: string, ar: string) => string;
}

export default function ReservationGuestVerification({
  phoneVerified,
  phoneOtpVerified,
  effectiveName,
  reservationPhone,
  effectiveEmail,
  user,
  phoneNumber,
  setPhoneNumber,
  otpChannel,
  setOtpChannel,
  otpBusy,
  otpSent,
  otpError,
  setOtpError,
  handleSendOtp,
  onOpenProfileStep,
  onOpenCodeStep,
  recaptchaContainerRef,
  label,
}: ReservationGuestVerificationProps) {
  return (
    <section
      id="phone-verification"
      className="mt-6 scroll-mt-28 rounded-3xl border border-violet-200/85 bg-white p-5 shadow-[0_12px_35px_rgba(109,40,217,0.06)] dark:border-violet-500/20 dark:bg-[#12101a] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">
              {label("Guest Information", "بيانات الضيف")}
            </h2>
          </div>
          {phoneVerified ? (
            <div className="mt-3 space-y-1">
              <p className="text-base font-extrabold text-gray-900 dark:text-white">
                {effectiveName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {label("Verified mobile", "رقم الجوال المتحقق منه")}:{" "}
                <strong dir="ltr" className="text-gray-900 dark:text-white font-mono">
                  {reservationPhone}
                </strong>
              </p>
              {effectiveEmail && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {label("Email address", "البريد الإلكتروني")}:{" "}
                  <span dir="ltr">{effectiveEmail}</span>
                </p>
              )}
            </div>
          ) : user ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 rounded-xl border border-violet-200/80 bg-violet-50/60 px-3.5 py-2 text-xs font-semibold text-violet-900 dark:border-violet-500/20 dark:bg-violet-950/30 dark:text-violet-200">
                <Mail className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                <span>
                  {label("Signed in as:", "تم تسجيل الدخول كـ:")}{" "}
                  <strong dir="ltr">{effectiveEmail || effectiveName}</strong>
                </span>
              </div>
              <p className="text-xs leading-5 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 rounded-xl px-3.5 py-2">
                {label(
                  "A verified Saudi mobile number is required before completing your booking. Please verify your mobile number below.",
                  "تشترط إجراءات الحجز توثيق رقم جوال سعودي قبل إتمام الحجز. يُرجى التحقق من رقم جوالك أدناه للمتابعة."
                )}
              </p>
            </div>
          ) : phoneOtpVerified ? (
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              {label(
                "Phone verified. Add your name to finish your guest profile.",
                "تم التحقق من الهاتف. أضف اسمك لإكمال ملف الضيف."
              )}
            </p>
          ) : (
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              {label(
                "Please sign in or enter your mobile number to continue. You will stay on this reservation page.",
                "يرجى تسجيل الدخول أو إدخال رقم جوالك للمتابعة. ستبقى في صفحة الحجز نفسها."
              )}
            </p>
          )}
        </div>
        {phoneVerified ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
            {label("Signed In & Verified", "تم تسجيل الدخول والتوثيق")}
          </span>
        ) : null}
      </div>

      {!phoneVerified && (
        <div className="mt-5">
          {phoneOtpVerified ? (
            <button
              type="button"
              onClick={onOpenProfileStep}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-violet-800 cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              {label("Add name", "أضف الاسم")}
            </button>
          ) : (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <label
                htmlFor="reservation-phone"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                {label("Mobile number", "رقم الجوال")}
              </label>
              <div className="flex gap-2" dir="ltr">
                <span className="flex shrink-0 items-center rounded-2xl border border-violet-200/80 bg-violet-50/50 px-4 text-sm font-semibold text-violet-900 dark:border-violet-500/20 dark:bg-violet-950/30 dark:text-violet-200">
                  +966
                </span>
                <input
                  id="reservation-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="5X XXX XXXX"
                  maxLength={14}
                  className="min-w-0 flex-1 rounded-2xl border border-violet-200/80 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 dark:border-violet-500/20 dark:bg-[#0b0912] dark:text-white"
                  aria-label={label("Saudi mobile number", "رقم الجوال السعودي")}
                  required
                />
                <button
                  type="submit"
                  disabled={otpBusy}
                  className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-violet-800 disabled:opacity-60 cursor-pointer"
                >
                  {otpBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {otpChannel === "sms"
                    ? label("Send SMS code", "إرسال رمز SMS")
                    : label("Send WhatsApp code", "إرسال رمز واتساب")}
                </button>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                  {label("Send verification code by", "أرسل رمز التحقق عبر")}
                </p>
                <div
                  className="grid grid-cols-2 gap-2 sm:max-w-sm"
                  role="radiogroup"
                  aria-label={label("Verification delivery channel", "قناة إرسال رمز التحقق")}
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={otpChannel === "sms"}
                    onClick={() => {
                      setOtpChannel("sms");
                      setOtpError(null);
                    }}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                      otpChannel === "sms"
                        ? "border-violet-500 bg-violet-50 text-violet-800 ring-1 ring-violet-500 dark:bg-violet-400/10 dark:text-violet-200"
                        : "border-violet-200/70 text-gray-600 hover:border-violet-300 dark:border-violet-500/20 dark:text-gray-300"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" /> SMS
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={otpChannel === "whatsapp"}
                    onClick={() => {
                      setOtpChannel("whatsapp");
                      setOtpError(null);
                    }}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-bold transition cursor-pointer ${
                      otpChannel === "whatsapp"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-200"
                        : "border-violet-200/70 text-gray-600 hover:border-emerald-300 dark:border-violet-500/20 dark:text-gray-300"
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </button>
                </div>
              </div>
              {otpChannel === "sms" && (
                <div className="overflow-x-auto pt-1">
                  <div ref={recaptchaContainerRef} />
                </div>
              )}
            </form>
          )}
          {otpSent && !phoneOtpVerified && (
            <button
              type="button"
              onClick={onOpenCodeStep}
              className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 dark:border-violet-400/20 dark:text-violet-300 dark:hover:bg-violet-400/10 cursor-pointer"
            >
              {label("Continue with verification code", "تابع باستخدام رمز التحقق")}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          )}
          {otpError && (
            <p
              role="alert"
              className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
            >
              {otpError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
