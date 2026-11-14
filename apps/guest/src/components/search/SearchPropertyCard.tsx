"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import type { Property } from "@/data/properties";
import { propertyDetailHref } from "@/lib/propertyUrls";
import { useApp } from "@/context/AppContext";
import {
  getLocalizedPropertyTitle,
  getLocalizedPropertyLocation,
  type Locale,
} from "@/lib/localization/localeHelper";
import { SearchCardImageCarousel } from "./card/SearchCardImageCarousel";
import { SearchCardSpecsStrip } from "./card/SearchCardSpecsStrip";

interface SearchPropertyCardProps {
  property: Property;
  priority?: boolean;
}

export default function SearchPropertyCard({
  property,
  priority = false,
}: SearchPropertyCardProps) {
  const { wishlist, toggleWishlist, language } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeIdx, setActiveIdx] = useState(0);

  const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop";
  const validImages = (property.images || []).filter(
    (img): img is string => typeof img === "string" && img.trim().length > 0
  );
  const images = validImages.length > 0 ? validImages : [property.image || FALLBACK_IMG];
  const isWishlisted = wishlist.includes(property.id);
  const detailHref = propertyDetailHref(property.id, searchParams.toString());

  const locale: Locale = language === "ar" ? "ar" : "en";
  const title = getLocalizedPropertyTitle(property, locale);
  const { district } = getLocalizedPropertyLocation(property, locale);

  // Derive specs metrics from property
  const area =
    typeof property.areaSqm === "number"
      ? property.areaSqm
      : property.category === "penthouse"
        ? 220
        : 350;
  const capacity =
    property.capacity ?? parseInt(property.specs.match(/(\d+)\s*Guests?/i)?.[1] || "6", 10);
  const bedrooms =
    typeof property.bedroomsCount === "number"
      ? property.bedroomsCount
      : parseInt(property.specs.match(/(\d+)\s*Bed/i)?.[1] || "0", 10);
  const livingRooms = property.livingRoomsCount ?? 0;
  const bathrooms = property.bathroomsCount ?? Math.max(0, bedrooms);
  const mainMajlisCapacity = property.majlisDetails?.mainMajlisCapacity;

  const chaletFor =
    language === "ar"
      ? property.chaletForAr || "عوائل فقط"
      : property.chaletForAr === "عوائل وعزاب"
      ? "Families & Singles"
      : "Families only";

  // Feature highlights
  const amenitiesList = property.amenities || [];
  const hasPool =
    property.hasPool ||
    amenitiesList.includes("private_pool") ||
    amenitiesList.includes("outdoor_pool") ||
    amenitiesList.includes("indoor_pool");
  const hasSelfCheckin = property.selfCheckin || amenitiesList.includes("self_checkin");
  const hasWifi = amenitiesList.includes("wifi");
  const hasKitchen =
    amenitiesList.includes("equipped_kitchen") ||
    property.features.some((f) => f.includes("Kitchen") || f.includes("مطبخ"));
  const hasBbq =
    amenitiesList.includes("bbq_facility") ||
    property.features.some((f) => f.includes("BBQ") || f.includes("شواء"));
  const hasPlayground =
    amenitiesList.includes("kids_playground") ||
    property.features.some((f) => f.includes("Play") || f.includes("أطفال"));
  const hasParking =
    amenitiesList.includes("private_parking") ||
    property.features.some((f) => f.includes("Parking") || f.includes("موقف"));

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${language === "ar" ? "عرض تفاصيل" : "View details for"} ${title}`}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button, a")) return;
        router.push(detailHref);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " "))
          return;
        event.preventDefault();
        router.push(detailHref);
      }}
      className="group relative flex flex-col rounded-3xl bg-white dark:bg-[#12101a] border border-violet-200/80 dark:border-violet-500/20 hover:border-violet-400 dark:hover:border-violet-400/50 p-3 transition-all duration-300 shadow-[0_8px_24px_rgba(109,40,217,0.05)] hover:shadow-[0_14px_34px_rgba(124,58,237,0.14)] cursor-pointer h-full"
    >
      {/* 1. Image Carousel Container with Hover Arrows & Dots */}
      <SearchCardImageCarousel
        images={images}
        activeIdx={activeIdx}
        title={title}
        priority={priority}
        isWishlisted={isWishlisted}
        onToggleWishlist={() => toggleWishlist(property.id)}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* 2. Card Body Matching Gathern Search Benchmark */}
      <div className="px-1 pt-2.5 pb-1 flex flex-col flex-grow justify-between">
        <div>
          {/* Row 1: Star Rating + Target Group + Discount Pill */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-xs sm:text-[13px] text-gray-900 dark:text-gray-100 font-medium">
              <Star className="w-3.5 h-3.5 fill-black text-black dark:fill-amber-400 dark:text-amber-400" />
              <span className="font-bold">{property.rating.toFixed(1)}</span>
              <span className="text-gray-500 dark:text-gray-400">({property.reviewsCount})</span>
            </div>

            <div className="flex items-center gap-1.5">
              {chaletFor && (
                <span className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded">
                  {chaletFor}
                </span>
              )}
              {property.discountPercentage && property.discountPercentage > 0 && (
                <span className="bg-[#E55353] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded leading-none">
                  {property.discountPercentage}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Title */}
          <h3
            className="font-semibold text-sm sm:text-[15px] text-gray-900 dark:text-white mt-2 line-clamp-1 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors"
            title={title}
          >
            {title}
          </h3>

          {/* Row 3: District / Location */}
          <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {district}
          </p>

          {/* Row 4 & 5: Gathern Signature Specs Strip with Icons and Feature Badges */}
          <SearchCardSpecsStrip
            area={area}
            capacity={capacity}
            bedrooms={bedrooms}
            livingRooms={livingRooms}
            bathrooms={bathrooms}
            mainMajlisCapacity={mainMajlisCapacity}
            language={language}
            hasPool={hasPool}
            hasSelfCheckin={hasSelfCheckin}
            hasWifi={hasWifi}
            hasKitchen={hasKitchen}
            hasBbq={hasBbq}
            hasPlayground={hasPlayground}
            hasParking={hasParking}
          />
        </div>

        {/* Row 6: Pricing Row */}
        <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            {property.originalPrice && property.originalPrice > property.basePrice && (
              <span className="line-through text-rose-500 dark:text-rose-400 font-bold text-xs sm:text-sm">
                {property.originalPrice.toFixed(0)}
              </span>
            )}
            <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
              {property.basePrice.toFixed(property.basePrice % 1 !== 0 ? 2 : 0)}{" "}
              {language === "ar" ? "ر.س" : "SAR"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {language === "ar" ? "/ليلة" : "/night"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
