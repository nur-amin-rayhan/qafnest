"use client";

import React from "react";
import type { Property } from "@/data/properties";
import GuestReviewsPanel from "@/components/property/GuestReviewsPanel";
import PropertySpecificationTab from "./PropertySpecificationTab";
import { PropertyLocationTab } from "./PropertyLocationTab";
import { PropertyTermsTab } from "./PropertyTermsTab";
import type { groupAmenitiesByCategory } from "@/lib/amenities";

export type PropertyDetailTab = "specification" | "reviews" | "location" | "terms";

interface PropertyTabsContainerProps {
  property: Property;
  activeTab: PropertyDetailTab;
  selectTab: (tab: PropertyDetailTab) => void;
  detailTabs: Array<{ id: PropertyDetailTab; label: string }>;
  specs: string;
  capacity: number;
  bedrooms: number | null;
  bathrooms: number;
  livingRooms: number;
  chaletFor: string;
  categorizedAmenities: ReturnType<typeof groupAmenitiesByCategory>;
  amenityGroups: Array<{ name: string; items: string[] }>;
  district: string;
  hasListedCoordinates: boolean;
  returnHref: string;
  anchorLabel: (en: string, ar: string) => string;
}

export function PropertyTabsContainer({
  property,
  activeTab,
  selectTab,
  detailTabs,
  specs,
  capacity,
  bedrooms,
  bathrooms,
  livingRooms,
  chaletFor,
  categorizedAmenities,
  amenityGroups,
  district,
  hasListedCoordinates,
  returnHref,
  anchorLabel,
}: PropertyTabsContainerProps) {
  return (
    <>
      {/* Tab navigation buttons */}
      <div
        className="sticky top-[72px] z-20 mt-7 flex w-fit max-w-full items-center gap-1.5 overflow-x-auto no-scrollbar rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-xs backdrop-blur dark:border-slate-800 dark:bg-[#0E0D16]/95"
        role="tablist"
        aria-label={anchorLabel("Property details", "تفاصيل العقار")}
      >
        {detailTabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`property-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="property-tab-panel"
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => selectTab(tab.id)}
            onKeyDown={(event) => {
              let nextIndex = index;
              if (event.key === "ArrowRight")
                nextIndex = (index + 1) % detailTabs.length;
              else if (event.key === "ArrowLeft")
                nextIndex = (index - 1 + detailTabs.length) % detailTabs.length;
              else if (event.key === "Home") nextIndex = 0;
              else if (event.key === "End") nextIndex = detailTabs.length - 1;
              else return;
              event.preventDefault();
              const nextTab = detailTabs[nextIndex];
              selectTab(nextTab.id);
              document.getElementById(`property-tab-${nextTab.id}`)?.focus();
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#4F2396] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id="property-tab-panel"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`property-tab-${activeTab}`}
        className="outline-none"
      >
        {activeTab === "specification" && (
          <PropertySpecificationTab
            property={property}
            specs={specs}
            capacity={capacity}
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            livingRooms={livingRooms}
            chaletFor={chaletFor}
            categorizedAmenities={categorizedAmenities}
            amenityGroups={amenityGroups}
            anchorLabel={anchorLabel}
          />
        )}

        {activeTab === "reviews" && <GuestReviewsPanel property={property} />}

        {activeTab === "location" && (
          <PropertyLocationTab
            property={property}
            district={district}
            hasListedCoordinates={hasListedCoordinates}
            returnHref={returnHref}
            anchorLabel={anchorLabel}
          />
        )}

        {activeTab === "terms" && (
          <PropertyTermsTab property={property} anchorLabel={anchorLabel} />
        )}
      </div>
    </>
  );
}

