"use client";

import React from "react";
import { LoaderCircle, Lock } from "lucide-react";

interface HostEmailAuthStepProps {
  isEmailSignIn: boolean;
  setIsEmailSignIn: (val: boolean) => void;
  hostBusinessName: string;
  setHostBusinessName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onDevHostFill: () => void;
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
  onDevHostFill,
  loading,
  onSubmit,
  t,
}: HostEmailAuthStepProps) {
  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      {!isEmailSignIn && (
        <div>
          <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
            {t("Host or Business Name", "اسم المنشأة أو المضيف")}
          </label>
          <input
            type="text"
            required
            value={hostBusinessName}
            onChange={(e) => setHostBusinessName(e.target.value)}
            placeholder={t("e.g. Oasis Luxury Chalets", "مثال: شاليهات الواحة الفاخرة")}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#4F2396] focus:bg-white"
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
          {t("Email Address", "البريد الإلكتروني")}
        </label>
        <input
          type="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="host@example.com"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#4F2396] focus:bg-white"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
          {t("Password", "كلمة المرور")}
        </label>
        <input
          type="password"
          dir="ltr"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#4F2396] focus:bg-white"
        />
      </div>

      {/* Dev Host Auto-Fill Button */}
      <button
        type="button"
        onClick={onDevHostFill}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-xs font-bold text-violet-800 transition cursor-pointer"
      >
        <span>⚡ {t("Quick Dev Host Fill (host.dev@qafnest.com)", "تسجيل دخول سريع بمضيف التطوير (Dev Host)")}</span>
      </button>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4F2396] hover:bg-[#3d1a78] py-3.5 text-sm font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
      >
        {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Lock size={16} />}
        <span>
          {loading
            ? t("Verifying...", "جارٍ التحقق…")
            : isEmailSignIn
            ? t("Sign In", "تسجيل الدخول")
            : t("Create Host Account", "إنشاء حساب مضيف")}
        </span>
      </button>

      <div className="flex items-center justify-between pt-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setIsEmailSignIn(!isEmailSignIn)}
          className="text-[#4F2396] hover:underline cursor-pointer"
        >
          {isEmailSignIn
            ? t("Don't have a host account? Register now", "ليس لديك حساب مضيف؟ سجل الآن")
            : t("Already have an account? Sign In", "لديك حساب بالفعل؟ تسجيل الدخول")}
        </button>
      </div>
    </form>
  );
}

