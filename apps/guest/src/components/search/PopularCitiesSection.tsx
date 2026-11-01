"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface PopularCitiesSectionProps {
  onSelectCity: (cityId: string) => void;
}

const POPULAR_CITIES = [
  {
    id: "jeddah",
    name: "Jeddah",
    nameAr: "جدة",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&fit=crop",
    staysCount: 420,
  },
  {
    id: "dammam",
    name: "Dammam",
    nameAr: "الدمام",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&fit=crop",
    staysCount: 185,
  },
  {
    id: "abha",
    name: "Abha",
    nameAr: "أبها",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&fit=crop",
    staysCount: 230,
  },
  {
    id: "alula",
    name: "AlUla",
    nameAr: "العلا",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&fit=crop",
    staysCount: 95,
  },
  {
    id: "taif",
    name: "Taif",
    nameAr: "الطائف",
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&fit=crop",
    staysCount: 160,
  },
  {
    id: "khobar",
    name: "Al Khobar",
    nameAr: "الخبر",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&fit=crop",
    staysCount: 210,
  },
];

export default function PopularCitiesSection({
  onSelectCity,
}: PopularCitiesSectionProps) {
  const { language } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const delta = dir === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="pt-12 pb-16 relative z-10 border-t border-gray-200/80 dark:border-white/10 mt-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header matching Gathern Screenshot */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-violet-950 dark:text-white tracking-tight">
            {language === "ar"
              ? "المدن الأكثر طلباً الأسبوع الماضي"
              : "Popular Cities Last Week"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {language === "ar"
              ? "هذه القائمة قد تنال إعجابك واهتمامك"
              : "This list maybe interesting for you"}
          </p>
        </div>

        {/* Carousel with Navigation Arrows */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => scroll("left")}
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-[#181524] text-gray-800 dark:text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Previous cities"
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>

          {/* Cards Strip */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-5 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
          >
            {POPULAR_CITIES.map((city) => (
              <div
                key={city.id}
                onClick={() => onSelectCity(city.id)}
                className="w-[280px] sm:w-[320px] shrink-0 group rounded-3xl overflow-hidden bg-white dark:bg-[#14121F] border border-gray-200/80 dark:border-white/10 hover:border-violet-400 dark:hover:border-violet-500/50 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Photo */}
                <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={city.image}
                    alt={city.name}
                    fill
                    sizes="320px"
                    className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                  <span className="absolute bottom-3 left-4 rtl:left-auto rtl:right-4 text-white font-bold text-lg sm:text-xl drop-shadow">
                    {language === "ar" ? city.nameAr : city.name}
                  </span>
                </div>

                {/* Footer text */}
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-violet-600" />
                    <span>{city.staysCount} {language === "ar" ? "إقامة متاحة" : "Stays available"}</span>
                  </span>
                  <span className="font-bold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                    {language === "ar" ? "استكشف ←" : "Explore →"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => scroll("right")}
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border border-gray-200 dark:border-white/15 bg-white dark:bg-[#181524] text-gray-800 dark:text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Next cities"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </section>
  );
}
