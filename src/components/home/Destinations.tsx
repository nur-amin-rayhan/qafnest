"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { DESTINATIONS, Destination } from "@/data/properties";
import { useApp } from "@/context/AppContext";
import { CITY_NAMES_AR } from "@/data/translations";

export default function Destinations() {
  const { selectedCity, setSelectedCity, rentMode, setRentMode, language, t } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const router = useRouter();

  const handleDestinationClick = (dest: Destination) => {
    if (dest.isMonthly) {
      setRentMode(rentMode === "monthly" ? "daily" : "monthly");
    } else {
      setSelectedCity(selectedCity === dest.city ? "all" : dest.city);
    }
    const propertiesEl = document.getElementById("properties");
    if (propertiesEl) {
      propertiesEl.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/search?city=${dest.city}`);
    }
  };

  return (
    <section id="destinations" className="pt-2 pb-3 sm:pb-4 relative z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* ========================================================= */}
        {/* A Place to Stay Wherever You Go - Circular Destinations   */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between gap-4 mb-3 sm:mb-4">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 mb-1.5 border border-violet-200 dark:border-violet-500/20"
            >
              <MapPin className="w-3.5 h-3.5 text-violet-600 dark:text-fuchsia-400" />
              {t.destinations.badge}
            </span>
            <h2
              className="font-display text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
            >
              {t.destinations.title} <span className="text-gradient">{t.destinations.titleHighlight}</span>
            </h2>
          </div>

          {/* Left / Right Carousel Navigation Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll destinations left"
              className="h-9 w-9 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-800 dark:text-white hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/20 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll destinations right"
              className="h-9 w-9 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-800 dark:text-white hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/20 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Circular Destination Avatars Strip */}
        <div
          ref={scrollRef}
          className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
        >
          {DESTINATIONS.map((dest) => {
            const isMonthlySelected = dest.isMonthly && rentMode === "monthly";
            const isCitySelected = !dest.isMonthly && selectedCity === dest.city;
            const isSelected = isMonthlySelected || isCitySelected;

            return (
              <div
                key={dest.id}
                onClick={() => handleDestinationClick(dest)}
                className="flex flex-col items-center shrink-0 cursor-pointer group text-center select-none"
                style={{ width: "88px" }}
              >
                {/* Avatar Circle Container */}
                <div
                  className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden transition-all duration-300 p-0.5 ${
                    isSelected
                      ? "ring-3 ring-violet-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105"
                      : "ring-1 ring-gray-200 dark:ring-white/15 hover:ring-violet-400 hover:scale-105"
                  }`}
                >
                  {dest.isMonthly ? (
                    /* Monthly Stays Special Circular Gradient */
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 flex flex-col items-center justify-center text-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.3)_0%,_transparent_70%)]" />
                      <CalendarDays className="w-6 h-6 mb-0.5 text-white drop-shadow" />
                      <span className="text-[9px] font-extrabold uppercase tracking-tight bg-black/40 px-1.5 py-0.5 rounded-full border border-white/20">
                        -35%
                      </span>
                    </div>
                  ) : (
                    /* Standard City Photo Avatar */
                    <div className="w-full h-full rounded-full overflow-hidden relative">
                      <Image
                        src={dest.image}
                        alt={dest.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="80px"
                      />
                      <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors" />
                    </div>
                  )}

                  {/* Active Indicator Pip */}
                  {isSelected && (
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0E0E1A] shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                  )}
                </div>

                {/* Name Label */}
                <span
                  className={`mt-2 text-xs font-semibold leading-tight transition-colors line-clamp-1 ${
                    isSelected
                      ? "text-violet-600 dark:text-violet-300 font-bold"
                      : "text-gray-900 dark:text-white/90 group-hover:text-violet-600 dark:group-hover:text-violet-300"
                  }`}
                >
                  {language === "ar" ? (CITY_NAMES_AR[dest.city] || dest.name) : dest.name}
                </span>

                {/* Subtle Stays Count / Subtitle */}
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[80px]">
                  {dest.isMonthly ? t.destinations.longStays : `${dest.count}+ ${t.destinations.staysCount}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
