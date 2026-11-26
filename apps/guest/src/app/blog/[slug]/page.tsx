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
  Copy,
  Check,
  CheckCircle2,
  ListOrdered,
  Tag,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Waves,
  Building2,
  ShieldCheck,
  Phone,
  Mail,
} from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { localizePath } from "@/lib/localization/localeHelper";

function safeSanitizeRichHtml(html: string): string {
  if (typeof html !== "string") return "";
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "");
}
import {
  BLOG_POST_DETAILS,
  getDefaultBlogPost,
} from "../data/blogDetailPosts";
import { BLOG_POSTS } from "../data/blogPosts";

function getBlogShortTitle(b: any, lang: "ar" | "en"): string {
  const isAr = lang === "ar";
  const slug = String(b.slug || "").toLowerCase();

  if (slug.includes("obhur") || slug.includes("beachfront") || slug.includes("jeddah")) {
    return isAr ? "فلل أبحر الشاطئية" : "Obhur Beach Villas";
  }
  if (slug.includes("riyadh") || slug.includes("investment")) {
    return isAr ? "دليل شاليهات الرياض" : "Riyadh Chalet Guide";
  }
  if (slug.includes("kharj") || slug.includes("farm")) {
    return isAr ? "مزارع الخرج العائلية" : "Al-Kharj Farm Retreats";
  }
  if (slug.includes("alula") || slug.includes("dome")) {
    return isAr ? "قباب العلا الصحراوية" : "AlUla Desert Domes";
  }
  if (slug.includes("licens") || slug.includes("tourism")) {
    return isAr ? "دليل تراخيص السياحة" : "Tourism Licensing Guide";
  }

  const title = isAr ? (b.titleAr || b.titleEn) : (b.titleEn || b.titleAr);
  if (!title) return isAr ? "مقال مميز" : "Featured Article";
  return title.length > 26 ? `${title.slice(0, 26)}...` : title;
}

function getBlogIcon(category: string = "", idx: number = 0) {
  const cat = String(category || "").toLowerCase();
  if (cat.includes("beach") || cat.includes("villa") || idx === 0) return Waves;
  if (cat.includes("invest") || cat.includes("chalet") || idx === 1) return Building2;
  if (cat.includes("farm") || idx === 2) return Sparkles;
  if (cat.includes("camp") || cat.includes("alula") || idx === 3) return Compass;
  if (cat.includes("guide") || cat.includes("license") || idx === 4) return ShieldCheck;
  return BookOpen;
}

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

    let newAttrs = attrs.replace(/\bid=["'][^"']*["']/gi, "");
    if (/class=["']/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/class=["']([^"']*)["']/i, 'class="$1 scroll-mt-32"');
    } else {
      newAttrs = ` class="scroll-mt-32"${newAttrs}`;
    }

    return `<${tag} id="${uniqueId}"${newAttrs}>${innerHtml}</${tag}>`;
  });

  return { processedHtml, toc };
}

// Minimal Brand SVG Icons for Share Buttons
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function SnapchatIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.004 2c-3.15 0-5.46 2.228-5.545 5.163-.03 1.05.295 2.13.528 2.91.13.435.035.61-.17.845-.31.348-.82.68-1.455.94-.365.15-.53.4-.485.735.065.485.57.77 1.115.845.69.095 1.4-.07 2.015-.41.355-.195.635-.05.74.225.335.88.945 1.54 1.8 1.94.22.1.33.24.28.49-.075.375-.54.915-1.47 1.405-.445.235-.555.57-.34.93.22.37.66.52 1.15.42.66-.135 1.3-.39 1.85-.75.29-.19.53-.16.7.07.39.52 1.07.96 1.84.96.765 0 1.445-.44 1.835-.96.17-.23.41-.26.7-.07.55.36 1.19.615 1.85.75.49.1.93-.05 1.15-.42.215-.36.105-.695-.34-.93-.93-.49-1.395-1.03-1.47-1.405-.05-.25.06-.39.28-.49.855-.4 1.465-1.06 1.8-1.94.105-.275.385-.42.74-.225.615.34 1.325.505 2.015.41.545-.075 1.05-.36 1.115-.845.045-.335-.12-.585-.485-.735-.635-.26-1.145-.592-1.455-.94-.205-.235-.3-.41-.17-.845.233-.78.558-1.86.528-2.91C17.464 4.228 15.154 2 12.004 2z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export default function BlogPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useApp();

  const slug = String(params?.slug || "");
  const [cmsPost, setCmsPost] = useState<any | null>(null);
  const [allBlogs, setAllBlogs] = useState<any[]>(BLOG_POSTS);
  const [copiedLink, setCopiedLink] = useState(false);
  const [tocCollapsed, setTocCollapsed] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");

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
        if (Array.isArray(data) && data.length > 0) {
          const published = data.filter((b) => b.status === "published");
          if (published.length > 0) {
            // Keep stable order with Obhur/Jeddah first
            const sorted = [...published].sort((a, b) => {
              const aIsObhur = a.slug?.includes("obhur") || a.slug?.includes("jeddah");
              const bIsObhur = b.slug?.includes("obhur") || b.slug?.includes("jeddah");
              if (aIsObhur && !bIsObhur) return -1;
              if (!aIsObhur && bIsObhur) return 1;
              return 0;
            });
            setAllBlogs(sorted);
          }
        }
      })
      .catch(() => {});
  }, []);

  const defaultPost = useMemo(() => {
    return BLOG_POST_DETAILS[slug] || getDefaultBlogPost(slug);
  }, [slug]);

  const post = useMemo(() => {
    if (!cmsPost) return defaultPost;
    return {
      ...defaultPost,
      ...cmsPost,
      keyFeatures:
        Array.isArray(cmsPost.keyFeatures) && cmsPost.keyFeatures.length > 0
          ? cmsPost.keyFeatures
          : defaultPost.keyFeatures,
      contentHtmlEn: cmsPost.contentHtmlEn || defaultPost.contentHtmlEn,
      contentHtmlAr: cmsPost.contentHtmlAr || defaultPost.contentHtmlAr,
      linkedPropertyId: cmsPost.linkedPropertyId || defaultPost.linkedPropertyId,
      linkedPropertyTitle: cmsPost.linkedPropertyTitle || defaultPost.linkedPropertyTitle,
    };
  }, [cmsPost, defaultPost]);

  const title = language === "ar" ? post.titleAr : post.titleEn;
  const excerpt = language === "ar" ? post.excerptAr : post.excerptEn;
  const catName = language === "ar" ? (post.categoryNameAr || "شاليهات") : (post.categoryNameEn || "Chalets");
  const authorRole = language === "ar" ? (post.authorRoleAr || "خبير ضيافة") : (post.authorRoleEn || "Hospitality Specialist");
  const readTime = language === "ar" ? (post.readTimeAr || "٤ دقائق") : (post.readTimeEn || "4 min read");
  const author = post.author || "QafNest";
  const date = post.date || post.createdAt?.split("T")[0] || "2026-11-12";
  const image = post.coverImage || post.image || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80";
  const tags: string[] = useMemo(() => (Array.isArray(post.tags) ? post.tags : []), [post.tags]);

  // Content processing: Table of Contents + HTML injection
  const rawHtmlContent = language === "ar" ? (post.contentHtmlAr || post.contentAr) : (post.contentHtmlEn || post.contentEn);
  const { processedHtml, toc } = useMemo(() => {
    if (typeof rawHtmlContent === "string") {
      return parseTableOfContentsAndInjectIds(rawHtmlContent);
    }
    return { processedHtml: "", toc: [] };
  }, [rawHtmlContent]);

  // Active Heading tracking via IntersectionObserver
  useEffect(() => {
    if (toc.length === 0) return;
    if (!activeHeadingId && toc[0]) {
      setActiveHeadingId(toc[0].id);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible?.target?.id) {
          setActiveHeadingId(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: 0,
      }
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc, activeHeadingId]);

  const handleScrollToHeading = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveHeadingId(id);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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

  // Social Share Handlers
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
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const shareOnFacebook = () => {
    if (typeof window !== "undefined") {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const shareOnSnapchat = () => {
    if (typeof window !== "undefined") {
      const url = `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(window.location.href)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const shareOnInstagram = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#07060A] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#4F2396]/20 scroll-smooth">
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
          ])
            .replace(/</g, "\\u003c")
            .replace(/\u2028/g, "\\u2028")
            .replace(/\u2029/g, "\\u2029"),
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20">
        {/* Breadcrumb & Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
            <Link href={localizePath("/", language)} className="hover:text-[#4F2396] dark:hover:text-violet-300 transition">
              {language === "ar" ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 text-slate-400" />
            <Link href={localizePath("/blog", language)} className="hover:text-[#4F2396] dark:hover:text-violet-300 transition">
              {language === "ar" ? "المدونة" : "Blog"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 text-slate-400" />
            <span className="text-[#4F2396] dark:text-violet-300 font-medium truncate max-w-[260px] sm:max-w-lg">
              {title}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                {language === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{language === "ar" ? "العودة إلى المقالات" : "Back to Blog"}</span>
              </button>

              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                {catName}
              </span>
            </div>

            {/* Social Share Buttons: WhatsApp, Facebook, Snapchat, Instagram, Copy Link Icon */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 me-1 hidden sm:inline">
                {language === "ar" ? "مشاركة:" : "Share:"}
              </span>

              {/* WhatsApp */}
              <button
                onClick={shareOnWhatsApp}
                title="Share on WhatsApp"
                aria-label="Share on WhatsApp"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101A] text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer shadow-xs"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                onClick={shareOnFacebook}
                title="Share on Facebook"
                aria-label="Share on Facebook"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101A] text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer shadow-xs"
              >
                <FacebookIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden md:inline">Facebook</span>
              </button>

              {/* Snapchat */}
              <button
                onClick={shareOnSnapchat}
                title="Share on Snapchat"
                aria-label="Share on Snapchat"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101A] text-slate-700 dark:text-slate-300 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer shadow-xs"
              >
                <SnapchatIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="hidden md:inline">Snapchat</span>
              </button>

              {/* Instagram */}
              <button
                onClick={shareOnInstagram}
                title="Share on Instagram (Copy & Open)"
                aria-label="Share on Instagram"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101A] text-slate-700 dark:text-slate-300 hover:border-pink-500 hover:text-pink-600 dark:hover:text-pink-400 transition cursor-pointer shadow-xs"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                <span className="hidden md:inline">Instagram</span>
              </button>

              {/* Copy Link Icon Button only */}
              <button
                onClick={handleCopyLink}
                title={copiedLink ? (language === "ar" ? "تم نسخ الرابط!" : "Copied!") : (language === "ar" ? "نسخ الرابط" : "Copy link")}
                aria-label={copiedLink ? "Link copied" : "Copy link"}
                className="p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#12101A] hover:border-slate-300 dark:hover:border-white/20 transition cursor-pointer shadow-xs"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                )}
              </button>
            </div>
          </div>

          {/* Article Header */}
          <header className="border-b border-slate-200/80 dark:border-white/10 pb-8 mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.25] mb-4">
              {title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl mb-6">
              {excerpt}
            </p>

            {/* Author & Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/10 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-[#4F2396] dark:text-violet-300">
                  {author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{author}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{authorRole}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {date}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {readTime}
                </span>
              </div>
            </div>
          </header>

          {/* Hero Image */}
          <div className="relative w-full h-[260px] sm:h-[400px] lg:h-[480px] rounded-2xl overflow-hidden mb-10 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Master Layout: 2-column on desktop (Content + Sticky Table of Contents) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-8 xl:gap-12 items-start">
          {/* Main Article Body */}
          <div className="min-w-0">
            {/* Inline Table of Contents for Mobile View */}
            <div className="lg:hidden mb-8 p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] shadow-xs">
              <button
                type="button"
                onClick={() => setTocCollapsed(!tocCollapsed)}
                className="w-full flex items-center justify-between gap-3 text-start cursor-pointer"
              >
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  <BookOpen className="w-4 h-4 text-[#4F2396] dark:text-violet-300" />
                  <span>{language === "ar" ? "فهرس المقالات" : "Articles Index"}</span>
                </div>
                {tocCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </button>

              {!tocCollapsed && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 space-y-1">
                  {allBlogs.map((b, idx) => {
                    const isCurrent = b.slug === post.slug || b.id === post.id;
                    const Icon = getBlogIcon(b.category, idx);
                    const shortTitle = getBlogShortTitle(b, language);
                    return (
                      <Link
                        key={b.slug || idx}
                        href={localizePath(`/blog/${b.slug}`, language)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          isCurrent
                            ? "bg-[#4F2396] text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? "text-white" : "text-slate-400"}`} />
                          <span className="truncate">{shortTitle}</span>
                        </div>
                        <span className={`text-[10px] font-mono shrink-0 ${isCurrent ? "text-white/80" : "text-slate-400"}`}>
                          0{idx + 1}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Article Container matching Policy / About style */}
            <article className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-6 sm:p-10 shadow-xs">
              {/* In-Article Sections Bar (Subtle & compact pills, keeps sidebar clean and compact) */}
              {toc.length > 0 && (
                <nav aria-label="Table of contents" className="mb-8 pb-5 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    <ListOrdered className="w-3.5 h-3.5 text-[#4F2396] dark:text-violet-300" />
                    <span>{language === "ar" ? "أقسام هذا المقال" : "In This Article"}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {toc.map((item) => {
                      const isActive = activeHeadingId === item.id;
                      return (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => handleScrollToHeading(item.id, e)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            isActive
                              ? "bg-[#4F2396] text-white shadow-xs"
                              : "bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                          } ${item.level === 3 ? "text-[11px] ps-2.5" : ""}`}
                        >
                          {item.text}
                        </a>
                      );
                    })}
                  </div>
                </nav>
              )}
              {/* Key Highlights / Features Box */}
              {post.keyFeatures && post.keyFeatures.length > 0 && (
                <div className="mb-8 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-[#4F2396] dark:text-violet-300" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {language === "ar" ? "أبرز مميزات ومواصفات الإقامة" : "Key Highlights of this Stay"}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {post.keyFeatures.map((feat: any, idx: number) => {
                      const fTitle = language === "ar" ? feat.titleAr : feat.titleEn;
                      const fDesc = language === "ar" ? (feat.descAr || "") : (feat.descEn || "");
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101A] shadow-xs"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {fTitle}
                            </h4>
                          </div>
                          {fDesc && (
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              {fDesc}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div
                dir={language === "ar" ? "rtl" : "ltr"}
                className="prose prose-slate dark:prose-invert max-w-none text-[15.5px] sm:text-[17px] leading-[1.85] sm:leading-[1.95] text-slate-700 dark:text-slate-200 font-normal [&>h2]:text-2xl [&>h2]:sm:text-3xl [&>h2]:font-bold [&>h2]:text-slate-900 dark:[&>h2]:text-white [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:sm:text-2xl [&>h3]:font-bold [&>h3]:text-slate-900 dark:[&>h3]:text-white [&>h3]:mt-8 [&>h3]:mb-3 [&>p]:mb-5 [&>ul]:mb-5 [&>li]:leading-relaxed [&>blockquote]:border-s-4 [&>blockquote]:border-[#4F2396] [&>blockquote]:ps-4 [&>blockquote]:italic [&>blockquote]:text-slate-600 dark:[&>blockquote]:text-slate-300"
              >
                {Array.isArray(rawHtmlContent) ? (
                  rawHtmlContent.map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))
                ) : processedHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: safeSanitizeRichHtml(processedHtml) }} />
                ) : (
                  <p>{excerpt}</p>
                )}
              </div>

              {/* Article Tags */}
              {tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold me-1">
                    <Tag className="w-3.5 h-3.5 text-[#4F2396] dark:text-violet-300" />
                    <span>{language === "ar" ? "الوسوم:" : "Tags:"}</span>
                  </span>
                  {tags.map((tag, idx) => (
                    <Link
                      key={idx}
                      href={localizePath(`/blog?search=${encodeURIComponent(tag)}`, language)}
                      className="px-3 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 transition"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </article>

            {/* Next / Previous Article Navigation */}
            {(prevPost || nextPost) && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevPost ? (
                  <Link
                    href={localizePath(`/blog/${prevPost.slug}`, language)}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101A] hover:border-slate-300 dark:hover:border-white/20 transition group shadow-xs"
                  >
                    <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mb-1.5">
                      {language === "ar" ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                      <span>{language === "ar" ? "المقال السابق" : "Previous Article"}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#4F2396] dark:group-hover:text-violet-300 transition">
                      {language === "ar" ? prevPost.titleAr : prevPost.titleEn}
                    </div>
                  </Link>
                ) : <div />}

                {nextPost ? (
                  <Link
                    href={localizePath(`/blog/${nextPost.slug}`, language)}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101A] hover:border-slate-300 dark:hover:border-white/20 transition group text-end shadow-xs"
                  >
                    <div className="text-[11px] text-slate-400 font-bold flex items-center justify-end gap-1 mb-1.5">
                      <span>{language === "ar" ? "المقال التالي" : "Next Article"}</span>
                      {language === "ar" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#4F2396] dark:group-hover:text-violet-300 transition">
                      {language === "ar" ? nextPost.titleAr : nextPost.titleEn}
                    </div>
                  </Link>
                ) : <div />}
              </div>
            )}
          </div>

          {/* Sticky Sidebar on Desktop: 100% Identical to Policy & About Page */}
          <aside className="hidden lg:block lg:sticky lg:top-28 space-y-4">
            {/* Primary Articles Index Card */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/10">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === "ar" ? "فهرس المقالات" : "Articles Index"}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {allBlogs.length} {language === "ar" ? "مقالات" : "Articles"}
                </span>
              </div>

              <nav aria-label={language === "ar" ? "فهرس المقالات" : "Articles"} className="space-y-1">
                {allBlogs.map((b, idx) => {
                  const isCurrent = b.slug === post.slug || b.id === post.id;
                  const Icon = getBlogIcon(b.category, idx);
                  const shortTitle = getBlogShortTitle(b, language);
                  const fullTitle = language === "ar" ? b.titleAr : b.titleEn;

                  return (
                    <Link
                      key={b.slug || idx}
                      href={localizePath(`/blog/${b.slug}`, language)}
                      title={fullTitle}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition group cursor-pointer ${
                        isCurrent
                          ? "bg-[#4F2396] text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isCurrent
                              ? "text-white"
                              : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                          }`}
                        />
                        <span className="truncate">{shortTitle}</span>
                      </div>
                      <span
                        className={`text-[11px] font-mono shrink-0 transition-colors ${
                          isCurrent ? "text-white/80" : "text-slate-400"
                        }`}
                      >
                        0{idx + 1}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* 24/7 Hospitality & Support Box (Exact parity with Policy & About Page) */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] p-4 text-xs space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                <Phone className="w-4 h-4 text-[#4F2396] dark:text-violet-300" />
                <span>{language === "ar" ? "خدمة العناية بالنزلاء" : "Hospitality Concierge"}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === "ar"
                  ? "فريق خدمة النزلاء في قاف نست متاح على مدار الساعة للإجابة على جميع استفساراتكم ومساعدتكم في اختيار إقامتكم."
                  : "Our Saudi hospitality team is available 24/7 to answer your questions and assist with bookings."}
              </p>
              <div className="pt-1 flex flex-col gap-1.5 font-semibold">
                <a
                  href="tel:+966576707709"
                  className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:text-[#4F2396] transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === "ar" ? "الهاتف المباشر:" : "Phone / Support:"}</span>
                  </span>
                  <span dir="ltr">+966 57 670 7709</span>
                </a>
                <a
                  href="mailto:support@qafnest.com"
                  className="inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:text-[#4F2396] transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === "ar" ? "البريد الإلكتروني:" : "Direct Email:"}</span>
                  </span>
                  <span>support@qafnest.com</span>
                </a>
              </div>
            </div>
          </aside>
        </div>

        {/* Minimal Unslop Callout: Find stays matching this experience */}
        <section className="mt-14">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101A] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#4F2396] dark:text-violet-300" />
                <span>{language === "ar" ? "إقامات مرخصة ومميزة" : "Verified Premium Stays"}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {language === "ar"
                  ? "ابحث عن وحدتك التالية في هذه الوجهة"
                  : "Find stays matching this experience"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {language === "ar"
                  ? "احجز شاليهات، مزارع، وفلل بأسعار مضمونة ودخول ذكي مشفر معتمد من وزارة السياحة."
                  : "Book chalets, farms, and villas with instant confirmation and smart locks licensed under the Ministry of Tourism."}
              </p>
            </div>

            <Link
              href={
                post.linkedPropertyId
                  ? localizePath(`/property/${post.linkedPropertyId}`, language)
                  : localizePath(`/search?type=${post.category === "guides" ? "chalet" : (post.category || "chalet")}`, language)
              }
              className="shrink-0 px-6 py-3 rounded-xl bg-[#4F2396] hover:bg-[#3d1979] text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <span>
                {post.linkedPropertyId
                  ? (language === "ar" ? "احجز هذا العقار مباشرة" : "Book This Property")
                  : (language === "ar" ? "استعراض العقارات" : "Browse Stays")}
              </span>
              <Compass className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* RELATED / SUGGESTED POSTS SECTION */}
        {relatedPosts.length > 0 && (
          <section className="mt-14 pt-10 border-t border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-[#4F2396] dark:text-violet-300 uppercase tracking-wider block mb-1">
                  {language === "ar" ? "مقالات ذات صلة" : "Related Posts"}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {language === "ar" ? "قد يعجبك أيضاً في هذه الوجهة" : "Recommended for You"}
                </h2>
              </div>
              <Link
                href={localizePath("/blog", language)}
                className="text-xs sm:text-sm font-semibold text-[#4F2396] dark:text-violet-300 hover:underline flex items-center gap-1"
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
                    className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101A] hover:border-slate-300 dark:hover:border-white/20 transition group flex flex-col shadow-xs"
                  >
                    <div className="relative w-full h-44 overflow-hidden bg-slate-100 dark:bg-slate-900">
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
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {relDate}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {relTime}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 group-hover:text-[#4F2396] dark:group-hover:text-violet-300 transition mb-2">
                          {relTitle}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {relExcerpt}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-[#4F2396] dark:text-violet-300">
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
      </main>

      <Footer />
    </div>
  );
}
