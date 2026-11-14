"use client";

import React, { useState } from "react";
import {
  Check,
  ChevronRight,
  Copy,
  Heart,
  MapPin,
  Maximize2,
  Share2,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { PropertyItem } from "../types";

interface PreviewTitleBarProps {
  property: PropertyItem;
  title: string;
  categoryName: string;
  cityName: string;
  district: string;
  unitReference: string;
  capacity: number;
  areaSqm: number;
  isUnpublished: boolean;
  lang: "ar" | "en";
  t: (ar: string, en: string) => string;
}

export function PreviewTitleBar({
  property,
  title,
  categoryName,
  cityName,
  district,
  unitReference,
  capacity,
  areaSqm,
  isUnpublished,
  lang,
  t,
}: PreviewTitleBarProps) {
  const [shareNotice, setShareNotice] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareNotice(true);
      setTimeout(() => setShareNotice(false), 2000);
    } catch {
      setShareNotice(false);
    }
  };

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
        <span>{t("الرئيسية", "Home")}</span>
        <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
        <span className="text-violet-600 dark:text-violet-400 font-medium">{cityName}</span>
        <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
        <span className="max-w-[40vw] truncate font-semibold text-gray-800 dark:text-gray-200">{title}</span>
      </nav>

      {/* Title, Badges & Actions */}
      <div className="border-b border-gray-100 pb-5 dark:border-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {isUnpublished && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-500/25 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-300 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <span>⏳ {t("قيد المراجعة • غير منشور", "Under Review • Unpublished")}</span>
                </span>
              )}

              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
                {categoryName}
              </span>

              {property.tourism_license_number && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{t("مرخص من وزارة السياحة", "MOT Licensed")}</span>
                </span>
              )}

              <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-2.5 py-1 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-300">
                <Zap className="h-3 w-3" />
                <span>{t("حجز فوري", "Instant Booking")}</span>
              </span>
            </div>

            <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-3xl lg:text-4xl">
              {title}
            </h1>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("رقم الوحدة المرجعي", "Listing Reference")} ({unitReference})
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-200/80 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-xs transition hover:border-violet-400 hover:text-violet-700 dark:border-violet-500/25 dark:bg-[#12101a] dark:text-gray-200 cursor-pointer"
            >
              {shareNotice ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Share2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              )}
              <span>{shareNotice ? t("تم النسخ", "Copied") : t("مشاركة", "Share")}</span>
              {shareNotice && <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold shadow-xs transition cursor-pointer ${
                isWishlisted
                  ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300"
                  : "border-violet-200/80 bg-white text-gray-700 hover:border-violet-400 dark:border-violet-500/25 dark:bg-[#12101a] dark:text-gray-200"
              }`}
            >
              <Heart
                className={`h-4 w-4 ${
                  isWishlisted ? "fill-current" : "text-violet-600 dark:text-violet-400"
                }`}
              />
              <span>{t("حفظ", "Save")}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex w-full flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-600 dark:border-white/10 dark:text-gray-300">
          <span className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
            <Star className="h-4 w-4 text-gray-400" />
            <span className="font-normal text-gray-500 dark:text-gray-400">
              {t("إدراج جديد (0 تقييم)", "New listing (0 reviews)")}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-violet-500" />
            <span>{district}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5 text-violet-500" />
            <span>{areaSqm} m²</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-violet-500" />
            <span>{t(`حتى ${capacity} ضيوف`, `Up to ${capacity} guests`)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

