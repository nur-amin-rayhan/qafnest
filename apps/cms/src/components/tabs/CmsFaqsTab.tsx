"use client";

import React, { useEffect, useState } from "react";
import type { CmsFaqItem, CmsPageRecord } from "@qafnest/shared";
import { cmsPath } from "@/lib/cmsUrl";
import type { FaqItem } from "../../types/cms";

interface CmsFaqsTabProps {
  faqs: FaqItem[];
  t: (en: string, ar: string) => string;
}

export function CmsFaqsTab({ faqs, t }: CmsFaqsTabProps) {
  const [faqPage, setFaqPage] = useState<CmsPageRecord | null>(null);
  const [items, setItems] = useState<CmsFaqItem[]>(() =>
    faqs.map((f) => ({
      id: f.id,
      category: f.category,
      questionEn: f.qEn,
      questionAr: f.qAr,
      answerEn: "",
      answerAr: "",
    }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch(cmsPath("/api/cms/pages?id=faq"))
      .then((res) => (res.ok ? res.json() : null))
      .then((page: CmsPageRecord | null) => {
        if (page) {
          setFaqPage(page);
          if (Array.isArray(page.faqs)) {
            setItems(page.faqs);
          }
        }
      })
      .catch(() => null);
  }, []);

  const persistItems = async (nextItems: CmsFaqItem[]) => {
    setSaving(true);
    setNotice(null);
    try {
      const payload: CmsPageRecord = {
        id: "faq",
        titleEn: faqPage?.titleEn || "Frequently Asked Questions",
        titleAr: faqPage?.titleAr || "الأسئلة الشائعة",
        subtitleEn: faqPage?.subtitleEn || "Help center answers for guests and hosts.",
        subtitleAr: faqPage?.subtitleAr || "إجابات مركز المساعدة للضيوف والمضيفين.",
        lastUpdated: new Date().toISOString().slice(0, 10),
        faqs: nextItems,
      };
      const res = await fetch(cmsPath("/api/cms/pages"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setFaqPage(payload);
      setEditingId(null);
      setNotice(t("FAQs saved and synchronized with Guest Help Center!", "تم حفظ ومزامنة الأسئلة الشائعة بنجاح!"));
    } catch {
      setNotice(t("Could not save FAQ updates.", "تعذر حفظ تحديثات الأسئلة الشائعة."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black">{t("Platform Help Center & FAQs", "مركز المساعدة والأسئلة الشائعة")}</h1>
          <p className="text-xs text-gray-400 mt-1">
            {t(
              "Manage answers displayed to guests and hosts across help center modules.",
              "إدارة الأسئلة والأجوبة المعروضة للضيوف والمضيفين في مركز المساعدة."
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void persistItems(items)}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white cursor-pointer disabled:opacity-40"
        >
          {saving ? t("Saving...", "جارٍ الحفظ...") : t("Save All FAQs", "حفظ جميع الأسئلة")}
        </button>
      </div>

      {notice && (
        <div className="px-3 py-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold">
          {notice}
        </div>
      )}

      <div className="space-y-3">
        {items.map((faq) => {
          const isEditing = editingId === faq.id;
          return (
            <div
              key={faq.id}
              className="rounded-xl border border-white/10 bg-[#0C1018] p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-teal-300">
                    {faq.category}
                  </span>
                  <p className="text-sm font-semibold">{faq.questionEn}</p>
                  <p className="text-xs text-gray-400">{faq.questionAr}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(isEditing ? null : faq.id)}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold cursor-pointer shrink-0"
                >
                  {isEditing ? t("Close", "إغلاق") : t("Edit", "تعديل")}
                </button>
              </div>
              {isEditing && (
                <div className="pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    value={faq.questionEn}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === faq.id ? { ...x, questionEn: e.target.value } : x))
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white"
                    placeholder="Question (EN)"
                  />
                  <input
                    type="text"
                    value={faq.questionAr}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === faq.id ? { ...x, questionAr: e.target.value } : x))
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white"
                    placeholder="Question (AR)"
                  />
                  <textarea
                    rows={2}
                    value={faq.answerEn}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === faq.id ? { ...x, answerEn: e.target.value } : x))
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white"
                    placeholder="Answer (EN)"
                  />
                  <textarea
                    rows={2}
                    value={faq.answerAr}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) => (x.id === faq.id ? { ...x, answerAr: e.target.value } : x))
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white"
                    placeholder="Answer (AR)"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

