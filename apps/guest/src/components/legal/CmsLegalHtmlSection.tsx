"use client";

import React, { useEffect } from "react";
import { sanitizeCmsHtml } from "@/lib/cms/usePublicCmsWorkspace";

export function CmsRichContentCard({
  html,
  metaTitle,
  metaDescription,
  updatedAt,
  language,
  accent = "purple",
}: {
  html: string;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt?: string;
  language: string;
  accent?: "emerald" | "purple" | "amber";
}) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (metaTitle?.trim()) {
      document.title = metaTitle.trim();
    }
    if (metaDescription?.trim()) {
      let desc = document.querySelector('meta[name="description"]');
      if (!desc) {
        desc = document.createElement("meta");
        desc.setAttribute("name", "description");
        document.head.appendChild(desc);
      }
      desc.setAttribute("content", metaDescription.trim());
    }
  }, [metaTitle, metaDescription]);

  const safeHtml = sanitizeCmsHtml(html);
  const headingColor =
    accent === "emerald"
      ? "[&_h2]:text-emerald-900 dark:[&_h2]:text-emerald-300 [&_li::marker]:text-emerald-600"
      : accent === "amber"
      ? "[&_h2]:text-amber-900 dark:[&_h2]:text-amber-300 [&_li::marker]:text-amber-600"
      : "[&_h2]:text-[#4F2396] dark:[&_h2]:text-violet-300 [&_li::marker]:text-purple-600";

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101a] p-6 sm:p-10 shadow-xs space-y-6">
      <div
        dir={language === "ar" ? "rtl" : "ltr"}
        className={`max-w-none space-y-4 text-xs sm:text-sm leading-7 text-slate-700 dark:text-slate-300
          [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-slate-900 dark:[&_h1]:text-white [&_h1]:mt-4 [&_h1]:mb-2
          [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:font-extrabold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:pt-4 [&_h2]:border-t [&_h2]:border-slate-100 dark:[&_h2]:border-white/10 [&_h2:first-child]:mt-0 [&_h2:first-child]:pt-0 [&_h2:first-child]:border-t-0
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-900 dark:[&_h3]:text-white [&_h3]:mt-4
          [&_p]:leading-7
          [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:space-y-1.5
          [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:space-y-1.5
          [&_a]:text-purple-700 dark:[&_a]:text-violet-300 [&_a]:underline
          [&_strong]:font-bold [&_strong]:text-slate-900 dark:[&_strong]:text-white
          [&_img]:rounded-2xl [&_img]:max-w-full [&_img]:my-4
          ${headingColor}`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      {updatedAt && (
        <div className="pt-4 border-t border-slate-100 dark:border-white/10 text-[11px] text-slate-400">
          {language === "ar" ? "آخر تحديث من إدارة المحتوى:" : "Last updated via QafNest CMS:"}{" "}
          {new Date(updatedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      )}
    </div>
  );
}
