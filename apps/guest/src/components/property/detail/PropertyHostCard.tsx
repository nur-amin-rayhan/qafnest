"use client";

import React from "react";
import Link from "next/link";
import { Star, ChevronRight, ShieldCheck, Zap, Sparkles, Building2 } from "lucide-react";
import type { Property } from "@/data/properties";
import { resolveHostForProperty } from "@/lib/services/hostService";

interface PropertyHostCardProps {
  property: Property;
  anchorLabel: (en: string, ar: string) => string;
}

export default function PropertyHostCard({
  property,
  anchorLabel,
}: PropertyHostCardProps) {
  const host = resolveHostForProperty(property);
  const hostDisplayName = anchorLabel(host.name, host.nameAr || host.name);
  const hostBadge = anchorLabel(host.badge, host.badgeAr || host.badge);
  const initial = (host.nameAr || host.name || "Q").trim().slice(0, 1).toUpperCase();

  const cardContent = (
    <>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Host Profile Avatar Icon with Verified Badge */}
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-2xl font-black text-white shadow-md shadow-violet-700/25 ring-4 ring-white dark:ring-[#12101a]">
                {initial}
              </div>
              {host.verified && (
                <div
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-[#12101a]"
                  title={anchorLabel("Verified Host", "مضيف موثق")}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* Host Identity Details */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-950 transition-colors group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-400">
                  {hostDisplayName}
                </h3>
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
                  {hostBadge}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {host.memberSince
                  ? anchorLabel(`Member since ${host.memberSince} · QafNest Host`, `عضو منذ ${host.memberSince} · مضيف قاف نست`)
                  : anchorLabel("QafNest Host Partner", "شريك ضيافة قاف نست")}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {host.profileHref && (
            <div className="flex items-center gap-2 self-start rounded-2xl border border-violet-200/80 bg-white px-4 py-2.5 text-xs font-bold text-violet-700 shadow-xs transition-all group-hover:bg-violet-600 group-hover:text-white dark:border-violet-500/30 dark:bg-white/5 dark:text-violet-300 dark:group-hover:bg-violet-600 dark:group-hover:text-white sm:self-center">
              <span>{anchorLabel("View Host Profile", "عرض الملف التعريفي")}</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </div>
          )}
        </div>

        {/* Highlight Stats Badges */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-violet-100/70 pt-4 dark:border-violet-500/15 sm:grid-cols-4">
          <div className="flex items-center gap-2 rounded-xl bg-white/70 p-2.5 dark:bg-white/5">
            <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
            <div>
              <span className="block text-xs font-bold text-gray-900 dark:text-white">
                {host.rating.toFixed(1)}
              </span>
              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                {host.reviewsCount} {anchorLabel("reviews", "تقييم")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/70 p-2.5 dark:bg-white/5">
            <Building2 className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
            <div>
              <span className="block text-xs font-bold text-gray-900 dark:text-white">
                {host.propertiesCount}
              </span>
              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                {anchorLabel("Properties", "عقارات")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/70 p-2.5 dark:bg-white/5">
            <Zap className="h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <span className="block text-xs font-bold text-gray-900 dark:text-white">
                {host.responseRate}
              </span>
              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                {anchorLabel("Response rate", "معدل الاستجابة")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/70 p-2.5 dark:bg-white/5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="block text-xs font-bold text-gray-900 dark:text-white">
                {host.verified ? anchorLabel("Verified", "موثق") : anchorLabel("Unverified", "غير موثق")}
              </span>
              <span className="block text-[11px] text-gray-500 dark:text-gray-400">
                {anchorLabel("Host status", "حالة المضيف")}
              </span>
            </div>
          </div>
        </div>

        {/* Short Bio snippet */}
        {(host.about || host.aboutAr) && (
          <p className="mt-3 text-xs leading-relaxed text-gray-600 line-clamp-2 dark:text-gray-300">
            {anchorLabel(host.about, host.aboutAr || host.about)}
          </p>
        )}
    </>
  );

  return (
    <section className="border-b border-violet-100/80 py-8 dark:border-violet-500/15">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
            <Sparkles className="h-3.5 w-3.5" />
            {anchorLabel("Your host", "مضيفك")}
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
            {anchorLabel(`Meet your host, ${hostDisplayName}`, `تعرّف على مضيفك، ${hostDisplayName}`)}
          </h2>
        </div>
      </div>

      {host.profileHref ? (
        <Link
          href={host.profileHref}
          className="group relative mt-5 block overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/40 via-white to-violet-50/20 p-6 shadow-sm transition-all duration-300 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10 dark:border-violet-500/25 dark:from-[#12101a] dark:via-[#161224] dark:to-[#12101a] dark:hover:border-violet-500/50"
        >
          {cardContent}
        </Link>
      ) : (
        <div className="group relative mt-5 block overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/40 via-white to-violet-50/20 p-6 shadow-sm dark:border-violet-500/25 dark:from-[#12101a] dark:via-[#161224] dark:to-[#12101a]">
          {cardContent}
        </div>
      )}
    </section>
  );
}
