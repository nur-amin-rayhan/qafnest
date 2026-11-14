"use client";

import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Check,
} from "lucide-react";
import { ProfileIdentityCard } from "./profile/ProfileIdentityCard";
import { ProfileContactCard } from "./profile/ProfileContactCard";
import { ProfilePersonalDetailsCard } from "./profile/ProfilePersonalDetailsCard";

interface ProfileTabProps {
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
  setEditPhone: (val: string) => void;
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
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
  language: string;
  t: (en: string, ar: string) => string;
}

export default function ProfileTab({
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
  setEditPhone,
  editFullName,
  setEditFullName,
  editCity,
  setEditCity,
  setFieldErrors,
  handleVerifyNationalId,
  handleVerifyIqama,
  handleVerifyEmail,
  handleSaveProfile,
  language,
  t,
}: ProfileTabProps) {
  return (
    <div className="space-y-6">
      {/* Header with Title and Overall Verification Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-white/10 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t("Guest Profile & Identity Settings", "إعدادات الملف الشخصي وتوثيق الهوية")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Manage your verified identity, email, Saudi National ID, and Iqama under Ministry of Tourism regulations.",
              "إدارة بياناتك الرسمية، البريد الإلكتروني، الهوية الوطنية، والإقامة المعتمدة وفق لوائح وزارة السياحة السعودية."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {nationalIdVerified || iqamaVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>{t("Identity Verified · Level 3", "الهوية موثقة رسميًا · المستوى 3")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <ShieldCheck size={16} className="text-amber-500" />
              <span>{t("Pending ID Verification", "بانتظار توثيق الهوية")}</span>
            </span>
          )}
        </div>
      </div>

      {/* Notifications & Status Banners */}
      {profileSavedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {t(
              "Profile and verification details updated successfully!",
              "تم حفظ وتحديث بيانات الملف الشخصي بنجاح!"
            )}
          </span>
        </div>
      )}

      {idVerificationMsg && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-2.5 ${
            idVerificationMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          {idVerificationMsg.type === "success" ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span>{idVerificationMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* CARD 1: OFFICIAL SAUDI IDENTITY VERIFICATION (NATIONAL ID & IQAMA) */}
        <ProfileIdentityCard
          primaryIdType={primaryIdType}
          setPrimaryIdType={setPrimaryIdType}
          nationalIdVerified={nationalIdVerified}
          iqamaVerified={iqamaVerified}
          editNationalId={editNationalId}
          setEditNationalId={setEditNationalId}
          editIqama={editIqama}
          setEditIqama={setEditIqama}
          verifyingNationalId={verifyingNationalId}
          verifyingIqama={verifyingIqama}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          handleVerifyNationalId={handleVerifyNationalId}
          handleVerifyIqama={handleVerifyIqama}
          t={t}
        />

        {/* CARD 2: CONTACT & EMAIL VERIFICATION */}
        <ProfileContactCard
          editEmail={editEmail}
          setEditEmail={setEditEmail}
          emailVerified={emailVerified}
          verifyingEmail={verifyingEmail}
          editPhone={editPhone}
          setEditPhone={setEditPhone}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          handleVerifyEmail={handleVerifyEmail}
          t={t}
        />

        {/* CARD 3: PERSONAL DETAILS & CITY */}
        <ProfilePersonalDetailsCard
          editFullName={editFullName}
          setEditFullName={setEditFullName}
          editCity={editCity}
          setEditCity={setEditCity}
          language={language}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          t={t}
        />

        {/* FORM ACTIONS: SAVE CHANGES BUTTON */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>
              {t(
                "Verified by Saudi Ministry of Tourism (MOT 73102999)",
                "موثق ومعتمد من وزارة السياحة بترخيص 73102999"
              )}
            </span>
          </p>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4F2396] hover:bg-[#3f1c79] text-white font-black px-8 py-3.5 text-sm shadow-md transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {savingProfile ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                <span>{t("Saving Changes...", "جارٍ الحفظ...")}</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>{t("Save Profile Changes", "حفظ وتحديث الملف الشخصي")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
