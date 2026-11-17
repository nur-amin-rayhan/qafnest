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

export default function BlogPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language, isDarkTheme } = useApp();

  const slug = String(params?.slug || "");
  const [cmsPost, setCmsPost] = useState<any | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/cms/blogs?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.slug) {
          setCmsPost(data);
        }
      })
      .catch(() => {});
  }, [slug]);

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

  // Content can be HTML string from CMS (contentHtmlAr/contentHtmlEn) or array of strings from static details
  const htmlContent = language === "ar" ? (post.contentHtmlAr || post.contentAr) : (post.contentHtmlEn || post.contentEn);

  return (
    <div className={`min-h-screen ${isDarkTheme ? "bg-[#06060B] text-white" : "bg-white text-gray-900"}`}>
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20">
        {/* Breadcrumb, Header & Hero Image — Full Site Width */}
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-6">
          <div className="flex items-center gap-2 text-xs text-muted mb-5">
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

          <div className="flex flex-wrap items-center gap-3 mb-5">
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

        {/* Article Body: Full Site Width */}
        <article
          dir={language === "ar" ? "rtl" : "ltr"}
          className={`max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 space-y-6 text-base sm:text-[17px] leading-8 ${
            isDarkTheme ? "text-gray-300" : "text-slate-700"
          }`}
        >
          {Array.isArray(htmlContent) ? (
            htmlContent.map((paragraph, idx) => (
              <p key={idx} className="leading-8">
                {paragraph}
              </p>
            ))
          ) : typeof htmlContent === "string" ? (
            <div
              className={
                isDarkTheme
                  ? "prose prose-lg prose-invert max-w-none text-gray-200 leading-8 space-y-5 [&>h2]:text-2xl sm:[&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-8 [&>h3]:text-xl sm:[&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-violet-300 [&>h3]:mt-6 [&>p]:leading-8 [&>blockquote]:border-s-4 [&>blockquote]:border-violet-500 [&>blockquote]:ps-4 [&>blockquote]:italic [&>ul]:list-disc [&>ul]:ps-6 [&>ol]:list-decimal [&>ol]:ps-6"
                  : "prose prose-lg max-w-none text-slate-800 leading-8 space-y-5 [&>h2]:text-2xl sm:[&>h2]:text-3xl [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:mt-8 [&>h3]:text-xl sm:[&>h3]:text-2xl [&>h3]:font-bold [&>h3]:text-violet-700 [&>h3]:mt-6 [&>p]:leading-8 [&>blockquote]:border-s-4 [&>blockquote]:border-violet-500 [&>blockquote]:ps-4 [&>blockquote]:italic [&>ul]:list-disc [&>ul]:ps-6 [&>ol]:list-decimal [&>ol]:ps-6"
              }
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(htmlContent) }}
            />
          ) : (
            <p>{excerpt}</p>
          )}
        </article>

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
