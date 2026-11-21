"use client";

import { useState, useEffect } from "react";
import { Compass } from "lucide-react";
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
          if (data.length > 0) {
            // Adapt CMS shared posts to BlogPost shape
            const adapted: BlogPost[] = data.map((b) => ({
              id: b.id,
              slug: b.slug,
              titleEn: b.titleEn,
              titleAr: b.titleAr,
              excerptEn: b.excerptEn,
              excerptAr: b.excerptAr,
              category: b.category,
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
            }));
            setPosts(adapted);
          } else {
            setPosts([]);
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
    <div
      className={`min-h-screen ${
        isDarkTheme ? "bg-[#06060B] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20">
        {/* Hero Header with Search Bar */}
        <BlogHeroHeader
          language={language}
          isDarkTheme={isDarkTheme}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Category Filter Pills */}
        <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 py-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {BLOG_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const label = language === "ar" ? cat.nameAr : cat.nameEn;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                      : isDarkTheme
                      ? "bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/5"
                      : "bg-white text-gray-700 hover:text-purple-900 hover:bg-purple-50 border border-gray-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Featured Posts */}
        {selectedCategory === "all" && !searchQuery && featuredPosts.length > 0 && (
          <BlogFeaturedSection
            posts={featuredPosts}
            language={language}
            isDarkTheme={isDarkTheme}
          />
        )}

        {/* All Posts Grid */}
        <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-display">
              {language === "ar" ? "أحدث المقالات" : "Latest Articles"}
            </h2>
            <span className="text-xs text-muted">
              {filteredPosts.length}{" "}
              {language === "ar" ? "مقال متوفر" : "articles"}
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                isDarkTheme ? "bg-[#0E0E1A] border-white/10" : "bg-white border-purple-100"
              }`}
            >
              <Compass className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold text-muted">
                {language === "ar"
                  ? "لم يتم العثور على مقالات مطابقة لبحثك."
                  : "No articles matched your search."}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white cursor-pointer"
              >
                {language === "ar" ? "عرض جميع المقالات" : "View All Articles"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
