"use client";

import React, { useRef } from "react";
import { Clock, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useApp } from "@/context/AppContext";
import PropertyCard from "@/components/home/PropertyCard";

export default function RecentlyViewedSection() {
  const { recentlyViewedProperties, clearRecentlyViewed, isLoaded } = useRecentlyViewed();
  const { language } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Guard against SSR hydration flash or empty state layout shifts
  if (!isLoaded || recentlyViewedProperties.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const isRtl = document.documentElement.dir === "rtl" || language === "ar";
    const delta = direction === "left" ? -340 : 340;
    scrollRef.current.scrollBy({
      left: isRtl ? -delta : delta,
      behavior: "smooth",
    });
  };

  const isArabic = language === "ar";

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="pt-4 pb-8 relative z-10"
        aria-label={isArabic ? "الإقامات التي شاهدتها مؤخراً" : "Recently Viewed Stays"}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-500/20 text-violet-700 dark:text-violet-300 text-[11px] font-bold tracking-wide uppercase mb-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                <span>{isArabic ? "سجل التصفح الأخير" : "Recent Browsing"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {isArabic ? "إقامات شاهدتها مؤخراً" : "Recently Viewed Stays"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isArabic
                  ? "تابع استكشاف وحجز الإقامات التي قمت بالاطلاع عليها"
                  : "Pick up where you left off with properties you explored"}
              </p>
            </div>

            {/* Actions: Clear History & Scroll Chevrons */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={clearRecentlyViewed}
                className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                aria-label={isArabic ? "مسح سجل المشاهدات" : "Clear browsing history"}
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{isArabic ? "مسح السجل" : "Clear"}</span>
              </button>

              <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-0.5" />

              <button
                type="button"
                onClick={() => scroll("left")}
                className="min-h-[44px] min-w-[44px] rounded-full border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 bg-white dark:bg-[#12101a] text-gray-700 dark:text-gray-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                aria-label={isArabic ? "السابق" : "Scroll previous"}
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                className="min-h-[44px] min-w-[44px] rounded-full border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 bg-white dark:bg-[#12101a] text-gray-700 dark:text-gray-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:outline-none"
                aria-label={isArabic ? "التالي" : "Scroll next"}
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Horizontal Scrolling Carousel */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 px-1 -mx-1"
          >
            {recentlyViewedProperties.map((property, idx) => (
              <div key={property.id} className="w-[230px] sm:w-[245px] md:w-[255px] shrink-0">
                <PropertyCard property={property} priority={idx < 2} />
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
