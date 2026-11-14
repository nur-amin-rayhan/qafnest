"use client";

import React, { useMemo } from "react";
import { Search, ChevronRight } from "lucide-react";
import type { FaqItem } from "./types";

interface FaqsTabProps {
  faqItems: FaqItem[];
  searchFaq: string;
  setSearchFaq: (search: string) => void;
  activeFaq: number | null;
  setActiveFaq: (idx: number | null) => void;
  language: string;
  t: (en: string, ar: string) => string;
}

export default function FaqsTab({
  faqItems,
  searchFaq,
  setSearchFaq,
  activeFaq,
  setActiveFaq,
  language,
  t,
}: FaqsTabProps) {
  const filteredFaqs = useMemo(() => {
    if (!searchFaq.trim()) return faqItems;
    const query = searchFaq.toLowerCase();
    return faqItems.filter(
      (item) =>
        item.qAr.toLowerCase().includes(query) ||
        item.qEn.toLowerCase().includes(query) ||
        item.aAr.toLowerCase().includes(query) ||
        item.aEn.toLowerCase().includes(query)
    );
  }, [faqItems, searchFaq]);

  return (
    <div>
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {t("Frequently Asked Questions", "الأسئلة الشائعة")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "Everything you need to know about bookings, smart locks, and refunds.",
              "كل ما تحتاج لمعرفته حول الحجوزات، الدخول الذكي، واسترداد التأمين."
            )}
          </p>
        </div>
      </div>

      {/* FAQ Search Bar */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchFaq}
          onChange={(e) => setSearchFaq(e.target.value)}
          placeholder={t("Search questions...", "ابحث في الأسئلة الشائعة...")}
          className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 ps-11 pe-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#4F2396] focus:bg-white dark:focus:bg-[#06060B] transition"
        />
      </div>

      {/* FAQ Accordions */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = activeFaq === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-start font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
              >
                <span>{language === "ar" ? faq.qAr : faq.qEn}</span>
                <ChevronRight
                  size={16}
                  className={`shrink-0 transition-transform ${
                    isOpen ? "rotate-90" : "rtl:rotate-180"
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-white/5 pt-3 bg-slate-50/50 dark:bg-white/[0.02]">
                  {language === "ar" ? faq.aAr : faq.aEn}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

