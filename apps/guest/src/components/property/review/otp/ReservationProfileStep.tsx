"use client";

import React from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import type { OtpStep } from "../types";

interface ReservationProfileStepProps {
  handleSaveProfile: (event: React.FormEvent<HTMLFormElement>) => void;
  firstName: string;
  setFirstName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  contactEmail: string;
  setContactEmail: (email: string) => void;
  otpError: string | null;
  otpBusy: boolean;
  sentPhone: string | null;
  setOtpStep: (step: OtpStep) => void;
  label: (en: string, ar: string) => string;
}

export function ReservationProfileStep({
  handleSaveProfile,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  contactEmail,
  setContactEmail,
  otpError,
  otpBusy,
  sentPhone,
  setOtpStep,
  label,
}: ReservationProfileStepProps) {
  return (
    <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
        <span className="flex items-center gap-2 font-bold">
          <CheckCircle2 className="h-4 w-4" />
          {label("Phone verified · You're signed in", "تم التحقق من الهاتف · تم تسجيل دخولك")}
        </span>
        <p className="mt-1">
          {label(
            "Your login stays on this booking page. Add your details for the reservation.",
            "سيبقى تسجيل دخولك في صفحة الحجز هذه. أضف بياناتك للحجز."
          )}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label("First name", "الاسم الأول")}
          <input
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 dark:border-white/10 dark:bg-[#0b0912] dark:text-white"
            placeholder={label("First name", "الاسم الأول")}
          />
        </label>
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label("Last name", "اسم العائلة")}
          <input
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 dark:border-white/10 dark:bg-[#0b0912] dark:text-white"
            placeholder={label("Last name", "اسم العائلة")}
          />
        </label>
      </div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label("Email address (Optional)", "البريد الإلكتروني (اختياري)")}
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 dark:border-white/10 dark:bg-[#0b0912] dark:text-white"
          placeholder={label("Optional - for booking updates", "اختياري - لتحديثات الحجز")}
        />
      </label>
      <p className="text-[11px] leading-5 text-gray-500 dark:text-gray-400">
        {label(
          "Your verified phone remains your sign-in. This email is saved for booking updates.",
          "سيظل رقم هاتفك المتحقق منه وسيلة تسجيل الدخول. سنستخدم هذا البريد لتحديثات الحجز."
        )}
      </p>
      {otpError && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
        >
          {otpError}
        </p>
      )}
      <button
        type="submit"
        disabled={otpBusy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/15 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {otpBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {label("Save & continue to payment", "احفظ وتابع للدفع")}
      </button>
      {sentPhone && (
        <button
          type="button"
          onClick={() => setOtpStep("code")}
          className="w-full text-center text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300 cursor-pointer"
        >
          {label("Back to verification code", "العودة إلى رمز التحقق")}
        </button>
      )}
    </form>
  );
}

