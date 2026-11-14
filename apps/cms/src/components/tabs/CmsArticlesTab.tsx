"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Eye,
  ExternalLink,
  Save,
  CheckCircle2,
  Search,
  Code,
  FileText,
  Clock,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import type { SharedBlogPost, BlogSeoConfig } from "@qafnest/shared";

import { cmsPath } from "@/lib/cmsUrl";
import { ECOSYSTEM_URLS } from "@qafnest/shared";
interface CmsArticlesTabProps {
  t: (en: string, ar: string) => string;
}

const CATEGORY_OPTIONS = [
  { id: "chalet", nameEn: "Chalets & Smart Living", nameAr: "شاليهات وإقامة ذكية" },
  { id: "villa", nameEn: "Luxury Escapes & Villas", nameAr: "ملاذات فاخرة وفلل" },
  { id: "farm", nameEn: "Country Farms", nameAr: "مزارع ريفية" },
  { id: "camp", nameEn: "Desert Camps", nameAr: "مخيمات صحراوية" },
  { id: "guides", nameEn: "Saudi Tourism Guides", nameAr: "أدلة السياحة السعودية" },
  { id: "host-tips", nameEn: "Host Insights & Revenue", nameAr: "إرشادات المضيفين والعوائد" },
] as const;

export function CmsArticlesTab({ t }: CmsArticlesTabProps) {
  const [blogs, setBlogs] = useState<SharedBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Editor mode: 'list' | 'edit'
  const [editorMode, setEditorMode] = useState<"list" | "edit">("list");
  const [activeFormLang, setActiveFormLang] = useState<"en" | "ar">("en");
  const [contentViewMode, setContentViewMode] = useState<"visual" | "html">("visual");

  // Active form data
  const [editingBlog, setEditingBlog] = useState<SharedBlogPost | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(cmsPath("/api/cms/blogs"));
      if (res.ok) {
        const data = await res.json();
        setBlogs(data);
      }
    } catch (err) {
      console.error("Failed loading blogs", err);
      showToast("Error loading blogs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const handleCreateNew = () => {
    const newId = `blog-${Date.now()}`;
    const initialPost: SharedBlogPost = {
      id: newId,
      slug: "",
      titleEn: "",
      titleAr: "",
      excerptEn: "",
      excerptAr: "",
      contentHtmlEn: "<h2>Introduction</h2><p>Start writing your comprehensive article here...</p>",
      contentHtmlAr: "<h2>المقدمة</h2><p>ابدأ بكتابة محتوى المقال الشامل هنا...</p>",
      category: "chalet",
      categoryNameEn: "Chalets & Smart Living",
      categoryNameAr: "شاليهات وإقامة ذكية",
      tags: ["Saudi Stays", "Chalets"],
      coverImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
      author: "QafNest Editorial",
      authorRoleEn: "Hospitality Insights Team",
      authorRoleAr: "فريق التحرير المتخصص في الضيافة",
      readTimeEn: "4 min read",
      readTimeAr: "٤ دقائق قراءة",
      status: "published",
      featured: false,
      date: new Date().toISOString().split("T")[0],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      seo: {
        metaTitleEn: "",
        metaTitleAr: "",
        metaDescriptionEn: "",
        metaDescriptionAr: "",
        keywords: ["QafNest", "Saudi Arabia", "Chalet"],
        canonicalUrl: "",
        ogImage: "",
      },
    };
    setEditingBlog(initialPost);
    setEditorMode("edit");
  };

  const handleEditExisting = (blog: SharedBlogPost) => {
    setEditingBlog({ ...blog });
    setEditorMode("edit");
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("Are you sure you want to delete this article?", "هل أنت متأكد من حذف هذا المقال؟"))) {
      return;
    }
    try {
      const res = await fetch(cmsPath(`/api/cms/blogs/${id}`), { method: "DELETE" });
      if (res.ok) {
        showToast(t("Blog deleted successfully.", "تم حذف المقال بنجاح."));
        await loadBlogs();
        if (editingBlog?.id === id) setEditorMode("list");
      } else {
        showToast(t("Failed to delete blog.", "فشل في حذف المقال."));
      }
    } catch {
      showToast(t("Network error deleting blog.", "خطأ في الشبكة أثناء الحذف."));
    }
  };

  const handleSaveBlog = async () => {
    if (!editingBlog) return;
    if (!editingBlog.titleEn || !editingBlog.titleAr) {
      alert(t("Please provide titles in both English and Arabic.", "يرجى إدخال عنوان المقال باللغتين الإنجليزية والعربية."));
      return;
    }

    // Auto-generate slug if empty
    let finalSlug = editingBlog.slug.trim();
    if (!finalSlug) {
      finalSlug = editingBlog.titleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    // Auto-fill SEO metadata if missing
    const seo: BlogSeoConfig = {
      metaTitleEn: editingBlog.seo.metaTitleEn || editingBlog.titleEn,
      metaTitleAr: editingBlog.seo.metaTitleAr || editingBlog.titleAr,
      metaDescriptionEn: editingBlog.seo.metaDescriptionEn || editingBlog.excerptEn,
      metaDescriptionAr: editingBlog.seo.metaDescriptionAr || editingBlog.excerptAr,
      keywords: editingBlog.seo.keywords || ["Saudi Arabia", "QafNest"],
      canonicalUrl: editingBlog.seo.canonicalUrl || `https://qafnest.com/blog/${finalSlug}`,
      ogImage: editingBlog.seo.ogImage || editingBlog.coverImage,
    };

    const catObj = CATEGORY_OPTIONS.find((c) => c.id === editingBlog.category) || CATEGORY_OPTIONS[0];

    const payload: SharedBlogPost = {
      ...editingBlog,
      slug: finalSlug,
      categoryNameEn: catObj.nameEn,
      categoryNameAr: catObj.nameAr,
      seo,
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const res = await fetch(cmsPath("/api/cms/blogs"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast(t("Article published and synced to Guest Portal (:3000)!", "تم نشر المقال ومزامنته مع بوابة الضيوف بنجاح!"));
        await loadBlogs();
        setEditorMode("list");
      } else {
        showToast(t("Failed saving article.", "فشل في حفظ المقال."));
      }
    } catch {
      showToast(t("Network error.", "خطأ في الاتصال."));
    } finally {
      setSaving(false);
    }
  };

  // Helper to append HTML snippet into the active language editor
  const insertHtmlSnippet = (tagOpen: string, tagClose: string) => {
    if (!editingBlog) return;
    const isEn = activeFormLang === "en";
    const current = isEn ? editingBlog.contentHtmlEn : editingBlog.contentHtmlAr;
    const updated = `${current}\n${tagOpen}Sample text${tagClose}\n`;
    setEditingBlog({
      ...editingBlog,
      [isEn ? "contentHtmlEn" : "contentHtmlAr"]: updated,
    });
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
              <Sparkles size={20} />
            </span>
            <span>{t("Bilingual Blog & SEO Studio", "استوديو المدونة وإدارة السيو")}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {t(
              "Author professional HTML articles with full SEO metadata in English and Arabic. Changes sync live to /blog on the Guest Portal.",
              "كتابة ونشر مقالات احترافية بمحرر HTML ودعم كامل لمحركات البحث باللغتين العربية والإنجليزية، متصلة مباشرة بالمدونة."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {editorMode === "edit" ? (
            <button
              type="button"
              onClick={() => setEditorMode("list")}
              className="h-10 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>{t("Back to Articles", "العودة للقائمة")}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateNew}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer transition"
            >
              <Plus size={16} />
              <span>{t("Write New Blog", "كتابة مقال جديد")}</span>
            </button>
          )}

          <a
            href={`${ECOSYSTEM_URLS.guest}/blog`}
            target="_blank"
            rel="noreferrer"
            className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold text-white flex items-center gap-2"
          >
            <span>{t("Live Blog", "المدونة المباشرة")}</span>
            <ExternalLink size={14} className="opacity-70" />
          </a>
        </div>
      </div>

      {/* MODE 1: ARTICLES DIRECTORY */}
      {editorMode === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400">
            <span>{blogs.length} {t("Articles Published", "مقالات متوفرة")}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-white/10 bg-[#0C1018] overflow-hidden flex flex-col justify-between group hover:border-teal-500/40 transition-all shadow-md"
              >
                <div className="relative h-44 w-full bg-black/60 overflow-hidden">
                  <img
                    src={b.coverImage}
                    alt={b.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 start-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-black/70 text-white backdrop-blur-md">
                      {b.categoryNameEn}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === "published"
                          ? "bg-teal-500/90 text-black"
                          : "bg-amber-500/90 text-black"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {b.date}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {b.readTimeEn}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-white line-clamp-2 leading-snug">
                      {b.titleEn}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-1 font-arabic" dir="rtl">
                      {b.titleAr}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Eye size={12} className="text-teal-400" />
                      <span>{b.views || 0} views</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditExisting(b)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-teal-400 cursor-pointer"
                        title={t("Edit Article", "تعديل")}
                      >
                        <Edit3 size={15} />
                      </button>
                      <a
                        href={`${ECOSYSTEM_URLS.guest}/blog/${b.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                        title={t("View Live", "معاينة")}
                      >
                        <Eye size={15} />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                        title={t("Delete Article", "حذف")}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODE 2: FULL-FEATURED BILINGUAL HTML & SEO EDITOR */}
      {editorMode === "edit" && editingBlog && (
        <div className="space-y-6">
          {/* Top Form Action Controls */}
          <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400">{t("Language Panel:", "لغة المحرر:")}</span>
              <div className="flex rounded-xl bg-black/60 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveFormLang("en")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeFormLang === "en" ? "bg-teal-500 text-black shadow-xs" : "text-gray-400 hover:text-white"
                  }`}
                >
                  English Version
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormLang("ar")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    activeFormLang === "ar" ? "bg-teal-500 text-black shadow-xs" : "text-gray-400 hover:text-white"
                  }`}
                >
                  النسخة العربية
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={editingBlog.status}
                onChange={(e) =>
                  setEditingBlog({ ...editingBlog, status: e.target.value as "published" | "draft" })
                }
                className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs font-bold text-white"
              >
                <option value="published">Status: Published (مباشر)</option>
                <option value="draft">Status: Draft (مسودة)</option>
              </select>

              <button
                type="button"
                onClick={handleSaveBlog}
                disabled={saving}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-md cursor-pointer transition disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? t("Saving...", "جاري الحفظ...") : t("Publish & Sync Live", "حفظ ونشر المقال")}</span>
              </button>
            </div>
          </div>

          {/* Core Article Metadata */}
          <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-6 space-y-4">
            <h2 className="text-sm font-bold text-teal-400 flex items-center gap-2">
              <FileText size={16} />
              <span>{t("1. Article Core Information & Bilingual Titles", "١. العناوين والمحتوى الأساسي")}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  {t("Article Title (English)", "عنوان المقال (إنجليزي)")} *
                </label>
                <input
                  required
                  type="text"
                  value={editingBlog.titleEn}
                  onChange={(e) => setEditingBlog({ ...editingBlog, titleEn: e.target.value })}
                  placeholder="e.g. 7 Hidden Gem Chalets in Riyadh"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  {t("Article Title (Arabic)", "عنوان المقال (عربي)")} *
                </label>
                <input
                  required
                  type="text"
                  value={editingBlog.titleAr}
                  onChange={(e) => setEditingBlog({ ...editingBlog, titleAr: e.target.value })}
                  placeholder="مثال: أفضل ٧ شاليهات مميزة في الرياض"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  {t("URL Slug (Leave blank for auto-generate)", "الاسم التعريفي في الرابط Slug")}
                </label>
                <input
                  type="text"
                  value={editingBlog.slug}
                  onChange={(e) => setEditingBlog({ ...editingBlog, slug: e.target.value })}
                  placeholder="smart-living-riyadh"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-teal-300 font-mono focus:outline-none"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  https://qafnest.com/blog/{editingBlog.slug || "your-slug"}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  {t("Category", "التصنيف")}
                </label>
                <select
                  value={editingBlog.category}
                  onChange={(e) => {
                    const nextCat = e.target.value as SharedBlogPost["category"];
                    const catObj = CATEGORY_OPTIONS.find((c) => c.id === nextCat) || CATEGORY_OPTIONS[0];
                    setEditingBlog({
                      ...editingBlog,
                      category: nextCat,
                      categoryNameEn: catObj.nameEn,
                      categoryNameAr: catObj.nameAr,
                    });
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameAr})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  {t("Cover Image URL", "رابط الصورة البارزة")}
                </label>
                <input
                  type="text"
                  value={editingBlog.coverImage}
                  onChange={(e) => setEditingBlog({ ...editingBlog, coverImage: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  {t("Excerpt / Summary (English)", "الملخص الموجز (إنجليزي)")}
                </label>
                <textarea
                  rows={2}
                  value={editingBlog.excerptEn}
                  onChange={(e) => setEditingBlog({ ...editingBlog, excerptEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  {t("Excerpt / Summary (Arabic)", "الملخص الموجز (عربي)")}
                </label>
                <textarea
                  rows={2}
                  value={editingBlog.excerptAr}
                  onChange={(e) => setEditingBlog({ ...editingBlog, excerptAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Rich HTML Content Editor */}
          <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                <Code size={16} />
                <span>
                  {t("2. Professional Article Content Editor", "٢. محرر المقال المتكامل وتنسيق HTML")} (
                  {activeFormLang === "en" ? "English" : "العربية"})
                </span>
              </h2>

              {/* View Switcher: Visual vs Code */}
              <div className="flex rounded-xl bg-black/60 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setContentViewMode("visual")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    contentViewMode === "visual" ? "bg-teal-500 text-black" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Visual Formatter
                </button>
                <button
                  type="button"
                  onClick={() => setContentViewMode("html")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                    contentViewMode === "html" ? "bg-teal-500 text-black" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Raw HTML Code
                </button>
              </div>
            </div>

            {/* Quick HTML Insertion Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-black/40 border border-white/10 text-xs">
              <span className="text-[11px] font-mono text-gray-500 px-1">Quick Tools:</span>
              <button
                type="button"
                onClick={() => insertHtmlSnippet("<h2>", "</h2>")}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold"
              >
                H2 Heading
              </button>
              <button
                type="button"
                onClick={() => insertHtmlSnippet("<h3>", "</h3>")}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold"
              >
                H3 Subheading
              </button>
              <button
                type="button"
                onClick={() => insertHtmlSnippet("<strong>", "</strong>")}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 font-bold"
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => insertHtmlSnippet("<blockquote>", "</blockquote>")}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300"
              >
                Quote
              </button>
              <button
                type="button"
                onClick={() => insertHtmlSnippet("<ul><li>", "</li><li>Item 2</li></ul>")}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300"
              >
                Bullet List
              </button>
              <button
                type="button"
                onClick={() => insertHtmlSnippet('<a href="https://qafnest.com/search">', "</a>")}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-teal-400"
              >
                Link
              </button>
              <button
                type="button"
                onClick={() => insertHtmlSnippet('<img src="https://images.unsplash.com/photo-..." alt="Chalet" class="rounded-2xl my-4 w-full" />', "")}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-teal-400"
              >
                Image
              </button>
            </div>

            {/* Editor Textarea */}
            <textarea
              rows={12}
              value={activeFormLang === "en" ? editingBlog.contentHtmlEn : editingBlog.contentHtmlAr}
              onChange={(e) => {
                const isEn = activeFormLang === "en";
                setEditingBlog({
                  ...editingBlog,
                  [isEn ? "contentHtmlEn" : "contentHtmlAr"]: e.target.value,
                });
              }}
              dir={activeFormLang === "ar" ? "rtl" : "ltr"}
              placeholder="<h2>Your Heading</h2><p>Article body paragraphs...</p>"
              className="w-full p-4 rounded-xl bg-black/60 border border-white/15 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-teal-500 leading-relaxed"
            />

            {/* Live Preview Box */}
            <div className="p-5 rounded-xl border border-white/10 bg-black/30 space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                {t("Live Rendered Preview:", "المعاينة المباشرة للنص:")}
              </span>
              <div
                dir={activeFormLang === "ar" ? "rtl" : "ltr"}
                className="prose prose-invert max-w-none text-xs sm:text-sm text-gray-200 leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{
                  __html: activeFormLang === "en" ? editingBlog.contentHtmlEn : editingBlog.contentHtmlAr,
                }}
              />
            </div>
          </div>

          {/* Full SEO Suite Section */}
          <div className="rounded-2xl border border-white/10 bg-[#0C1018] p-6 space-y-4">
            <h2 className="text-sm font-bold text-teal-400 flex items-center gap-2">
              <Search size={16} />
              <span>{t("3. Advanced Search Engine Optimization (SEO) & Social Graph", "٣. تحسين محركات البحث وسيو المشاركة")}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  Meta Title (English) — {editingBlog.seo.metaTitleEn.length}/60 chars
                </label>
                <input
                  type="text"
                  value={editingBlog.seo.metaTitleEn}
                  onChange={(e) =>
                    setEditingBlog({
                      ...editingBlog,
                      seo: { ...editingBlog.seo, metaTitleEn: e.target.value },
                    })
                  }
                  placeholder="Smart Living: Keyless Luxury Chalets in Riyadh | QafNest"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  Meta Title (Arabic) — {editingBlog.seo.metaTitleAr.length}/60 chars
                </label>
                <input
                  type="text"
                  value={editingBlog.seo.metaTitleAr}
                  onChange={(e) =>
                    setEditingBlog({
                      ...editingBlog,
                      seo: { ...editingBlog.seo, metaTitleAr: e.target.value },
                    })
                  }
                  placeholder="الإقامة الذكية: شاليهات فاخرة بدخول ذكي في الرياض | قاف نست"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  Meta Description (English) — {editingBlog.seo.metaDescriptionEn.length}/160 chars
                </label>
                <textarea
                  rows={2}
                  value={editingBlog.seo.metaDescriptionEn}
                  onChange={(e) =>
                    setEditingBlog({
                      ...editingBlog,
                      seo: { ...editingBlog.seo, metaDescriptionEn: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  Meta Description (Arabic) — {editingBlog.seo.metaDescriptionAr.length}/160 chars
                </label>
                <textarea
                  rows={2}
                  value={editingBlog.seo.metaDescriptionAr}
                  onChange={(e) =>
                    setEditingBlog({
                      ...editingBlog,
                      seo: { ...editingBlog.seo, metaDescriptionAr: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  Focus Keywords (Comma-separated)
                </label>
                <input
                  type="text"
                  value={editingBlog.seo.keywords.join(", ")}
                  onChange={(e) =>
                    setEditingBlog({
                      ...editingBlog,
                      seo: {
                        ...editingBlog.seo,
                        keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean),
                      },
                    })
                  }
                  placeholder="Riyadh Chalet, Smart Locks, شاليهات الرياض"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">
                  Open Graph (OG) Social Image URL
                </label>
                <input
                  type="text"
                  value={editingBlog.seo.ogImage || ""}
                  onChange={(e) =>
                    setEditingBlog({
                      ...editingBlog,
                      seo: { ...editingBlog.seo, ogImage: e.target.value },
                    })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>
            </div>

            {/* Google SERP Snippet Preview */}
            <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-1">
              <span className="text-[10px] font-mono uppercase text-gray-500">Google Search Result Preview</span>
              <div className="text-teal-400 text-sm font-semibold truncate hover:underline cursor-pointer">
                {activeFormLang === "en"
                  ? editingBlog.seo.metaTitleEn || editingBlog.titleEn
                  : editingBlog.seo.metaTitleAr || editingBlog.titleAr}
              </div>
              <div className="text-[11px] text-emerald-400 truncate font-mono">
                https://qafnest.com/blog/{editingBlog.slug || "smart-living-riyadh"}
              </div>
              <div className="text-xs text-gray-400 line-clamp-2">
                {activeFormLang === "en"
                  ? editingBlog.seo.metaDescriptionEn || editingBlog.excerptEn
                  : editingBlog.seo.metaDescriptionAr || editingBlog.excerptAr}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
