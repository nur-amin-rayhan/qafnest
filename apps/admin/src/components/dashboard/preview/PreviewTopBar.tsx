"use client";

import React from "react";
import { ArrowLeft, Check, ExternalLink, X } from "lucide-react";
import { PropertyItem } from "../types";
import { ECOSYSTEM_URLS } from "@qafnest/shared";

interface PreviewTopBarProps {
  lang: "ar" | "en";
  setLang: React.Dispatch<React.SetStateAction<"ar" | "en">>;
  property: PropertyItem;
  isApproved: boolean;
  isUnpublished: boolean;
  onApprove?: (id: string) => Promise<void> | void;
  onRequestRevisions?: (property: PropertyItem) => void;
  handleExitPreview: () => void;
  t: (ar: string, en: string) => string;
}

export function PreviewTopBar({
  lang,
  setLang,
  property,
  isApproved,
  isUnpublished,
  onApprove,
  onRequestRevisions,
  handleExitPreview,
  t,
}: PreviewTopBarProps) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-violet-500/20 bg-[#0E0E1A]/95 px-3 sm:px-6 py-2.5 backdrop-blur-md text-white shadow-xl min-h-[56px]">
      {/* Left / Start: Navigation & Status */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={handleExitPreview}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 cursor-pointer shrink-0"
          title={t("العودة إلى لوحة الإدارة (Esc)", "Back to Admin Hub (Esc)")}
        >
          <ArrowLeft className={`h-4 w-4 shrink-0 ${lang === "ar" ? "rotate-180" : ""}`} />
          <span className="hidden sm:inline">{t("العودة للإدارة", "Admin Hub")}</span>
        </button>

        <div className="h-5 w-px bg-white/20 hidden sm:block shrink-0" />

        {/* Prominent Status Badge in Top Bar */}
        {isUnpublished ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 shadow-xs shadow-amber-500/20 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="truncate">{t("قيد المراجعة • غير منشور", "UNDER REVIEW • UNPUBLISHED")}</span>
            </span>
            <span className="hidden xl:inline text-[11px] font-semibold text-gray-400 truncate">
              {t("معاينة حية للمظهر الكامل للضيوف", "Live guest portal preview")}
            </span>
          </div>
        ) : isApproved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{t("منشور ومتاح للضيوف", "PUBLISHED & LIVE ON WEB")}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300 shrink-0">
            <span>✕ {t("مرفوض / يلزم تعديلات", "REVISIONS REQUESTED")}</span>
          </span>
        )}
      </div>

      {/* Right / End: Action Controls + Visible Functional Close Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Language Toggle for Layout Testing */}
        <button
          type="button"
          onClick={() => setLang((l) => (l === "ar" ? "en" : "ar"))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 cursor-pointer shrink-0"
          title="Toggle Arabic / English layout preview"
        >
          <span className="text-[13px]">🌐</span>
          <span className="hidden md:inline">{lang === "ar" ? "English" : "العربية"}</span>
        </button>

        {/* Quick Publish / Approve */}
        {onApprove && (
          <button
            type="button"
            onClick={() => onApprove(property.id)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-status-emerald hover:bg-emerald-600 px-3 sm:px-4 py-1.5 text-xs font-black text-white shadow-md shadow-emerald-700/30 transition active:scale-95 cursor-pointer shrink-0"
            title={t("الموافقة والنشر الفوري للموقع", "Approve and publish immediately")}
          >
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{t("الموافقة والنشر", "Approve & Publish")}</span>
          </button>
        )}

        {/* Request Changes / Reject */}
        {onRequestRevisions && (
          <button
            type="button"
            onClick={() => onRequestRevisions(property)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-status-terracotta hover:bg-rose-700 px-3 sm:px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-700/30 transition active:scale-95 cursor-pointer shrink-0"
            title={t("طلب تعديلات من المضيف", "Request revisions from host")}
          >
            <span className="material-symbols-outlined text-[15px] shrink-0">rate_review</span>
            <span className="hidden sm:inline">{t("طلب تعديلات", "Request Changes")}</span>
          </button>
        )}

        {/* Live Web Link if published */}
        {isApproved && (
          <a
            href={`${ECOSYSTEM_URLS.guest}/property/${property.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-violet-400/30 bg-violet-600/30 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-violet-200 hover:bg-violet-600/50 transition cursor-pointer shrink-0"
            title="Open public guest URL"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden lg:inline">{t("عرض في المتصفح", "Live View")}</span>
          </a>
        )}

        {/* Dedicated Visible Functional Close Button */}
        <button
          type="button"
          onClick={handleExitPreview}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white px-3 sm:px-3.5 py-1.5 text-xs font-extrabold shadow-md shadow-rose-950/40 border border-rose-400/30 transition-all cursor-pointer shrink-0"
          aria-label={t("إغلاق المعاينة والعودة إلى لوحة الإدارة", "Close preview and exit preview mode")}
          title={t("إغلاق المعاينة والعودة للوحة الإدارة (Esc)", "Close preview and return to Admin Hub (Esc)")}
        >
          <X className="h-4 w-4 shrink-0" />
          <span>{t("إغلاق المعاينة", "Close Preview")}</span>
        </button>
      </div>
    </div>
  );
}

