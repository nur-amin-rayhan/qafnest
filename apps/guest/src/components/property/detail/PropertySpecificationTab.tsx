"use client";

import React from "react";
import {
  Users,
  BedDouble,
  Bath,
  Sofa,
  Maximize2,
  Waves,
  Zap,
  KeyRound,
  ShieldCheck,
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
    <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/40 p-3.5 shadow-sm transition hover:border-violet-300 dark:border-violet-500/25 dark:from-violet-950/35 dark:via-[#141022] dark:to-fuchsia-950/20">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700 shadow-xs dark:from-violet-500/20 dark:to-fuchsia-500/20 dark:text-violet-300">
        {icon}
      </span>
      <span className="mt-3 block text-[11px] font-bold uppercase tracking-wide text-violet-700/85 dark:text-violet-300/85">
        {label}
      </span>
      <span className="mt-0.5 block truncate text-sm sm:text-base font-black text-gray-950 dark:text-white">
        {value}
      </span>
    </div>
  );
}

export function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 px-3.5 py-1.5 text-xs font-black text-violet-900 shadow-2xs dark:border-violet-400/25 dark:from-violet-950/50 dark:via-purple-950/40 dark:to-fuchsia-950/40 dark:text-violet-200">
      {icon}
      {label}
    </span>
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
      className="scroll-mt-32 border-b border-gray-100 py-8 dark:border-white/10"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
        {anchorLabel("Stay details", "تفاصيل الإقامة")}
      </span>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
        {anchorLabel("Specification", "المواصفات")}
      </h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{specs}</p>

      {property.isLicensed && property.tourismLicenseNumber && (
        <div className="mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
          {anchorLabel("Tourism Ministry License Number", "رقم ترخيص وزارة السياحة")}:{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {property.tourismLicenseNumber}
          </span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Fact
          icon={<Users className="h-4 w-4 text-violet-500" />}
          label={anchorLabel("Capacity", "السعة الإجمالية")}
          value={anchorLabel(`Up to ${capacity} guests`, `حتى ${capacity} ضيوف`)}
        />
        {bedrooms !== null ? (
          <Fact
            icon={<BedDouble className="h-4 w-4 text-violet-500" />}
            label={anchorLabel("Bedrooms", "غرف النوم")}
            value={anchorLabel(`${bedrooms} Bedrooms`, `${bedrooms} غرف نوم`)}
          />
        ) : null}
        <Fact
          icon={<Bath className="h-4 w-4 text-violet-500" />}
          label={anchorLabel("Bathrooms", "دورات المياه")}
          value={anchorLabel(`${bathrooms} Baths`, `${bathrooms} دورات مياه`)}
        />
        <Fact
          icon={<Sofa className="h-4 w-4 text-violet-500" />}
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
            icon={<Maximize2 className="h-4 w-4 text-violet-500" />}
            label={anchorLabel("Area", "المساحة")}
            value={`${property.areaSqm} ${anchorLabel("m²", "م²")}`}
          />
        ) : null}
        <Fact
          icon={<Users className="h-4 w-4 text-violet-500" />}
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

      {/* Badges */}
      <div className="mt-4 flex flex-wrap gap-2">
        {property.instantBook && (
          <Badge
            icon={<Zap className="h-3.5 w-3.5" />}
            label={anchorLabel("Instant booking", "حجز فوري")}
          />
        )}
        {property.selfCheckin && (
          <Badge
            icon={<KeyRound className="h-3.5 w-3.5" />}
            label={anchorLabel("Self check-in", "دخول ذاتي")}
          />
        )}
        {property.hasPool && (
          <Badge icon={<Waves className="h-3.5 w-3.5" />} label={anchorLabel("Pool", "مسبح")} />
        )}
        {property.isLicensed && (
          <Badge
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label={anchorLabel("Licensed", "مرخص")}
          />
        )}
      </div>

      {/* Categorized Amenities */}
      <PropertyAmenitiesSection
        categorizedAmenities={categorizedAmenities}
        amenityGroups={amenityGroups}
        anchorLabel={anchorLabel}
      />
    </section>
  );
}
