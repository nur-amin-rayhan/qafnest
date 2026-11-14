"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, LoaderCircle } from "lucide-react";

interface ProfileIdentityCardProps {
  primaryIdType: "national_id" | "iqama";
  setPrimaryIdType: (val: "national_id" | "iqama") => void;
  nationalIdVerified: boolean;
  iqamaVerified: boolean;
  editNationalId: string;
  setEditNationalId: (val: string) => void;
  editIqama: string;
  setEditIqama: (val: string) => void;
  verifyingNationalId: boolean;
  verifyingIqama: boolean;
  fieldErrors: {
    national_id?: string;
    iqama?: string;
  };
  setFieldErrors: React.Dispatch<
    React.SetStateAction<{
      email?: string;
      national_id?: string;
      iqama?: string;
      full_name?: string;
    }>
  >;
  handleVerifyNationalId: () => Promise<void>;
  handleVerifyIqama: () => Promise<void>;
  t: (en: string, ar: string) => string;
}

export function ProfileIdentityCard({
  primaryIdType,
  setPrimaryIdType,
  nationalIdVerified,
  iqamaVerified,
  editNationalId,
  setEditNationalId,
  editIqama,
  setEditIqama,
  verifyingNationalId,
  verifyingIqama,
  fieldErrors,
  setFieldErrors,
  handleVerifyNationalId,
  handleVerifyIqama,
  t,
}: ProfileIdentityCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-white/10">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#4F2396] dark:text-purple-400" />
            <span>
              {t(
                "Official Saudi Identity Verification",
                "توثيق الهوية الرسمية (الهوية الوطنية / الإقامة)"
              )}
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {t(
              "Mandatory for Ministry of Tourism instant reservation checks and smart lock check-in PIN release.",
              "إلزامي لإتمام الحجز الفوري وإصدار رمز الدخول الذكي وفق متطلبات وزارة السياحة."
            )}
          </p>
        </div>

        {/* Document Type Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#0E0E1A] border border-slate-200 dark:border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setPrimaryIdType("national_id")}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              primaryIdType === "national_id"
                ? "bg-[#4F2396] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            {t("Saudi Citizen (National ID)", "هوية وطنية")}
          </button>
          <button
            type="button"
            onClick={() => setPrimaryIdType("iqama")}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              primaryIdType === "iqama"
                ? "bg-[#4F2396] text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            {t("Resident (Iqama)", "هوية مقيم (إقامة)")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* FIELD: SAUDI NATIONAL ID */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("Saudi National ID Number", "رقم الهوية الوطنية (للمواطنين)")}
            </label>
            {nationalIdVerified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={12} />
                <span>{t("Verified via Nafath", "موثق عبر نفاذ")}</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-semibold">
                {t("10 digits (starts with 1)", "10 أرقام تبدأ بـ 1")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              dir="ltr"
              value={editNationalId}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setEditNationalId(val);
                if (val.length === 10 && val.startsWith("1")) {
                  setFieldErrors((prev) => ({ ...prev, national_id: undefined }));
                }
              }}
              placeholder="10XXXXXXXX"
              maxLength={10}
              className={`w-full rounded-2xl border bg-white dark:bg-[#06060B] px-4 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none transition focus:border-[#4F2396] ${
                fieldErrors.national_id
                  ? "border-rose-400"
                  : "border-slate-200 dark:border-white/10"
              }`}
            />
            <button
              type="button"
              onClick={handleVerifyNationalId}
              disabled={verifyingNationalId || !editNationalId}
              className="shrink-0 px-3.5 py-2.5 rounded-2xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#4F2396] dark:text-purple-300 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
            >
              {verifyingNationalId ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : nationalIdVerified ? (
                <span>{t("Re-verify", "إعادة التحقق")}</span>
              ) : (
                <span>{t("Verify ID", "تحقق الآن")}</span>
              )}
            </button>
          </div>
          {fieldErrors.national_id && (
            <p className="text-[11px] text-rose-600 font-semibold">{fieldErrors.national_id}</p>
          )}
        </div>

        {/* FIELD: IQAMA NUMBER */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("Saudi Resident Iqama Number", "رقم هوية مقيم (الإقامة للمقيمين)")}
            </label>
            {iqamaVerified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={12} />
                <span>{t("Verified Resident", "إقامة موثقة")}</span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-semibold">
                {t("10 digits (starts with 2)", "10 أرقام تبدأ بـ 2")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              dir="ltr"
              value={editIqama}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setEditIqama(val);
                if (val.length === 10 && val.startsWith("2")) {
                  setFieldErrors((prev) => ({ ...prev, iqama: undefined }));
                }
              }}
              placeholder="20XXXXXXXX"
              maxLength={10}
              className={`w-full rounded-2xl border bg-white dark:bg-[#06060B] px-4 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none transition focus:border-[#4F2396] ${
                fieldErrors.iqama ? "border-rose-400" : "border-slate-200 dark:border-white/10"
              }`}
            />
            <button
              type="button"
              onClick={handleVerifyIqama}
              disabled={verifyingIqama || !editIqama}
              className="shrink-0 px-3.5 py-2.5 rounded-2xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#4F2396] dark:text-purple-300 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
            >
              {verifyingIqama ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : iqamaVerified ? (
                <span>{t("Re-verify", "إعادة التحقق")}</span>
              ) : (
                <span>{t("Verify Iqama", "تحقق الآن")}</span>
              )}
            </button>
          </div>
          {fieldErrors.iqama && (
            <p className="text-[11px] text-rose-600 font-semibold">{fieldErrors.iqama}</p>
          )}
        </div>
      </div>
    </div>
  );
}

