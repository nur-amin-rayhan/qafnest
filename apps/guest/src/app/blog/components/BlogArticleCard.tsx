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
  isDarkTheme,
}: BlogArticleCardProps) {
  const activeLocale: Locale = language === "ar" ? "ar" : "en";
  const ArrowIcon = language === "ar" ? ArrowLeft : ArrowRight;
  const title = language === "ar" ? post.titleAr : post.titleEn;
  const excerpt = language === "ar" ? post.excerptAr : post.excerptEn;
  const catName = language === "ar" ? post.categoryNameAr : post.categoryNameEn;
  const readTime = language === "ar" ? post.readTimeAr : post.readTimeEn;

  return (
    <article
      className={`group rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
        isDarkTheme
          ? "bg-[#0E0E1A] border-white/10 hover:border-violet-500/40 shadow-lg"
          : "bg-white border-purple-100 hover:border-purple-300 shadow-sm"
      }`}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={post.image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md">
            {catName}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-muted mb-2">
            <Calendar className="w-3 h-3" />
            <span>{post.date}</span>
            <span>·</span>
            <Clock className="w-3 h-3" />
            <span>{readTime}</span>
          </div>

          <Link href={localizePath(`/blog/${post.slug}`, activeLocale)}>
            <h3 className="text-base font-bold font-display group-hover:text-fuchsia-400 transition-colors line-clamp-2">
              {title}
            </h3>
          </Link>

          <p className="mt-2 text-xs text-muted line-clamp-3 leading-relaxed">
            {excerpt}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-purple-500/10 flex items-center justify-between text-xs">
          <span className="font-medium text-muted">{post.author}</span>
          <Link
            href={localizePath(`/search?type=${post.category === "guides" ? "chalet" : post.category}`, activeLocale)}
            className="font-bold text-violet-400 group-hover:text-fuchsia-400 flex items-center gap-1 transition-colors"
          >
            <span>{language === "ar" ? "تصفح الوحدات" : "Explore Stays"}</span>
            <ArrowIcon className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

