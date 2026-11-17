"use client";

import React from "react";
import { FileText, Mail, Sliders, HelpCircle, Megaphone, ShieldCheck, FileCheck2, ExternalLink } from "lucide-react";
import { ECOSYSTEM_URLS } from "@qafnest/shared";
import type { CmsTab } from "../types/cms";

interface CmsSidebarProps {
  activeTab: string;
  setActiveTab: (tab: CmsTab) => void;
  articlesCount: number;
  t: (en: string, ar: string) => string;
}

export function CmsSidebar({
  activeTab,
  setActiveTab,
  articlesCount,
  t,
}: CmsSidebarProps) {
  const selectLegacy = (tab: CmsTab) => setActiveTab(tab);
  return (
    <aside className="w-full md:w-64 border-r border-white/10 bg-[#090C13] p-4 space-y-1">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
        {t("Content Publishing", "إدارة ونشر المحتوى")}
      </div>

      <button
        type="button"
        onClick={() => selectLegacy("blogs")}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === "blogs"
            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>{t("Guest Blog Articles", "مقالات مدونة الضيوف")}</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
          {articlesCount}
        </span>
      </button>

      <button
        type="button"
        onClick={() => selectLegacy("legal-pages")}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === "legal-pages"
            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <FileText className="w-4 h-4 text-teal-400" />
        <span>{t("Footer & Legal Pages", "صفحات الفوتر والسياسات")}</span>
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
          5 Pages
        </span>
      </button>

      <button
        type="button"
        onClick={() => selectLegacy("contact-us")}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === "contact-us"
            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <Mail className="w-4 h-4 text-teal-400" />
        <span>{t("Contact Form & Gmail", "نموذج التواصل و Gmail")}</span>
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
          Inbox
        </span>
      </button>

      <button
        type="button"
        onClick={() => selectLegacy("site-seo")}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === "site-seo"
            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <Sliders className="w-4 h-4" />
        <span>{t("SEO & Metadata Engine", "محرك السيو والعناوين")}</span>
      </button>

      <button
        type="button"
        onClick={() => selectLegacy("faqs")}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === "faqs"
            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <HelpCircle className="w-4 h-4" />
        <span>{t("Platform FAQs", "الأسئلة الشائعة")}</span>
      </button>

      <button
        type="button"
        onClick={() => selectLegacy("home-popups")}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === "home-popups"
            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <Megaphone className="w-4 h-4" />
        <span>{t("Marketing Banners", "الإعلانات التسويقية")}</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("identity")}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === "identity"
            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>{t("Saudi Identity (Yakeen/Nafath)", "توثيق الهوية (يقين ونفاذ)")}</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("zatca")}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
          activeTab === "zatca"
            ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <FileCheck2 className="w-4 h-4 text-purple-400" />
        <span>{t("ZATCA E-Invoicing (Fatoorah)", "الفوترة الإلكترونية (زاتكا)")}</span>
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
          Phase 2
        </span>
      </button>

      <div className="pt-6 border-t border-white/10 mt-4">
        <div className="p-3 rounded-xl bg-purple-900/10 border border-purple-500/20 text-xs space-y-2">
          <p className="font-semibold text-purple-200">{t("Operations & Approvals", "العمليات والاعتمادات")}</p>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            {t(
              "Property verification, host payouts, and booking ledgers have been consolidated into the dedicated Admin Operations Hub.",
              "تم نقل اعتماد العقارات، الحجوزات والمدفوعات إلى لوحة الإدارة المتخصصة."
            )}
          </p>
          <div className="flex flex-col gap-1.5 pt-1">
            <a
              href={ECOSYSTEM_URLS.admin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-bold text-[11px]"
            >
              <span>{t("Open Admin Hub", "فتح لوحة الإدارة")}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="tel:+966576707709"
              className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-semibold text-[11px]"
            >
              <span>{t("Support: 0576707709", "الدعم: 0576707709")}</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}

