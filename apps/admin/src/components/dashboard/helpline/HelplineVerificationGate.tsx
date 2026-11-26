"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  Send,
} from "lucide-react";
import type { HelplineVerificationSession } from "./helplineTypes";

export function HelplineVerificationGate({
  guestPhone,
  verificationSession,
  verificationMethod,
  setVerificationMethod,
  verificationLink,
  initiatingVerification,
  otpInput,
  setOtpInput,
  verifyingOtp,
  nationalIdInput,
  setNationalIdInput,
  verifyingId,
  verificationNotice,
  onInitiateVerification,
  onVerifyOtp,
  onVerifyId,
  onRefreshVerification,
  t,
}: {
  guestPhone: string;
  verificationSession: HelplineVerificationSession | null;
  verificationMethod: "code" | "link";
  setVerificationMethod: (m: "code" | "link") => void;
  verificationLink: string | null;
  initiatingVerification: boolean;
  otpInput: string;
  setOtpInput: (v: string) => void;
  verifyingOtp: boolean;
  nationalIdInput: string;
  setNationalIdInput: (v: string) => void;
  verifyingId: boolean;
  verificationNotice: string | null;
  onInitiateVerification: (m: "code" | "link") => void;
  onVerifyOtp: () => void;
  onVerifyId: () => void;
  onRefreshVerification: () => void;
  t: (en: string, ar: string) => string;
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  return (
    <div
      data-testid="helpline-verification-gate"
      className={`rounded-xl border p-4 space-y-3.5 transition-all ${
        verificationSession?.completed
          ? "border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20"
          : "border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {verificationSession?.completed ? (
            <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {t("Zero-Bypass Identity & Mobile OTP Gate", "بوابة التوثيق الإلزامية (نفاذ + يقين + رمز الجوال)")}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {t(
                "Saudi regulation strictly requires caller phone OTP & National ID / Iqama verification before room hold.",
                "اشتراطات المنصة تتطلب توثيق جوال العميل ورقم الهوية/الإقامة رسمياً قبل الحجز."
              )}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
            verificationSession?.completed
              ? "bg-emerald-600 text-white"
              : verificationSession?.otpVerified
              ? "bg-blue-600 text-white"
              : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          }`}
        >
          {verificationSession?.completed
            ? "Fully Verified"
            : verificationSession?.otpVerified
            ? "Phone Verified (ID Pending)"
            : "Verification Required"}
        </span>
      </div>

      {verificationNotice && (
        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between shadow-2xs">
          <span>{verificationNotice}</span>
        </div>
      )}

      {!verificationSession?.completed ? (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 text-xs">
            {(["code", "link"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setVerificationMethod(method)}
                className={`flex-1 py-1.5 px-3 rounded-lg font-medium border transition cursor-pointer ${
                  verificationMethod === method
                    ? "bg-white dark:bg-slate-900 border-[#4F2396] dark:border-purple-500 text-[#4F2396] dark:text-purple-300 shadow-2xs font-semibold"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {method === "code"
                  ? t("Method A: Verification Code (Desk OTP)", "الطريقة 1: رمز التحقق المباشر (OTP)")
                  : t("Method B: Verification Link (Caller Self-Service)", "الطريقة 2: رابط توثيق للعميل")}
              </button>
            ))}
          </div>

          {!verificationSession ? (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={initiatingVerification || !guestPhone.trim()}
                onClick={() => onInitiateVerification(verificationMethod)}
                className="h-9 px-4 rounded-lg bg-[#4F2396] hover:bg-[#3D1A78] text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {initiatingVerification ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                <span>
                  {verificationMethod === "code"
                    ? t("Send 6-Digit OTP Code", "إرسال رمز التحقق للعميل")
                    : t("Generate Verification Link", "توليد رابط التوثيق للعميل")}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 bg-white dark:bg-[#0E0D16] p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              {verificationMethod === "link" && verificationLink && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t("Guest Portal Verification URL:", "رابط بوابة توثيق العميل:")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      readOnly
                      value={verificationLink}
                      className="flex-1 min-w-[200px] h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[11px] font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(verificationLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>{copiedLink ? t("Copied!", "تم النسخ!") : t("Copy", "نسخ")}</span>
                    </button>
                    <a
                      href={verificationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-[#4F2396] dark:text-purple-300 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 text-xs font-semibold flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      <span>{t("Open", "فتح")}</span>
                    </a>
                    <button
                      type="button"
                      onClick={onRefreshVerification}
                      className="px-3 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>{t("Check Status", "فحص الحالة")}</span>
                    </button>
                  </div>
                </div>
              )}

              {!verificationSession.otpVerified && verificationMethod === "code" && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                      {t("Enter 6-Digit Code received by caller:", "أدخل رمز التحقق المكون من 6 أرقام:")}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="123456"
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={verifyingOtp || !otpInput.trim()}
                    onClick={onVerifyOtp}
                    className="h-8 px-3 mt-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {verifyingOtp ? t("Verifying...", "جارٍ التحقق...") : t("Confirm OTP", "تأكيد الرمز")}
                  </button>
                </div>
              )}

              {!verificationSession.identityVerified && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                      {t("Saudi National ID / Resident Iqama (10 digits):", "رقم الهوية الوطنية أو الإقامة (10 أرقام):")}
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={nationalIdInput}
                      onChange={(e) => setNationalIdInput(e.target.value)}
                      placeholder="1XXXXXXXXX or 2XXXXXXXXX"
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#4F2396]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={verifyingId || !nationalIdInput.trim()}
                    onClick={onVerifyId}
                    className="h-8 px-3 mt-4 rounded-lg bg-[#4F2396] hover:bg-[#3D1A78] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {verifyingId ? t("Checking...", "جارٍ الفحص...") : t("Verify with Yakeen", "توثيق عبر يقين")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-white dark:bg-[#0E0D16] rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
            <CheckCircle2 size={16} />
            <span>{t("Caller Verified via Yakeen Registry", "تم توثيق هوية العميل وجواله رسمياً عبر يقين")}</span>
          </div>
          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
            ID: {verificationSession.nationalId || "VERIFIED"} · {verificationSession.phoneNumber}
          </span>
        </div>
      )}
    </div>
  );
}
