"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  KeyRound,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { HostSecuritySettings, BaseTabProps } from "./types";
import { SecuritySessionsCard } from "./SecuritySessionsCard";

interface SecuritySettingsTabProps extends BaseTabProps {
  security: HostSecuritySettings;
  onUpdatePassword: (password: string) => Promise<boolean>;
  onSignOutOtherSessions: () => Promise<void>;
}

export function SecuritySettingsTab({
  security,
  onUpdatePassword,
  onSignOutOtherSessions,
  lang,
  t,
  isSaving,
}: SecuritySettingsTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(security.twoFactorEnabled);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Compute password strength
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError(
        t(
          "Password must be at least 8 characters long.",
          "يجب أن تتكون كلمة المرور من 8 خانات على الأقل."
        )
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(
        t(
          "New password and confirmation do not match.",
          "كلمة المرور وتأكيدها غير متطابقين."
        )
      );
      return;
    }

    const ok = await onUpdatePassword(newPassword);
    if (ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Update Password Card */}
      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-[#4F2396]">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {t("Change Password", "تحديث وتغيير كلمة المرور")}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {t(
                "Ensure your host account uses a strong, unique password to prevent unauthorized access.",
                "احرص على استخدام كلمة مرور قوية وغير مكررة لحماية حسابك ووحداتك العقارية."
              )}
            </p>
          </div>
        </div>

        {passwordError && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>
              {t(
                "Your password has been securely updated.",
                "تم تحديث كلمة المرور بنجاح وحماية الجلسة."
              )}
            </span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5">
              {t("Current Password", "كلمة المرور الحالية")}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 transition focus:border-violet-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            />
          </div>

          <div />

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-slate-800">
                {t("New Secure Password", "كلمة المرور الجديدة")}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>
                  {showPassword ? t("Hide", "إخفاء") : t("Show", "إظهار")}
                </span>
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 transition focus:border-violet-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            />
            {/* Strength Bar */}
            {newPassword.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      strength >= step
                        ? strength >= 3
                          ? "bg-emerald-500"
                          : "bg-amber-400"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1.5">
              {t("Confirm New Password", "تأكيد كلمة المرور الجديدة")}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs sm:text-sm font-bold text-slate-900 transition focus:border-violet-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4F2396] hover:bg-[#3d1979] px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-violet-950/20 transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("Updating Password...", "جارٍ التحديث...")}</span>
              </>
            ) : (
              <span>{t("Update Password", "تحديث كلمة المرور")}</span>
            )}
          </button>
        </div>
      </form>

      {/* 2. Two-Factor Authentication Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {t(
                  "Two-Factor Authentication (2FA)",
                  "التحقق بخطوتين عبر رسائل SMS (2FA)"
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t(
                  "Require an SMS OTP verification code upon every host portal login.",
                  "طلب رمز تحقق أمان فوري عبر رسائل الجوال عند كل عملية تسجيل دخول للمضيف."
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={twoFactor}
            onClick={() => setTwoFactor(!twoFactor)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer ${
              twoFactor ? "bg-emerald-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                twoFactor
                  ? lang === "ar"
                    ? "-translate-x-5"
                    : "translate-x-5"
                  : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
          <Smartphone size={20} className="text-slate-600 shrink-0" />
          <div className="text-xs text-slate-600 leading-relaxed font-medium">
            {t(
              "Your verified Saudi mobile number is permanently designated for SMS OTP security clearances.",
              "رقم جوالك المعتمد مسجل ومربوط لاستقبال رموز التحقق لضمان عدم وصول أي طرف غير مصرح له."
            )}
          </div>
        </div>
      </div>

      {/* 3. Active Sessions Card */}
      <SecuritySessionsCard
        currentDevice={security.currentDevice}
        loginLocation={security.loginLocation}
        isSaving={isSaving}
        onSignOutOtherSessions={onSignOutOtherSessions}
        t={t}
      />
    </div>
  );
}
