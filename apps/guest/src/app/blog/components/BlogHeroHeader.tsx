"use client";

import { BookOpen, Search } from "lucide-react";

interface BlogHeroHeaderProps {
  language: string;
  isDarkTheme: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onSelectTag?: (tag: string) => void;
}

export default function BlogHeroHeader({
  language,
  searchQuery,
  setSearchQuery,
  onSelectTag,
}: BlogHeroHeaderProps) {
  const quickTags = [
    { labelEn: "Riyadh Chalets", labelAr: "شاليهات الرياض", query: "Riyadh" },
    { labelEn: "Jeddah Villas", labelAr: "فلل جدة", query: "Jeddah" },
    { labelEn: "AlUla Camps", labelAr: "مخيمات العلا", query: "AlUla" },
    { labelEn: "Farm Retreats", labelAr: "مزارع ريفية", query: "Farm" },
    { labelEn: "Host Licensing", labelAr: "تراخيص المضيفين", query: "Licensing" },
  ];

  return (
    <section className="relative py-12 sm:py-16 border-b border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Quiet Editorial Badge matching About / Policy style */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-5">
          <BookOpen className="w-3.5 h-3.5 text-[#4F2396] dark:text-violet-300" />
          <span>
            {language === "ar"
              ? "مجلة قاف نست للسياحة وبيوت العطلات المرخصة"
              : "Official QafNest Journal · Vacation Stays & Travel Guides"}
          </span>
        </div>

        {/* Confident, Crisp Editorial Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.2] max-w-4xl mx-auto">
          {language === "ar" ? (
            <>
              استكشف أجمل الوجهات وبيوت العطلات مع{" "}
              <span className="text-[#4F2396] dark:text-violet-400">قاف نست</span>
            </>
          ) : (
            <>
              Curated Travel Guides &amp; Vacation Stays by{" "}
              <span className="text-[#4F2396] dark:text-violet-400">QafNest</span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {language === "ar"
            ? "أدلة سياحية موثقة، نصائح حجز معتمدة، وتجارب استثنائية في الشاليهات، الفلل الخاصة، والمزارع الريفية بالمملكة."
            : "Curated destination insights, booking tips, and verified private retreats across chalets, luxury villas, and country farms."}
        </p>

        {/* Refined Minimal Search Bar */}
        <div className="mt-8 max-w-xl mx-auto">
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#12101A] focus-within:border-[#4F2396] dark:focus-within:border-violet-500 shadow-xs transition">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "ar"
                  ? "ابحث عن مقال، وجهة، أو نوع إقامة (مثل الرياض، أبحر، مزارع)..."
                  : "Search articles, destinations, or stay guides (e.g. Riyadh, Obhur, Farms)..."
              }
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white px-2 py-1 cursor-pointer"
              >
                {language === "ar" ? "مسح" : "Clear"}
              </button>
            )}
          </div>

          {/* Quick Destination Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium me-1">
              {language === "ar" ? "وجهات شائعة:" : "Trending topics:"}
            </span>
            {quickTags.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchQuery(tag.query);
                  if (onSelectTag) onSelectTag(tag.query);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20 hover:text-[#4F2396] dark:hover:text-violet-300 transition text-[11px] font-medium cursor-pointer"
              >
                {language === "ar" ? tag.labelAr : tag.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
