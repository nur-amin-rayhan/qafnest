"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Save,
  RefreshCw,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  Shield,
  HelpCircle,
  Phone,
  Cookie,
  AlertCircle,
} from "lucide-react";
import type { CmsPageRecord, CmsPageSection, CmsFaqItem } from "@qafnest/shared";

import { cmsPath } from "@/lib/cmsUrl";
import { ECOSYSTEM_URLS } from "@qafnest/shared";
interface CmsPagesTabProps {
  t: (en: string, ar: string) => string;
}

const PAGE_KEYS = [
  { id: "terms", labelEn: "Terms & Conditions", labelAr: "الشروط والأحكام", icon: FileText },
  { id: "privacy", labelEn: "Privacy Policy (PDPL)", labelAr: "سياسة الخصوصية", icon: Shield },
  { id: "cookies", labelEn: "Cookies Policy", labelAr: "سياسة ملفات الكوكيز", icon: Cookie },
  { id: "faq", labelEn: "Frequently Asked Questions", labelAr: "الأسئلة الشائعة", icon: HelpCircle },
  { id: "contact", labelEn: "Contact Us & Headquarters", labelAr: "اتصل بنا والمقر الرئيسي", icon: Phone },
] as const;

export function CmsPagesTab({ t }: CmsPagesTabProps) {
  const [selectedKey, setSelectedKey] = useState<string>("terms");
  const [pages, setPages] = useState<Record<string, CmsPageRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<"en" | "ar">("en");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(cmsPath("/api/cms/pages"));
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (err) {
      console.error("Failed loading CMS pages", err);
      showToast("Error loading pages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const currentPage: CmsPageRecord | undefined = pages[selectedKey];

  const handleFieldChange = (field: keyof CmsPageRecord, val: any) => {
    if (!currentPage) return;
    setPages((prev) => ({
      ...prev,
      [selectedKey]: {
        ...currentPage,
        [field]: val,
      },
    }));
  };

  const handleSectionChange = (idx: number, subfield: keyof CmsPageSection, val: string) => {
    if (!currentPage || !currentPage.sections) return;
    const updated = [...currentPage.sections];
    updated[idx] = { ...updated[idx], [subfield]: val };
    handleFieldChange("sections", updated);
  };

  const handleAddSection = () => {
    if (!currentPage) return;
    const currentSections = currentPage.sections || [];
    const newSection: CmsPageSection = {
      id: `sec-${Date.now()}`,
      titleEn: "New Section Title",
      titleAr: "عنوان بند جديد",
      contentEn: "Detailed clause content in English...",
      contentAr: "نص البند القانوني بالتفصيل بالعربية...",
    };
    handleFieldChange("sections", [...currentSections, newSection]);
  };

  const handleRemoveSection = (idx: number) => {
    if (!currentPage || !currentPage.sections) return;
    const updated = currentPage.sections.filter((_, i) => i !== idx);
    handleFieldChange("sections", updated);
  };

  const handleFaqChange = (idx: number, subfield: keyof CmsFaqItem, val: string) => {
    if (!currentPage || !currentPage.faqs) return;
    const updated = [...currentPage.faqs];
    updated[idx] = { ...updated[idx], [subfield]: val };
    handleFieldChange("faqs", updated);
  };

  const handleAddFaq = () => {
    if (!currentPage) return;
    const currentFaqs = currentPage.faqs || [];
    const newFaq: CmsFaqItem = {
      id: `faq-${Date.now()}`,
      category: "general",
      questionEn: "New Question in English?",
      questionAr: "سؤال جديد بالعربية؟",
      answerEn: "Detailed answer explaining the process in English...",
      answerAr: "إجابة مفصلة توضح الإجراء باللغة العربية...",
    };
    handleFieldChange("faqs", [...currentFaqs, newFaq]);
  };

  const handleRemoveFaq = (idx: number) => {
    if (!currentPage || !currentPage.faqs) return;
    const updated = currentPage.faqs.filter((_, i) => i !== idx);
    handleFieldChange("faqs", updated);
  };

  const handleContactChange = (subfield: string, val: string) => {
    if (!currentPage || !currentPage.contactInfo) return;
    handleFieldChange("contactInfo", {
      ...currentPage.contactInfo,
      [subfield]: val,
    });
  };

  const handleSaveCurrentPage = async () => {
    if (!currentPage) return;
    setSaving(true);
    try {
      const res = await fetch(cmsPath("/api/cms/pages"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentPage),
      });
      if (res.ok) {
        showToast(t("Page updated successfully and synced to live website!", "تم تحديث الصفحة بنجاح ومزامنتها مع الموقع المباشر!"));
      } else {
        showToast(t("Failed to save changes.", "فشل في حفظ التعديلات."));
      }
    } catch {
      showToast(t("Network error saving page.", "خطأ في الشبكة أثناء الحفظ."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-teal-500 text-black font-bold px-5 py-3 shadow-2xl text-xs sm:text-sm">
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <FileText size={20} />
            </span>
            <span>{t("Legal & Footer Pages CMS Editor", "محرر الصفحات القانونية والفوتر")}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {t(
              "Dynamically edit Terms & Conditions, Privacy Policy, Cookies Policy, FAQs, and Contact Us. Updates sync live to the Guest App.",
              "تحرير وتحديث الشروط والأحكام، سياسة الخصوصية، الكوكيز، الأسئلة الشائعة واتصل بنا فورياً ومزامنتها مع موقع الضيوف."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPages}
            disabled={loading}
            className="h-10 px-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-teal-400" : ""} />
            <span>{t("Reload", "إعادة تحميل")}</span>
          </button>
          <a
            href={`${ECOSYSTEM_URLS.guest}/${selectedKey}`}
            target="_blank"
            rel="noreferrer"
            className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white flex items-center gap-2"
          >
            <span>{t("View Live", "معاينة مباشرة")}</span>
            <ExternalLink size={14} className="opacity-70" />
          </a>
        </div>
      </div>

      {/* Tab Selectors (Page Choice) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {PAGE_KEYS.map((pk) => {
          const Icon = pk.icon;
          const isSelected = selectedKey === pk.id;
          return (
            <button
              key={pk.id}
              type="button"
              onClick={() => setSelectedKey(pk.id)}
              className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                isSelected
                  ? "bg-teal-500/15 border-teal-500/50 text-white shadow-[0_0_15px_rgba(20,184,166,0.2)]"
                  : "bg-[#0C1018] border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon size={18} className={isSelected ? "text-teal-400" : "text-gray-500"} />
                <span className="text-[10px] font-mono uppercase text-gray-500">/{pk.id}</span>
              </div>
              <div className="text-xs font-bold leading-tight">
                {t(pk.labelEn, pk.labelAr)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Page Editor Container */}
      {currentPage ? (
        <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-6 space-y-6">
          {/* Top Bar inside Form: Language toggle & Save Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">{t("Editing Language:", "لغة التحرير:")}</span>
              <div className="flex rounded-xl bg-black/60 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveLang("en")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeLang === "en" ? "bg-teal-500 text-black shadow-xs" : "text-gray-400 hover:text-white"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang("ar")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeLang === "ar" ? "bg-teal-500 text-black shadow-xs" : "text-gray-400 hover:text-white"
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {t("Last Updated:", "آخر تحديث:")} {currentPage.lastUpdated}
              </span>
              <button
                type="button"
                onClick={handleSaveCurrentPage}
                disabled={saving}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer transition disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? t("Saving...", "جاري الحفظ...") : t("Save & Publish Live", "حفظ ونشر التعديلات")}</span>
              </button>
            </div>
          </div>

          {/* Page Headers (Title & Subtitle) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1">
                {activeLang === "en" ? "Page Title (English)" : "عنوان الصفحة (عربي)"}
              </label>
              <input
                type="text"
                value={activeLang === "en" ? currentPage.titleEn : currentPage.titleAr}
                onChange={(e) =>
                  handleFieldChange(activeLang === "en" ? "titleEn" : "titleAr", e.target.value)
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1">
                {activeLang === "en" ? "Subtitle / Intro (English)" : "الوصف الفرعي (عربي)"}
              </label>
              <input
                type="text"
                value={activeLang === "en" ? currentPage.subtitleEn : currentPage.subtitleAr}
                onChange={(e) =>
                  handleFieldChange(activeLang === "en" ? "subtitleEn" : "subtitleAr", e.target.value)
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Conditional Sections Editor (Terms, Privacy, Cookies) */}
          {currentPage.sections && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-teal-400">
                  {t("Page Clauses & Legal Sections", "بنود وفقرات الصفحة")} ({currentPage.sections.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{t("Add Clause", "إضافة بند جديد")}</span>
                </button>
              </div>

              <div className="space-y-4">
                {currentPage.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-mono font-bold text-teal-400">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        title={t("Delete Clause", "حذف البند")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        {activeLang === "en" ? "Section Title (English)" : "عنوان البند (عربي)"}
                      </label>
                      <input
                        type="text"
                        value={activeLang === "en" ? sec.titleEn : sec.titleAr}
                        onChange={(e) =>
                          handleSectionChange(idx, activeLang === "en" ? "titleEn" : "titleAr", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        {activeLang === "en" ? "Clause Content (English)" : "محتوى البند (عربي)"}
                      </label>
                      <textarea
                        rows={3}
                        value={activeLang === "en" ? sec.contentEn : sec.contentAr}
                        onChange={(e) =>
                          handleSectionChange(idx, activeLang === "en" ? "contentEn" : "contentAr", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional FAQs Editor */}
          {currentPage.faqs && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-teal-400">
                  {t("FAQ Items", "قائمة الأسئلة الشائعة")} ({currentPage.faqs.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{t("Add FAQ Question", "إضافة سؤال جديد")}</span>
                </button>
              </div>

              <div className="space-y-4">
                {currentPage.faqs.map((faq, idx) => (
                  <div
                    key={faq.id || idx}
                    className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-teal-400">Q#{idx + 1}</span>
                        <select
                          value={faq.category}
                          onChange={(e) => handleFaqChange(idx, "category", e.target.value)}
                          className="px-2 py-1 rounded bg-black/60 border border-white/15 text-[11px] text-gray-300"
                        >
                          <option value="booking">Booking / الحجز</option>
                          <option value="verification">Verification / التحقق</option>
                          <option value="smart-locks">Smart Locks / الدخول الذكي</option>
                          <option value="helpline">Helpline / الدعم الهاتفي</option>
                          <option value="payment">Payment & VAT / الدفع والضريبة</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        title={t("Delete Question", "حذف السؤال")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        {activeLang === "en" ? "Question (English)" : "السؤال (عربي)"}
                      </label>
                      <input
                        type="text"
                        value={activeLang === "en" ? faq.questionEn : faq.questionAr}
                        onChange={(e) =>
                          handleFaqChange(idx, activeLang === "en" ? "questionEn" : "questionAr", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        {activeLang === "en" ? "Answer (English)" : "الإجابة (عربي)"}
                      </label>
                      <textarea
                        rows={3}
                        value={activeLang === "en" ? faq.answerEn : faq.answerAr}
                        onChange={(e) =>
                          handleFaqChange(idx, activeLang === "en" ? "answerEn" : "answerAr", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Contact Us Info Editor */}
          {currentPage.contactInfo && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-sm font-bold text-teal-400">
                {t("Headquarters & Direct Helpline Information", "معلومات المقر الرئيسي وهواتف الدعم")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    {t("Phone Helpline (Unified)", "هاتف الحجز الموحد")}
                  </label>
                  <input
                    type="text"
                    value={currentPage.contactInfo.phone}
                    onChange={(e) => handleContactChange("phone", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    {t("WhatsApp Digits", "رقم الواتساب المعتمد")}
                  </label>
                  <input
                    type="text"
                    value={currentPage.contactInfo.whatsapp}
                    onChange={(e) => handleContactChange("whatsapp", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    {t("Ministry of Tourism License", "رقم ترخيص وزارة السياحة")}
                  </label>
                  <input
                    type="text"
                    value={currentPage.contactInfo.licenseNumber}
                    onChange={(e) => handleContactChange("licenseNumber", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    {t("Customer Support Email", "بريد خدمة العملاء")}
                  </label>
                  <input
                    type="email"
                    value={currentPage.contactInfo.supportEmail}
                    onChange={(e) => handleContactChange("supportEmail", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    {t("Host Partnerships Email", "بريد شركاء الضيافة")}
                  </label>
                  <input
                    type="email"
                    value={currentPage.contactInfo.hostsEmail}
                    onChange={(e) => handleContactChange("hostsEmail", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    {t("Finance & Settlements Email", "بريد المالية والتحويلات")}
                  </label>
                  <input
                    type="email"
                    value={currentPage.contactInfo.financeEmail}
                    onChange={(e) => handleContactChange("financeEmail", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    {t("Physical Address (English)", "العنوان الوطني (إنجليزي)")}
                  </label>
                  <input
                    type="text"
                    value={currentPage.contactInfo.addressEn}
                    onChange={(e) => handleContactChange("addressEn", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                    {t("Physical Address (Arabic)", "العنوان الوطني (عربي)")}
                  </label>
                  <input
                    type="text"
                    value={currentPage.contactInfo.addressAr}
                    onChange={(e) => handleContactChange("addressAr", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400 bg-[#0C1018] rounded-2xl border border-white/10">
          <AlertCircle size={24} className="mx-auto mb-2 text-gray-500" />
          <p>{t("Select a page from above to edit its content.", "اختر صفحة من الأعلى لبدء التحرير.")}</p>
        </div>
      )}
    </div>
  );
}
