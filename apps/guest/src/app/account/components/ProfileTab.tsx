"use client";

import React from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Check,
} from "lucide-react";
import { ProfileIdentityCard } from "./profile/ProfileIdentityCard";
import { ProfileContactCard } from "./profile/ProfileContactCard";
import { ProfilePersonalDetailsCard } from "./profile/ProfilePersonalDetailsCard";

interface ProfileTabProps {
  session: Session | null;
  nationalIdVerified: boolean;
  iqamaVerified: boolean;
  emailVerified: boolean;
  verifyingNationalId: boolean;
  verifyingIqama: boolean;
  verifyingEmail: boolean;
  savingProfile: boolean;
  profileSavedMsg: boolean;
  idVerificationMsg: { type: "success" | "error"; text: string } | null;
  fieldErrors: {
    email?: string;
    national_id?: string;
    iqama?: string;
    full_name?: string;
  };
  primaryIdType: "national_id" | "iqama";
  setPrimaryIdType: (val: "national_id" | "iqama") => void;
  editNationalId: string;
  setEditNationalId: (val: string) => void;
  editIqama: string;
  setEditIqama: (val: string) => void;
  editEmail: string;
  setEditEmail: (val: string) => void;
  editPhone: string;
  onPhoneVerified: (newPhone: string, identityResetRequired: boolean) => void;
  editFullName: string;
  setEditFullName: (val: string) => void;
  editCity: string;
  setEditCity: (val: string) => void;
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
  handleVerifyEmail: () => Promise<void>;
  emailOtpSent?: boolean;
  emailOtpCode?: string;
  emailDevCode?: string | null;
  setEmailOtpCode?: (val: string) => void;
  handleConfirmEmailOtp?: () => Promise<void>;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
  language: string;
  t: (en: string, ar: string) => string;
}

export default function ProfileTab({
  session,
  nationalIdVerified,
  iqamaVerified,
  emailVerified,
  verifyingNationalId,
  verifyingIqama,
  verifyingEmail,
  savingProfile,
  profileSavedMsg,
  idVerificationMsg,
  fieldErrors,
  primaryIdType,
  setPrimaryIdType,
  editNationalId,
  setEditNationalId,
  editIqama,
  setEditIqama,
  editEmail,
  setEditEmail,
  editPhone,
  onPhoneVerified,
  editFullName,
  setEditFullName,
  editCity,
  setEditCity,
  setFieldErrors,
  handleVerifyNationalId,
  handleVerifyIqama,
  handleVerifyEmail,
  emailOtpSent,
  emailOtpCode,
  emailDevCode,
  setEmailOtpCode,
  handleConfirmEmailOtp,
  handleSaveProfile,
  language,
  t,
}: ProfileTabProps) {
  const isIdentityVerified = nationalIdVerified || iqamaVerified;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 dark:border-white/[0.08] gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
            {t("Profile & Identity", "الملف الشخصي وتوثيق الهوية")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t(
              "Verify your mobile and Saudi ID or Iqama via Nafath / Elm Yaqeen to unlock bookings.",
              "وثّق رقم الجوال والهوية الوطنية أو الإقامة عبر نفاذ / علم يقين لإتمام الحجوزات."
            )}
          </p>
        </div>
        <div className="shrink-0">
          {isIdentityVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
              <ShieldCheck size={14} />
              <span>{t("Identity verified", "الهوية موثقة")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium">
              <ShieldAlert size={14} />
              <span>{t("Verification required", "يتطلب التوثيق")}</span>
            </span>
          )}
        </div>
      </div>

      {profileSavedMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{t("Profile saved", "تم حفظ الملف الشخصي")}</span>
        </div>
      )}

      {idVerificationMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            idVerificationMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30 text-rose-800 dark:text-rose-200"
          }`}
        >
          {idVerificationMsg.type === "success" ? (
            <CheckCircle2 size={16} className="shrink-0" />
          ) : (
            <AlertCircle size={16} className="shrink-0" />
          )}
          <span>{idVerificationMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-5">
        <ProfileIdentityCard
          primaryIdType={primaryIdType}
          setPrimaryIdType={setPrimaryIdType}
          nationalIdVerified={nationalIdVerified}
          iqamaVerified={iqamaVerified}
          editNationalId={editNationalId}
          setEditNationalId={setEditNationalId}
          editIqama={editIqama}
          setEditIqama={setEditIqama}
          editPhone={editPhone}
          verifyingNationalId={verifyingNationalId}
          verifyingIqama={verifyingIqama}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          handleVerifyNationalId={handleVerifyNationalId}
          handleVerifyIqama={handleVerifyIqama}
          t={t}
        />

        <ProfileContactCard
          session={session}
          language={language}
          editEmail={editEmail}
          setEditEmail={setEditEmail}
          emailVerified={emailVerified}
          verifyingEmail={verifyingEmail}
          emailOtpSent={emailOtpSent}
          emailOtpCode={emailOtpCode}
          emailDevCode={emailDevCode}
          setEmailOtpCode={setEmailOtpCode}
          handleConfirmEmailOtp={handleConfirmEmailOtp}
          editPhone={editPhone}
          onPhoneVerified={onPhoneVerified}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          handleVerifyEmail={handleVerifyEmail}
          t={t}
        />

        <ProfilePersonalDetailsCard
          editFullName={editFullName}
          setEditFullName={setEditFullName}
          editCity={editCity}
          setEditCity={setEditCity}
          isIdentityVerified={isIdentityVerified}
          language={language}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          t={t}
        />

        <div className="pt-1 flex justify-end">
          <button
            type="submit"
            disabled={savingProfile}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F2396] hover:bg-[#3f1c79] text-white font-medium px-6 py-2.5 text-sm transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
          >
            {savingProfile ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                <span>{t("Saving...", "جارٍ الحفظ...")}</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>{t("Save changes", "حفظ التغييرات")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
