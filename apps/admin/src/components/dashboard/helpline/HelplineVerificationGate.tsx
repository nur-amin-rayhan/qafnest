"use client";

import React, { useState } from "react";
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
      className={`rounded-2xl border p-4 space-y-3.5 transition-all ${
        verificationSession?.completed ? "border-status-emerald/40 bg-status-emerald/5" : "border-amber-300 bg-amber-50/50"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined text-[20px] ${
              verificationSession?.completed ? "text-status-emerald" : "text-amber-600"
            }`}
          >
            {verificationSession?.completed ? "verified_user" : "shield_lock"}
          </span>
          <div>
            <h4 className="text-xs font-black text-on-surface">
              {t("Zero-Bypass Identity & Mobile OTP Gate", "بوابة التوثيق الإلزامية (نفاذ + يقين + رمز الجوال)")}
            </h4>
            <p className="text-[11px] text-outline">
              {t(
                "Saudi regulation strictly requires caller phone OTP & National ID / Iqama verification before room hold.",
                "اشتراطات المنصة تتطلب توثيق جوال العميل ورقم الهوية/الإقامة رسمياً قبل الحجز."
              )}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
            verificationSession?.completed
              ? "bg-status-emerald text-white"
              : verificationSession?.otpVerified
              ? "bg-blue-600 text-white"
              : "bg-amber-200 text-amber-900"
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
        <div className="p-2.5 rounded-xl bg-white border border-surface-container text-xs font-semibold text-on-surface flex items-center justify-between">
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
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold border transition cursor-pointer ${
                  verificationMethod === method
                    ? "bg-white border-primary text-primary shadow-2xs"
                    : "bg-surface-container-low border-surface-container text-on-surface-variant"
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
                className="h-9 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">{initiatingVerification ? "sync" : "send"}</span>
                <span>
                  {verificationMethod === "code"
                    ? t("Send 6-Digit OTP Code", "إرسال رمز التحقق للعميل")
                    : t("Generate Verification Link", "توليد رابط التوثيق للعميل")}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 bg-white p-3.5 rounded-xl border border-surface-container">
              {verificationMethod === "link" && verificationLink && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-on-surface">
                    {t("Guest Portal Verification URL:", "رابط بوابة توثيق العميل:")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      readOnly
                      value={verificationLink}
                      className="flex-1 min-w-[200px] h-8 px-2 rounded-lg border border-surface-container bg-surface-container-low text-[11px] font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(verificationLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface"
                    >
                      {copiedLink ? t("Copied!", "تم النسخ!") : t("Copy", "نسخ")}
                    </button>
                    <a
                      href={verificationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center"
                    >
                      {t("Open", "فتح")}
                    </a>
                    <button
                      type="button"
                      onClick={onRefreshVerification}
                      className="px-3 h-8 rounded-lg bg-status-emerald/15 text-status-emerald hover:bg-status-emerald/25 text-xs font-bold"
                    >
                      {t("Check Status", "فحص الحالة")}
                    </button>
                  </div>
                </div>
              )}

              {!verificationSession.otpVerified && verificationMethod === "code" && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-on-surface mb-0.5">
                      {t("Enter 6-Digit Code received by caller:", "أدخل رمز التحقق المكون من 6 أرقام:")}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="123456"
                      className="w-full h-8 px-2 rounded-lg border border-surface-container text-xs font-mono text-center tracking-widest"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={verifyingOtp || !otpInput.trim()}
                    onClick={onVerifyOtp}
                    className="h-8 px-3 mt-4 rounded-lg bg-status-emerald text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    {verifyingOtp ? "Verifying..." : "Confirm OTP"}
                  </button>
                </div>
              )}

              {!verificationSession.identityVerified && (
                <div className="flex items-center gap-2 pt-2 border-t border-surface-container-low">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-on-surface mb-0.5">
                      {t("Saudi National ID / Resident Iqama (10 digits):", "رقم الهوية الوطنية أو الإقامة (10 أرقام):")}
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={nationalIdInput}
                      onChange={(e) => setNationalIdInput(e.target.value)}
                      placeholder="1XXXXXXXXX or 2XXXXXXXXX"
                      className="w-full h-8 px-2 rounded-lg border border-surface-container text-xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={verifyingId || !nationalIdInput.trim()}
                    onClick={onVerifyId}
                    className="h-8 px-3 mt-4 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                  >
                    {verifyingId ? "Checking..." : "Verify with Yakeen"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-white rounded-xl border border-status-emerald/30 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-status-emerald font-bold">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{t("Caller Verified via Yakeen Registry", "تم توثيق هوية العميل وجواله رسمياً عبر يقين")}</span>
          </div>
          <span className="font-mono text-outline text-[11px]">
            ID: {verificationSession.nationalId || "VERIFIED"} · {verificationSession.phoneNumber}
          </span>
        </div>
      )}
    </div>
  );
}
