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
  Bath,
  Waves,
  Key,
  Wifi,
  UtensilsCrossed,
  Flame,
  Gamepad2,
  Car,
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
  const area = property.areaSqm || (property.category === "penthouse" ? 220 : 350);
  const capacity =
    property.capacity ||
    parseInt(property.specs.match(/(\d+)\s*Guests?/i)?.[1] || "6", 10);
  const bedrooms =
    property.bedroomsCount ||
    parseInt(property.specs.match(/(\d+)\s*Bed/i)?.[1] || "2", 10);
  const livingRooms = property.livingRoomsCount ?? 1;
  const bathrooms = property.bathroomsCount || Math.max(1, bedrooms);
  const mainMajlisCapacity = property.majlisDetails?.mainMajlisCapacity;

  const chaletFor =
    language === "ar"
      ? property.chaletForAr || "عوائل فقط"
      : property.chaletForAr === "عوائل وعزاب"
      ? "Families & Singles"
      : "Families only";

  // Feature highlights with icons (Gathern Benchmark)
  const amenitiesList = property.amenities || [];
  const hasPool =
    property.hasPool ||
    amenitiesList.includes("private_pool") ||
    amenitiesList.includes("outdoor_pool") ||
    amenitiesList.includes("indoor_pool");
  const hasSelfCheckin =
    property.selfCheckin || amenitiesList.includes("self_checkin");
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
        if (
          event.target !== event.currentTarget ||
          (event.key !== "Enter" && event.key !== " ")
        )
          return;
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
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 dark:bg-black/85 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
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
          {/* Row 1: Star Rating + Target Group + Discount Pill */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-xs sm:text-[13px] text-gray-900 dark:text-gray-100 font-medium">
              <Star className="w-3.5 h-3.5 fill-black text-black dark:fill-amber-400 dark:text-amber-400" />
              <span className="font-bold">{property.rating.toFixed(1)}</span>
              <span className="text-gray-500 dark:text-gray-400">
                ({property.reviewsCount})
              </span>
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

          {/* Row 4: Gathern Signature Specs Strip with Icons */}
          <div className="flex items-center gap-2.5 sm:gap-3 mt-2 py-1.5 border-y border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300 text-[11px] sm:text-xs flex-wrap">
            {/* Area */}
            <div className="flex items-center gap-1" title={`${area} m²`}>
              <Maximize2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
              <span className="font-medium">
                {area} {language === "ar" ? "م²" : "m²"}
              </span>
            </div>

            {/* Guests */}
            <div className="flex items-center gap-1" title={`${capacity} Guests`}>
              <Users className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
              <span className="font-medium">
                {language === "ar" ? `سعة ${capacity}` : `${capacity} guests`}
              </span>
            </div>

            {/* Bedrooms */}
            <div className="flex items-center gap-1" title={`${bedrooms} Bedrooms`}>
              <Bed className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
              <span className="font-medium">
                {language === "ar" ? `${bedrooms} غرف` : `${bedrooms} bed`}
              </span>
            </div>

            {/* Majlis */}
            {mainMajlisCapacity ? (
              <div
                className="flex items-center gap-1"
                title={`Majlis: ${mainMajlisCapacity}`}
              >
                <Sofa className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="font-medium">
                  {language === "ar"
                    ? `مجلس ${mainMajlisCapacity}`
                    : `Majlis ${mainMajlisCapacity}`}
                </span>
              </div>
            ) : livingRooms > 0 ? (
              <div
                className="flex items-center gap-1"
                title={`${livingRooms} Living rooms`}
              >
                <Sofa className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <span className="font-medium">
                  {language === "ar"
                    ? `${livingRooms} صالة`
                    : `${livingRooms} living`}
                </span>
              </div>
            ) : null}

            {/* Bathrooms */}
            <div className="flex items-center gap-1" title={`${bathrooms} Bathrooms`}>
              <Bath className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
              <span className="font-medium">
                {language === "ar" ? `${bathrooms} حمام` : `${bathrooms} bath`}
              </span>
            </div>
          </div>

          {/* Row 5: Feature Badges Strip (Gathern Icon Badges) */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {hasPool && (
              <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-800/30 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-cyan-700 dark:text-cyan-300">
                <Waves className="w-3 h-3 text-cyan-500 shrink-0" />
                <span>{language === "ar" ? "مسبح" : "Pool"}</span>
              </span>
            )}
            {hasSelfCheckin && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/30 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-amber-700 dark:text-amber-300">
                <Key className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{language === "ar" ? "دخول ذاتي" : "Self check-in"}</span>
              </span>
            )}
            {hasWifi && (
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-800/30 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-violet-700 dark:text-violet-300">
                <Wifi className="w-3 h-3 text-violet-500 shrink-0" />
                <span>{language === "ar" ? "واي فاي" : "WiFi"}</span>
              </span>
            )}
            {hasKitchen && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/30 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                <UtensilsCrossed className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{language === "ar" ? "مطبخ" : "Kitchen"}</span>
              </span>
            )}
            {hasBbq && (
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-800/30 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-orange-700 dark:text-orange-300">
                <Flame className="w-3 h-3 text-orange-500 shrink-0" />
                <span>{language === "ar" ? "شواء" : "BBQ"}</span>
              </span>
            )}
            {hasPlayground && (
              <span className="inline-flex items-center gap-1 rounded-md bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-800/30 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-pink-700 dark:text-pink-300">
                <Gamepad2 className="w-3 h-3 text-pink-500 shrink-0" />
                <span>{language === "ar" ? "ألعاب أطفال" : "Playground"}</span>
              </span>
            )}
            {hasParking && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/30 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium text-blue-700 dark:text-blue-300">
                <Car className="w-3 h-3 text-blue-500 shrink-0" />
                <span>{language === "ar" ? "موقف خاص" : "Parking"}</span>
              </span>
            )}
          </div>
        </div>

        {/* Row 6: Pricing Row */}
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
