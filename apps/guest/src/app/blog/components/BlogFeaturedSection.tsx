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
}: BlogFeaturedSectionProps) {
  const activeLocale: Locale = language === "ar" ? "ar" : "en";
  const ArrowIcon = language === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-200/80 dark:border-white/10">
        <Sparkles className="w-4 h-4 text-[#4F2396] dark:text-violet-300" />
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          {language === "ar" ? "مقالات مختارة" : "Featured Stories"}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {posts.map((post) => {
          const title = language === "ar" ? post.titleAr : post.titleEn;
          const excerpt = language === "ar" ? post.excerptAr : post.excerptEn;
          const catName = language === "ar" ? post.categoryNameAr : post.categoryNameEn;
          const readTime = language === "ar" ? post.readTimeAr : post.readTimeEn;

          return (
            <article
              key={post.id}
              className="group rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101A] hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md"
            >
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                <Image
                  src={post.image}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 start-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-black/85 backdrop-blur-md text-slate-900 dark:text-white border border-slate-200/50 dark:border-white/20 shadow-xs">
                    {catName}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {post.date}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {readTime}
                    </span>
                  </div>

                  <Link href={localizePath(`/blog/${post.slug}`, activeLocale)}>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-[#4F2396] dark:group-hover:text-violet-300 transition-colors line-clamp-2 leading-snug">
                      {title}
                    </h3>
                  </Link>

                  <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#4F2396] dark:text-violet-300 font-bold text-xs flex items-center justify-center">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                        {post.author}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {language === "ar" ? post.authorRoleAr : post.authorRoleEn}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={localizePath(`/blog/${post.slug}`, activeLocale)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F2396] dark:text-violet-300 hover:text-[#3d1979] dark:hover:text-violet-200 transition-colors"
                  >
                    <span>{language === "ar" ? "قراءة المقال" : "Read Story"}</span>
                    <ArrowIcon className="w-3.5 h-3.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
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
