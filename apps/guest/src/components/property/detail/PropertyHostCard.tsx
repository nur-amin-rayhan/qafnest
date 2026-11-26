"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star, ChevronRight, ShieldCheck, Zap, Sparkles, Building2 } from "lucide-react";
import type { Property } from "@/data/properties";
import { getHostProfile, resolveHostForProperty, type HostProfile } from "@/lib/services/hostService";
import { localizePath } from "@/lib/localization/localeHelper";
import { useProperties } from "@/hooks/useProperties";

interface PropertyHostCardProps {
  property: Property;
  anchorLabel: (en: string, ar: string) => string;
}

export default function PropertyHostCard({
  property,
  anchorLabel,
}: PropertyHostCardProps) {
  const { properties: allProperties } = useProperties();
  const [profile, setProfile] = useState<HostProfile | null>(null);

  const host = useMemo(() => {
    const base = resolveHostForProperty(property, allProperties);
    if (profile) {
      return {
        ...base,
        name: profile.name || base.name,
        nameAr: profile.nameAr || base.nameAr,
        rating: profile.rating > 0 ? profile.rating : base.rating,
        reviewsCount: profile.reviewsCount > 0 ? profile.reviewsCount : base.reviewsCount,
        propertiesCount: profile.propertiesCount > 0 ? profile.propertiesCount : base.propertiesCount,
        verified: profile.verified || base.verified,
        about: profile.about || base.about,
        aboutAr: profile.aboutAr || base.aboutAr,
      };
    }
    return base;
  }, [property, allProperties, profile]);

  useEffect(() => {
    let active = true;
    const hostId = property.hostId || property.host?.id;
    if (hostId) {
      getHostProfile(hostId).then((res) => {
        if (active && res) {
          setProfile(res);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [property.hostId, property.host?.id]);

  const hostDisplayName = anchorLabel(host.name, host.nameAr || host.name);
  const hostBadge = anchorLabel(host.badge, host.badgeAr || host.badge);
  const initial = (host.nameAr || host.name || "Q").trim().slice(0, 1).toUpperCase();
  const currentLang = anchorLabel("en", "ar") as "en" | "ar";
  const localizedProfileHref = host.profileHref ? localizePath(host.profileHref, currentLang) : "";

  const cardContent = (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Host Profile Avatar Icon with Verified Badge */}
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F2396] text-xl font-bold text-white shadow-xs">
              {initial}
            </div>
            {host.verified && (
              <div
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-[#12101a]"
                title={anchorLabel("Verified Host", "مضيف موثق")}
              >
                <ShieldCheck className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* Host Identity Details */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 transition-colors group-hover:text-[#4F2396] dark:text-white dark:group-hover:text-purple-400">
                {hostDisplayName}
              </h3>
              <span className="rounded-full border border-purple-200/60 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-[#4F2396] dark:border-purple-800/40 dark:bg-purple-950/50 dark:text-purple-300">
                {hostBadge}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {host.memberSince
                ? anchorLabel(`Member since ${host.memberSince} · QafNest Host`, `عضو منذ ${host.memberSince} · مضيف قاف نست`)
                : anchorLabel("QafNest Host Partner", "شريك ضيافة قاف نست")}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {host.profileHref && (
          <div className="flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 shadow-xs transition-all group-hover:bg-[#4F2396] group-hover:text-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:group-hover:bg-[#4F2396] dark:group-hover:text-white sm:self-center">
            <span>{anchorLabel("View Host Profile", "عرض الملف التعريفي")}</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </div>
        )}
      </div>

      {/* Highlight Stats Badges */}
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200/80 pt-4 dark:border-slate-800 sm:grid-cols-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/40">
          <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
          <div>
            <span className="block text-xs font-bold text-slate-900 dark:text-white">
              {host.rating.toFixed(1)}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              {host.reviewsCount} {anchorLabel("reviews", "تقييم")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/40">
          <Building2 className="h-4 w-4 shrink-0 text-[#4F2396] dark:text-purple-300" />
          <div>
            <span className="block text-xs font-bold text-slate-900 dark:text-white">
              {host.propertiesCount}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              {anchorLabel("Properties", "عقارات")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/40">
          <Zap className="h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <span className="block text-xs font-bold text-slate-900 dark:text-white">
              {host.responseRate}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              {anchorLabel("Response rate", "معدل الاستجابة")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-900/40">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span className="block text-xs font-bold text-slate-900 dark:text-white">
              {host.verified ? anchorLabel("Verified", "موثق") : anchorLabel("Unverified", "غير موثق")}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              {anchorLabel("Host status", "حالة المضيف")}
            </span>
          </div>
        </div>
      </div>

      {/* Short Bio snippet */}
      {(host.about || host.aboutAr) && (
        <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2 dark:text-slate-300">
          {anchorLabel(host.about, host.aboutAr || host.about)}
        </p>
      )}
    </>
  );

  return (
    <section className="border-b border-slate-200/80 py-8 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F2396] dark:text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            {anchorLabel("Your host", "مضيفك")}
          </span>
          <h2 className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {anchorLabel(`Meet your host, ${hostDisplayName}`, `تعرّف على مضيفك، ${hostDisplayName}`)}
          </h2>
        </div>
      </div>

      {localizedProfileHref ? (
        <Link
          href={localizedProfileHref}
          className="group relative mt-5 block overflow-hidden rounded-2xl border border-slate-200/85 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-[#110F18] dark:hover:border-slate-700"
        >
          {cardContent}
        </Link>
      ) : (
        <div className="group relative mt-5 block overflow-hidden rounded-2xl border border-slate-200/85 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-[#110F18]">
          {cardContent}
        </div>
      )}
    </section>
  );
}
