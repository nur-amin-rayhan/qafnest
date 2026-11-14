"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, MapPin } from "lucide-react";
import { formatPropertyAddressLine, resolvePropertyGoogleMapsUrl } from "@qafnest/shared";
import InteractiveMapView from "@/components/search/InteractiveMapView";
import { useApp } from "@/context/AppContext";
import type { Property } from "@/data/properties";

interface PropertyLocationTabProps {
  property: Property;
  district: string;
  hasListedCoordinates: boolean;
  returnHref: string;
  anchorLabel: (en: string, ar: string) => string;
}

export function PropertyLocationTab({
  property,
  district,
  hasListedCoordinates,
  returnHref,
  anchorLabel,
}: PropertyLocationTabProps) {
  const router = useRouter();
  const { language } = useApp();
  const [mapMode, setMapMode] = useState<"embed" | "interactive">("embed");

  const queryTarget =
    hasListedCoordinates && Number.isFinite(property.lat) && Number.isFinite(property.lng)
      ? `${Number(property.lat!.toFixed(6))},${Number(property.lng!.toFixed(6))}`
      : `${district} ${property.cityName || property.city || ""}`.trim();
  const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
    queryTarget
  )}&hl=${language === "ar" ? "ar" : "en"}&z=${hasListedCoordinates ? 15 : 13}&output=embed`;
  const formattedAddress = formatPropertyAddressLine(property, language) || district;
  const externalMapsUrl =
    resolvePropertyGoogleMapsUrl(property) ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryTarget)}`;

  return (
    <section id="location" className="scroll-mt-32 py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
            {anchorLabel("Explore the area", "اكتشف المنطقة")}
          </span>
          <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">
            {anchorLabel("Location and map", "الموقع والخريطة")}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-500" />
            <span>{formattedAddress}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!hasListedCoordinates && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
              {anchorLabel("Approximate area", "موقع تقريبي")}
            </span>
          )}
          <div className="inline-flex items-center rounded-full border border-violet-200 dark:border-white/15 bg-white dark:bg-white/5 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMapMode("embed")}
              className={`rounded-full px-3 py-1 transition cursor-pointer ${
                mapMode === "embed"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {anchorLabel("Google Map", "خريطة جوجل")}
            </button>
            <button
              type="button"
              onClick={() => setMapMode("interactive")}
              className={`rounded-full px-3 py-1 transition cursor-pointer ${
                mapMode === "interactive"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {anchorLabel("Area View", "عرض الحي")}
            </button>
          </div>
          <a
            href={externalMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-500/15 px-3 py-1.5 text-[11px] font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition"
          >
            <ExternalLink className="h-3 w-3" />
            <span>{anchorLabel("Open in Maps", "فتح في الخرائط")}</span>
          </a>
        </div>
      </div>

      {mapMode === "embed" ? (
        <div className="relative aspect-[16/9] min-h-[300px] w-full overflow-hidden rounded-3xl border border-violet-200/80 dark:border-white/15 bg-gray-100 dark:bg-white/5 shadow-inner">
          <iframe
            key={embedSrc}
            title={`${district} Google Map`}
            src={embedSrc}
            className="h-full w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : (
        <InteractiveMapView
          properties={[property]}
          selectedPropertyId={property.id}
          onSelectProperty={() => undefined}
          onClose={() => router.push(returnHref)}
        />
      )}

      <p className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
        {anchorLabel(
          "For privacy, map locations may be approximate. Exact access details are shared after booking confirmation.",
          "حفاظاً على الخصوصية، قد يكون موقع الخريطة تقريبياً. تتم مشاركة تفاصيل الوصول الدقيقة بعد تأكيد الحجز."
        )}
      </p>
    </section>
  );
}

