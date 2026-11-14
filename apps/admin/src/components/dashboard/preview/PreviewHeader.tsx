"use client";

import React from "react";

interface PreviewHeaderProps {
  cityName: string;
  capacity: number;
  t: (ar: string, en: string) => string;
}

export function PreviewHeader({ cityName, capacity, t }: PreviewHeaderProps) {
  return (
    <header className="border-b border-gray-100 bg-white/95 px-4 sm:px-6 lg:px-8 py-3.5 dark:border-white/10 dark:bg-[#08070D]/95">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-700 to-fuchsia-600 font-black text-white shadow-md shadow-violet-700/30">
              Q
            </span>
            <div className="flex flex-col">
              <span className="font-display text-lg font-black tracking-tight text-gray-950 dark:text-white">
                QAFNEST
              </span>
              <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 -mt-1">
                {t("إقامات سعودية أصيلة", "Saudi Stays & Chalets")}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 rounded-full border border-violet-200/90 bg-violet-50/40 px-5 py-2.5 text-xs text-gray-700 shadow-sm dark:border-violet-500/25 dark:bg-[#12101a] dark:text-gray-200">
          <span className="font-bold text-gray-950 dark:text-white">{cityName}</span>
          <span className="text-gray-400">•</span>
          <span>{t("أي وقت", "Any week")}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-500 dark:text-gray-400">
            {t(`${capacity} ضيوف كحد أقصى`, `Up to ${capacity} guests`)}
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-700 text-white ms-2">
            <span className="material-symbols-outlined text-[14px]">search</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="rounded-full bg-violet-100/70 px-3 py-1 font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            SAR (ر.س)
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container font-bold text-on-surface border border-outline/20">
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          </div>
        </div>
      </div>
    </header>
  );
}

