"use client";

import React from "react";
import Link from "next/link";
import { Star, ShieldCheck, Zap, Building2, CheckCircle2, ChevronRight, Award } from "lucide-react";
import { localizePath } from "@/lib/localization/localeHelper";
import type { HostProfile } from "@/lib/services/hostService";

interface HostProfileHeaderProps {
  host: HostProfile;
  language: "en" | "ar";
}

export default function HostProfileHeader({ host, language }: HostProfileHeaderProps) {
  const isAr = language === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);
  const displayName = isAr && host.nameAr ? host.nameAr : host.name;
  const initial = displayName.trim().slice(0, 1).toUpperCase();
  const badgeText = isAr && host.badgeAr ? host.badgeAr : host.badge;
  const aboutText = isAr && host.aboutAr ? host.aboutAr : host.about;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/70 via-white to-violet-100/30 p-6 shadow-sm dark:border-violet-500/25 dark:from-[#12101a] dark:via-[#161224] dark:to-[#0f0d17] sm:p-10">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
        <Link href={localizePath("/", language)} className="hover:text-violet-600 dark:hover:text-violet-400">
          {label("Home", "الرئيسية")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="text-gray-400">{label("Hosts", "المضيفون")}</span>
        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        <span className="text-violet-700 dark:text-violet-300 font-bold">{displayName}</span>
      </nav>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        {/* Profile Avatar & Info */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-800 text-4xl font-black text-white shadow-xl shadow-violet-700/25 ring-4 ring-white dark:ring-[#12101a]">
              {initial}
            </div>
            {host.verified && (
              <div
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-4 ring-white dark:ring-[#12101a]"
                title={label("Verified Host", "مضيف معتمد")}
              >
                <ShieldCheck className="h-4 w-4" />
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 dark:text-white">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800 dark:bg-violet-900/50 dark:text-violet-300">
                <Award className="h-3.5 w-3.5" />
                {badgeText}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {host.memberSince
                ? label(
                    `Hosting on QafNest since ${host.memberSince} · QafNest Host Partner`,
                    `مضيف في قاف نست منذ ${host.memberSince} · شريك ضيافة`
                  )
                : label("QafNest Host Partner", "شريك ضيافة قاف نست")}
            </p>

            {host.verified && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 dark:bg-emerald-950/40">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {label("Identity Confirmed", "تم التحقق من الهوية الوطنية")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Contact / Booking CTA info */}
        <div className="flex flex-col gap-2 rounded-2xl border border-violet-200/60 bg-white/80 p-4 shadow-xs dark:border-violet-500/20 dark:bg-white/5 lg:w-72">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label("Hosting Guarantee", "ضمان الضيافة")}
          </span>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {label(
              "Book with confidence. All bookings are backed by QafNest 100% Stay Protection and ZATCA invoices.",
              "احجز باطمئنان. جميع الحجوزات محمية بضمان قاف نست الشامل مع فواتير ضريبية معتمدة."
            )}
          </p>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-violet-100/80 pt-6 dark:border-violet-500/20 sm:grid-cols-4">
        <div className="rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-xs dark:border-violet-500/15 dark:bg-white/5">
          <div className="flex items-center gap-2 text-amber-500">
            <Star className="h-5 w-5 fill-amber-400" />
            <strong className="text-xl font-bold text-gray-950 dark:text-white">
              {host.rating.toFixed(1)}
            </strong>
          </div>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            {host.reviewsCount} {label("verified reviews", "تقييم موثق")}
          </span>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-xs dark:border-violet-500/15 dark:bg-white/5">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Building2 className="h-5 w-5" />
            <strong className="text-xl font-bold text-gray-950 dark:text-white">
              {host.propertiesCount}
            </strong>
          </div>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            {label("Active Properties", "عقارات معتمدة ومجهزة")}
          </span>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-xs dark:border-violet-500/15 dark:bg-white/5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Zap className="h-5 w-5" />
            <strong className="text-xl font-bold text-gray-950 dark:text-white">
              {host.responseRate}
            </strong>
          </div>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            {label("Response Rate", "نسبة سرعة التجاوب")}
          </span>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white/70 p-4 shadow-xs dark:border-violet-500/15 dark:bg-white/5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
            <strong className="text-xl font-bold text-gray-950 dark:text-white">
              {host.responseTime}
            </strong>
          </div>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            {label("Average Response Time", "متوسط وقت الرد")}
          </span>
        </div>
      </div>

      {/* About Section */}
      {aboutText && (
        <div className="mt-6 rounded-2xl bg-white/50 p-5 dark:bg-white/5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">
            {label("About the host", "نبذة عن المضيف")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {aboutText}
          </p>
        </div>
      )}
    </section>
  );
}

