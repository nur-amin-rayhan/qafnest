"use client";

import React from "react";
import { PropertyItem } from "../types";
import { TabSpecification, CategorizedAmenityGroup } from "./tabs/TabSpecification";
import { TabReviews } from "./tabs/TabReviews";
import { TabLocation } from "./tabs/TabLocation";
import { TabTerms } from "./tabs/TabTerms";

type TabType = "specification" | "reviews" | "location" | "terms";

interface PreviewContentTabsProps {
  property: PropertyItem;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lang: "ar" | "en";
  t: (ar: string, en: string) => string;
  categoryName: string;
  cityName: string;
  district: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  areaSqm: number;
  hasPool: boolean;
  categorizedAmenities: CategorizedAmenityGroup[];
}

export function PreviewContentTabs({
  property,
  activeTab,
  setActiveTab,
  lang,
  t,
  categoryName,
  cityName,
  district,
  capacity,
  bedrooms,
  bathrooms,
  livingRooms,
  areaSqm,
  hasPool,
  categorizedAmenities,
}: PreviewContentTabsProps) {
  return (
    <div className="min-w-0">
      {/* Sticky Tab Navigation Bar */}
      <div className="sticky top-[64px] z-20 mt-7 w-fit max-w-full overflow-x-auto rounded-full border border-violet-200/85 bg-white/95 p-1.5 shadow-md shadow-violet-900/5 backdrop-blur-md dark:border-violet-500/30 dark:bg-[#12101a]/95">
        {(
          [
            { id: "specification", label: t("المواصفات والمرافق", "Specification") },
            { id: "reviews", label: t("تقييمات الضيوف", "Guest reviews") },
            { id: "location", label: t("الموقع والخريطة", "Location & map") },
            { id: "terms", label: t("الشروط والسياسات", "Terms & policies") },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-sm shadow-violet-600/25"
                : "text-gray-700 hover:bg-violet-50 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-violet-400/10 dark:hover:text-violet-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SPECIFICATION & AMENITIES */}
      {activeTab === "specification" && (
        <TabSpecification
          specs={property.specs}
          categoryName={categoryName}
          capacity={capacity}
          bedrooms={bedrooms}
          bathrooms={bathrooms}
          livingRooms={livingRooms}
          areaSqm={areaSqm}
          hasPool={hasPool}
          categorizedAmenities={categorizedAmenities}
          lang={lang}
          t={t}
        />
      )}

      {/* TAB 2: GUEST REVIEWS */}
      {activeTab === "reviews" && <TabReviews t={t} />}

      {/* TAB 3: LOCATION & MAP */}
      {activeTab === "location" && (
        <TabLocation
          district={district}
          cityName={cityName}
          address={
            lang === "ar"
              ? property.address_ar || property.address
              : property.address || property.address_ar
          }
          lat={property.lat}
          lng={property.lng}
          lang={lang}
          t={t}
        />
      )}

      {/* TAB 4: TERMS & POLICIES */}
      {activeTab === "terms" && <TabTerms t={t} />}
    </div>
  );
}
