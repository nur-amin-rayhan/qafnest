"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, ArrowRight } from "lucide-react";
import { Property } from "@/data/properties";
import { propertyReservationHref } from "@/lib/propertyUrls";
import {
  getLocalizedPropertyTitle,
  getLocalizedCityName,
  getLocalizedCategoryName,
  formatLocalizedPropertySpecs,
  type Locale,
} from "@/lib/localization/localeHelper";

interface SearchModalResultsListProps {
  filteredResults: Property[];
  hasFilters: boolean;
  onResetFilters: () => void;
  onSelectProperty: (p: Property) => void;
  rentType: "daily" | "monthly";
  formatPrice: (amount: number) => string;
  isDarkTheme: boolean;
  language: string;
  t: {
    properties: {
      book: string;
      [key: string]: string;
    };
    [key: string]: unknown;
  };
  closeSearchModal: () => void;
}

export function SearchModalResultsList({
  filteredResults,
  hasFilters,
  onResetFilters,
  onSelectProperty,
  rentType,
  formatPrice,
  isDarkTheme,
  language,
  t,
  closeSearchModal,
}: SearchModalResultsListProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-muted uppercase tracking-wider">
          {filteredResults.length} {language === "ar" ? "عقار متطابق" : "Properties Matching"}
        </span>
        {hasFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs text-fuchsia-400 hover:underline cursor-pointer"
          >
            {language === "ar" ? "إعادة ضبط الفلاتر" : "Reset All Filters"}
          </button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {filteredResults.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <p className="text-sm font-semibold mb-1">
              {language === "ar" ? "لم يتم العثور على إقامات متطابقة" : "No accommodations found"}
            </p>
            <p className="text-xs">
              {language === "ar"
                ? "جرب اختيار مدينة أخرى أو تغيير خيارات التصفية."
                : "Try selecting another city or relaxing filter criteria."}
            </p>
          </div>
        ) : (
          filteredResults.map((p) => {
            const locale: Locale = language === "ar" ? "ar" : "en";
            const title = getLocalizedPropertyTitle(p, locale);
            const cityName = getLocalizedCityName(p.city || p.cityName, locale);
            const categoryName = getLocalizedCategoryName(p.category || p.categoryName, locale);
            const specs = formatLocalizedPropertySpecs(p, locale);

            return (
              <div
                key={p.id}
                onClick={() => onSelectProperty(p)}
                className={`p-2.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer group ${
                  isDarkTheme
                    ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-violet-400/40"
                    : "bg-purple-50/40 border-purple-100 hover:bg-purple-50 hover:border-purple-300"
                }`}
              >
                <div className="relative h-16 w-20 sm:h-18 sm:w-24 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={p.image}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] uppercase font-bold text-fuchsia-400 tracking-wider">
                      {cityName} · {categoryName}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-fg">
                      {p.rating > 0 ? (
                        <>
                          <Star className="w-3 h-3 fill-fuchsia-400 text-fuchsia-400" />
                          <span>{p.rating.toFixed(1)} / 10</span>
                        </>
                      ) : (
                        <span>{language === "ar" ? "لا توجد تقييمات" : "No rating"}</span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-fg truncate group-hover:text-fuchsia-400 transition-colors">
                    {title}
                  </h4>

                  <p className="text-[11px] text-muted truncate">{specs}</p>
                </div>

                <div className="text-right rtl:text-left shrink-0">
                  <p className="text-xs sm:text-sm font-bold text-fg">
                    {formatPrice(
                      rentType === "monthly" ? Math.round(p.basePrice * 20) : p.basePrice
                    )}
                  </p>
                  <span className="text-[10px] text-muted block">
                    {rentType === "monthly"
                      ? language === "ar"
                        ? "لكل شهر"
                        : "per month"
                      : language === "ar"
                      ? "لكل ليلة"
                      : "per night"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeSearchModal();
                      router.push(propertyReservationHref(p.id));
                    }}
                    className="mt-1 text-[10px] font-bold text-violet-400 hover:text-fuchsia-400 flex items-center gap-0.5 justify-end rtl:justify-start"
                  >
                    <span>{t.properties.book}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

