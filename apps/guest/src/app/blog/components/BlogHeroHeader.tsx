"use client";

import { Compass, Search } from "lucide-react";

interface BlogHeroHeaderProps {
  language: string;
  isDarkTheme: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export default function BlogHeroHeader({
  language,
  isDarkTheme,
  searchQuery,
  setSearchQuery,
}: BlogHeroHeaderProps) {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16 border-b border-purple-500/10">
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-950/30 text-xs sm:text-sm font-semibold text-fuchsia-400 mb-5 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <Compass className="w-4 h-4 text-fuchsia-400" />
          <span>
            {language === "ar"
              ? "دليل السفر والسياحة في المملكة العربية السعودية"
              : "Saudi Travel & Vacation Rentals Guide"}
          </span>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight max-w-4xl mx-auto leading-[1.15]">
          {language === "ar" ? (
            <>
              مدونة <span className="text-gradient">قاف نست</span> للسياحة والإقامات
            </>
          ) : (
            <>
              Discover Saudi Arabia with <span className="text-gradient">QafNest</span>
            </>
          )}
        </h1>

        <p className="mt-4 text-sm sm:text-base lg:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          {language === "ar"
            ? "أدلة شاملة، نصائح حجز، وأفضل الوجهات لقضاء أجمل الأوقات في الشاليهات، الفلل، المزارع الريفية، والمخيمات الصحراوية."
            : "Curated destination guides, local stay insights, and insider tips for luxury chalets, private villas, farms, and desert camps."}
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto relative">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
              isDarkTheme
                ? "bg-[#0E0E1A] border-white/10 focus-within:border-violet-500/60 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                : "bg-white border-purple-200 focus-within:border-purple-500 shadow-[0_10px_30px_rgba(88,28,135,0.08)]"
            }`}
          >
            <Search className="w-5 h-5 text-violet-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "ar"
                  ? "ابحث عن مقال، وجهة، أو نوع إقامة .."
                  : "Search articles, destinations, or stay guides .."
              }
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-muted hover:text-white px-2 py-1 cursor-pointer"
              >
                {language === "ar" ? "مسح" : "Clear"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

