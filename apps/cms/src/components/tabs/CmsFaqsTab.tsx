"use client";

import React from "react";
import type { FaqItem } from "../../types/cms";

interface CmsFaqsTabProps {
  faqs: FaqItem[];
  t: (en: string, ar: string) => string;
}

export function CmsFaqsTab({ faqs, t }: CmsFaqsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">{t("Platform Help Center & FAQs", "مركز المساعدة والأسئلة الشائعة")}</h1>
        <p className="text-xs text-gray-400 mt-1">
          {t(
            "Manage answers displayed to guests and hosts across help center modules.",
            "إدارة الأسئلة والأجوبة المعروضة للضيوف والمضيفين في مركز المساعدة."
          )}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className="rounded-xl border border-white/10 bg-[#0C1018] p-4 flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-teal-300">
                {faq.category}
              </span>
              <p className="text-sm font-semibold">{faq.qEn}</p>
              <p className="text-xs text-gray-400">{faq.qAr}</p>
            </div>
            <button
              type="button"
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer"
            >
              {t("Edit", "تعديل")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

