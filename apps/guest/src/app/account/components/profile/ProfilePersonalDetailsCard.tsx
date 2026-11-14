"use client";

import React from "react";
import { User } from "lucide-react";

interface ProfilePersonalDetailsCardProps {
  editFullName: string;
  setEditFullName: (val: string) => void;
  editCity: string;
  setEditCity: (val: string) => void;
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
  language,
  fieldErrors,
  setFieldErrors,
  t,
}: ProfilePersonalDetailsCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-4">
      <div className="pb-3 border-b border-slate-200/60 dark:border-white/10">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <User size={16} className="text-[#4F2396] dark:text-purple-400" />
          <span>{t("Personal Details & City of Residence", "الاسم والمدينة")}</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* FIELD: FULL NAME */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {t("Full Name (as on official ID)", "الاسم الكامل (حسب بطاقة الهوية / الإقامة)")}
          </label>
          <input
            type="text"
            required
            value={editFullName}
            onChange={(e) => {
              setEditFullName(e.target.value);
              setFieldErrors((prev) => ({ ...prev, full_name: undefined }));
            }}
            placeholder={
              language === "ar" ? "الاسم الثلاثي أو الرباعي" : "Your official full name"
            }
            className={`w-full rounded-2xl border bg-white dark:bg-[#06060B] px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none transition focus:border-[#4F2396] ${
              fieldErrors.full_name
                ? "border-rose-400"
                : "border-slate-200 dark:border-white/10"
            }`}
          />
          {fieldErrors.full_name && (
            <p className="text-[11px] text-rose-600 font-semibold">{fieldErrors.full_name}</p>
          )}
        </div>

        {/* FIELD: CITY IN SAUDI ARABIA */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {t("City / Region in Saudi Arabia", "المدينة / المنطقة")}
          </label>
          <select
            value={editCity}
            onChange={(e) => setEditCity(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#06060B] px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none transition focus:border-[#4F2396] cursor-pointer"
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

