"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, Phone, User as UserIcon } from "lucide-react";

interface GuestEmailAuthStepProps {
  isEmailSignIn: boolean;
  setIsEmailSignIn: (val: boolean) => void;
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onDevGuestFill: () => void;
  onSwitchToPhone: () => void;
  errorMsg: string | null;
  successMsg: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  language: "ar" | "en";
}

export default function GuestEmailAuthStep({
  isEmailSignIn,
  setIsEmailSignIn,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  onDevGuestFill,
  onSwitchToPhone,
  errorMsg,
  successMsg,
  loading,
  onSubmit,
  language,
}: GuestEmailAuthStepProps) {
  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {language === "ar"
            ? isEmailSignIn
              ? "تسجيل الدخول بالبريد"
              : "إنشاء حساب جديد"
            : isEmailSignIn
            ? "Sign In with Email"
            : "Create Account"}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
          {language === "ar"
            ? "أدخل بيانات حسابك للوصول إلى لوحة حجوزاتك ومفضلتك"
            : "Enter your credentials to access your booking dashboard"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {!isEmailSignIn && (
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
              {language === "ar" ? "الاسم الكامل" : "Full Name"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                <UserIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === "ar" ? "اسمك الكامل" : "Your full name"}
                className="w-full ps-10 pe-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 transition"
              />
            </div>
          </div>
        )}

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

        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
            {language === "ar" ? "كلمة المرور" : "Password"}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
              <Lock className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="password"
              required
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full ps-10 pe-4 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 transition"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onDevGuestFill}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-xs font-bold text-violet-700 dark:text-violet-300 transition cursor-pointer"
        >
          <span>
            {language === "ar"
              ? "⚡ تجربة سريعة: تعبئة حساب تجريبي"
              : "⚡ Quick Fill Dev Guest Credentials"}
          </span>
        </button>

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
            <span>
              {language === "ar"
                ? isEmailSignIn
                  ? "تسجيل الدخول"
                  : "إنشاء الحساب"
                : isEmailSignIn
                ? "Sign In"
                : "Create Account"}
            </span>
          )}
        </button>
      </form>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-gray-500">
        <button
          type="button"
          onClick={() => setIsEmailSignIn(!isEmailSignIn)}
          className="hover:underline font-semibold text-purple-600 dark:text-purple-400 cursor-pointer text-center sm:text-start"
        >
          {isEmailSignIn
            ? language === "ar"
              ? "ليس لديك حساب؟ تسجيل جديد"
              : "Need an account? Sign up"
            : language === "ar"
            ? "لديك حساب بالفعل؟ تسجيل الدخول"
            : "Already have an account? Sign in"}
        </button>

        <button
          type="button"
          onClick={onSwitchToPhone}
          className="hover:underline font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{language === "ar" ? "الدخول برقم الجوال" : "Mobile Login"}</span>
        </button>
      </div>
    </div>
  );
}

