"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Compass,
  Share2,
  Copy,
  Check,
  ListOrdered,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { localizePath } from "@/lib/localization/localeHelper";
import { sanitizeRichHtml } from "@qafnest/shared/escapeHtml";
import {
  BLOG_POST_DETAILS,
  getDefaultBlogPost,
} from "../data/blogDetailPosts";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function parseTableOfContentsAndInjectIds(html: string): {
  processedHtml: string;
  toc: TocItem[];
} {
  const toc: TocItem[] = [];
  let headingIndex = 0;

  const processedHtml = html.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (match, tag, attrs, innerHtml) => {
    const text = innerHtml.replace(/<[^>]*>/g, "").trim();
    if (!text) return match;

    const cleanId =
      text
        .toLowerCase()
        .replace(/[^\w\u0600-\u06FF\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-") || `heading-${headingIndex}`;

    const uniqueId = `${cleanId}-${headingIndex++}`;
    const level = tag.toLowerCase() === "h2" ? 2 : 3;

    toc.push({ id: uniqueId, text, level });

    const withoutId = attrs.replace(/\bid=["'][^"']*["']/gi, "");
    return `<${tag} id="${uniqueId}" class="scroll-mt-28" ${withoutId}>${innerHtml}</${tag}>`;
  });

  return { processedHtml, toc };
}

export default function BlogPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language, isDarkTheme } = useApp();

  const slug = String(params?.slug || "");
  const [cmsPost, setCmsPost] = useState<any | null>(null);
  const [allBlogs, setAllBlogs] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [tocCollapsed, setTocCollapsed] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/cms/blogs?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.slug) {
          setCmsPost(data);
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    fetch("/api/cms/blogs", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAllBlogs(data.filter((b) => b.status === "published"));
        }
      })
      .catch(() => {});
  }, []);

  const defaultPost = useMemo(() => {
    return BLOG_POST_DETAILS[slug] || getDefaultBlogPost(slug);
  }, [slug]);

  const post = cmsPost || defaultPost;

  const title = language === "ar" ? post.titleAr : post.titleEn;
  const excerpt = language === "ar" ? post.excerptAr : post.excerptEn;
  const catName = language === "ar" ? (post.categoryNameAr || "شاليهات") : (post.categoryNameEn || "Chalets");
  const authorRole = language === "ar" ? (post.authorRoleAr || "خبير ضيافة") : (post.authorRoleEn || "Hospitality Specialist");
  const readTime = language === "ar" ? (post.readTimeAr || "٤ دقائق") : (post.readTimeEn || "4 min read");
  const author = post.author || "QafNest";
  const date = post.date || post.createdAt?.split("T")[0] || "2026-11-12";
  const image = post.coverImage || post.image || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80";
  const tags: string[] = Array.isArray(post.tags) ? post.tags : [];

  // Content processing: Table of Contents + HTML injection
  const rawHtmlContent = language === "ar" ? (post.contentHtmlAr || post.contentAr) : (post.contentHtmlEn || post.contentEn);
  const { processedHtml, toc } = useMemo(() => {
    if (typeof rawHtmlContent === "string") {
      return parseTableOfContentsAndInjectIds(rawHtmlContent);
    }
    return { processedHtml: "", toc: [] };
  }, [rawHtmlContent]);

  // Related posts (Internal Linking Engine) & Previous/Next post navigation
  const { relatedPosts, prevPost, nextPost } = useMemo(() => {
    if (!allBlogs.length) return { relatedPosts: [], prevPost: null, nextPost: null };

    const currentIndex = allBlogs.findIndex((b) => b.slug === slug || b.id === post.id);
    const prev = currentIndex > 0 ? allBlogs[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : null;

    const others = allBlogs.filter((b) => b.slug !== slug && b.id !== post.id);
    const currentTags = tags.map((t) => t.toLowerCase());

    const scored = others.map((b) => {
      let score = 0;
      if (b.category && post.category && String(b.category).toLowerCase() === String(post.category).toLowerCase()) {
        score += 5;
      }
      if (Array.isArray(b.tags)) {
        for (const t of b.tags) {
          if (currentTags.includes(String(t).toLowerCase())) {
            score += 2;
          }
        }
      }
      return { blog: b, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const related = scored.slice(0, 3).map((s) => s.blog);

    return { relatedPosts: related, prevPost: prev, nextPost: next };
  }, [allBlogs, slug, post.id, post.category, tags]);

  const canonicalUrl = `https://qafnest.com/${language}/blog/${encodeURIComponent(slug)}`;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const shareOnWhatsApp = () => {
    if (typeof window !== "undefined") {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n${window.location.href}`)}`;
      window.open(url, "_blank");
    }
  };

  const shareOnTwitter = () => {
    if (typeof window !== "undefined") {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-[#06060B] text-white" : "bg-white text-gray-900"}`}>
      <Navbar />

      {/* Schema.org BlogPosting & BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": canonicalUrl,
              },
              headline: title,
              description: excerpt,
              image: image,
              datePublished: post.createdAt || post.date || "2026-11-12",
              dateModified: post.updatedAt || post.createdAt || post.date || "2026-11-12",
              author: {
                "@type": "Person",
                name: author,
                jobTitle: authorRole,
              },
              publisher: {
                "@type": "Organization",
                name: "QafNest",
                logo: {
                  "@type": "ImageObject",
                  url: "https://qafnest.com/logo.png",
                },
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: language === "ar" ? "الرئيسية" : "Home",
                  item: `https://qafnest.com/${language}`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: language === "ar" ? "المدونة" : "Blog",
                  item: `https://qafnest.com/${language}/blog`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: title,
                  item: canonicalUrl,
                },
              ],
            },
          ]),
        }}
      />

      <main className="pt-24 sm:pt-28 pb-20">
        {/* Breadcrumb & Navigation */}
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-4">
          <div className="flex items-center gap-2 text-xs text-muted mb-4">
            <Link href={localizePath("/", language)} className="hover:text-violet-500 transition">
              {language === "ar" ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <Link href={localizePath("/blog", language)} className="hover:text-violet-500 transition">
              {language === "ar" ? "المدونة" : "Blog"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <span className="text-violet-500 truncate max-w-[260px] sm:max-w-lg">{title}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                  isDarkTheme ? "text-gray-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {language === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{language === "ar" ? "العودة إلى المقالات" : "Back to Blog"}</span>
              </button>

              <span
                className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold border ${
                  isDarkTheme
                    ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
                    : "bg-violet-100 text-violet-700 border-violet-200"
                }`}
              >
                {catName}
              </span>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-violet-500" />
                <span>{language === "ar" ? "مشاركة:" : "Share:"}</span>
              </span>

              <button
                onClick={shareOnWhatsApp}
                title="Share on WhatsApp"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  isDarkTheme ? "bg-white/5 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-400" : "bg-white border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700"
                }`}
              >
                WhatsApp
              </button>

              <button
                onClick={shareOnTwitter}
                title="Share on X"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  isDarkTheme ? "bg-white/5 border-white/10 hover:bg-blue-500/20 hover:text-blue-400" : "bg-white border-gray-200 hover:bg-blue-50 hover:text-blue-700 text-gray-700"
                }`}
              >
                X / Twitter
              </button>

              <button
                onClick={handleCopyLink}
                title="Copy Article Link"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition inline-flex items-center gap-1 cursor-pointer ${
                  isDarkTheme ? "bg-white/5 border-white/10 hover:bg-violet-500/20 text-gray-300" : "bg-white border-gray-200 hover:bg-violet-50 text-gray-700"
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-violet-500" />}
                <span>{copiedLink ? (language === "ar" ? "تم النسخ" : "Copied!") : (language === "ar" ? "نسخ الرابط" : "Copy Link")}</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight mb-4">
            {title}
          </h1>

          {/* Excerpt */}
          <p className="text-base sm:text-lg lg:text-xl text-muted leading-relaxed mb-6 max-w-5xl">
            {excerpt}
          </p>

          {/* Author & Meta Row */}
          <div
            className={`flex flex-wrap items-center justify-between gap-4 py-4 border-y mb-8 ${
              isDarkTheme ? "border-purple-500/20" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm border ${
                  isDarkTheme
                    ? "bg-violet-600/30 text-violet-300 border-violet-500/30"
                    : "bg-violet-100 text-violet-700 border-violet-200"
                }`}
              >
                {author.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold">{author}</p>
                <p className="text-xs text-muted">{authorRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-violet-500" />
                {date}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-violet-500" />
                {readTime}
              </span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative w-full h-[260px] sm:h-[420px] lg:h-[520px] rounded-3xl overflow-hidden mb-10 shadow-2xl border border-purple-500/20">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Content Layout with Dynamic Table of Contents (Article Index) */}
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Body */}
          <div className="lg:col-span-8 min-w-0">
            {/* Inline Table of Contents for Mobile / Compact View */}
            {toc.length > 0 && (
              <div
                className={`mb-8 p-5 sm:p-6 rounded-2xl border shadow-sm transition-all ${
                  isDarkTheme ? "bg-[#0E0E1A] border-violet-500/20" : "bg-violet-50/50 border-violet-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setTocCollapsed(!tocCollapsed)}
                  className="w-full flex items-center justify-between gap-3 text-start cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 font-bold text-base sm:text-lg">
                    <ListOrdered className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    <span>{language === "ar" ? "فهرس المحتويات (جدول الأقسام)" : "Table of Contents (Article Index)"}</span>
                  </div>
                  {tocCollapsed ? <ChevronDown className="w-5 h-5 text-muted" /> : <ChevronUp className="w-5 h-5 text-muted" />}
                </button>

                {!tocCollapsed && (
                  <nav className="mt-4 pt-4 border-t border-violet-500/10 space-y-2">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`block text-xs sm:text-sm transition hover:text-violet-600 dark:hover:text-violet-400 ${
                          item.level === 3 ? "ps-5 text-muted" : "font-semibold text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        • {item.text}
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            )}

            {/* Render Article HTML Content */}
            <article
              dir={language === "ar" ? "rtl" : "ltr"}
              className={`space-y-6 text-base sm:text-[17px] leading-8 ${
                isDarkTheme ? "text-gray-300" : "text-slate-700"
              }`}
            >
              {Array.isArray(rawHtmlContent) ? (
                rawHtmlContent.map((paragraph, idx) => (
                  <p key={idx} className="leading-8">
                    {paragraph}
                  </p>
                ))
              ) : processedHtml ? (
                <div
                  className={
                    isDarkTheme
                      ? "prose prose-lg prose-invert max-w-none text-gray-200 leading-8 space-y-5 [&>h2]:text-2xl sm:[&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-8 [&>h3]:text-xl sm:[&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-violet-300 [&>h3]:mt-6 [&>p]:leading-8 [&>blockquote]:border-s-4 [&>blockquote]:border-violet-500 [&>blockquote]:ps-4 [&>blockquote]:italic [&>ul]:list-disc [&>ul]:ps-6 [&>ol]:list-decimal [&>ol]:ps-6"
                      : "prose prose-lg max-w-none text-slate-800 leading-8 space-y-5 [&>h2]:text-2xl sm:[&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-8 [&>h3]:text-xl sm:[&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-violet-700 [&>h3]:mt-6 [&>p]:leading-8 [&>blockquote]:border-s-4 [&>blockquote]:border-violet-500 [&>blockquote]:ps-4 [&>blockquote]:italic [&>ul]:list-disc [&>ul]:ps-6 [&>ol]:list-decimal [&>ol]:ps-6"
                  }
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(processedHtml) }}
                />
              ) : (
                <p>{excerpt}</p>
              )}
            </article>

            {/* Article Tags (Internal SEO Linking) */}
            {tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-purple-500/20 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted flex items-center gap-1 font-semibold">
                  <Tag className="w-3.5 h-3.5 text-violet-500" />
                  <span>{language === "ar" ? "الوسوم والكلمات الدلالية:" : "Tags & Keywords:"}</span>
                </span>
                {tags.map((tag, idx) => (
                  <Link
                    key={idx}
                    href={localizePath(`/blog?search=${encodeURIComponent(tag)}`, language)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                      isDarkTheme
                        ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-violet-600/30"
                        : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-violet-100 hover:text-violet-800"
                    }`}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Next / Previous Article Navigation */}
            {(prevPost || nextPost) && (
              <div className="mt-10 pt-8 border-t border-purple-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevPost ? (
                  <Link
                    href={localizePath(`/blog/${prevPost.slug}`, language)}
                    className={`p-4 rounded-2xl border transition group ${
                      isDarkTheme ? "bg-[#0E0E1A] border-white/10 hover:border-violet-500/50" : "bg-white border-gray-200 hover:border-violet-400 hover:shadow-md"
                    }`}
                  >
                    <div className="text-[11px] text-muted font-bold flex items-center gap-1 mb-1">
                      {language === "ar" ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                      <span>{language === "ar" ? "المقال السابق" : "Previous Article"}</span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                      {language === "ar" ? prevPost.titleAr : prevPost.titleEn}
                    </div>
                  </Link>
                ) : <div />}

                {nextPost ? (
                  <Link
                    href={localizePath(`/blog/${nextPost.slug}`, language)}
                    className={`p-4 rounded-2xl border transition group text-end ${
                      isDarkTheme ? "bg-[#0E0E1A] border-white/10 hover:border-violet-500/50" : "bg-white border-gray-200 hover:border-violet-400 hover:shadow-md"
                    }`}
                  >
                    <div className="text-[11px] text-muted font-bold flex items-center justify-end gap-1 mb-1">
                      <span>{language === "ar" ? "المقال التالي" : "Next Article"}</span>
                      {language === "ar" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-xs sm:text-sm font-bold line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                      {language === "ar" ? nextPost.titleAr : nextPost.titleEn}
                    </div>
                  </Link>
                ) : <div />}
              </div>
            )}
          </div>

          {/* Sticky Sidebar on Desktop */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Sticky Table of Contents on Desktop */}
            {toc.length > 0 && (
              <div
                className={`sticky top-28 p-6 rounded-2xl border shadow-sm hidden lg:block ${
                  isDarkTheme ? "bg-[#0E0E1A] border-violet-500/20" : "bg-white border-violet-100 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-4 pb-3 border-b border-violet-500/10">
                  <ListOrdered className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span>{language === "ar" ? "فهرس المقال" : "Article Index"}</span>
                </div>
                <nav className="space-y-2.5 max-h-[60vh] overflow-y-auto scrollbar-thin">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`block text-xs transition hover:text-violet-600 dark:hover:text-violet-400 ${
                        item.level === 3 ? "ps-4 text-muted" : "font-semibold text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      • {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </aside>
        </div>

        {/* RELATED / SUGGESTED POSTS SECTION (Internal Linking Engine) */}
        {relatedPosts.length > 0 && (
          <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 mt-16 pt-12 border-t border-purple-500/20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block mb-1">
                  {language === "ar" ? "مقالات ذات صلة" : "Related Posts"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
                  {language === "ar" ? "قد يعجبك أيضاً في هذه الوجهة" : "Recommended for You"}
                </h2>
              </div>
              <Link
                href={localizePath("/blog", language)}
                className="text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
              >
                <span>{language === "ar" ? "عرض جميع المقالات" : "View all articles"}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relBlog) => {
                const relTitle = language === "ar" ? relBlog.titleAr : relBlog.titleEn;
                const relExcerpt = language === "ar" ? relBlog.excerptAr : relBlog.excerptEn;
                const relCat = language === "ar" ? (relBlog.categoryNameAr || "شاليهات") : (relBlog.categoryNameEn || "Chalets");
                const relImage = relBlog.coverImage || relBlog.image || image;
                const relDate = relBlog.date || relBlog.createdAt?.split("T")[0] || "2026-11-12";
                const relTime = language === "ar" ? (relBlog.readTimeAr || "٤ دقائق") : (relBlog.readTimeEn || "4 min");

                return (
                  <Link
                    key={relBlog.id}
                    href={localizePath(`/blog/${relBlog.slug}`, language)}
                    className={`rounded-2xl overflow-hidden border transition group flex flex-col ${
                      isDarkTheme
                        ? "bg-[#0E0E1A] border-white/10 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-950/20"
                        : "bg-white border-gray-200 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100"
                    }`}
                  >
                    <div className="relative w-full h-44 overflow-hidden bg-slate-900">
                      <Image
                        src={relImage}
                        alt={relTitle}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                      />
                      <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {relCat}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 text-[11px] text-muted mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-violet-500" />
                            {relDate}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-violet-500" />
                            {relTime}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition mb-2">
                          {relTitle}
                        </h3>
                        <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                          {relExcerpt}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-purple-500/10 flex items-center justify-between text-xs font-semibold text-violet-600 dark:text-violet-400">
                        <span>{language === "ar" ? "قراءة المقال" : "Read Article"}</span>
                        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Explore Related Properties Callout */}
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 mt-14">
          <div
            className={`rounded-3xl p-6 sm:p-10 border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 ${
              isDarkTheme
                ? "bg-gradient-to-r from-violet-950/60 via-purple-950/40 to-[#0F101A] border-violet-500/30"
                : "bg-gradient-to-r from-violet-50 via-purple-50/70 to-fuchsia-50/50 border-violet-200"
            }`}
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>{language === "ar" ? "إقامات مرخصة ومميزة" : "Verified Premium Stays"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display">
                {language === "ar"
                  ? "ابحث عن وحدتك التالية في هذه الوجهة"
                  : "Find stays matching this experience"}
              </h3>
              <p className="text-xs sm:text-sm text-muted mt-1">
                {language === "ar"
                  ? "احجز شاليهات، مزارع، وفلل بأسعار مضمونة ودخول ذكي مشفر."
                  : "Book chalets, farms, and villas with instant confirmation and smart locks."}
              </p>
            </div>

            <Link
              href={localizePath(`/search?type=${post.category === "guides" ? "chalet" : (post.category || "chalet")}`, language)}
              className="shrink-0 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs sm:text-sm shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <span>{language === "ar" ? "استعراض العقارات" : "Browse Stays"}</span>
              <Compass className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
