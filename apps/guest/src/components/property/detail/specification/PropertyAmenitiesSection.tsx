"use client";

import { Home } from "lucide-react";
import { AmenityIcon } from "@/lib/amenities";

interface PropertyAmenitiesSectionProps {
  categorizedAmenities: Array<{
    id: string;
    iconName: string;
    titleEn: string;
    titleAr: string;
    amenities: Array<{
      id: string;
      iconName: string;
      nameEn: string;
      nameAr: string;
    }>;
  }>;
  amenityGroups: Array<{
    name: string;
    items: string[];
  }>;
  anchorLabel: (en: string, ar: string) => string;
}

export default function PropertyAmenitiesSection({
  categorizedAmenities,
  amenityGroups,
  anchorLabel,
}: PropertyAmenitiesSectionProps) {
  return (
    <div className="mt-8 border-t border-violet-100/80 pt-6 dark:border-violet-500/15">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
        {anchorLabel("What's included", "المرافق المتاحة")}
      </span>
      <h3 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">
        {anchorLabel("Amenities & Facilities", "المرافق والمواصفات الكاملة")}
      </h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {anchorLabel(
          "Comprehensive list of verified features and equipment available during your stay",
          "قائمة شاملة بكافة الخدمات والتجهيزات المتاحة لراحتك"
        )}
      </p>

      {categorizedAmenities.length > 0 ? (
        <div className="mt-6 space-y-5">
          {categorizedAmenities.map((group) => (
            <div
              key={group.id}
              className="rounded-3xl border border-violet-200/80 bg-violet-50/35 p-5 shadow-xs dark:border-violet-500/20 dark:bg-[#12101a]"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-700 text-white shadow-sm shadow-violet-700/20">
                  <AmenityIcon name={group.iconName} className="h-4 w-4" />
                </span>
                <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  {anchorLabel(group.titleEn, group.titleAr)}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {group.amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-2.5 rounded-2xl border border-violet-200/70 bg-white px-4 py-3 text-xs sm:text-[13px] text-gray-800 shadow-xs transition hover:border-violet-400 dark:border-violet-500/20 dark:bg-[#161224] dark:text-gray-200"
                  >
                    <span className="text-violet-600 dark:text-violet-400 shrink-0">
                      <AmenityIcon name={amenity.iconName} className="h-4 w-4" />
                    </span>
                    <span className="font-semibold">
                      {anchorLabel(amenity.nameEn, amenity.nameAr)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : amenityGroups.length ? (
        <div className="mt-6 space-y-4">
          {amenityGroups.map((group) => (
            <div key={group.name} className="grid gap-3 py-4 sm:grid-cols-[220px_minmax(0,1fr)]">
              <h4 className="flex items-start gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <Home className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                {group.name}
              </h4>
              <ul className="grid gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-violet-600 dark:text-violet-300">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          {anchorLabel(
            "No amenity details have been added to this listing yet.",
            "لم تتم إضافة تفاصيل المرافق لهذا العقار بعد."
          )}
        </p>
      )}
    </div>
  );
}

