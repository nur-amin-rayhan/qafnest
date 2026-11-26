"use client";

import React from "react";
import { AlertCircle, ChevronDown, ExternalLink, Loader2, Mail } from "lucide-react";

interface GuestPhoneInputStepProps {
  phone: string;
  setPhone: (val: string) => void;
  recaptchaContainerRef: React.Ref<HTMLDivElement>;
  turnstileContainerRef?: React.Ref<HTMLDivElement>;
  errorMsg: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToEmail: () => void;
  language: "ar" | "en";
}

export default function GuestPhoneInputStep({
  phone,
  setPhone,
  recaptchaContainerRef,
  turnstileContainerRef,
  errorMsg,
  loading,
  onSubmit,
  onSwitchToEmail,
  language,
}: GuestPhoneInputStepProps) {
  return (
    <div>
      {/* Brand Logo & Welcome Header (Gathern-Style) */}
      <div className="text-center mb-6 pt-1">
        <div className="inline-flex items-center justify-center">
          <span className="font-display text-3xl sm:text-4xl font-black text-purple-700 dark:text-purple-400 tracking-tight">
            Qaf<span className="text-amber-500">Nest</span>
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-3">
          {language === "ar" ? "مرحباً بك" : "Welcome"}
        </h3>
        <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 mt-1">
          {language === "ar"
            ? "أدخل رقم جوالك لإنشاء حساب أو تسجيل الدخول."
            : "Enter your mobile number to create an account or log in."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {/* Mobile Number Label */}
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
            {language === "ar" ? "رقم الجوال" : "Mobile Number"}
          </label>

          {/* Unified Flag + Code + Input Box */}
          <div
            className="flex items-center rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-600/10 transition px-3.5 py-1.5 shadow-sm"
            dir="ltr"
          >
            <div className="flex items-center gap-1.5 pe-3 border-e border-gray-200 dark:border-white/10 shrink-0 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 select-none">
              <span className="text-base leading-none">🇸🇦</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              <span>+966</span>
            </div>
            <input
              type="tel"
              required
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
              placeholder="5X XXX XXXX"
              maxLength={15}
              className="w-full ps-3 pe-2 py-2.5 bg-transparent text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
          </div>

          {/* Helper Notice directly below input (Exact Gathern Copy) */}
          <p className="text-[11.5px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-2.5">
            {language === "ar"
              ? "ستتلقى رمز التحقق على الرقم المدخل.. يُرجى التأكد من صحة الرقم."
              : "You will receive a verification code at the entered number.. Please ensure the number is correct."}
          </p>
        </div>

        {/* Hidden bot protection containers (Zero visual clutter) */}
        <div ref={recaptchaContainerRef} className="hidden" aria-hidden="true" />
        {turnstileContainerRef && (
          <div ref={turnstileContainerRef} className="hidden" aria-hidden="true" />
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 break-words">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Rounded Pill CONTINUE Button */}
        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 disabled:bg-gray-200 dark:disabled:bg-white/10 disabled:text-gray-400 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-4"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span>{language === "ar" ? "متابعة" : "CONTINUE"}</span>
          )}
        </button>
      </form>

      {/* Footer Navigation: Hosts Portal & Email Option */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 flex flex-col items-center gap-2.5 text-center">
        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
        >
          <span>
            {language === "ar" ? "هل ترغب في إضافة عقارك؟" : "Do you want to list your property?"}
          </span>
          <span className="font-bold text-purple-700 dark:text-purple-400 underline inline-flex items-center gap-0.5">
            {language === "ar" ? "بوابة المضيفين" : "Hosts Portal"}
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </a>

        <button
          type="button"
          onClick={onSwitchToEmail}
          className="text-xs font-medium text-gray-400 hover:text-purple-700 dark:hover:text-purple-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer pt-0.5"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>
            {language === "ar" ? "أو المتابعة عبر البريد الإلكتروني" : "Or continue with Email"}
          </span>
        </button>
      </div>
    </div>
  );
}


