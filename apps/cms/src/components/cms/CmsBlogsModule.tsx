"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  ArrowLeft,
  Plus,
  ExternalLink,
  Loader2,
  Globe,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import type { SharedBlogPost, BlogSeoConfig } from "@qafnest/shared";
import { ECOSYSTEM_URLS } from "@qafnest/shared";
import { cmsPath } from "@/lib/cmsUrl";
import { CollectionTableShell, type TableColumn } from "./CollectionTableShell";
import { RichVisualEditor } from "./RichVisualEditor";
import { MediaPickerField } from "./MediaPickerField";
import type { CmsCategoryRecord, CmsLocale, CmsMediaRecord, CmsUserRecord } from "@/types/cms";

interface CmsBlogsModuleProps {
  blogs: SharedBlogPost[];
  loading: boolean;
  onRefreshBlogs: () => Promise<void>;
  categories: CmsCategoryRecord[];
  onAddCategoryQuick: (name: string) => Promise<void>;
  users: CmsUserRecord[];
  mediaLibrary: CmsMediaRecord[];
  onMediaUploaded: (m: CmsMediaRecord) => void;
  locale: CmsLocale;
  setLocale: (loc: CmsLocale) => void;
  darkMode: boolean;
  onNotify: (msg: string) => void;
}

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CmsBlogsModule({
  blogs,
  loading,
  onRefreshBlogs,
  categories,
  onAddCategoryQuick,
  users,
  mediaLibrary,
  onMediaUploaded,
  locale,
  setLocale,
  darkMode,
  onNotify,
}: CmsBlogsModuleProps) {
  const isAr = locale === "ar";
  const [view, setView] = useState<"list" | "edit">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [isNewBlog, setIsNewBlog] = useState(false);
  const [draft, setDraft] = useState<SharedBlogPost | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  const orderedBlogs = useMemo(() => {
    const base = [...blogs];
    if (orderedIds.length > 0) {
      base.sort((a, b) => {
        const ia = orderedIds.indexOf(a.id);
        const ib = orderedIds.indexOf(b.id);
        return (ia === -1 ? 9999 : ia) - (ib === -1 ? 9999 : ib);
      });
    }
    return base.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (b.titleEn || "").toLowerCase().includes(q) ||
        (b.titleAr || "").toLowerCase().includes(q) ||
        (b.slug || "").toLowerCase().includes(q) ||
        (b.excerptEn || "").toLowerCase().includes(q) ||
        (b.excerptAr || "").toLowerCase().includes(q)
      );
    });
  }, [blogs, orderedIds, statusFilter, search]);

  const openCreate = () => {
    const firstCat = categories[0];
    const defaultAuthor = users[0] ? `${users[0].firstName} ${users[0].lastName}`.trim() : "QafNest Editorial";
    const fresh: SharedBlogPost = {
      id: `blog-${Date.now()}`,
      slug: "",
      titleEn: "",
      titleAr: "",
      excerptEn: "",
      excerptAr: "",
      contentHtmlEn: "<h2>Introduction</h2><p>Start writing your article content here...</p>",
      contentHtmlAr: "<h2>مقدمة</h2><p>ابدأ بكتابة محتوى المقال هنا...</p>",
      category: (firstCat?.slug || "chalet") as SharedBlogPost["category"],
      categoryNameEn: firstCat?.name.en || "Chalets & Smart Living",
      categoryNameAr: firstCat?.name.ar || "شاليهات وإقامة ذكية",
      tags: ["QafNest", "Saudi Stays"],
      coverImage: "",
      author: defaultAuthor,
      authorRoleEn: "Editorial Team",
      authorRoleAr: "فريق التحرير",
      readTimeEn: "4 min read",
      readTimeAr: "4 دقائق قراءة",
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
        keywords: ["QafNest", "Saudi Arabia"],
        canonicalUrl: "",
        ogImage: "",
      },
    };
    setDraft(fresh);
    setTagsInput(fresh.tags.join(", "));
    setKeywordsInput((fresh.seo?.keywords || []).join(", "));
    setIsNewBlog(true);
    setView("edit");
  };

  const openEdit = (blog: SharedBlogPost) => {
    const safeBlog: SharedBlogPost = {
      ...blog,
      seo: {
        metaTitleEn: blog.seo?.metaTitleEn || "",
        metaTitleAr: blog.seo?.metaTitleAr || "",
        metaDescriptionEn: blog.seo?.metaDescriptionEn || "",
        metaDescriptionAr: blog.seo?.metaDescriptionAr || "",
        keywords: Array.isArray(blog.seo?.keywords) ? blog.seo.keywords : [],
        canonicalUrl: blog.seo?.canonicalUrl || "",
        ogImage: blog.seo?.ogImage || "",
      },
    };
    setDraft(safeBlog);
    setTagsInput((safeBlog.tags || []).join(", "));
    setKeywordsInput((safeBlog.seo.keywords || []).join(", "));
    setIsNewBlog(false);
    setView("edit");
  };

  const handleDelete = async (blog: SharedBlogPost) => {
    const label = isAr ? blog.titleAr || blog.titleEn : blog.titleEn || blog.titleAr;
    if (!window.confirm(isAr ? `هل تريد حذف المقال "${label}"؟` : `Delete blog "${label}"?`)) {
      return;
    }
    try {
      const res = await fetch(cmsPath(`/api/cms/blogs/${blog.id}`), { method: "DELETE" });
      if (res.ok) {
        onNotify(isAr ? "تم حذف المقال بنجاح" : "Blog deleted successfully");
        await onRefreshBlogs();
      } else {
        onNotify(isAr ? "فشل حذف المقال" : "Failed to delete blog");
      }
    } catch {
      onNotify("Network error deleting blog");
    }
  };

  const handleSave = async () => {
    if (!draft) return;

    const resolvedTitleEn = draft.titleEn.trim() || draft.titleAr.trim();
    const resolvedTitleAr = draft.titleAr.trim() || draft.titleEn.trim();
    if (!resolvedTitleEn && !resolvedTitleAr) {
      onNotify(isAr ? "يرجى إدخال عنوان المقال أولاً" : "Please enter a blog title first");
      return;
    }

    const resolvedSlug =
      draft.slug.trim() || slugify(resolvedTitleEn) || `post-${Date.now()}`;

    const matchedCat = categories.find((c) => c.slug === draft.category);
    const parsedTags = tagsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedKeywords = keywordsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const seo: BlogSeoConfig = {
      metaTitleEn: draft.seo.metaTitleEn.trim() || resolvedTitleEn,
      metaTitleAr: draft.seo.metaTitleAr.trim() || resolvedTitleAr,
      metaDescriptionEn:
        draft.seo.metaDescriptionEn.trim() || draft.excerptEn.trim() || resolvedTitleEn,
      metaDescriptionAr:
        draft.seo.metaDescriptionAr.trim() || draft.excerptAr.trim() || resolvedTitleAr,
      keywords: parsedKeywords.length > 0 ? parsedKeywords : ["QafNest", "Saudi Arabia"],
      canonicalUrl:
        (draft.seo.canonicalUrl || "").trim() || `${ECOSYSTEM_URLS.guest}/blog/${resolvedSlug}`,
      ogImage: (draft.seo.ogImage || "").trim() || draft.coverImage || "",
    };

    const payload: SharedBlogPost = {
      ...draft,
      slug: resolvedSlug,
      titleEn: resolvedTitleEn,
      titleAr: resolvedTitleAr,
      excerptEn: draft.excerptEn.trim() || draft.excerptAr.trim() || resolvedTitleEn,
      excerptAr: draft.excerptAr.trim() || draft.excerptEn.trim() || resolvedTitleAr,
      categoryNameEn: matchedCat?.name.en || draft.categoryNameEn || draft.category,
      categoryNameAr: matchedCat?.name.ar || draft.categoryNameAr || draft.category,
      tags: parsedTags,
      updatedAt: new Date().toISOString(),
      seo,
    };

    setSaving(true);
    try {
      const endpoint = isNewBlog
        ? cmsPath("/api/cms/blogs")
        : cmsPath(`/api/cms/blogs/${payload.id}`);
      const res = await fetch(endpoint, {
        method: isNewBlog ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        onNotify(isAr ? "تم حفظ المقال بنجاح" : "Blog saved successfully");
        await onRefreshBlogs();
        setDraft(json?.blog || payload);
        setIsNewBlog(false);
      } else {
        onNotify(json?.error || "Failed to save blog");
      }
    } catch {
      onNotify("Network error while saving blog");
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumn<SharedBlogPost>[] = [
    {
      key: "title",
      label: isAr ? "العنوان" : "Title",
      render: (b) => (
        <button
          type="button"
          onClick={() => openEdit(b)}
          className="font-semibold text-[#2563EB] hover:underline text-left max-w-[260px] truncate block"
        >
          {(isAr ? b.titleAr || b.titleEn : b.titleEn || b.titleAr) || "[Untitled]"}
        </button>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      render: (b) => (
        <span className="font-mono text-[11px] text-gray-500 max-w-[180px] truncate block">
          {b.slug}
        </span>
      ),
    },
    {
      key: "excerpt",
      label: isAr ? "الملخص" : "Excerpt",
      render: (b) => (
        <span className={`max-w-[260px] truncate block ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
          {isAr ? b.excerptAr || b.excerptEn : b.excerptEn || b.excerptAr}
        </span>
      ),
    },
    {
      key: "content",
      label: isAr ? "المحتوى" : "Content",
      render: (b) => (
        <span className={`max-w-[240px] truncate block ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
          {stripHtml(isAr ? b.contentHtmlAr || b.contentHtmlEn : b.contentHtmlEn || b.contentHtmlAr).slice(0, 80)}
        </span>
      ),
    },
    {
      key: "status",
      label: isAr ? "الحالة" : "Status",
      render: (b) =>
        b.status === "published" ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Published
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
            Draft
          </span>
        ),
    },
  ];

  const inputCls = `w-full px-3 py-2 rounded-lg border text-xs outline-none transition ${
    darkMode
      ? "bg-[#11131A] border-[#2A2F3E] text-white focus:border-blue-500"
      : "bg-white border-[#D1D5DB] text-[#111827] focus:border-[#2563EB]"
  }`;

  const cardCls = `rounded-xl border p-5 space-y-4 ${
    darkMode ? "bg-[#151822] border-[#222634]" : "bg-white border-[#E5E7EB]"
  }`;

  if (view === "edit" && draft) {
    const activeTitle = isAr ? draft.titleAr : draft.titleEn;
    const activeExcerpt = isAr ? draft.excerptAr : draft.excerptEn;
    const activeContent = isAr ? draft.contentHtmlAr : draft.contentHtmlEn;

    return (
      <div className="space-y-5 max-w-5xl">
        {/* Sticky Top Edit Action Bar (Matching Screenshots 5 & 6) */}
        <div
          className={`sticky top-14 z-20 -mx-2 px-4 py-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            darkMode
              ? "bg-[#11131A]/95 border-[#222634]"
              : "bg-white/95 border-[#E5E7EB] shadow-xs"
          } backdrop-blur`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`p-1.5 rounded-lg border transition ${
                darkMode
                  ? "border-[#2A2F3E] text-slate-300 hover:bg-white/5"
                  : "border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
              title="Back to Blogs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className={`text-lg font-bold truncate ${darkMode ? "text-white" : "text-[#111827]"}`}>
                {activeTitle.trim() || "[Untitled]"}
              </div>
              <div className={`text-[11px] flex items-center gap-2 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                <span>{isNewBlog ? "Creating new Blog" : "Editing Blog"}</span>
                <span>•</span>
                <span className="text-[#2563EB] font-medium">
                  {locale === "en" ? "English (en)" : "العربية (ar)"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Locale Switcher inside Editor */}
            <div
              className={`inline-flex rounded-lg border p-0.5 text-xs ${
                darkMode ? "bg-[#181B24] border-[#2A2F3E]" : "bg-gray-100 border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  locale === "en" ? "bg-white dark:bg-[#2563EB] text-[#111827] dark:text-white shadow-xs" : "text-gray-500"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLocale("ar")}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  locale === "ar" ? "bg-white dark:bg-[#2563EB] text-[#111827] dark:text-white shadow-xs" : "text-gray-500"
                }`}
              >
                العربية
              </button>
            </div>

            {!isNewBlog && draft.slug && (
              <a
                href={`${ECOSYSTEM_URLS.guest}/${locale}/blog/${draft.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition ${
                  darkMode
                    ? "border-[#2A2F3E] text-slate-200 hover:bg-white/5"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview ({locale.toUpperCase()})</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm disabled:opacity-60 transition"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        {/* Main Fields Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Columns: Title, Slug, Excerpt, Rich Content, Cover Image */}
          <div className="lg:col-span-2 space-y-5">
            <div className={cardCls}>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-medium">
                  <span>
                    Title <span className="text-red-500">*</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#2563EB]">
                    <Globe className="w-3 h-3" />
                    {locale === "en" ? "English" : "العربية"}
                  </span>
                </label>
                <input
                  value={activeTitle}
                  dir={isAr ? "rtl" : "ltr"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => {
                      if (!prev) return prev;
                      const next = isAr ? { ...prev, titleAr: val } : { ...prev, titleEn: val };
                      if (isNewBlog && !isAr && !prev.slug) {
                        next.slug = slugify(val);
                      }
                      return next;
                    });
                  }}
                  placeholder={isAr ? "أدخل عنوان المقال بالعربية..." : "Enter article title in English..."}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) =>
                        prev ? { ...prev, slug: slugify(prev.titleEn || prev.titleAr) } : prev
                      )
                    }
                    className="text-[11px] text-[#2563EB] hover:underline"
                  >
                    Generate from title
                  </button>
                </div>
                <input
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  placeholder="riyadh-luxury-chalets-guide"
                  className={`${inputCls} font-mono`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-medium">
                  <span>
                    Excerpt <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {locale === "en" ? "English" : "العربية"}
                  </span>
                </label>
                <textarea
                  rows={3}
                  dir={isAr ? "rtl" : "ltr"}
                  value={activeExcerpt}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? isAr
                          ? { ...prev, excerptAr: e.target.value }
                          : { ...prev, excerptEn: e.target.value }
                        : prev
                    )
                  }
                  placeholder={isAr ? "ملخص قصير للمقال..." : "Short compelling summary for cards & search results..."}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs font-medium">
                  <span>Content ({locale === "en" ? "English" : "العربية"})</span>
                </label>
                <RichVisualEditor
                  value={activeContent}
                  onChange={(html) =>
                    setDraft((prev) =>
                      prev
                        ? isAr
                          ? { ...prev, contentHtmlAr: html }
                          : { ...prev, contentHtmlEn: html }
                        : prev
                    )
                  }
                  darkMode={darkMode}
                  dir={isAr ? "rtl" : "ltr"}
                  mediaLibrary={mediaLibrary}
                  onMediaUploaded={onMediaUploaded}
                />
              </div>
            </div>

            {/* Cover Image Card */}
            <div className={cardCls}>
              <MediaPickerField
                label="Cover Image"
                helperText="Recommended size: 1200×630px for optimal social & blog card rendering."
                value={draft.coverImage}
                onChange={(url) => setDraft({ ...draft, coverImage: url })}
                mediaLibrary={mediaLibrary}
                onMediaUploaded={onMediaUploaded}
                darkMode={darkMode}
              />
            </div>

            {/* Key Highlights / Features Card */}
            <div className={cardCls}>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <span>{isAr ? "المميزات الرئيسية للمقال (Key Highlights)" : "Article Key Highlights & Features"}</span>
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {isAr
                      ? "أضف المميزات البارزة لتظهر كبطاقات مستقلة داخل المقال (مثل المسابح المدفأة، الدخول الذكي، والتراخيص)"
                      : "Add key features highlighted inside the article (e.g. Heated Pools, Smart Keyless Locks, SAMA Payouts)"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = draft.keyFeatures || [];
                    setDraft({
                      ...draft,
                      keyFeatures: [
                        ...current,
                        {
                          titleEn: "Feature Title",
                          titleAr: "عنوان الميزة",
                          descEn: "Brief description of this highlight...",
                          descAr: "وصف مختصر لهذه الميزة...",
                        },
                      ],
                    });
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? "إضافة ميزة" : "Add Highlight"}</span>
                </button>
              </div>

              {(!draft.keyFeatures || draft.keyFeatures.length === 0) ? (
                <div className="text-xs text-gray-400 italic p-4 border border-dashed rounded-lg text-center">
                  {isAr
                    ? "لم تتم إضافة مميزات رئيسية بعد. انقر على 'إضافة ميزة' للبدء."
                    : "No key highlights added yet. Click 'Add Highlight' to specify feature points."}
                </div>
              ) : (
                <div className="space-y-3">
                  {draft.keyFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-gray-200 dark:border-[#222634] bg-gray-50/70 dark:bg-[#11131A] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-500 text-[11px]">#{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (draft.keyFeatures || []).filter((_, i) => i !== idx);
                            setDraft({ ...draft, keyFeatures: updated });
                          }}
                          className="text-red-500 hover:text-red-700 font-semibold text-[11px] cursor-pointer"
                        >
                          {isAr ? "حذف" : "Remove"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={feat.titleEn}
                          onChange={(e) => {
                            const updated = [...(draft.keyFeatures || [])];
                            updated[idx] = { ...updated[idx], titleEn: e.target.value };
                            setDraft({ ...draft, keyFeatures: updated });
                          }}
                          placeholder="Title (English) e.g. Heated Private Pools"
                          className={inputCls}
                        />
                        <input
                          value={feat.titleAr}
                          dir="rtl"
                          onChange={(e) => {
                            const updated = [...(draft.keyFeatures || [])];
                            updated[idx] = { ...updated[idx], titleAr: e.target.value };
                            setDraft({ ...draft, keyFeatures: updated });
                          }}
                          placeholder="العنوان (بالعربية) مثل مسابح خاصة مدفأة"
                          className={inputCls}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={feat.descEn || ""}
                          onChange={(e) => {
                            const updated = [...(draft.keyFeatures || [])];
                            updated[idx] = { ...updated[idx], descEn: e.target.value };
                            setDraft({ ...draft, keyFeatures: updated });
                          }}
                          placeholder="Short description (English)..."
                          className={inputCls}
                        />
                        <input
                          value={feat.descAr || ""}
                          dir="rtl"
                          onChange={(e) => {
                            const updated = [...(draft.keyFeatures || [])];
                            updated[idx] = { ...updated[idx], descAr: e.target.value };
                            setDraft({ ...draft, keyFeatures: updated });
                          }}
                          placeholder="وصف مختصر (بالعربية)..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEO Configuration Card */}
            <div className={cardCls}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">SEO &amp; Metadata</h3>
                  <p className="text-[11px] text-gray-500">
                    Search engine preview and bilingual canonical configuration
                  </p>
                </div>
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Meta Title ({locale.toUpperCase()})</label>
                  <input
                    value={isAr ? draft.seo.metaTitleAr : draft.seo.metaTitleEn}
                    dir={isAr ? "rtl" : "ltr"}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        seo: {
                          ...draft.seo,
                          ...(isAr ? { metaTitleAr: e.target.value } : { metaTitleEn: e.target.value }),
                        },
                      })
                    }
                    placeholder="SEO Title"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Canonical URL</label>
                  <input
                    value={draft.seo.canonicalUrl}
                    onChange={(e) =>
                      setDraft({ ...draft, seo: { ...draft.seo, canonicalUrl: e.target.value } })
                    }
                    placeholder={`${ECOSYSTEM_URLS.guest}/blog/${draft.slug || "slug"}`}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Meta Description ({locale.toUpperCase()})</label>
                <textarea
                  rows={2}
                  dir={isAr ? "rtl" : "ltr"}
                  value={isAr ? draft.seo.metaDescriptionAr : draft.seo.metaDescriptionEn}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      seo: {
                        ...draft.seo,
                        ...(isAr
                          ? { metaDescriptionAr: e.target.value }
                          : { metaDescriptionEn: e.target.value }),
                      },
                    })
                  }
                  placeholder="150–160 characters meta description..."
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Keywords (comma-separated)</label>
                <input
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="Saudi chalets, Riyadh stays, QafNest"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar Metadata Column (Author, Category, Status, Featured, Date, Tags) */}
          <div className="space-y-5">
            <div className={cardCls}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Publishing
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Status</label>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value as "published" | "draft" })
                  }
                  className={inputCls}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={Boolean(draft.featured)}
                  onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
                  className="rounded accent-[#2563EB] w-4 h-4"
                />
                <span>Featured Article</span>
              </label>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Publish Date</label>
                <input
                  type="date"
                  value={draft.date || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Read Time ({locale.toUpperCase()})</label>
                <input
                  value={isAr ? draft.readTimeAr : draft.readTimeEn}
                  onChange={(e) =>
                    setDraft(
                      isAr
                        ? { ...draft, readTimeAr: e.target.value }
                        : { ...draft, readTimeEn: e.target.value }
                    )
                  }
                  placeholder={isAr ? "5 دقائق قراءة" : "5 min read"}
                  className={inputCls}
                />
              </div>
            </div>

            <div className={cardCls}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Relationships
              </h3>

              {/* Author Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Author</label>
                <div className="flex gap-1.5">
                  <select
                    value={draft.author}
                    onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                    className={inputCls}
                  >
                    <option value="QafNest Editorial">QafNest Editorial</option>
                    {users.map((u) => {
                      const fullName = `${u.firstName} ${u.lastName}`.trim() || u.email;
                      return (
                        <option key={u.id} value={fullName}>
                          {fullName} ({u.role})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Category Select with Quick + */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Category</label>
                <div className="flex gap-1.5">
                  <select
                    value={draft.category}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value as SharedBlogPost["category"] })
                    }
                    className={inputCls}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {isAr ? cat.name.ar : cat.name.en}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      const name = window.prompt("New category name:");
                      if (name && name.trim()) {
                        await onAddCategoryQuick(name.trim());
                        setDraft({
                          ...draft,
                          category: slugify(name.trim()) as SharedBlogPost["category"],
                        });
                      }
                    }}
                    className={`px-2.5 rounded-lg border shrink-0 transition ${
                      darkMode
                        ? "border-[#2A2F3E] hover:bg-white/5 text-slate-200"
                        : "border-gray-300 hover:bg-gray-50 text-gray-700"
                    }`}
                    title="Quick Add Category"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tags (comma-separated)</label>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Chalets, Riyadh, Tourism"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Linked Property Card */}
            <div className={cardCls}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {isAr ? "العقار المرتبط (Linked Property)" : "Linked Property"}
              </h3>
              <p className="text-[11px] text-gray-500">
                {isAr
                  ? "اربط هذا المقال بعقار محدد ليظهر كزر حجز مباشر للنزلاء"
                  : "Link this article to a specific property for direct booking CTA"}
              </p>
              <div className="space-y-2">
                <input
                  value={draft.linkedPropertyTitle || ""}
                  onChange={(e) => setDraft({ ...draft, linkedPropertyTitle: e.target.value })}
                  placeholder="Property Title (e.g. Obhur Beachfront Villa)"
                  className={inputCls}
                />
                <input
                  value={draft.linkedPropertyId || ""}
                  onChange={(e) => setDraft({ ...draft, linkedPropertyId: e.target.value })}
                  placeholder="Property UUID or ID"
                  className={`${inputCls} font-mono text-[11px]`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CollectionTableShell
      title={isAr ? "المقالات (Blogs)" : "Blogs"}
      subtitle={
        isAr
          ? "إدارة مقالات المدونة ثنائية اللغة مع محرر نصوص مرئي وإعدادات السيو"
          : "Manage bilingual articles with rich visual editor, cover media, and SEO metadata"
      }
      searchPlaceholder={isAr ? "ابحث بالعنوان أو الرابط..." : "Search by Title or Slug"}
      searchValue={search}
      onSearchChange={setSearch}
      createLabel={isAr ? "إنشاء مقال جديد" : "Create New"}
      onCreateNew={openCreate}
      filterLabel={isAr ? "تصفية" : "Filters"}
      filterOptions={[
        { label: "All Statuses", value: "all" },
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ]}
      activeFilter={statusFilter}
      onFilterChange={setStatusFilter}
      columns={columns}
      rows={orderedBlogs}
      draggable
      onReorder={(next) => setOrderedIds(next.map((b) => b.id))}
      onEdit={openEdit}
      onDelete={handleDelete}
      emptyTitle="No Blogs Found."
      emptyDescription="Create your first bilingual blog article to publish on QafNest."
      darkMode={darkMode}
      loading={loading}
    />
  );
}
