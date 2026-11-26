"use client";

import React from "react";
import { User, CheckCircle2 } from "lucide-react";

interface ProfilePersonalDetailsCardProps {
  editFullName: string;
  setEditFullName: (val: string) => void;
  editCity: string;
  setEditCity: (val: string) => void;
  isIdentityVerified: boolean;
  language: string;
  fieldErrors: {
    full_name?: string;
  };
  setFieldErrors: React.Dispatch<
    React.SetStateAction<{
      email?: string;
      national_id?: string;
      iqama?: string;
      full_name?: string;
    }>
  >;
  t: (en: string, ar: string) => string;
}

export function ProfilePersonalDetailsCard({
  editFullName,
  setEditFullName,
  editCity,
  setEditCity,
  isIdentityVerified,
  language,
  fieldErrors,
  setFieldErrors,
  t,
}: ProfilePersonalDetailsCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#F9F8FD] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-4">
      <div className="pb-3 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <User size={16} strokeWidth={1.75} className="text-[#4F2396] dark:text-purple-300" />
          <span>{t("Personal Details", "البيانات الشخصية")}</span>
        </h3>
        {isIdentityVerified && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 size={12} />
            <span>{t("Synced from Nafath / Yaqeen", "مجلوب من نفاذ / يقين")}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-800 dark:text-slate-300 block">
            {t("Full name (Nafath / Yaqeen)", "الاسم الكامل (من نفاذ / علم يقين)")}
          </label>
          <input
            type="text"
            required
            readOnly={isIdentityVerified}
            aria-readonly={isIdentityVerified}
            value={editFullName}
            onChange={(e) => {
              if (isIdentityVerified) return;
              setEditFullName(e.target.value);
              setFieldErrors((prev) => ({ ...prev, full_name: undefined }));
            }}
            placeholder={
              language === "ar"
                ? "يتم جلبه تلقائياً بعد توثيق الهوية"
                : "Auto-fetched upon ID verification"
            }
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/35 transition-colors focus:border-[#4F2396] ${
              isIdentityVerified
                ? "bg-slate-100 dark:bg-white/[0.06] cursor-not-allowed"
                : "bg-white dark:bg-[#06060B]"
            } ${
              fieldErrors.full_name
                ? "border-rose-500"
                : "border-slate-300 dark:border-white/15"
            }`}
          />
          {fieldErrors.full_name && (
            <p className="text-xs text-rose-700 dark:text-rose-400">{fieldErrors.full_name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-800 dark:text-slate-300 block">
            {t("City", "المدينة")}
          </label>
          <select
            value={editCity}
            onChange={(e) => setEditCity(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#06060B] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/35 transition-colors focus:border-[#4F2396] cursor-pointer"
          >
            <option value="الرياض">الرياض (Riyadh)</option>
            <option value="جدة">جدة (Jeddah)</option>
            <option value="مكة المكرمة">مكة المكرمة (Makkah)</option>
            <option value="المدينة المنورة">المدينة المنورة (Madinah)</option>
            <option value="الدمام">الدمام (Dammam)</option>
            <option value="الخبر">الخبر (Al Khobar)</option>
            <option value="أبها">أبها (Abha)</option>
            <option value="الطائف">الطائف (Taif)</option>
            <option value="تبوك">تبوك (Tabuk)</option>
            <option value="العلا">العلا (AlUla)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
