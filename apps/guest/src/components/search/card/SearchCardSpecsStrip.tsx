"use client";

import React from "react";
import {
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

interface SearchCardSpecsStripProps {
  area: number;
  capacity: number;
  bedrooms: number;
  livingRooms: number;
  bathrooms: number;
  mainMajlisCapacity?: number;
  language: "en" | "ar";
  hasPool: boolean;
  hasSelfCheckin: boolean;
  hasWifi: boolean;
  hasKitchen: boolean;
  hasBbq: boolean;
  hasPlayground: boolean;
  hasParking: boolean;
}

export function SearchCardSpecsStrip({
  area,
  capacity,
  bedrooms,
  livingRooms,
  bathrooms,
  mainMajlisCapacity,
  language,
  hasPool,
  hasSelfCheckin,
  hasWifi,
  hasKitchen,
  hasBbq,
  hasPlayground,
  hasParking,
}: SearchCardSpecsStripProps) {
  return (
    <>
      {/* Specs Strip with Icons */}
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

        {/* Majlis / Living */}
        {mainMajlisCapacity ? (
          <div className="flex items-center gap-1" title={`Majlis: ${mainMajlisCapacity}`}>
            <Sofa className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="font-medium">
              {language === "ar"
                ? `مجلس ${mainMajlisCapacity}`
                : `Majlis ${mainMajlisCapacity}`}
            </span>
          </div>
        ) : livingRooms > 0 ? (
          <div className="flex items-center gap-1" title={`${livingRooms} Living rooms`}>
            <Sofa className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
            <span className="font-medium">
              {language === "ar" ? `${livingRooms} صالة` : `${livingRooms} living`}
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

      {/* Feature Badges Strip */}
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
    </>
  );
}

