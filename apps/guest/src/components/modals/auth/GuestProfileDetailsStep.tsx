"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface GuestProfileDetailsStepProps {
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  contactEmail: string;
  setContactEmail: (val: string) => void;
  errorMsg: string | null;
  successMsg: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  language: "ar" | "en";
}

export default function GuestProfileDetailsStep({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  contactEmail,
  setContactEmail,
  errorMsg,
  successMsg,
  loading,
  onSubmit,
  language,
}: GuestProfileDetailsStepProps) {
  return (
    <div>
      <div className="mb-5">
        <h3 className="font-display text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {language === "ar" ? "أكمل ملفك الشخصي" : "Complete your profile"}
        </h3>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {language === "ar"
            ? "تم التحقق من رقم جوالك بنجاح. أضف بياناتك لمتابعة الحجز."
            : "Your phone is verified. Add your details to continue booking."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="auth-first-name" className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">
              {language === "ar" ? "الاسم الأول" : "First name"}
            </label>
            <input
              id="auth-first-name"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={language === "ar" ? "الاسم الأول" : "Your first name"}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="auth-last-name" className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">
              {language === "ar" ? "اسم العائلة" : "Last name"}
            </label>
            <input
              id="auth-last-name"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={language === "ar" ? "اسم العائلة" : "Your last name"}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="auth-contact-email" className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">
            {language === "ar" ? "البريد الإلكتروني" : "Email address"}
          </label>
          <input
            id="auth-contact-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            dir="ltr"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-600 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        {errorMsg && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 break-words">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 break-words">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-purple-800 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>{language === "ar" ? "حفظ ومتابعة" : "Save & Continue"}</span>
          )}
        </button>
      </form>
    </div>
  );
}

