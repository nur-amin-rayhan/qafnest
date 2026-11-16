"use client";

import React, { useEffect, useState } from "react";
import type { CmsPageRecord } from "@qafnest/shared";
import { cmsPath } from "@/lib/cmsUrl";
import type { SeoRouteMeta } from "../../types/cms";

interface CmsSeoTabProps {
  seoRoutes: SeoRouteMeta[];
  t: (en: string, ar: string) => string;
}

export function CmsSeoTab({ seoRoutes, t }: CmsSeoTabProps) {
  const [routes, setRoutes] = useState<SeoRouteMeta[]>(seoRoutes);
  const [savingPath, setSavingPath] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(cmsPath("/api/cms/pages?id=seo-routes"))
      .then((res) => (res.ok ? res.json() : null))
      .then((page: CmsPageRecord | null) => {
        if (page && Array.isArray(page.sections) && page.sections.length > 0) {
          setRoutes(
            page.sections.map((sec) => ({
              path: sec.id,
              titleEn: sec.titleEn,
              titleAr: sec.titleAr,
              keywords: sec.contentEn,
              ogImage: sec.contentAr || "/og-image.jpg",
            }))
          );
        }
      })
      .catch(() => null);
  }, []);

  const handleSaveRoute = async (routePath: string) => {
    setSavingPath(routePath);
    setStatusMsg(null);
    try {
      const payload: CmsPageRecord = {
        id: "seo-routes",
        titleEn: "SEO & Metadata Engine",
        titleAr: "إدارة السيو والبيانات الوصفية",
        subtitleEn: "Canonical & route metadata configuration",
        subtitleAr: "إعدادات الروابط الأساسية والبيانات الوصفية",
        lastUpdated: new Date().toISOString().slice(0, 10),
        sections: routes.map((r) => ({
          id: r.path,
          titleEn: r.titleEn,
          titleAr: r.titleAr,
          contentEn: r.keywords,
          contentAr: r.keywords,
        })),
      };
      const res = await fetch(cmsPath("/api/cms/pages"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to persist SEO settings");
      setStatusMsg(t("SEO route metadata saved successfully.", "تم حفظ إعدادات السيو بنجاح."));
    } catch {
      setStatusMsg(t("Failed to save SEO route metadata.", "تعذر حفظ إعدادات السيو."));
    } finally {
      setSavingPath(null);
    }
  };

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

      {statusMsg && (
        <div className="px-3 py-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold">
          {statusMsg}
        </div>
      )}

      <div className="space-y-4">
        {routes.map((route) => (
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
                disabled={savingPath === route.path}
                onClick={() => void handleSaveRoute(route.path)}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 cursor-pointer disabled:opacity-40"
              >
                {savingPath === route.path ? t("Saving...", "جارٍ الحفظ...") : t("Save Changes", "حفظ التعديلات")}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">Title (EN)</label>
                <input
                  type="text"
                  value={route.titleEn}
                  onChange={(e) =>
                    setRoutes((prev) =>
                      prev.map((r) => (r.path === route.path ? { ...r, titleEn: e.target.value } : r))
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1 font-semibold">Title (AR)</label>
                <input
                  type="text"
                  value={route.titleAr}
                  onChange={(e) =>
                    setRoutes((prev) =>
                      prev.map((r) => (r.path === route.path ? { ...r, titleAr: e.target.value } : r))
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-gray-400 block mb-1 font-semibold">Target Keywords (Comma Separated)</label>
                <input
                  type="text"
                  value={route.keywords}
                  onChange={(e) =>
                    setRoutes((prev) =>
                      prev.map((r) => (r.path === route.path ? { ...r, keywords: e.target.value } : r))
                    )
                  }
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

