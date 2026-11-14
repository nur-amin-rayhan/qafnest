"use client";

import React from "react";
import type { SeoRouteMeta } from "../../types/cms";

interface CmsSeoTabProps {
  seoRoutes: SeoRouteMeta[];
  t: (en: string, ar: string) => string;
}

export function CmsSeoTab({ seoRoutes, t }: CmsSeoTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">{t("SEO & Metadata Engine", "إدارة السيو والبيانات الوصفية")}</h1>
        <p className="text-xs text-gray-400 mt-1">
          {t(
            "Configure page titles, meta descriptions, and OpenGraph social preview images across all customer touchpoints.",
            "التحكم بعناوين الصفحات وبيانات الميتا لمحركات البحث وشبكات التواصل الاجتماعي."
          )}
        </p>
      </div>

      <div className="space-y-4">
        {seoRoutes.map((route) => (
          <div
            key={route.path}
            className="rounded-2xl border border-white/10 bg-[#0C1018] p-5 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-teal-400">{route.path}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300">
                  Route
                </span>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 cursor-pointer"
              >
                {t("Save Changes", "حفظ التعديلات")}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">Title (EN)</label>
                <input
                  type="text"
                  defaultValue={route.titleEn}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">Title (AR)</label>
                <input
                  type="text"
                  defaultValue={route.titleAr}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-gray-400 block mb-1 font-semibold">Target Keywords (Comma Separated)</label>
                <input
                  type="text"
                  defaultValue={route.keywords}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

