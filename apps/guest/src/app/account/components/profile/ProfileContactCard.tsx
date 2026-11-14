"use client";

import React from "react";
import { Mail, CheckCircle2, LoaderCircle } from "lucide-react";

interface ProfileContactCardProps {
  editEmail: string;
  setEditEmail: (val: string) => void;
  emailVerified: boolean;
  verifyingEmail: boolean;
  editPhone: string;
  setEditPhone: (val: string) => void;
  fieldErrors: {
    email?: string;
  };
  setFieldErrors: React.Dispatch<
    React.SetStateAction<{
      email?: string;
      national_id?: string;
      iqama?: string;
      full_name?: string;
    }>
  >;
  handleVerifyEmail: () => Promise<void>;
  t: (en: string, ar: string) => string;
}

export function ProfileContactCard({
  editEmail,
  setEditEmail,
  emailVerified,
  verifyingEmail,
  editPhone,
  setEditPhone,
  fieldErrors,
  setFieldErrors,
  handleVerifyEmail,
  t,
}: ProfileContactCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-4">
      <div className="pb-3 border-b border-slate-200/60 dark:border-white/10">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Mail size={16} className="text-[#4F2396] dark:text-purple-400" />
          <span>{t("Contact & Email Verification", "البريد الإلكتروني وأرقام الاتصال")}</span>
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          {t(
            "Your email is used for booking confirmations, official VAT invoices, and check-in codes.",
            "يُستخدم بريدك الإلكتروني لإرسال تأكيدات الحجز، الفاتورة الضريبية، ورموز القفل الذكي."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* FIELD: CONTACT EMAIL */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("Email Address", "البريد الإلكتروني")}
            </label>
            {emailVerified ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={12} />
                <span>{t("Verified Email", "بريد موثق")}</span>
              </span>
            ) : (
              <span className="text-[10px] text-amber-500 font-semibold">
                {t("Pending confirmation", "بانتظار التأكيد")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="email"
              dir="ltr"
              value={editEmail}
              onChange={(e) => {
                setEditEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="guest@example.com"
              className={`w-full rounded-2xl border bg-white dark:bg-[#06060B] px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none transition focus:border-[#4F2396] ${
                fieldErrors.email
                  ? "border-rose-400"
                  : "border-slate-200 dark:border-white/10"
              }`}
            />
            <button
              type="button"
              onClick={handleVerifyEmail}
              disabled={verifyingEmail || !editEmail}
              className="shrink-0 px-3.5 py-2.5 rounded-2xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-[#4F2396] dark:text-purple-300 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
            >
              {verifyingEmail ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : emailVerified ? (
                <span>{t("Verified", "موثق")}</span>
              ) : (
                <span>{t("Verify Email", "تحقق")}</span>
              )}
            </button>
          </div>
          {fieldErrors.email && (
            <p className="text-[11px] text-rose-600 font-semibold">{fieldErrors.email}</p>
          )}
        </div>

        {/* FIELD: VERIFIED MOBILE PHONE */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t("Verified Saudi Mobile Phone", "رقم الجوال الموثق")}
            </label>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              <span>{t("OTP Verified", "موثق برمز SMS")}</span>
            </span>
          </div>

          <input
            type="text"
            dir="ltr"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="+966 5X XXX XXXX"
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/5 px-4 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none cursor-default"
          />
        </div>
      </div>
    </div>
  );
}

