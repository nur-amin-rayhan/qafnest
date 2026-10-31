"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star,
  Heart,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Users,
  Bed,
  Waves,
  Key,
  Wifi,
} from "lucide-react";
import { Property } from "@/data/properties";
import { propertyDetailHref } from "@/lib/propertyUrls";
import { useApp } from "@/context/AppContext";

interface PropertyCardProps {
  property: Property;
  priority?: boolean;
}

export default function PropertyCard({
  property,
  priority = false,
}: PropertyCardProps) {
  const { wishlist, toggleWishlist, language } = useApp();
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);

  const images =
    property.images && property.images.length > 0
      ? property.images
      : [property.image];
  const isWishlisted = wishlist.includes(property.id);
  const detailHref = propertyDetailHref(property.id);

  const title =
    language === "ar" ? property.titleAr || property.title : property.title;
  const district =
    language === "ar"
      ? property.districtAr || property.district || property.cityName
      : property.district || property.cityName;

  const area = property.areaSqm || (property.category === "penthouse" ? 220 : 350);
  const capacity =
    property.capacity ||
    parseInt(property.specs.match(/(\d+)\s*Guests?/i)?.[1] || "6", 10);
  const bedrooms =
    property.bedroomsCount ||
    parseInt(property.specs.match(/(\d+)\s*Bed/i)?.[1] || "2", 10);

  const amenitiesList = property.amenities || [];
  const hasPool =
    property.hasPool ||
    amenitiesList.includes("private_pool") ||
    amenitiesList.includes("outdoor_pool") ||
    amenitiesList.includes("indoor_pool");
  const hasSelfCheckin =
    property.selfCheckin || amenitiesList.includes("self_checkin");
  const hasWifi = amenitiesList.includes("wifi");

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
      className="group relative flex flex-col rounded-2xl bg-white dark:bg-[#12101a] border border-violet-100 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/50 p-2 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(139,92,246,0.12)] cursor-pointer h-full"
    >
      {/* Image Carousel Container with Hover Arrows */}
      <div className="group/img relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5">
        <Image
          src={images[activeIdx]}
          alt={title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 240px, (max-width: 1024px) 240px, 260px"
          className="object-cover transition-opacity duration-300 group-hover:scale-105"
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

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleWishlist(property.id);
          }}
          className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 z-10 p-1.5 rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-sm text-white transition-all cursor-pointer"
          aria-label="Wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? "fill-[#E55353] text-[#E55353]" : "text-white"
            }`}
          />
        </button>
      </div>

      {/* Property Details Matching Gathern Spec */}
      <div className="px-1 pt-2.5 pb-1 flex flex-col flex-grow justify-between">
        <div>
          {/* Star Rating & Reviews */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-xs text-gray-900 dark:text-gray-100 font-medium">
              <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900 dark:fill-amber-400 dark:text-amber-400" />
              <span className="font-bold">{property.rating.toFixed(1)}</span>
              <span className="text-gray-500 dark:text-gray-400">
                ({property.reviewsCount})
              </span>
            </div>

            {property.chaletForAr && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                {language === "ar" ? property.chaletForAr : property.chaletForAr === "عوائل وعزاب" ? "Families & Singles" : "Families"}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="font-semibold text-sm text-gray-900 dark:text-white mt-1 line-clamp-1 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors"
            title={title}
          >
            {title}
          </h3>

          {/* District / Location */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {district}
          </p>

          {/* Compact Feature Strip with Icons */}
          <div className="flex items-center gap-2 mt-1.5 py-1 border-t border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 text-[11px] flex-wrap">
            <div className="flex items-center gap-0.5" title={`${bedrooms} Bedrooms`}>
              <Bed className="w-3 h-3 text-gray-400" />
              <span>{bedrooms}</span>
            </div>
            <div className="flex items-center gap-0.5" title={`Up to ${capacity} Guests`}>
              <Users className="w-3 h-3 text-gray-400" />
              <span>{capacity}</span>
            </div>
            <div className="flex items-center gap-0.5" title={`${area} m²`}>
              <Maximize2 className="w-3 h-3 text-gray-400" />
              <span>{area}m²</span>
            </div>

            <div className="flex items-center gap-1 ml-auto rtl:mr-auto rtl:ml-0">
              {hasPool && (
                <span title="Swimming Pool">
                  <Waves className="w-3 h-3 text-cyan-500" />
                </span>
              )}
              {hasSelfCheckin && (
                <span title="Self Check-in">
                  <Key className="w-3 h-3 text-amber-500" />
                </span>
              )}
              {hasWifi && (
                <span title="High-speed WiFi">
                  <Wifi className="w-3 h-3 text-violet-500" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Row */}
        <div className="mt-2 flex flex-col border-t border-gray-100 dark:border-white/5 pt-1.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {property.discountPercentage && property.discountPercentage > 0 && (
              <span className="bg-[#E55353] text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">
                {property.discountPercentage}%
              </span>
            )}
            {property.originalPrice && property.originalPrice > property.basePrice && (
              <span className="line-through text-gray-400 dark:text-gray-500 text-xs">
                {property.originalPrice}
              </span>
            )}
            <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
              {property.basePrice} {language === "ar" ? "ر.س" : "SAR"}
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
