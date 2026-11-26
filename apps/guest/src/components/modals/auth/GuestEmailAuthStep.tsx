"use client";

import React from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail, Phone } from "lucide-react";

interface GuestEmailAuthStepProps {
  email: string;
  setEmail: (val: string) => void;
  onSwitchToPhone: () => void;
  errorMsg: string | null;
  successMsg: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  language: "ar" | "en";
  turnstileContainerRef?: React.Ref<HTMLDivElement>;
}

export default function GuestEmailAuthStep({
  email,
  setEmail,
  onSwitchToPhone,
  errorMsg,
  successMsg,
  loading,
  onSubmit,
  language,
  turnstileContainerRef,
}: GuestEmailAuthStepProps) {
  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {language === "ar" ? "تسجيل الدخول أو إنشاء حساب" : "Login or Sign Up with Email"}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
          {language === "ar"
            ? "أدخل بريدك الإلكتروني لتصلك رسالة برمز التحقق السريع للدخول الفوري بدون كلمة مرور"
            : "Enter your email to receive a secure one-time verification code for passwordless sign-in"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email Address Input */}
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
            {language === "ar" ? "البريد الإلكتروني" : "Email Address"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
              <Mail className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full ps-10 pe-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 transition"
            />
          </div>
        </div>

        {/* Cloudflare Turnstile Invisible Container */}
        {turnstileContainerRef && (
          <div className="flex justify-center overflow-hidden my-0.5">
            <div ref={turnstileContainerRef} />
          </div>
        )}

        {/* Cloudflare Turnstile Subtle Protection Dot */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>
            {language === "ar"
              ? "محمي بنظام التحقق السحابي Cloudflare Turnstile"
              : "Protected by Cloudflare Turnstile"}
          </span>
        </div>

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
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{language === "ar" ? "متابعة وإرسال الرمز" : "Continue & Send Code"}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-center text-xs text-gray-500">
        <button
          type="button"
          onClick={onSwitchToPhone}
          className="hover:underline font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{language === "ar" ? "الدخول برقم الجوال السعودي" : "Sign in with Saudi Mobile Number"}</span>
        </button>
      </div>
    </div>
  );
}

