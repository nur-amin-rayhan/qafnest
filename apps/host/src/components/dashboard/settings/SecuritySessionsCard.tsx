"use client";

import React from "react";
import { Laptop, LogOut } from "lucide-react";

interface SecuritySessionsCardProps {
  currentDevice: string;
  loginLocation: string;
  isSaving: boolean;
  onSignOutOtherSessions: () => Promise<void>;
  t: (en: string, ar: string) => string;
}

export function SecuritySessionsCard({
  currentDevice,
  loginLocation,
  isSaving,
  onSignOutOtherSessions,
  t,
}: SecuritySessionsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#12101a] p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Laptop size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {t("Active Logged-in Sessions", "الجلسات والأجهزة النشطة")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t(
                "Devices and browsers currently authenticated with your host credentials.",
                "قائمة الأجهزة والمتصفحات التي تم تسجيل الدخول منها حالياً."
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => void onSignOutOtherSessions()}
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition cursor-pointer disabled:opacity-50"
        >
          <LogOut size={14} />
          <span>{t("Sign Out All Other Devices", "تسجيل الخروج من باقي الأجهزة")}</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <span className="block text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {currentDevice || t("Active Browser Session", "جلسة المتصفح الحالية")}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {loginLocation || t("Saudi Arabia", "المملكة العربية السعودية")} · {t("Active Now (Current Session)", "نشط الآن (الجلسة الحالية)")}
            </span>
          </div>
        </div>
        <span className="rounded-lg bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300">
          {t("This Device", "هذا الجهاز")}
        </span>
      </div>
    </div>
  );
}

