"use client";

import React from "react";
import { Globe, ShieldCheck, ExternalLink, LogOut } from "lucide-react";
import { ECOSYSTEM_URLS } from "@qafnest/shared";

interface CmsHeaderProps {
  userEmail?: string | null;
  lang: "en" | "ar";
  setLang: (lang: "en" | "ar") => void;
  signOut: () => void;
  t: (en: string, ar: string) => string;
}

export function CmsHeader({
  userEmail,
  lang,
  setLang,
  signOut,
  t,
}: CmsHeaderProps) {
  return (
    <header className="h-16 border-b border-white/10 bg-[#0C1018]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-black text-lg">
          Q
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight">QafNest CMS</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
              {t("Content & SEO", "المحتوى وتحسين البحث")}
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            {t("Marketing & Editorial Publishing Portal", "بوابة النشر التحريري والتسويق")}
          </p>
        </div>
      </div>

      {/* Center: Switch to Admin Hub Button */}
      <div className="hidden md:flex items-center gap-3">
        <a
          href={ECOSYSTEM_URLS.admin}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t("Switch to Executive Admin Operations Hub", "الانتقال إلى لوحة تحكم العمليات والإدارة")}</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-medium cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === "en" ? "العربية" : "English"}</span>
        </button>

        <span className="text-xs text-gray-400 hidden sm:inline">{userEmail || "editorial@qafnest.com"}</span>

        <button
          type="button"
          onClick={signOut}
          title={t("Sign out", "تسجيل الخروج")}
          className="p-2 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

