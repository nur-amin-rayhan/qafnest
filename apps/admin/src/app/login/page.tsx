"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, LoaderCircle, Globe } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl") || "/";
  const returnUrl =
    rawReturnUrl.startsWith("/") && !rawReturnUrl.startsWith("//")
      ? rawReturnUrl
      : "/";

  const { user, loading: authLoading, signIn, lang, toggleLang, dir, t } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to returnUrl
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(returnUrl);
    }
  }, [user, authLoading, router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage(
        t("Please enter both email and password.", "يرجى إدخال البريد الإلكتروني وكلمة المرور.")
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.success) {
        router.replace(returnUrl);
      } else {
        setErrorMessage(
          result.error ||
            t(
              "Authentication failed. Invalid admin credentials.",
              "فشلت المصادقة. بيانات دخول المشرف غير صحيحة."
            )
        );
      }
    } catch {
      setErrorMessage(
        t(
          "Unable to connect to authorization server. Please try again.",
          "تعذر الاتصال بخادم المصادقة. يرجى المحاولة مرة أخرى."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir={dir}
      className="min-h-screen bg-[#05070B] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden"
    >
      {/* Background Glows */}
      <div className="absolute top-1/4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-purple-700/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 end-10 w-[300px] h-[250px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Language Toggle */}
      <div className="w-full max-w-md flex justify-end mb-4 relative z-10">
        <button
          type="button"
          onClick={toggleLang}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 transition cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-purple-300" />
          <span>{lang === "en" ? "العربية" : "English"}</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-[#0C101A]/90 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-2xl relative z-10">
        {/* Header & Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-[32px] font-black tracking-[-0.05em] text-white" dir="ltr">
              Qaf<span className="text-[#a78bfa]">Nest</span>
              <span className="text-[#FF9750]">.</span>
            </span>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase text-emerald-300 border border-emerald-500/30">
              {t("OPERATIONS v1.0.0", "العمليات v1.0.0")}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold mb-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{t("Authorized Operations & Moderation", "إدارة العمليات والرقابة المعتمدة")}</span>
          </div>

          <p className="text-xs text-gray-400">
            {t(
              "Sign in with administrative credentials to access moderation, listing audit, and platform settings.",
              "سجّل الدخول ببيانات المشرف للوصول إلى الرقابة ومراجعة العقارات وإعدادات المنصة."
            )}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">
              {t("Admin Email", "البريد الإلكتروني للمشرف")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@qafnest.com"
                required
                dir="ltr"
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl ps-11 pe-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-300">
                {t("Password", "كلمة المرور")}
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                dir="ltr"
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl ps-11 pe-11 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition p-1 cursor-pointer"
                aria-label={showPassword ? t("Hide password", "إخفاء كلمة المرور") : t("Show password", "إظهار كلمة المرور")}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || authLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-2xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <LoaderCircle className="w-4 h-4 animate-spin" />
                <span>{t("Authenticating...", "جارٍ التحقق من الصلاحيات...")}</span>
              </>
            ) : (
              <span>{t("Sign In to Super Admin", "تسجيل الدخول إلى لوحة المشرف العام")}</span>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-gray-500 relative z-10">
        {t(
          "QafNest Central Platform Operations & Moderation · Saudi Arabia",
          "العمليات المركزية والرقابة لمنصة قاف نست · المملكة العربية السعودية"
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#05070B] flex items-center justify-center">
          <LoaderCircle className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      }
    >
      <AdminLoginContent />
    </React.Suspense>
  );
}
