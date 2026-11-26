"use client";

import React from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";

interface AccountHeroBannerProps {
  displayName: string;
  userInitial: string;
  editPhone: string;
  editEmail: string;
  isIdentityVerified: boolean;
  t: (en: string, ar: string) => string;
}

export default function AccountHeroBanner({
  displayName,
  userInitial,
  editPhone,
  editEmail,
  isIdentityVerified,
  t,
}: AccountHeroBannerProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#0E0E1A] border border-[#E4DFF0] dark:border-white/[0.08] shadow-xs p-6 sm:p-7 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F4EEFF] dark:bg-[#4F2396]/25 border border-purple-200 dark:border-[#4F2396]/40 text-[#4F2396] dark:text-purple-200">
            <span className="text-xl sm:text-2xl font-semibold tracking-tight">
              {userInitial}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white leading-snug">
                <bdi>{displayName}</bdi>
              </h1>
              {isIdentityVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck size={14} className="shrink-0" />
                  <span>{t("Verified · Nafath / Yaqeen", "موثق · نفاذ / يقين")}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>{t("ID Verification Pending", "بانتظار توثيق الهوية")}</span>
                </span>
              )}
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono tabular-nums">
              {editPhone && <bdi dir="ltr">{editPhone}</bdi>}
              {editPhone && editEmail && <span aria-hidden="true">·</span>}
              {editEmail && <bdi dir="ltr">{editEmail}</bdi>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
