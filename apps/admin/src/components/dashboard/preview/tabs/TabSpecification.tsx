"use client";

import React from "react";
import { Bath, BedDouble, Maximize2, Sofa, Users, Waves } from "lucide-react";
import { AmenityIcon } from "@/lib/amenities";

interface FactCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function FactCard({ icon, label, value }: FactCardProps) {
  return (
    <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/40 p-3.5 shadow-sm transition hover:border-violet-300 dark:border-violet-500/25 dark:from-violet-950/35 dark:via-[#141022] dark:to-fuchsia-950/20 min-w-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700 shadow-xs dark:from-violet-500/20 dark:to-fuchsia-500/20 dark:text-violet-300 shrink-0">
        {icon}
      </span>
      <span
        className="mt-3 block truncate text-[10px] font-semibold uppercase tracking-wide text-violet-700/75 dark:text-violet-300/80"
        title={label}
      >
        {label}
      </span>
      <span
        className="mt-0.5 block truncate text-sm font-bold text-gray-900 dark:text-white"
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

export interface CategorizedAmenityGroup {
  id: string;
  titleAr: string;
  titleEn: string;
  iconName: string;
  amenities: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    iconName: string;
  }>;
}

interface TabSpecificationProps {
  specs?: string;
  categoryName: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  areaSqm: number;
  hasPool: boolean;
  categorizedAmenities: CategorizedAmenityGroup[];
  lang: "ar" | "en";
  t: (ar: string, en: string) => string;
}

export function TabSpecification({
  specs,
  categoryName,
  capacity,
  bedrooms,
  bathrooms,
  livingRooms,
  areaSqm,
  hasPool,
  categorizedAmenities,
  lang,
  t,
}: TabSpecificationProps) {
  return (
    <section className="py-8 border-b border-gray-100 dark:border-white/10 scroll-mt-28">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
        {t("تفاصيل الإقامة", "Stay details")}
      </span>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
        {t("المواصفات والتجهيزات", "Specification & Amenities")}
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {specs ||
          t(
            `${categoryName} · ${bedrooms} غرف نوم · يتسع لـ ${capacity} ضيف`,
            `${categoryName} · ${bedrooms} Bedrooms · Accommodates up to ${capacity} guests`
          )}
      </p>

      {/* 6-Fact Cards Grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <FactCard
          icon={<Users className="h-4 w-4 text-violet-500" />}
          label={t("السعة الإجمالية", "Capacity")}
          value={t(`حتى ${capacity} ضيوف`, `Up to ${capacity} guests`)}
        />
        <FactCard
          icon={<BedDouble className="h-4 w-4 text-violet-500" />}
          label={t("غرف النوم", "Bedrooms")}
          value={t(`${bedrooms} غرف نوم`, `${bedrooms} Bedrooms`)}
        />
        <FactCard
          icon={<Bath className="h-4 w-4 text-violet-500" />}
          label={t("دورات المياه", "Bathrooms")}
          value={t(`${bathrooms} دورات مياه`, `${bathrooms} Baths`)}
        />
        <FactCard
          icon={<Sofa className="h-4 w-4 text-violet-500" />}
          label={t("المجالس والصالات", "Living spaces")}
          value={t(`${livingRooms} مجالس ضيافة`, `${livingRooms} Majlis spaces`)}
        />
        <FactCard
          icon={<Maximize2 className="h-4 w-4 text-violet-500" />}
          label={t("المساحة الإجمالية", "Area")}
          value={`${areaSqm} m²`}
        />
        <FactCard
          icon={<Users className="h-4 w-4 text-violet-500" />}
          label={t("الفئة المسموحة", "Audience")}
          value={t("عوائل وعزاب", "Families & Singles")}
        />
      </div>

      {/* Swimming Pool Specs Card */}
      {hasPool && (
        <div className="mt-5 rounded-3xl border border-violet-200/80 bg-violet-50/35 p-5 dark:border-violet-500/20 dark:bg-[#12101a]">
          <div className="flex items-center gap-2 text-violet-800 dark:text-violet-300 font-bold text-sm mb-3">
            <Waves className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>{t("مواصفات المسبح والترفيه المائي", "Swimming Pool Specifications")}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
            <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224] min-w-0">
              <span className="text-gray-500 dark:text-gray-400 block truncate">
                {t("نوع المسبح", "Pool Type")}
              </span>
              <span className="mt-0.5 block font-bold text-gray-900 dark:text-white truncate">
                {t("مسبح خارجي خاص", "Outdoor Private Pool")}
              </span>
            </div>
            <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224] min-w-0">
              <span className="text-gray-500 dark:text-gray-400 block truncate">
                {t("حاجز الأمان", "Safety Barrier")}
              </span>
              <span className="mt-0.5 block font-bold text-gray-900 dark:text-white truncate">
                {t("متوفر حاجز حماية للأطفال", "Child safety barrier present")}
              </span>
            </div>
            <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224] min-w-0">
              <span className="text-gray-500 dark:text-gray-400 block truncate">
                {t("أبعاد المسبح", "Dimensions")}
              </span>
              <span className="mt-0.5 block font-bold text-gray-900 dark:text-white truncate">
                8m × 4m
              </span>
            </div>
            <div className="rounded-2xl border border-violet-200/70 bg-white p-3 dark:border-violet-500/20 dark:bg-[#161224] min-w-0">
              <span className="text-gray-500 dark:text-gray-400 block truncate">
                {t("عمق المسبح", "Depth")}
              </span>
              <span className="mt-0.5 block font-bold text-gray-900 dark:text-white truncate">
                1.2m - 1.8m
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Categorized Amenities */}
      <div className="mt-8 border-t border-violet-100/80 pt-6 dark:border-violet-500/15">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
          {t("المرافق المتاحة", "What's included")}
        </span>
        <h3 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">
          {t("المرافق والمواصفات الكاملة", "Amenities & Facilities")}
        </h3>

        <div className="mt-6 space-y-5">
          {categorizedAmenities.map((group) => (
            <div
              key={group.id}
              className="rounded-3xl border border-violet-200/80 bg-violet-50/35 p-5 shadow-xs dark:border-violet-500/20 dark:bg-[#12101a]"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-700 text-white shadow-sm shadow-violet-700/20 shrink-0">
                  <AmenityIcon name={group.iconName} className="h-4 w-4" />
                </span>
                <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  {lang === "ar" ? group.titleAr : group.titleEn}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {group.amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-2.5 rounded-2xl border border-violet-200/70 bg-white px-4 py-3 text-xs sm:text-[13px] text-gray-800 shadow-xs transition hover:border-violet-400 dark:border-violet-500/20 dark:bg-[#161224] dark:text-gray-200 min-w-0"
                  >
                    <span className="text-violet-600 dark:text-violet-400 shrink-0">
                      <AmenityIcon name={amenity.iconName} className="h-4 w-4" />
                    </span>
                    <span className="font-semibold truncate">
                      {lang === "ar" ? amenity.nameAr : amenity.nameEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

