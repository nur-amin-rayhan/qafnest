"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import type { Property } from "@/data/properties";
import InteractiveMapView from "./InteractiveMapView";
import SearchPropertyCard from "./SearchPropertyCard";

interface SearchResultsSectionProps {
  viewMode: "grid" | "map";
  setViewMode: (mode: "grid" | "map") => void;
  sortedProperties: Property[];
  filteredCount: number;
  selectedMapPropertyId: string | null;
  setSelectedMapPropertyId: (id: string | null) => void;
  language: "en" | "ar";
  onResetFilters: () => void;
}

export default function SearchResultsSection({
  viewMode,
  setViewMode,
  sortedProperties,
  filteredCount,
  selectedMapPropertyId,
  setSelectedMapPropertyId,
  language,
  onResetFilters,
}: SearchResultsSectionProps) {
  if (viewMode === "map") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] gap-4 items-stretch">
        <InteractiveMapView
          properties={sortedProperties}
          selectedPropertyId={selectedMapPropertyId}
          onSelectProperty={(propertyId) => {
            setSelectedMapPropertyId(propertyId);
            document.getElementById(`map-list-${propertyId}`)?.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }}
          onClose={() => setViewMode("grid")}
        />
        <section
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          aria-label={language === "ar" ? "نتائج البحث على الخريطة" : "Map search results"}
          className="max-h-[680px] overflow-y-auto overscroll-contain rounded-3xl border border-violet-200/80 bg-violet-50/30 p-3 dark:border-violet-500/20 dark:bg-[#0d0b16]"
        >
          <div className="sticky top-0 z-10 mb-3 flex items-center justify-between rounded-2xl border border-violet-200/80 bg-white/95 px-3.5 py-2.5 text-xs font-bold text-violet-900 shadow-xs backdrop-blur dark:border-violet-500/20 dark:bg-[#12101a]/95 dark:text-gray-200">
            <span>
              {filteredCount} {language === "ar" ? "عقارات" : "properties"}
            </span>
            <span className="text-[10px] font-medium text-gray-500">
              {language === "ar" ? "اضغط دبوس الخريطة لعرض العقار" : "Select a map pin to find its listing"}
            </span>
          </div>
          {sortedProperties.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 dark:bg-[#12101a] dark:text-gray-400">
              {language === "ar" ? "لا توجد عقارات مطابقة" : "No properties match these filters"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {sortedProperties.map((property, idx) => (
                <div
                  id={`map-list-${property.id}`}
                  key={property.id}
                  onMouseEnter={() => setSelectedMapPropertyId(property.id)}
                  onFocusCapture={() => setSelectedMapPropertyId(property.id)}
                  className={`rounded-3xl transition-shadow ${
                    selectedMapPropertyId === property.id
                      ? "ring-2 ring-violet-600 ring-offset-2 ring-offset-white dark:ring-offset-[#0d0b16]"
                      : ""
                  }`}
                >
                  <SearchPropertyCard property={property} priority={idx < 2} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (filteredCount === 0) {
    return (
      <div className="rounded-3xl p-16 text-center border border-violet-200/85 dark:border-violet-500/20 bg-violet-50/30 dark:bg-[#12101F] shadow-[0_12px_35px_rgba(109,40,217,0.06)]">
        <Sparkles className="w-8 h-8 text-violet-600 mx-auto mb-3" />
        <h3 className="font-extrabold text-lg text-gray-900 dark:text-white mb-1">
          {language === "ar" ? "لا توجد عقارات مطابقة" : "No properties found"}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-5">
          {language === "ar"
            ? "جرب إزالة بعض الفلاتر أو تغيير الحي لرؤية المزيد من العقارات."
            : "Try clearing some filters or selecting another district to see more results."}
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-700 to-fuchsia-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          {language === "ar" ? "إظهار كافة العقارات" : "Show All Properties"}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedProperties.map((property, idx) => (
        <SearchPropertyCard
          key={property.id}
          property={property}
          priority={idx < 3}
        />
      ))}
    </div>
  );
}

