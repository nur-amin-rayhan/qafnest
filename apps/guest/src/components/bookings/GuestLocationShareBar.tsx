"use client";

import React from "react";
import { MapPin, ExternalLink } from "lucide-react";
import {
  resolvePropertyGoogleMapsUrl,
  formatPropertyAddressLine,
  type PropertyLocationFields,
} from "@qafnest/shared";
import { getLocalizedPropertyTitle } from "@/lib/localization/localeHelper";

export interface ShareablePropertyLocation extends PropertyLocationFields {
  id?: string | null;
  title?: string | null;
  titleAr?: string | null;
  title_ar?: string | null;
  city?: string | null;
  city_name?: string | null;
  state?: string | null;
  stateAr?: string | null;
  state_ar?: string | null;
  district?: string | null;
  districtAr?: string | null;
  district_ar?: string | null;
  street?: string | null;
  streetAr?: string | null;
  street_ar?: string | null;
  address?: string | null;
  addressAr?: string | null;
  address_ar?: string | null;
  postalCode?: string | null;
  postal_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  googleMapsUrl?: string | null;
  google_maps_url?: string | null;
}

interface GuestLocationShareBarProps {
  property: ShareablePropertyLocation | null | undefined;
  bookingRef?: string | null;
  language: "en" | "ar";
  label: (en: string, ar: string) => string;
  variant?: "strip" | "card";
}

function toLocationFields(
  property: ShareablePropertyLocation,
  language: "en" | "ar"
): PropertyLocationFields {
  const localizedTitle = getLocalizedPropertyTitle(
    {
      id: property.id || undefined,
      title: property.title || undefined,
      titleAr: property.titleAr ?? property.title_ar ?? undefined,
    },
    language
  );
  return {
    title: property.title || localizedTitle,
    titleAr: property.titleAr ?? property.title_ar ?? localizedTitle,
    city: property.city_name || property.city || null,
    state: property.state || null,
    stateAr: property.stateAr ?? property.state_ar ?? null,
    district: property.district || null,
    districtAr: property.districtAr ?? property.district_ar ?? null,
    street: property.street || null,
    streetAr: property.streetAr ?? property.street_ar ?? null,
    address: property.address || null,
    addressAr: property.addressAr ?? property.address_ar ?? null,
    postalCode: property.postalCode ?? property.postal_code ?? null,
    lat: property.lat ?? null,
    lng: property.lng ?? null,
    googleMapsUrl: property.googleMapsUrl ?? property.google_maps_url ?? null,
  };
}

export default function GuestLocationShareBar({
  property,
  language,
  label,
  variant = "strip",
}: GuestLocationShareBarProps) {
  if (!property) return null;

  const fields = toLocationFields(property, language);
  const mapsUrl = resolvePropertyGoogleMapsUrl(fields);
  const addressLine = formatPropertyAddressLine(fields, language);

  if (!mapsUrl && !addressLine) return null;

  const containerClass =
    variant === "card"
      ? "mt-4 rounded-2xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-500/25 dark:bg-violet-500/5"
      : "border-t border-violet-100 bg-violet-50/40 px-5 py-4 dark:border-violet-500/15 dark:bg-violet-500/[0.04] sm:px-6";

  return (
    <div className={containerClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900 dark:text-violet-200">
            <MapPin className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
            <span>{label("Property Location & Directions", "موقع العقار والاتجاهات")}</span>
          </div>
          {addressLine && (
            <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              {addressLine}
            </p>
          )}
        </div>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-xs hover:bg-violet-50 dark:border-violet-500/30 dark:bg-white/5 dark:text-violet-300 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{label("Open Map", "فتح الخريطة")}</span>
          </a>
        )}
      </div>
    </div>
  );
}
