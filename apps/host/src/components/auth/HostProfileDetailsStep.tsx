"use client";

import React from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

interface HostProfileDetailsStepProps {
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  contactEmail: string;
  setContactEmail: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSkip: () => void;
  t: (en: string, ar: string) => string;
  effectiveLang: "ar" | "en";
}

export default function HostProfileDetailsStep({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  contactEmail,
  setContactEmail,
  loading,
  onSubmit,
  onSkip,
  t,
  effectiveLang,
}: HostProfileDetailsStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            {t("First Name", "الاسم الأول / التجاري")}
          </label>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("e.g. Mohammed", "مثال: محمد")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396] transition"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            {t("Last / Family Name", "اسم العائلة")}
          </label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t("e.g. Al-Ghamdi", "مثال: الغامدي")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396] transition"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
          {t("Email Address (Optional)", "البريد الإلكتروني (اختياري)")}
        </label>
        <input
          type="email"
          dir="ltr"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="host@example.com"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396] transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F2396] hover:bg-[#3f1b7a] py-3 text-sm font-semibold text-white shadow-xs transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight size={15} className={effectiveLang === "ar" ? "rotate-180" : ""} />
        )}
        <span>
          {loading
            ? t("Saving profile...", "جارٍ الحفظ والدخول…")
            : t("Save & Enter Dashboard", "حفظ والدخول إلى لوحة التحكم")}
        </span>
      </button>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-medium text-slate-500 hover:text-[#4F2396] hover:underline cursor-pointer"
        >
          {t("Skip for now and enter dashboard", "تخطي الآن والدخول إلى لوحة التحكم")}
        </button>
      </div>
    </form>
  );
}

