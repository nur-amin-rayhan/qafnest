"use client";

import React from "react";
import { ArrowRight, LoaderCircle, MessageCircle, Smartphone } from "lucide-react";

interface HostPhoneInputStepProps {
  phone: string;
  setPhone: (val: string) => void;
  otpChannel: "sms" | "whatsapp";
  setOtpChannel: (val: "sms" | "whatsapp") => void;
  recaptchaContainerRef: React.Ref<HTMLDivElement>;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  t: (en: string, ar: string) => string;
  effectiveLang: "ar" | "en";
  authMode?: "signin" | "signup";
  onToggleAuthMode?: () => void;
}

export default function HostPhoneInputStep({
  phone,
  setPhone,
  otpChannel,
  setOtpChannel,
  recaptchaContainerRef,
  loading,
  onSubmit,
  t,
  effectiveLang,
  authMode = "signin",
  onToggleAuthMode,
}: HostPhoneInputStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t("Saudi Mobile Number", "رقم الجوال السعودي")}
        </label>
        <div className="flex items-center gap-2.5" dir="ltr">
          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <span className="text-base">🇸🇦</span>
            <span>+966</span>
          </div>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="5X XXX XXXX"
            maxLength={10}
            autoFocus
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396] transition"
          />
        </div>
        <span className="mt-1.5 block text-[11px] font-normal text-slate-400 dark:text-slate-500">
          {t("Enter mobile number starting with 5 (e.g. 501234567)", "أدخل رقم الجوال يبدأ بـ 5 (مثال: 501234567)")}
        </span>
      </div>

      {/* Delivery Channel Radio */}
      <div>
        <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t("Send verification code via:", "إرسال رمز التحقق عبر:")}
        </span>
        <div className="grid grid-cols-2 gap-2.5" role="radiogroup">
          <button
            type="button"
            role="radio"
            aria-checked={otpChannel === "sms"}
            onClick={() => setOtpChannel("sms")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-medium transition cursor-pointer ${
              otpChannel === "sms"
                ? "border-[#4F2396] dark:border-purple-600 bg-violet-50/70 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300 font-semibold ring-1 ring-[#4F2396]"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <Smartphone size={15} />
            <span>{t("SMS Message", "رسالة نصية SMS")}</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={otpChannel === "whatsapp"}
            onClick={() => setOtpChannel("whatsapp")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-medium transition cursor-pointer ${
              otpChannel === "whatsapp"
                ? "border-emerald-600 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-600"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <MessageCircle size={15} />
            <span>{t("WhatsApp", "واتساب WhatsApp")}</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pt-1">
        <div ref={recaptchaContainerRef} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F2396] hover:bg-[#3f1b7a] py-3.5 text-sm font-semibold text-white shadow-xs transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight size={15} className={effectiveLang === "ar" ? "rotate-180" : ""} />
        )}
        <span>
          {loading
            ? t("Sending verification code...", "جارٍ إرسال الرمز…")
            : authMode === "signup"
            ? t("Send Code & Register", "إرسال رمز التحقق والتسجيل")
            : t("Send Verification Code", "إرسال رمز التحقق")}
        </span>
      </button>

      {/* Switch between Sign In & Register + Helpful clarification note */}
      <div className="pt-2 text-center text-xs">
        <p className="text-slate-600 dark:text-slate-400">
          {authMode === "signup"
            ? t("Already have a host account?", "لديك حساب مضيف بالفعل؟")
            : t("Don't have a host account?", "ليس لديك حساب مضيف؟")}
          {" "}
          <button
            type="button"
            onClick={onToggleAuthMode}
            className="font-semibold text-[#4F2396] dark:text-purple-400 hover:underline cursor-pointer"
          >
            {authMode === "signup"
              ? t("Sign In", "تسجيل الدخول")
              : t("Register now", "سجل الآن")}
          </button>
        </p>
        <p className="mt-1.5 text-[11px] font-normal text-slate-400 dark:text-slate-500 leading-relaxed">
          {authMode === "signup"
            ? t(
                "Entering your mobile number will create and verify your host account automatically.",
                "إدخال رقم الجوال سينشئ حسابك كمضيف ويوثقه تلقائياً فور تأكيد الرمز."
              )
            : t(
                "Entering your mobile number will sign you in or create your host account automatically.",
                "إدخال رقم الجوال يقوم بتسجيل الدخول أو إنشاء حسابك كمضيف تلقائياً."
              )}
        </p>
      </div>
    </form>
  );
}

