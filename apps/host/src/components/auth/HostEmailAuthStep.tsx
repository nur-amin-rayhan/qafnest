"use client";

import React, { useState } from "react";
import { LoaderCircle, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

interface HostEmailAuthStepProps {
  isEmailSignIn: boolean;
  setIsEmailSignIn: (val: boolean) => void;
  hostBusinessName: string;
  setHostBusinessName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  t: (en: string, ar: string) => string;
}

export default function HostEmailAuthStep({
  isEmailSignIn,
  setIsEmailSignIn,
  hostBusinessName,
  setHostBusinessName,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onSubmit,
  t,
}: HostEmailAuthStepProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3.5">
      {isEmailSignIn && process.env.NODE_ENV !== "production" && (
        <button
          type="button"
          onClick={() => {
            setEmail("host.dev@qafnest.com");
            setPassword("QafNest@Dev2026!");
          }}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100/80 px-3 py-2 text-xs font-semibold text-[#4F2396] transition cursor-pointer"
        >
          <Sparkles size={13} className="text-[#4F2396]" />
          <span>{t("Fill Dev Host Credentials (host.dev@qafnest.com)", "تعبئة بيانات المضيف التجريبي (host.dev@qafnest.com)")}</span>
        </button>
      )}

      {!isEmailSignIn && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
            {t("Host or Business Name", "اسم المنشأة أو المضيف")}
          </label>
          <input
            type="text"
            required
            value={hostBusinessName}
            onChange={(e) => setHostBusinessName(e.target.value)}
            placeholder={t("e.g. Oasis Luxury Chalets", "مثال: شاليهات الواحة الفاخرة")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396] transition"
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
          {t("Email Address", "البريد الإلكتروني")}
        </label>
        <input
          type="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="host@example.com"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396] transition"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
          {t("Password", "كلمة المرور")}
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            dir="ltr"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pe-10 text-sm font-medium text-slate-900 outline-none focus:border-[#4F2396] focus:ring-1 focus:ring-[#4F2396] transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F2396] hover:bg-[#3f1b7a] py-3 text-sm font-semibold text-white shadow-xs transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock size={15} />}
        <span>
          {loading
            ? t("Verifying...", "جارٍ التحقق…")
            : isEmailSignIn
            ? t("Sign In", "تسجيل الدخول")
            : t("Create Host Account", "إنشاء حساب مضيف")}
        </span>
      </button>

      <div className="flex items-center justify-between pt-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setIsEmailSignIn(!isEmailSignIn)}
          className="text-[#4F2396] font-semibold hover:underline cursor-pointer"
        >
          {isEmailSignIn
            ? t("Don't have a host account? Register now", "ليس لديك حساب مضيف؟ سجل الآن")
            : t("Already have an account? Sign In", "لديك حساب بالفعل؟ تسجيل الدخول")}
        </button>
      </div>
    </form>
  );
}

