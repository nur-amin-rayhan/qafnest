"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Property } from "@/data/properties";
import { useApp } from "@/context/AppContext";
import PropertyCard from "@/components/home/PropertyCard";

interface PropertySectionProps {
  id?: string;
  sectionKey: "kidia" | "sea" | "fog" | "roses" | "deals" | string;
  title: string;
  titleAr: string;
  properties: Property[];
  isFirstSection?: boolean;
}

export default function PropertySection({
  id,
  title,
  titleAr,
  properties,
  isFirstSection = false,
}: PropertySectionProps) {
  const { language } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const isRtl = document.documentElement.dir === "rtl" || language === "ar";
    const delta = direction === "left" ? -320 : 320;
    scrollRef.current.scrollBy({
      left: isRtl ? -delta : delta,
      behavior: "smooth",
    });
  };

  if (!properties || properties.length === 0) return null;

  return (
    <section id={id} className="pt-2 pb-6 relative z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section Header with Title and Scroll Controls */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {language === "ar" ? titleAr : title}
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 bg-white dark:bg-[#12101a] text-gray-700 dark:text-gray-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              aria-label="Previous properties"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30 bg-white dark:bg-[#12101a] text-gray-700 dark:text-gray-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
              aria-label="Next properties"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Functional Horizontal Scrolling Grid */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 px-1 -mx-1"
        >
          {properties.map((property, idx) => (
            <div
              key={property.id}
              className="w-[220px] sm:w-[235px] md:w-[245px] shrink-0"
            >
              <PropertyCard property={property} priority={isFirstSection && idx < 2} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
