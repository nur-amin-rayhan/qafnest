"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star,
  Heart,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Users,
  Bed,
  Sofa,
  Tv,
  Coffee,
  Key,
  Waves,
} from "lucide-react";
import { Property } from "@/data/properties";
import { propertyDetailHref } from "@/lib/propertyUrls";
import { useApp } from "@/context/AppContext";

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

  const images =
    property.images && property.images.length > 0
      ? property.images
      : [property.image];
  const isWishlisted = wishlist.includes(property.id);
  const detailHref = propertyDetailHref(property.id, searchParams.toString());

  const title =
    language === "ar" ? property.titleAr || property.title : property.title;
  const district =
    language === "ar"
      ? property.districtAr || property.district || property.cityName
      : property.district || property.cityName;

  // Derive specs metrics from property
  const area = property.areaSqm || (property.category === "penthouse" ? 85 : 120);
  const capacity =
    property.capacity ||
    (parseInt(property.specs.match(/(\d+)\s*Guests?/i)?.[1] || "4", 10));
  const bedrooms =
    property.bedroomsCount ||
    (parseInt(property.specs.match(/(\d+)\s*Bed/i)?.[1] || "1", 10));
  const livingRooms = property.livingRoomsCount ?? 1;

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
        if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        router.push(detailHref);
      }}
      className="group relative flex flex-col rounded-2xl bg-white dark:bg-[#12101a] border border-gray-200/80 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/50 p-2.5 transition-all duration-300 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] cursor-pointer h-full"
    >
      {/* 1. Image Carousel Container with Hover Arrows & Dots */}
      <div className="group/img relative aspect-[16/11] w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5">
        <Image
          src={images[activeIdx]}
          alt={title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 dark:bg-black/85 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 dark:bg-black/85 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 pointer-events-none">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`transition-all duration-300 rounded-full ${
                    i === activeIdx
                      ? "w-2 h-2 bg-white scale-110 shadow-sm"
                      : "w-1.5 h-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Wishlist Heart Button (Top-Left like Gathern) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleWishlist(property.id);
          }}
          className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 z-10 p-1.5 rounded-full bg-white/90 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 shadow-sm text-gray-700 dark:text-white transition-all cursor-pointer"
          aria-label="Wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted
                ? "fill-[#E55353] text-[#E55353]"
                : "text-gray-700 dark:text-white/90"
            }`}
          />
        </button>
      </div>

      {/* 2. Card Body Matching Gathern Search Benchmark */}
      <div className="px-1 pt-2.5 pb-1 flex flex-col flex-grow justify-between">
        <div>
          {/* Row 1: Star Rating + Discount Pill */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs sm:text-[13px] text-gray-900 dark:text-gray-100 font-medium">
              <Star className="w-3.5 h-3.5 fill-black text-black dark:fill-amber-400 dark:text-amber-400" />
              <span className="font-bold">{property.rating.toFixed(1)}</span>
              <span className="text-gray-500 dark:text-gray-400">
                ({property.reviewsCount}) {language === "ar" ? "تقييم" : "Reviews"}
              </span>
            </div>

            {property.discountPercentage && property.discountPercentage > 0 && (
              <span className="bg-[#E55353] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded leading-none">
                {property.discountPercentage}% OFF
              </span>
            )}
          </div>

          {/* Row 2: Gathern Signature Specs Strip with Icons */}
          <div className="flex items-center gap-3 mt-2 py-1.5 border-y border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300 text-xs flex-wrap">
            {/* Area */}
            <div className="flex items-center gap-1" title={`${area} m²`}>
              <Maximize2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-medium">{area}</span>
            </div>

            {/* Guests */}
            <div className="flex items-center gap-1" title={`${capacity} Guests`}>
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-medium">{capacity}</span>
            </div>

            {/* Bedrooms */}
            <div className="flex items-center gap-1" title={`${bedrooms} Bedrooms`}>
              <Bed className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-medium">{bedrooms}</span>
            </div>

            {/* Living rooms */}
            {livingRooms > 0 && (
              <div className="flex items-center gap-1" title={`${livingRooms} Living rooms`}>
                <Sofa className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-medium">{livingRooms}</span>
              </div>
            )}

            {/* Key feature icons */}
            <div className="flex items-center gap-1.5 ml-auto rtl:mr-auto rtl:ml-0 text-gray-400">
              {property.hasPool && (
                <span title="Pool">
                  <Waves className="w-3.5 h-3.5 text-cyan-500" />
                </span>
              )}
              {property.selfCheckin && (
                <span title="Self Check-in">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                </span>
              )}
              <span title="Smart TV">
                <Tv className="w-3.5 h-3.5" />
              </span>
              <span title="Coffee Bar">
                <Coffee className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Row 3: Title */}
          <h3
            className="font-semibold text-sm sm:text-[15px] text-gray-900 dark:text-white mt-2 line-clamp-1 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors"
            title={title}
          >
            {title}
          </h3>

          {/* Row 4: District / Location */}
          <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {district}
          </p>
        </div>

        {/* Row 5: Pricing Row */}
        <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            {property.originalPrice && property.originalPrice > property.basePrice && (
              <span className="line-through text-gray-400 dark:text-gray-500 text-xs">
                {property.originalPrice.toFixed(2)}
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
