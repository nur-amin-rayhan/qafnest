"use client";

import React from "react";
import {
  Users,
  BedDouble,
  Bath,
  Sofa,
  Maximize2,
} from "lucide-react";
import type { Property } from "@/data/properties";
import PropertyPoolSpecs from "./specification/PropertyPoolSpecs";
import PropertyMajlisSpecs from "./specification/PropertyMajlisSpecs";
import PropertyAmenitiesSection from "./specification/PropertyAmenitiesSection";

interface PropertySpecificationTabProps {
  property: Property;
  specs: string;
  capacity: number;
  bedrooms: number | null;
  bathrooms: number;
  livingRooms: number;
  chaletFor: string;
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

export function Fact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/85 bg-slate-50/60 p-3.5 sm:p-4 transition hover:border-slate-300 dark:border-slate-800 dark:bg-[#110F18] dark:hover:border-slate-700">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#4F2396] dark:bg-purple-950/60 dark:text-purple-300">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="mt-0.5 block text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white leading-snug break-words">
          {value}
        </span>
      </div>
    </div>
  );
}

export default function PropertySpecificationTab({
  property,
  specs,
  capacity,
  bedrooms,
  bathrooms,
  livingRooms,
  chaletFor,
  categorizedAmenities,
  amenityGroups,
  anchorLabel,
}: PropertySpecificationTabProps) {
  return (
    <section
      id="specification"
      className="scroll-mt-32 border-b border-slate-200/80 py-8 dark:border-slate-800"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[#4F2396] dark:text-purple-300">
            {anchorLabel("Stay details", "تفاصيل الإقامة")}
          </span>
          <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {anchorLabel("Specification", "المواصفات الأساسية")}
          </h2>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{specs}</p>

      {property.isLicensed && property.tourismLicenseNumber && (
        <div className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          {anchorLabel("Tourism Ministry License Number", "رقم ترخيص وزارة السياحة")}:{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {property.tourismLicenseNumber}
          </span>
        </div>
      )}

      {/* Responsive Grid with Room for Full Text Without Truncation */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <Fact
          icon={<Users className="h-5 w-5" />}
          label={anchorLabel("Capacity", "السعة الإجمالية")}
          value={anchorLabel(`Up to ${capacity} guests`, `حتى ${capacity} ضيوف`)}
        />
        {bedrooms !== null ? (
          <Fact
            icon={<BedDouble className="h-5 w-5" />}
            label={anchorLabel("Bedrooms", "غرف النوم")}
            value={anchorLabel(`${bedrooms} Bedrooms`, `${bedrooms} غرف نوم`)}
          />
        ) : null}
        <Fact
          icon={<Bath className="h-5 w-5" />}
          label={anchorLabel("Bathrooms", "دورات المياه")}
          value={anchorLabel(`${bathrooms} Baths`, `${bathrooms} دورات مياه`)}
        />
        <Fact
          icon={<Sofa className="h-5 w-5" />}
          label={anchorLabel("Living spaces", "المجالس والصالات")}
          value={
            property.majlisDetails?.mainMajlisCapacity
              ? anchorLabel(
                  `Majlis for ${property.majlisDetails.mainMajlisCapacity}`,
                  `مجلس يسع ${property.majlisDetails.mainMajlisCapacity}`
                )
              : anchorLabel(`${livingRooms} Living spaces`, `${livingRooms} مجالس`)
          }
        />
        {property.areaSqm ? (
          <Fact
            icon={<Maximize2 className="h-5 w-5" />}
            label={anchorLabel("Area", "المساحة")}
            value={`${property.areaSqm} ${anchorLabel("m²", "م²")}`}
          />
        ) : null}
        <Fact
          icon={<Users className="h-5 w-5" />}
          label={anchorLabel("Target audience", "الفئة المسموحة")}
          value={chaletFor}
        />
      </div>

      {/* Pool & Leisure Specs */}
      {property.hasPool && (
        <PropertyPoolSpecs poolDetails={property.poolDetails} anchorLabel={anchorLabel} />
      )}

      {/* Majlis & Seating Specs */}
      {property.majlisDetails && (
        <PropertyMajlisSpecs
          majlisDetails={property.majlisDetails}
          chaletFor={chaletFor}
          anchorLabel={anchorLabel}
        />
      )}

      {/* Categorized Amenities */}
      <PropertyAmenitiesSection
        categorizedAmenities={categorizedAmenities}
        amenityGroups={amenityGroups}
        anchorLabel={anchorLabel}
      />
    </section>
  );
}
