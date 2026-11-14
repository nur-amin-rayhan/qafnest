"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";

interface SearchCardImageCarouselProps {
  images: string[];
  activeIdx: number;
  title: string;
  priority?: boolean;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onPrev: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
}

export function SearchCardImageCarousel({
  images,
  activeIdx,
  title,
  priority = false,
  isWishlisted,
  onToggleWishlist,
  onPrev,
  onNext,
}: SearchCardImageCarouselProps) {
  return (
    <div className="group/img relative aspect-[16/11] w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5">
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
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 dark:bg-black/85 hover:bg-white dark:hover:bg-black text-gray-800 dark:text-white shadow-md flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </button>

          <button
            type="button"
            onClick={onNext}
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
          onToggleWishlist();
        }}
        className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 z-10 p-1.5 rounded-full bg-white/90 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 shadow-sm text-gray-700 dark:text-white transition-all cursor-pointer"
        aria-label="Wishlist"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            isWishlisted ? "fill-[#E55353] text-[#E55353]" : "text-gray-700 dark:text-white/90"
          }`}
        />
      </button>
    </div>
  );
}

