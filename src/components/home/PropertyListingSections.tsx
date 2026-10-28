"use client";

import React, { useMemo } from "react";
import { PROPERTIES } from "@/data/properties";
import { useApp } from "@/context/AppContext";
import { CITY_NAMES_AR, CATEGORY_NAMES_AR } from "@/data/translations";
import PropertySection from "@/components/home/PropertySection";
import PropertyCard from "@/components/home/PropertyCard";
import { RotateCcw } from "lucide-react";

export default function PropertyListingSections() {
  const {
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    instantOnly,
    setInstantOnly,
    poolOnly,
    setPoolOnly,
    selfCheckinOnly,
    setSelfCheckinOnly,
    guestsCount,
    language,
    t,
  } = useApp();

  const isFiltered =
    selectedCity !== "all" ||
    selectedCategory !== "all" ||
    instantOnly ||
    poolOnly ||
    selfCheckinOnly ||
    guestsCount > 4;

  const resetAllFilters = () => {
    setSelectedCity("all");
    setSelectedCategory("all");
    setInstantOnly(false);
    setPoolOnly(false);
    setSelfCheckinOnly(false);
  };

  const filteredProperties = useMemo(() => {
    if (!isFiltered) return [];
    return PROPERTIES.filter((p) => {
      if (selectedCity !== "all" && p.city !== selectedCity) return false;
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (instantOnly && !p.instantBook) return false;
      if (poolOnly && !p.hasPool) return false;
      if (selfCheckinOnly && !p.selfCheckin) return false;
      if (guestsCount > 4) {
        const cap = parseInt(p.specs, 10) || 4;
        if (cap < guestsCount) return false;
      }
      return true;
    });
  }, [
    isFiltered,
    selectedCity,
    selectedCategory,
    instantOnly,
    poolOnly,
    selfCheckinOnly,
    guestsCount,
  ]);

  const kidiaProperties = useMemo(
    () => PROPERTIES.filter((p) => p.section === "kidia"),
    []
  );
  const seaProperties = useMemo(
    () => PROPERTIES.filter((p) => p.section === "sea"),
    []
  );
  const fogProperties = useMemo(
    () => PROPERTIES.filter((p) => p.section === "fog"),
    []
  );
  const rosesProperties = useMemo(
    () => PROPERTIES.filter((p) => p.section === "roses"),
    []
  );
  const dealsProperties = useMemo(
    () => PROPERTIES.filter((p) => p.section === "deals"),
    []
  );

  const cityName =
    language === "ar"
      ? CITY_NAMES_AR[selectedCity] || selectedCity
      : selectedCity;
  const categoryName =
    language === "ar"
      ? CATEGORY_NAMES_AR[selectedCategory] || selectedCategory
      : selectedCategory;

  return (
    <div id="properties" className="pt-2 pb-16 space-y-4">
      {/* Search / Filter Results if active */}
      {isFiltered && (
        <section className="pt-2 pb-6 relative z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {language === "ar"
                    ? `نتائج البحث (${filteredProperties.length})`
                    : `Search Results (${filteredProperties.length})`}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedCity !== "all" ? cityName : ""}
                  {selectedCategory !== "all" ? ` · ${categoryName}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/30 hover:border-violet-400 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{language === "ar" ? "إعادة تعيين الفلاتر" : "Reset Filters"}</span>
              </button>
            </div>

            {filteredProperties.length === 0 ? (
              <div className="rounded-2xl p-8 text-center bg-white dark:bg-[#12101a] border border-violet-100 dark:border-white/10">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.properties.noResultsTitle}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.properties.noResultsDesc}
                </p>
              </div>
            ) : (
              <div className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 px-1 -mx-1">
                {filteredProperties.map((p, idx) => (
                  <div
                    key={p.id}
                    className="w-[220px] sm:w-[235px] md:w-[245px] shrink-0"
                  >
                    <PropertyCard property={p} priority={idx < 4} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 1. Stay Near Qiddiya */}
      <PropertySection
        id="section-kidia"
        sectionKey="kidia"
        title="Stay Near Qiddiya"
        titleAr="أقِم بالقرب من القدية"
        properties={kidiaProperties}
      />

      {/* 2. Stay by the Sea */}
      <PropertySection
        id="section-sea"
        sectionKey="sea"
        title="Stay by the Sea"
        titleAr="أقِم على البحر"
        properties={seaProperties}
      />

      {/* 3. Stay Amid the Fog */}
      <PropertySection
        id="section-fog"
        sectionKey="fog"
        title="Stay Amid the Fog"
        titleAr="أقِم بين الضباب"
        properties={fogProperties}
      />

      {/* 4. Stay Near the Roses */}
      <PropertySection
        id="section-roses"
        sectionKey="roses"
        title="Stay Near the Roses"
        titleAr="أقِم بالقرب من الورد"
        properties={rosesProperties}
      />

      {/* 5. Daily Deals */}
      <PropertySection
        id="section-deals"
        sectionKey="deals"
        title="Daily Deals"
        titleAr="العروض اليومية"
        properties={dealsProperties}
      />
    </div>
  );
}
