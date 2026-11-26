"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { Mail, CheckCircle2, LoaderCircle, Smartphone, Pencil, X } from "lucide-react";
import {
  confirmPhoneChangeOtp,
  createPhoneChangeRecaptcha,
  sendPhoneChangeOtp,
} from "@/lib/auth/phoneOtpVerification";
import { getFirebaseErrorMessage } from "@/lib/firebase/client";

interface ProfileContactCardProps {
  session: Session | null;
  language: string;
  editEmail: string;
  setEditEmail: (val: string) => void;
  emailVerified: boolean;
  verifyingEmail: boolean;
  editPhone: string;
  onPhoneVerified: (newPhone: string, identityResetRequired: boolean) => void;
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
  emailOtpSent?: boolean;
  emailOtpCode?: string;
  emailDevCode?: string | null;
  setEmailOtpCode?: (val: string) => void;
  handleConfirmEmailOtp?: () => Promise<void>;
  t: (en: string, ar: string) => string;
}

export function ProfileContactCard({
  session,
  language,
  editEmail,
  setEditEmail,
  emailVerified,
  verifyingEmail,
  emailOtpSent,
  emailOtpCode,
  emailDevCode,
  setEmailOtpCode,
  handleConfirmEmailOtp,
  editPhone,
  onPhoneVerified,
  fieldErrors,
  setFieldErrors,
  handleVerifyEmail,
  t,
}: ProfileContactCardProps) {
  const [changingPhone, setChangingPhone] = useState(false);
  const [newPhoneInput, setNewPhoneInput] = useState("");
  const [otpStep, setOtpStep] = useState<"input" | "otp">("input");
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpStatus, setOtpStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!changingPhone || otpStep !== "input") return;
    let cleanupRecaptcha: (() => void) | undefined;
    const id = window.setTimeout(() => {
      const { verifier, cleanup } = createPhoneChangeRecaptcha({
        container: recaptchaRef.current,
        onError: (msg) => setOtpStatus({ type: "error", text: msg }),
      });
      verifierRef.current = verifier;
      cleanupRecaptcha = cleanup;
    }, 50);
    return () => {
      window.clearTimeout(id);
      cleanupRecaptcha?.();
      verifierRef.current = null;
    };
  }, [changingPhone, otpStep]);

  const handleRequestOtp = async () => {
    setOtpStatus(null);
    setOtpBusy(true);
    try {
      const res = await sendPhoneChangeOtp({
        rawPhone: newPhoneInput,
        verifier: verifierRef.current,
        language,
      });
      confirmationRef.current = res.confirmationResult;
      setOtpStep("otp");
      setOtpCode("");
      setOtpStatus({
        type: "success",
        text: t(
          `OTP sent to ${res.formattedPhone}`,
          `تم إرسال رمز التحقق إلى ${res.formattedPhone}`
        ),
      });
    } catch (err) {
      setOtpStatus({ type: "error", text: getFirebaseErrorMessage(err) });
    } finally {
      setOtpBusy(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!confirmationRef.current) return;
    setOtpStatus(null);
    setOtpBusy(true);
    try {
      const result = await confirmPhoneChangeOtp({
        confirmationResult: confirmationRef.current,
        otpCode,
        newPhone: newPhoneInput,
        session,
        language,
      });
      setOtpStatus({ type: "success", text: result.message });
      onPhoneVerified(result.phone, result.identityResetRequired);
      setChangingPhone(false);
      setOtpStep("input");
      setNewPhoneInput("");
      setOtpCode("");
    } catch (err) {
      setOtpStatus({ type: "error", text: getFirebaseErrorMessage(err) });
    } finally {
      setOtpBusy(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#F9F8FD] dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-4">
      <div className="pb-3 border-b border-slate-200 dark:border-white/[0.08]">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Mail size={16} strokeWidth={1.75} className="text-[#4F2396] dark:text-purple-300" />
          <span>{t("Contact & Mobile Verification", "بيانات الاتصال وتوثيق الجوال")}</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-800 dark:text-slate-300">
              {t("Email address", "البريد الإلكتروني")}
            </label>
            {emailVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={12} />
                <span>{t("Verified", "موثق")}</span>
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {t("Unverified", "غير موثق")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="email"
              dir="ltr"
              value={editEmail}
              readOnly={emailVerified}
              aria-readonly={emailVerified}
              onChange={(e) => {
                if (emailVerified) return;
                setEditEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="guest@example.com"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/35 transition-colors focus:border-[#4F2396] ${
                emailVerified
                  ? "bg-slate-100 dark:bg-white/[0.06] cursor-not-allowed"
                  : "bg-white dark:bg-[#06060B]"
              } ${
                fieldErrors.email
                  ? "border-rose-500"
                  : "border-slate-300 dark:border-white/15"
              }`}
            />
            {!emailVerified && (
              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={verifyingEmail || !editEmail}
                className="shrink-0 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
              >
                {verifyingEmail ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <span>{t("Verify", "تحقق")}</span>
                )}
              </button>
            )}
          </div>

          {emailOtpSent && !emailVerified && (
            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-900 dark:text-purple-200">
                  {t("Enter 6-digit code sent via Resend:", "أدخل رمز التحقق المكون من 6 أرقام المرسل عبر Resend:")}
                </span>
                {emailDevCode && (
                  <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded">
                    Code: {emailDevCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={emailOtpCode || ""}
                  onChange={(e) => setEmailOtpCode?.(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-28 px-3 py-1.5 text-center font-mono font-bold tracking-widest text-sm rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-[#06060B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F2396]"
                />
                <button
                  type="button"
                  onClick={handleConfirmEmailOtp}
                  disabled={verifyingEmail || (emailOtpCode || "").length < 6}
                  className="px-3 py-1.5 rounded-lg bg-[#4F2396] hover:bg-[#3D1A75] text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  {verifyingEmail ? <LoaderCircle size={14} className="animate-spin" /> : t("Confirm", "تأكيد")}
                </button>
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={verifyingEmail}
                  className="px-2 py-1.5 text-xs text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
                >
                  {t("Resend", "إعادة إرسال")}
                </button>
              </div>
            </div>
          )}
          {fieldErrors.email && (
            <p className="text-xs text-rose-700 dark:text-rose-400">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-800 dark:text-slate-300">
              {t("Saudi mobile number", "رقم الجوال السعودي")}
            </label>
            {editPhone ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={12} />
                <span>{t("OTP verified", "موثق OTP")}</span>
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {t("Not linked", "غير مربوط")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              dir="ltr"
              readOnly
              value={editPhone}
              placeholder="+966 5X XXX XXXX"
              className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/[0.06] px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F2396]/35"
            />
            <button
              type="button"
              onClick={() => {
                setChangingPhone((prev) => !prev);
                setOtpStep("input");
                setOtpStatus(null);
              }}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#06060B] hover:border-[#4F2396] text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {changingPhone ? (
                <>
                  <X size={13} />
                  <span>{t("Cancel", "إلغاء")}</span>
                </>
              ) : (
                <>
                  <Pencil size={13} />
                  <span>{editPhone ? t("Change", "تغيير") : t("Link", "ربط")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {changingPhone && (
        <div className="mt-3 p-4 rounded-xl bg-white dark:bg-[#0B0B10] border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Smartphone size={14} className="text-[#4F2396] dark:text-purple-300" />
            <span>
              {t(
                "Verify new Saudi mobile via SMS OTP (must match Nafath / Yaqeen ID)",
                "تحقق من رقم الجوال الجديد عبر رمز SMS (يجب مطابقته مع الهوية في نفاذ / يقين)"
              )}
            </span>
          </div>

          {otpStep === "input" ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="tel"
                  dir="ltr"
                  value={newPhoneInput}
                  onChange={(e) => setNewPhoneInput(e.target.value)}
                  placeholder="+9665XXXXXXXX"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 dark:text-white focus:outline-none focus:border-[#4F2396] focus-visible:ring-2 focus-visible:ring-[#4F2396]/40"
                />
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpBusy || !newPhoneInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#4F2396] hover:bg-[#3f1c79] text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {otpBusy ? t("Sending...", "جارٍ الإرسال...") : t("Send OTP", "إرسال الرمز")}
                </button>
              </div>
              <div ref={recaptchaRef} />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit OTP"
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-3.5 py-2 text-sm font-mono tabular-nums tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-[#4F2396] focus-visible:ring-2 focus-visible:ring-[#4F2396]/40"
              />
              <button
                type="button"
                onClick={handleConfirmOtp}
                disabled={otpBusy || otpCode.length < 4}
                className="px-4 py-2 rounded-xl bg-[#4F2396] hover:bg-[#3f1c79] text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {otpBusy ? t("Verifying...", "جارٍ التحقق...") : t("Verify OTP", "تأكيد الرمز")}
              </button>
            </div>
          )}

          {otpStatus && (
            <p
              className={`text-xs font-medium ${
                otpStatus.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {otpStatus.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
