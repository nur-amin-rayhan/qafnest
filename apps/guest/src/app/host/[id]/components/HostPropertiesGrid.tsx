"use client";

import React, { useState, useMemo } from "react";
import { Building2, SlidersHorizontal } from "lucide-react";
import type { Property } from "@/data/properties";
import PropertyCard from "@/components/home/PropertyCard";

interface HostPropertiesGridProps {
  properties: Property[];
  hostName: string;
  language: "en" | "ar";
}

export default function HostPropertiesGrid({
  properties,
  hostName,
  language,
}: HostPropertiesGridProps) {
  const isAr = language === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(properties.map((p) => p.category).filter(Boolean)));
    return ["all", ...cats];
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (selectedCategory === "all") return properties;
    return properties.filter((p) => p.category === selectedCategory);
  }, [properties, selectedCategory]);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "chalet":
        return label("Chalets", "شاليهات");
      case "villa":
        return label("Villas", "فلل");
      case "farm":
        return label("Farms", "مزارع");
      case "camp":
        return label("Camps", "مخيمات");
      case "penthouse":
        return label("Penthouses", "بنتهاوس");
      default:
        return label("All stays", "جميع العقارات");
    }
  };

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
            <Building2 className="h-3.5 w-3.5" />
            {label("Listing Portfolio", "قائمة العقارات")}
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
            {label(`Properties hosted by ${hostName}`, `عقارات المضيف ${hostName}`)}
            <span className="ms-2 rounded-full bg-violet-100 px-2.5 py-0.5 text-sm font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              {filteredProperties.length}
            </span>
          </h2>
        </div>

        {/* Category Filters */}
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-violet-700 text-white shadow-xs"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Property Cards Grid */}
      {filteredProperties.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-violet-100 bg-white p-12 text-center dark:border-violet-500/20 dark:bg-[#12101a]">
          <Building2 className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
            {label("No properties found in this category", "لا توجد عقارات في هذا التصنيف حالياً")}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {label("Try selecting another category above to view all listings.", "اختر تصنيفاً آخر أعلاه لعرض بقية العقارات المتاحة.")}
          </p>
          <button
            onClick={() => setSelectedCategory("all")}
            className="mt-4 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white hover:bg-violet-800 transition"
          >
            {label("Show all listings", "عرض كل العقارات")}
          </button>
        </div>
      )}
    </section>
  );
}

