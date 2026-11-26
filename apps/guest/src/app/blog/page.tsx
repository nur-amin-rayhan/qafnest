"use client";

import { useState, useEffect } from "react";
import { Compass, BookOpen } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useApp } from "@/context/AppContext";
import { BLOG_POSTS, BLOG_CATEGORIES, type BlogPost } from "./data/blogPosts";
import BlogHeroHeader from "./components/BlogHeroHeader";
import BlogFeaturedSection from "./components/BlogFeaturedSection";
import BlogArticleCard from "./components/BlogArticleCard";
import BlogHostCtaBanner from "./components/BlogHostCtaBanner";

export default function BlogPage() {
  const { language, isDarkTheme } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);

  useEffect(() => {
    fetch("/api/cms/blogs")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          const published = data.filter((b) => b && b.status !== "draft");
          if (published.length > 0) {
            // Adapt CMS shared posts to BlogPost shape
            const adapted: BlogPost[] = published.map((b) => {
              const rawCat = String(b.category || "guides").toLowerCase();
              const mappedCat =
                rawCat === "host-tips"
                  ? "guides"
                  : rawCat.endsWith("s")
                  ? rawCat
                  : `${rawCat}s`;

              return {
                id: b.id,
                slug: b.slug,
                titleEn: b.titleEn,
                titleAr: b.titleAr,
                excerptEn: b.excerptEn,
                excerptAr: b.excerptAr,
                category: mappedCat as BlogPost["category"],
                categoryNameEn: b.categoryNameEn || "General",
                categoryNameAr: b.categoryNameAr || "عام",
                readTimeEn: b.readTimeEn || "4 min",
                readTimeAr: b.readTimeAr || "٤ دقائق",
                date: b.date || b.createdAt?.split("T")[0] || "2026-11-12",
                image: b.coverImage || b.image,
                author: b.author || "QafNest",
                authorRoleEn: b.authorRoleEn || "Specialist",
                authorRoleAr: b.authorRoleAr || "مختص",
                featured: Boolean(b.featured),
              };
            });
            setPosts(adapted);
          }
        }
      })
      .catch(() => {});
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      post.titleEn.toLowerCase().includes(q) ||
      post.titleAr.includes(q) ||
      post.excerptEn.toLowerCase().includes(q) ||
      post.excerptAr.includes(q);
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = posts.filter((p) => p.featured);

  return (
    <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#07060A] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#4F2396]/20 scroll-smooth">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20">
        {/* Editorial Hero Header with Search Bar */}
        <BlogHeroHeader
          language={language}
          isDarkTheme={isDarkTheme}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectTag={(tag) => setSearchQuery(tag)}
        />

        {/* Category Filter Navigation */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {BLOG_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const label = language === "ar" ? cat.nameAr : cat.nameEn;
              const count =
                cat.id === "all"
                  ? posts.length
                  : posts.filter((p) => p.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-xs ${
                    isActive
                      ? "bg-[#4F2396] text-white shadow-xs"
                      : "bg-white dark:bg-[#12101A] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 border border-slate-200/80 dark:border-white/10"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-white/5 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Featured Posts (Only when viewing all categories with no search query) */}
        {selectedCategory === "all" && !searchQuery && featuredPosts.length > 0 && (
          <BlogFeaturedSection
            posts={featuredPosts}
            language={language}
            isDarkTheme={isDarkTheme}
          />
        )}

        {/* All Articles Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#4F2396] dark:text-violet-300" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {language === "ar" ? "أحدث المقالات والأدلة" : "Latest Articles & Guides"}
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {filteredPosts.length}{" "}
              {language === "ar" ? "مقال متوفر" : "articles"}
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101A] shadow-xs">
              <Compass className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {language === "ar"
                  ? "لم يتم العثور على مقالات مطابقة لبحثك."
                  : "No articles matched your search."}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-[#4F2396] hover:bg-[#3d1979] text-white cursor-pointer transition shadow-xs"
              >
                {language === "ar" ? "عرض جميع المقالات" : "View All Articles"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredPosts.map((post) => (
                <BlogArticleCard
                  key={post.id}
                  post={post}
                  language={language}
                  isDarkTheme={isDarkTheme}
                />
              ))}
            </div>
          )}
        </section>

        {/* Host CTA Banner */}
        <BlogHostCtaBanner language={language} />
      </main>

      <Footer />
    </div>
  );
}
