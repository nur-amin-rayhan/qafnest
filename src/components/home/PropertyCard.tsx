"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Star, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Property } from "@/data/properties";
import { useApp } from "@/context/AppContext";

interface PropertyCardProps {
  property: Property;
  priority?: boolean;
}

export default function PropertyCard({ property, priority = false }: PropertyCardProps) {
  const { wishlist, toggleWishlist, openBookingModal, language } = useApp();
  const [activeIdx, setActiveIdx] = useState(0);

  const images = property.images && property.images.length > 0 ? property.images : [property.image];
  const isWishlisted = wishlist.includes(property.id);

  const title = language === "ar" ? (property.titleAr || property.title) : property.title;
  const district = language === "ar"
    ? (property.districtAr || property.district || property.cityName)
    : (property.district || property.cityName);

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
      onClick={() => openBookingModal(title, property.basePrice)}
      className="group relative flex flex-col rounded-2xl bg-white dark:bg-[#12101a] border border-violet-100 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/50 p-2 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(139,92,246,0.12)] cursor-pointer h-full"
    >
      {/* Image Carousel Container with Hover Arrows */}
      <div className="group/img relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5">
        <Image
          src={images[activeIdx]}
          alt={title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
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
          <div className="flex items-center gap-1 text-xs sm:text-[13px] text-gray-900 dark:text-gray-100 font-medium">
            <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900 dark:fill-amber-400 dark:text-amber-400" />
            <span className="font-bold">10.0</span>
            <span className="text-gray-600 dark:text-gray-400">
              ({property.reviewsCount}) {language === "ar" ? "تقييم" : "Reviews"}
            </span>
          </div>

          {/* Title */}
          <h3
            className="font-semibold text-sm sm:text-[15px] text-gray-900 dark:text-white mt-1 line-clamp-1 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors"
            title={title}
          >
            {title}
          </h3>

          {/* District / Location */}
          <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {district}
          </p>
        </div>

        {/* Pricing Row */}
        <div className="mt-2 flex flex-col">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            {property.discountPercentage && property.discountPercentage > 0 && (
              <span className="bg-[#E55353] text-white text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded leading-none">
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
            {!property.discountPercentage && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {language === "ar" ? "/ليلة" : "/night"}
              </span>
            )}
          </div>
          {property.discountPercentage && (
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {language === "ar" ? "/ليلة" : "/night"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
