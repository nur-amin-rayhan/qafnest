"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface PreviewHostCardProps {
  hostId?: string | null;
  hostName?: string | null;
  tourismLicenseNumber?: string | null;
  t: (ar: string, en: string) => string;
}

export function PreviewHostCard({
  hostId,
  hostName,
  tourismLicenseNumber,
  t,
}: PreviewHostCardProps) {
  const displayName = hostName || (hostId ? `Host #${hostId.slice(0, 8)}` : t("مضيف", "Host"));

  return (
    <section className="border-b border-violet-100/80 py-8 dark:border-violet-500/15">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
        {t("مضيفك", "Your Host")}
      </span>
      <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">
        {t("عن المضيف", "About the Host")}
      </h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-3xl border border-violet-200/80 bg-violet-50/35 p-5 shadow-xs dark:border-violet-500/25 dark:bg-[#12101a]">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-700 font-bold text-white shadow-md shadow-violet-700/20">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <span className="font-bold text-gray-900 dark:text-white block">
              {displayName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 mt-0.5">
              {tourismLicenseNumber ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-status-emerald" />
                  <span className="text-status-emerald font-semibold">
                    {t("ترخيص وزارة السياحة مرفق", "MOT License Provided")}: {tourismLicenseNumber}
                  </span>
                </>
              ) : (
                <span>{t("شريك استضافة قاف نست", "QafNest Partner Host")}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

