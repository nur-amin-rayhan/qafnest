"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { localizePath, type Locale } from "@/lib/localization/localeHelper";
import { BlogPost } from "../data/blogPosts";

interface BlogArticleCardProps {
  post: BlogPost;
  language: string;
  isDarkTheme: boolean;
}

export default function BlogArticleCard({
  post,
  language,
}: BlogArticleCardProps) {
  const activeLocale: Locale = language === "ar" ? "ar" : "en";
  const ArrowIcon = language === "ar" ? ArrowLeft : ArrowRight;
  const title = language === "ar" ? post.titleAr : post.titleEn;
  const excerpt = language === "ar" ? post.excerptAr : post.excerptEn;
  const catName = language === "ar" ? post.categoryNameAr : post.categoryNameEn;
  const readTime = language === "ar" ? post.readTimeAr : post.readTimeEn;

  return (
    <article className="group rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#12101A] hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md">
      <div className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        <Image
          src={post.image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3.5 start-3.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 dark:bg-black/80 text-slate-900 dark:text-white backdrop-blur-md border border-slate-200/50 dark:border-white/20 shadow-xs">
            {catName}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center gap-2.5 text-xs text-slate-400 mb-2.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{post.date}</span>
            <span>·</span>
            <Clock className="w-3.5 h-3.5" />
            <span>{readTime}</span>
          </div>

          <Link href={localizePath(`/blog/${post.slug}`, activeLocale)}>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#4F2396] dark:group-hover:text-violet-300 transition-colors line-clamp-2 leading-snug">
              {title}
            </h3>
          </Link>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {excerpt}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[#4F2396] dark:text-violet-300 font-bold text-[10px] flex items-center justify-center">
              {post.author.charAt(0)}
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-400">{post.author}</span>
          </div>

          <Link
            href={localizePath(`/blog/${post.slug}`, activeLocale)}
            className="font-bold text-[#4F2396] dark:text-violet-300 hover:text-[#3d1979] dark:hover:text-violet-200 flex items-center gap-1 transition-colors"
          >
            <span>{language === "ar" ? "قراءة المقال" : "Read Article"}</span>
            <ArrowIcon className="w-3 h-3 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
          </Link>
        </div>
      </div>
    </article>
  );
}
