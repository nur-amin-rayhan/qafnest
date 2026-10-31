"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShieldCheck, Zap, Heart, ArrowRight, ArrowLeft, RotateCcw, MapPin } from "lucide-react";
import { getPropertyCapacity, normalizeCityId, Property } from "@/data/properties";
import { useProperties } from "@/hooks/useProperties";
import { useApp } from "@/context/AppContext";
import { propertyDetailHref } from "@/lib/propertyUrls";
import {
  CITY_NAMES_AR,
  CATEGORY_NAMES_AR,
  PROPERTY_TITLES_AR,
  PROPERTY_SPECS_AR,
} from "@/data/translations";

export default function PropertiesGrid() {
  const { properties } = useProperties();
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
    wishlist,
    toggleWishlist,
    formatPrice,
    formatTabby,
    openBookingModal,
    rentMode,
    guestsCount,
    language,
    t,
  } = useApp();

  const filterProperty = (p: Property) => {
    if (selectedCity !== "all" && normalizeCityId(p.city) !== normalizeCityId(selectedCity)) return false;
    if (instantOnly && !p.instantBook) return false;
    if (poolOnly && !p.hasPool) return false;
    if (selfCheckinOnly && !p.selfCheckin) return false;
    if (guestsCount > 4) {
      if (getPropertyCapacity(p) < guestsCount) return false;
    }
    return true;
  };

  const allFiltered = properties.filter((p) => {
    if (!filterProperty(p)) return false;
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    return true;
  });

  const resetAllFilters = () => {
    setSelectedCity("all");
    setSelectedCategory("all");
    setInstantOnly(false);
    setPoolOnly(false);
    setSelfCheckinOnly(false);
  };

  const renderCard = (item: Property, idx: number) => {
    const isWishlisted = wishlist.includes(item.id);
    const effectivePrice =
      rentMode === "monthly" ? Math.round(item.basePrice * 20) : item.basePrice;

    const title = language === "ar" ? (PROPERTY_TITLES_AR[item.id] || item.title) : item.title;
    const cityName = language === "ar" ? (CITY_NAMES_AR[item.city] || item.cityName) : item.cityName;
    const categoryName = language === "ar" ? (CATEGORY_NAMES_AR[item.category] || item.categoryName) : item.categoryName;
    const specs = language === "ar" ? (PROPERTY_SPECS_AR[item.specs] || item.specs) : item.specs;
    const detailHref = propertyDetailHref(item.id);

    return (
      <div
        key={item.id}
        className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-[#12101a] border border-violet-500/25 dark:border-violet-500/20 hover:border-violet-600 dark:hover:border-violet-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(139,92,246,0.15)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.6),0_0_20px_rgba(139,92,246,0.15)] overflow-hidden"
      >
        {/* Clean 4:3 Aspect Image with Badges */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-white/5">
          <Image
            src={item.image}
            alt={title}
            fill
            priority={idx < 4}
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          <Link href={detailHref} aria-label={`${language === "ar" ? "عرض تفاصيل" : "View details for"} ${title}`} className="absolute inset-0 z-[1]" />
          {/* Subtle top vignette for badge contrast */}
          <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

          {/* Badges & Wishlist Button */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {item.instantBook && (
                <span className="px-2.5 py-1 rounded-full bg-white/95 dark:bg-black/75 text-[10px] font-bold text-violet-700 dark:text-fuchsia-300 border border-violet-200 dark:border-fuchsia-400/30 flex items-center gap-1 shadow-sm">
                  <Zap className="w-2.5 h-2.5 text-violet-600 dark:text-fuchsia-400 fill-violet-600 dark:fill-fuchsia-400" />
                  <span>{t.properties.instantBook}</span>
                </span>
              )}
              {item.isLicensed && (
                <span className="px-2.5 py-1 rounded-full bg-white/95 dark:bg-black/75 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30 flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.properties.licensed}</span>
                </span>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(item.id);
              }}
              className="h-8 w-8 rounded-full bg-white/95 dark:bg-black/65 border border-gray-200 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:text-rose-500 hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer shadow-sm"
              aria-label="Add to wishlist"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-700 dark:text-white"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Card Body - Gathern Clean & Simple Layout */}
        <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between gap-3">
          <div>
            {/* Row 1: Location & Rating/Reviews */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                <MapPin className="w-3.5 h-3.5 text-violet-600 dark:text-fuchsia-400 shrink-0" />
                <span>{cityName}</span>
                <span className="text-gray-300 dark:text-white/30 font-normal">·</span>
                <span className="text-gray-600 dark:text-gray-400 font-normal">
                  {categoryName}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{item.rating}</span>
                <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
                  ({item.reviewsCount})
                </span>
              </div>
            </div>

            {/* Row 2: Property Name - NO HIDDEN TEXT */}
            <h3
              className="font-display text-base font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors mb-1.5 leading-snug"
              title={title}
            >
              <Link href={detailHref}>{title}</Link>
            </h3>

            {/* Row 3: Specs / Capacity - Clear and visible */}
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-normal">
              {specs}
            </p>
          </div>

          {/* Row 4: Nightly Price & Book Button */}
          <div className="pt-3 border-t border-violet-500/15 dark:border-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {formatPrice(effectivePrice)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                  {rentMode === "monthly" ? t.properties.perMonth : t.properties.perNight}
                </span>
              </div>

              <button
                onClick={() => openBookingModal(title, item.basePrice)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <span>{t.properties.book}</span>
                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </button>
            </div>

            {/* Row 5: Tabby Installment Note */}
            <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
              <span>
                {t.properties.orFourPaymentsOf}{" "}
                <strong className="text-gray-900 dark:text-white font-semibold">
                  {formatTabby(effectivePrice)}
                </strong>{" "}
                {t.properties.withTabby}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-[10px]">
                {t.properties.zeroInterest}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="properties" className="pt-6 pb-20 relative z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Main Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-violet-600 dark:text-violet-300 block mb-1">
              {t.properties.badge}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {selectedCategory === "all" && selectedCity === "all" ? (
                <>
                  {t.properties.titleAll} <span className="text-gradient">{t.properties.titleHighlight}</span>
                </>
              ) : selectedCity !== "all" ? (
                <>
                  {t.properties.titleIn}{" "}
                  <span className="text-gradient capitalize">
                    {language === "ar" ? (CITY_NAMES_AR[selectedCity] || selectedCity) : selectedCity}
                  </span>
                </>
              ) : (
                <>
                  {t.properties.titleAll}{" "}
                  <span className="text-gradient capitalize">
                    {language === "ar" ? (CATEGORY_NAMES_AR[selectedCategory] || selectedCategory) : selectedCategory}
                  </span>
                </>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {(selectedCategory !== "all" || selectedCity !== "all" || instantOnly || poolOnly || selfCheckinOnly) && (
              <button
                onClick={resetAllFilters}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-500/30 hover:border-violet-400 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t.properties.showAll}</span>
              </button>
            )}

            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-500/20">
              {allFiltered.length} {t.properties.verifiedCount}
            </span>
          </div>
        </div>

        {/* Empty State */}
        {allFiltered.length === 0 ? (
          <div className="rounded-3xl p-12 text-center max-w-lg mx-auto bg-white dark:bg-[#12101a] border border-violet-500/20 dark:border-white/10 shadow-sm">
            <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {t.properties.noResultsTitle}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-6">
              {t.properties.noResultsDesc}
            </p>
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{t.properties.resetFilters}</span>
            </button>
          </div>
        ) : (
          /* Single Unified Property Grid in Gathern Style */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allFiltered.map((item, idx) => renderCard(item, idx))}
          </div>
        )}
      </div>
    </section>
  );
}
