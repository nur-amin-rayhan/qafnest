"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { CheckCircle2, LoaderCircle, ShieldCheck, Smartphone, X } from "lucide-react";
import { isValidSaudiIdDigits } from "@qafnest/shared/saudiIdentity";
import { normalizePhoneInput } from "@qafnest/shared/phone";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { verifySaudiDocument } from "@/app/account/hooks/accountVerificationHelpers";
import {
  confirmPhoneChangeOtp,
  createPhoneChangeRecaptcha,
  sendPhoneChangeOtp,
} from "@/lib/auth/phoneOtpVerification";

export const OPEN_IDENTITY_MODAL_EVENT = "qafnest:open-identity-modal";

export function dispatchOpenIdentityModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_IDENTITY_MODAL_EVENT));
  }
}

export default function GuestIdentityGateModal() {
  const { language } = useApp();
  const { user, session, profile, loading, authModalOpen, refreshProfile } = useAuth();
  const t = (en: string, ar: string) => (language === "ar" ? ar : en);

  const normalizedPhone = useMemo(
    () => normalizePhoneInput(profile?.phone || user?.phone || "") || "",
    [profile?.phone, user?.phone]
  );
  const isVerified = Boolean(profile?.is_verified || user?.app_metadata?.is_verified);

  const [forceOpen, setForceOpen] = useState(false);
  const [dismissedForUser, setDismissedForUser] = useState<string | null>(null);
  const [changingPhone, setChangingPhone] = useState(false);

  const [phoneInput, setPhoneInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const initialIdType =
    profile?.id_type === "iqama" || profile?.iqama ? "iqama" : "national_id";
  const [idType, setIdType] = useState<"national_id" | "iqama">(initialIdType);
  const [idNumber, setIdNumber] = useState("");
  const [verifyingId, setVerifyingId] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedSummary, setVerifiedSummary] = useState<{
    fullName: string;
    message: string;
  } | null>(null);

  const needsPhoneStep = !normalizedPhone || changingPhone;

  useEffect(() => {
    const onOpenRequest = () => {
      setErrorMsg(null);
      setVerifiedSummary(null);
      setDismissedForUser(null);
      setForceOpen(true);
    };
    window.addEventListener(OPEN_IDENTITY_MODAL_EVENT, onOpenRequest);
    return () => window.removeEventListener(OPEN_IDENTITY_MODAL_EVENT, onOpenRequest);
  }, []);

  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentId = user?.id || null;
    if (currentId && currentId !== prevUserIdRef.current) {
      setDismissedForUser(null);
      setVerifiedSummary(null);
      setErrorMsg(null);
      setChangingPhone(false);
      setOtpSent(false);
      setOtpCode("");
    }
    if (!currentId) {
      setForceOpen(false);
      setDismissedForUser(null);
    }
    prevUserIdRef.current = currentId;
  }, [user?.id]);

  const autoPromptOpen = Boolean(
    user &&
      profile &&
      !loading &&
      !authModalOpen &&
      !isVerified &&
      dismissedForUser !== user.id
  );
  const isOpen = Boolean(user && (autoPromptOpen || forceOpen || verifiedSummary));

  useEffect(() => {
    if (!isOpen || !needsPhoneStep) {
      verifierRef.current = null;
      setRecaptchaReady(false);
      return;
    }

    const { verifier, cleanup } = createPhoneChangeRecaptcha({
      container: recaptchaContainerRef.current,
      onReady: () => setRecaptchaReady(true),
      onExpired: () => setRecaptchaReady(false),
      onError: (msg) => setErrorMsg(msg),
    });
    verifierRef.current = verifier;
    return () => {
      cleanup();
      verifierRef.current = null;
      setRecaptchaReady(false);
    };
  }, [isOpen, needsPhoneStep]);

  if (!isOpen || !user) return null;

  const handleDismiss = () => {
    setForceOpen(false);
    setVerifiedSummary(null);
    setErrorMsg(null);
    setChangingPhone(false);
    setOtpSent(false);
    setOtpCode("");
    setDismissedForUser(user.id);
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setOtpBusy(true);
    try {
      const result = await sendPhoneChangeOtp({
        rawPhone: phoneInput,
        verifier: verifierRef.current,
        language,
      });
      confirmationRef.current = result.confirmationResult;
      setOtpSent(true);
      setOtpCode("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("Failed to send OTP.", "تعذر إرسال رمز التحقق."));
    } finally {
      setOtpBusy(false);
    }
  };

  const handleConfirmPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationRef.current) return;
    setErrorMsg(null);
    setOtpBusy(true);
    try {
      await confirmPhoneChangeOtp({
        confirmationResult: confirmationRef.current,
        otpCode,
        newPhone: phoneInput,
        session,
        language,
      });
      await refreshProfile(user.id);
      setChangingPhone(false);
      setOtpSent(false);
      setOtpCode("");
      setPhoneInput("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("Invalid verification code.", "رمز التحقق غير صحيح."));
    } finally {
      setOtpBusy(false);
    }
  };

  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanedId = idNumber.trim().replace(/\D/g, "");
    const resolvedType: "national_id" | "iqama" = cleanedId.startsWith("2")
      ? "iqama"
      : cleanedId.startsWith("1")
      ? "national_id"
      : idType;
    const expectedPrefix = resolvedType === "iqama" ? "2" : "1";

    if (!isValidSaudiIdDigits(cleanedId, expectedPrefix)) {
      setErrorMsg(
        resolvedType === "iqama"
          ? t(
              "Enter a valid 10-digit Saudi Iqama number starting with 2.",
              "أدخل رقم إقامة صالح مكون من 10 أرقام يبدأ بالرقم 2."
            )
          : t(
              "Enter a valid 10-digit Saudi National ID starting with 1.",
              "أدخل رقم هوية وطنية صالح مكون من 10 أرقام يبدأ بالرقم 1."
            )
      );
      return;
    }

    if (!normalizedPhone) {
      setErrorMsg(
        t(
          "Verify your Saudi mobile number first before checking National ID or Iqama.",
          "وثق رقم جوالك السعودي أولاً قبل التحقق من الهوية أو الإقامة."
        )
      );
      return;
    }

    setVerifyingId(true);
    try {
      const res = await verifySaudiDocument({
        type: resolvedType,
        rawId: cleanedId,
        fullName: profile?.full_name || undefined,
        phone: normalizedPhone,
        session,
        language,
      });
      if (!res.success) {
        setErrorMsg(res.message);
        return;
      }

      await refreshProfile(user.id);
      setVerifiedSummary({
        fullName: res.fullName || profile?.full_name || t("Verified Guest", "ضيف موثق"),
        message: res.message,
      });
    } finally {
      setVerifyingId(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-identity-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[#E4DFF0] bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#0E0E1A]">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t("Close", "إغلاق")}
          className="absolute top-4 end-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pe-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EEFF] text-[#4F2396] dark:bg-purple-950/40 dark:text-purple-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="guest-identity-gate-title"
              className="text-base font-semibold text-slate-900 dark:text-white"
            >
              {t("Identity Verification Required", "توثيق الهوية مطلوب لإتمام الحجز")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {t(
                "Nafath / Elm Yaqeen · Matches verified mobile number",
                "نفاذ / علم يقين · يجب مطابقة الهوية مع رقم الجوال الموثق"
              )}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-950/30 dark:text-rose-300"
          >
            {errorMsg}
          </div>
        )}

        {verifiedSummary ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{t("Verified & Synced", "تم التحقق ومزامنة الاسم")}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {verifiedSummary.fullName}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {verifiedSummary.message}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full rounded-xl bg-[#4F2396] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3d1979] cursor-pointer"
            >
              {t("Continue to Booking", "المتابعة لإتمام الحجز")}
            </button>
          </div>
        ) : needsPhoneStep ? (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Smartphone className="h-4 w-4 text-[#4F2396] dark:text-purple-300" />
              <span>
                {t(
                  "Step 1 of 2: Verify the Saudi mobile number linked to your National ID or Iqama.",
                  "الخطوة 1 من 2: وثق رقم الجوال السعودي المسجل باسمك في نفاذ / علم يقين."
                )}
              </span>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                <div className="flex gap-2" dir="ltr">
                  <span className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    +966
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="5XXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 outline-none focus:border-[#4F2396] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div ref={recaptchaContainerRef} className="min-h-[78px]" />
                <div className="flex items-center gap-2">
                  {normalizedPhone && (
                    <button
                      type="button"
                      onClick={() => {
                        setChangingPhone(false);
                        setErrorMsg(null);
                      }}
                      className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      {t("Back", "رجوع")}
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={otpBusy || !recaptchaReady || !phoneInput.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#4F2396] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3d1979] disabled:opacity-50 cursor-pointer"
                  >
                    {otpBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    <span>{t("Send Verification Code", "إرسال رمز التحقق")}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPhoneOtp} className="space-y-3">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  {t("Enter the 6-digit SMS code", "أدخل رمز التحقق المرسل برسالة SMS")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-center font-mono text-base tracking-widest tabular-nums text-slate-900 outline-none focus:border-[#4F2396] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  required
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {t("Change", "تعديل")}
                  </button>
                  <button
                    type="submit"
                    disabled={otpBusy || otpCode.length < 4}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#4F2396] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3d1979] disabled:opacity-50 cursor-pointer"
                  >
                    {otpBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    <span>{t("Confirm Mobile", "تأكيد الجوال")}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleVerifyIdentity} className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-slate-600 dark:text-slate-300">
                {t("Verified mobile:", "الجوال الموثق:")}{" "}
                <bdi dir="ltr" className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                  {normalizedPhone}
                </bdi>
              </span>
              <button
                type="button"
                onClick={() => {
                  setChangingPhone(true);
                  setErrorMsg(null);
                }}
                className="text-xs font-semibold text-[#4F2396] hover:underline dark:text-purple-300 cursor-pointer"
              >
                {t("Change", "تغيير")}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  setIdType("national_id");
                  setErrorMsg(null);
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                  idType === "national_id"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                {t("National ID (1...)", "الهوية الوطنية (1...)")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdType("iqama");
                  setErrorMsg(null);
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                  idType === "iqama"
                    ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                {t("Iqama (2...)", "رقم الإقامة (2...)")}
              </button>
            </div>

            <div>
              <label
                htmlFor="guest-identity-gate-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {idType === "iqama"
                  ? t("Iqama Number", "رقم الإقامة")
                  : t("Saudi National ID", "رقم الهوية الوطنية")}
              </label>
              <input
                id="guest-identity-gate-input"
                type="text"
                inputMode="numeric"
                dir="ltr"
                maxLength={10}
                value={idNumber}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setIdNumber(clean);
                  if (clean.startsWith("2")) setIdType("iqama");
                  else if (clean.startsWith("1")) setIdType("national_id");
                  setErrorMsg(null);
                }}
                placeholder={idType === "iqama" ? "2XXXXXXXXX" : "1XXXXXXXXX"}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm tabular-nums text-slate-900 outline-none focus:border-[#4F2396] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                required
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {t(
                  "Must be registered under your verified mobile number. Your official name will be fetched automatically from Nafath / Elm Yaqeen.",
                  "يجب أن يكون الرقم مسجلاً على رقم جوالك الموثق. سيتم جلب الاسم الرسمي تلقائياً من نفاذ / علم يقين."
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              >
                {t("Later", "لاحقاً")}
              </button>
              <button
                type="submit"
                disabled={verifyingId || idNumber.length !== 10}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F2396] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#3d1979] disabled:opacity-50 cursor-pointer"
              >
                {verifyingId && <LoaderCircle className="h-4 w-4 animate-spin" />}
                <span>{t("Verify & Fetch Name", "التحقق وجلب الاسم")}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
