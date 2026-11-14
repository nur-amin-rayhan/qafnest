"use client";

import React from "react";
import Link from "next/link";
import { localizePath, type Locale } from "@/lib/localization/localeHelper";
import {
  ChevronRight,
  ShieldCheck,
  Zap,
  Star,
  MapPin,
  Maximize2,
  Users,
  Share2,
  Check,
  Copy,
  Heart,
  Hash,
} from "lucide-react";
import type { Property } from "@/data/properties";

interface PropertyHeaderSectionProps {
  property: Property;
  title: string;
  cityName: string;
  district: string;
  categoryName: string;
  capacity: number;
  returnHref: string;
  unitReference: string;
  reviewStats: { average: number; total: number };
  shareNotice: boolean;
  isWishlisted: boolean;
  language: Locale;
  onShare: () => Promise<void>;
  onToggleWishlist: () => void;
  anchorLabel: (en: string, ar: string) => string;
}

export function PropertyHeaderSection({
  property,
  title,
  cityName,
  district,
  categoryName,
  capacity,
  returnHref,
  unitReference,
  reviewStats,
  shareNotice,
  isWishlisted,
  language,
  onShare,
  onToggleWishlist,
  anchorLabel,
}: PropertyHeaderSectionProps) {
  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav
        className="mb-5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
        aria-label="Breadcrumb"
      >
        <Link href={localizePath("/", language)} className="transition hover:text-violet-600">
          {anchorLabel("Home", "الرئيسية")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <Link href={localizePath(returnHref, language)} className="transition hover:text-violet-600">
          {cityName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="max-w-[48vw] truncate font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </span>
      </nav>

      {/* Main Title & Action Bar */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {/* Prominent High-Visibility Badges Row */}
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Sequential Numeric Unit Code Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200/90 bg-violet-50/90 px-3 py-1.5 text-xs font-black text-[#4F2396] shadow-2xs dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300">
              <Hash className="h-3.5 w-3.5 text-[#FF9750]" />
              <span>{anchorLabel("Unit", "الوحدة")}</span>
              <span className="font-mono text-xs font-black tracking-wide text-slate-900 dark:text-white">
                #{unitReference}
              </span>
            </span>

            {/* Category Badge */}
            <span className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-black text-slate-800 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-white">
              {categoryName}
            </span>

            {/* Licensed Stay Badge */}
            {property.isLicensed && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800 shadow-2xs dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                {anchorLabel("Licensed Stay", "إقامة مرخصة")}
              </span>
            )}

            {/* Instant Booking Badge */}
            {property.instantBook && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-black text-fuchsia-800 shadow-2xs dark:border-fuchsia-500/20 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
                <Zap className="h-3.5 w-3.5 text-[#4F2396]" />
                {anchorLabel("Instant Booking", "حجز فوري")}
              </span>
            )}

            {/* Under Review if not approved */}
            {!property.isApproved && property.status !== "approved" && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-300 shadow-2xs animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>⏳ {anchorLabel("Under Review", "قيد المراجعة")}</span>
              </span>
            )}
          </div>

          {/* Main Title */}
          <h1 className="font-display text-2xl font-black tracking-tight text-gray-950 dark:text-white sm:text-3xl lg:text-4xl">
            {title}
          </h1>

          {/* Prominent High-Visibility Property Metadata Section (Gathern Benchmark Style) */}
          <div className="mt-4 flex flex-wrap items-stretch gap-2.5 sm:gap-3">
            {/* Rating Card */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-2xs dark:border-white/10 dark:bg-[#12101a]">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {anchorLabel("Rating", "التقييم")}
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {reviewStats.total > 0 ? (
                    <>
                      {reviewStats.average.toFixed(1)}
                      <span className="text-[10px] font-bold text-slate-400"> / 10</span>
                      <span className="ms-1 text-[11px] font-semibold text-slate-500">
                        ({reviewStats.total})
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-slate-500">{anchorLabel("New", "جديد")}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Unit Area Card */}
            {property.areaSqm && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-violet-200/90 bg-violet-50/50 px-3.5 py-2.5 shadow-2xs dark:border-violet-500/25 dark:bg-violet-950/30">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-100 text-[#4F2396] dark:bg-violet-900/50 dark:text-violet-300">
                  <Maximize2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#4F2396] dark:text-violet-300">
                    {anchorLabel("Unit Area", "المساحة")}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {property.areaSqm} <span className="text-[11px] font-bold text-slate-500">m² / م²</span>
                  </div>
                </div>
              </div>
            )}

            {/* Guest Capacity Card */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/90 bg-emerald-50/50 px-3.5 py-2.5 shadow-2xs dark:border-emerald-500/25 dark:bg-emerald-950/30">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {anchorLabel("Capacity", "السعة")}
                </div>
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {property.guestPolicy ||
                    anchorLabel(`Up to ${capacity} Guests`, `حتى ${capacity} ضيوف`)}
                </div>
              </div>
            </div>

            {/* Location Card (Strictly localized) */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-2xs dark:border-white/10 dark:bg-[#12101a] max-w-full sm:max-w-xs">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {anchorLabel("Location", "الموقع")}
                </div>
                <div className="truncate text-xs sm:text-sm font-black text-slate-900 dark:text-white" title={district}>
                  {district}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-2xl border border-violet-200/80 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-xs transition hover:border-violet-400 hover:text-violet-700 dark:border-violet-500/25 dark:bg-[#12101a] dark:text-gray-200 dark:hover:text-violet-300 cursor-pointer"
          >
            {shareNotice ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Share2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            )}
            <span>
              {shareNotice
                ? anchorLabel("Copied", "تم النسخ")
                : anchorLabel("Share", "مشاركة")}
            </span>
            {shareNotice && <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleWishlist}
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
            {anchorLabel("Save", "حفظ")}
          </button>
        </div>
      </div>
    </>
  );
}

