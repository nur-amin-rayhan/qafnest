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
}: HostPhoneInputStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-xs font-extrabold text-slate-700">
          {t("Saudi Mobile Number", "رقم الجوال السعودي")}
        </label>
        <div className="flex items-center gap-2" dir="ltr">
          <div className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 px-3.5 py-3 text-xs font-black text-slate-900">
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
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#4F2396] focus:bg-white"
          />
        </div>
        <span className="mt-1 block text-[11px] font-medium text-slate-400">
          {t("Enter mobile number starting with 5 (e.g. 501234567)", "أدخل رقم الجوال يبدأ بـ 5 (مثال: 501234567)")}
        </span>
      </div>

      {/* Delivery Channel Radio */}
      <div>
        <span className="mb-1.5 block text-xs font-extrabold text-slate-700">
          {t("Send verification code via:", "إرسال رمز التحقق عبر:")}
        </span>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          <button
            type="button"
            role="radio"
            aria-checked={otpChannel === "sms"}
            onClick={() => setOtpChannel("sms")}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-black transition cursor-pointer ${
              otpChannel === "sms"
                ? "border-[#4F2396] bg-violet-50 text-[#4F2396] ring-1 ring-[#4F2396]"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
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
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-black transition cursor-pointer ${
              otpChannel === "whatsapp"
                ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
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
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF9750] hover:bg-[#f58438] py-3.5 text-sm font-black text-[#2d1259] shadow-lg shadow-amber-500/20 transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      >
        {loading ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowRight size={16} className={effectiveLang === "ar" ? "rotate-180" : ""} />
        )}
        <span>
          {loading
            ? t("Sending verification code...", "جارٍ إرسال الرمز…")
            : t("Send Verification Code", "إرسال رمز التحقق")}
        </span>
      </button>
    </form>
  );
}

