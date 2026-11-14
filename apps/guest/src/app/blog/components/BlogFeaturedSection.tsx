"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Calendar, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { localizePath, type Locale } from "@/lib/localization/localeHelper";
import { BlogPost } from "../data/blogPosts";

interface BlogFeaturedSectionProps {
  posts: BlogPost[];
  language: string;
  isDarkTheme: boolean;
}

export default function BlogFeaturedSection({
  posts,
  language,
  isDarkTheme,
}: BlogFeaturedSectionProps) {
  const activeLocale: Locale = language === "ar" ? "ar" : "en";
  const ArrowIcon = language === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-fuchsia-400" />
        <h2 className="text-xl sm:text-2xl font-bold font-display">
          {language === "ar" ? "مقالات مختارة" : "Featured Stories"}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {posts.map((post) => {
          const title = language === "ar" ? post.titleAr : post.titleEn;
          const excerpt = language === "ar" ? post.excerptAr : post.excerptEn;
          const catName = language === "ar" ? post.categoryNameAr : post.categoryNameEn;
          const readTime = language === "ar" ? post.readTimeAr : post.readTimeEn;

          return (
            <article
              key={post.id}
              className={`group relative rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                isDarkTheme
                  ? "bg-[#0E0E1A] border-white/10 hover:border-violet-500/40 shadow-xl"
                  : "bg-white border-purple-100 hover:border-purple-300 shadow-md"
              }`}
            >
              <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                <Image
                  src={post.image}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600/90 text-white backdrop-blur-md">
                    {catName}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 rtl:left-4 rtl:right-4 text-white">
                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.date}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {readTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col justify-between flex-1">
                <div>
                  <Link href={localizePath(`/blog/${post.slug}`, activeLocale)}>
                    <h3 className="text-lg sm:text-xl font-bold font-display group-hover:text-fuchsia-400 transition-colors line-clamp-2">
                      {title}
                    </h3>
                  </Link>
                  <p className="mt-2 text-xs sm:text-sm text-muted line-clamp-3 leading-relaxed">
                    {excerpt}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-purple-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-violet-600/30 text-violet-300 font-bold text-xs flex items-center justify-center">
                      {post.author.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold">{post.author}</span>
                  </div>

                  <Link
                    href={localizePath(`/search?type=${post.category === "guides" ? "chalet" : post.category}`, activeLocale)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 group-hover:text-fuchsia-400 transition-colors"
                  >
                    <span>{language === "ar" ? "استكشف العقارات" : "Explore Stays"}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

