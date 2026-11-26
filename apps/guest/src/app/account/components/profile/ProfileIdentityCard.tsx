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
  editPhone: string;
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
  editPhone,
  verifyingNationalId,
  verifyingIqama,
  fieldErrors,
  setFieldErrors,
  handleVerifyNationalId,
  handleVerifyIqama,
  t,
}: ProfileIdentityCardProps) {
  const isNational = primaryIdType === "national_id";
  const activeVerified = isNational ? nationalIdVerified : iqamaVerified;
  const activeValue = isNational ? editNationalId : editIqama;
  const activeBusy = isNational ? verifyingNationalId : verifyingIqama;
  const activeError = isNational ? fieldErrors.national_id : fieldErrors.iqama;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#F9F8FD] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={16} strokeWidth={1.75} className="text-[#4F2396] dark:text-purple-300" />
            <span>{t("Nafath / Elm Yaqeen Identity", "توثيق الهوية عبر نفاذ / علم يقين")}</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {editPhone ? (
              <>
                {t("Matches verified mobile", "يطابق الجوال الموثق")}{" "}
                <bdi dir="ltr" className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-200">
                  {editPhone}
                </bdi>
              </>
            ) : (
              t(
                "Verify your Saudi mobile first to match your ID",
                "وثّق رقم الجوال أولاً لمطابقة رقم الهوية أو الإقامة"
              )
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#06060B] border border-slate-200 dark:border-white/10 text-xs font-medium">
          <button
            type="button"
            onClick={() => setPrimaryIdType("national_id")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              isNational
                ? "bg-[#4F2396] text-white"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {t("National ID", "هوية وطنية")}
          </button>
          <button
            type="button"
            onClick={() => setPrimaryIdType("iqama")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              !isNational
                ? "bg-[#4F2396] text-white"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {t("Iqama", "إقامة")}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-800 dark:text-slate-300">
            {isNational
              ? t("Saudi National ID (10 digits starting with 1)", "رقم الهوية الوطنية (١٠ أرقام تبدأ بـ ١)")
              : t("Saudi Iqama Number (10 digits starting with 2)", "رقم الإقامة (١٠ أرقام تبدأ بـ ٢)")}
          </label>
          {activeVerified && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              <span>{t("Verified · Nafath / Yaqeen", "موثق · نفاذ / يقين")}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            dir="ltr"
            value={activeValue}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              if (isNational) {
                setEditNationalId(val);
                if (val.length === 10 && val.startsWith("1")) {
                  setFieldErrors((prev) => ({ ...prev, national_id: undefined }));
                }
              } else {
                setEditIqama(val);
                if (val.length === 10 && val.startsWith("2")) {
                  setFieldErrors((prev) => ({ ...prev, iqama: undefined }));
                }
              }
            }}
            placeholder={isNational ? "10XXXXXXXX" : "20XXXXXXXX"}
            maxLength={10}
            className={`w-full rounded-xl border bg-white dark:bg-[#06060B] px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/35 transition-colors focus:border-[#4F2396] ${
              activeError ? "border-rose-500" : "border-slate-300 dark:border-white/15"
            }`}
          />
          <button
            type="button"
            onClick={isNational ? handleVerifyNationalId : handleVerifyIqama}
            disabled={activeBusy || !activeValue || !editPhone}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-[#4F2396] hover:bg-[#3f1c79] text-white text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
          >
            {activeBusy ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : activeVerified ? (
              <span>{t("Re-verify", "إعادة التحقق")}</span>
            ) : (
              <span>{t("Verify & Sync Name", "تحقق وجلب الاسم")}</span>
            )}
          </button>
        </div>
        {activeError && <p className="text-xs text-rose-600">{activeError}</p>}
      </div>
    </div>
  );
}
