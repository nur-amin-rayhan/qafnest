"use client";

import React, { useEffect, useRef, useState } from "react";
import { loadGoogleMapsScript, getGoogleMapsApiKey } from "@/lib/geo/googleMapsLoader";
import { Layers, Loader2 } from "lucide-react";

interface GoogleMapCanvasProps {
  lat: number;
  lng: number;
  embedUrl?: string;
  mapViewMode?: "embed" | "pin";
  onMapViewModeChange?: (mode: "embed" | "pin") => void;
  onLocationChange: (lat: number, lng: number) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  fallbackContent: React.ReactNode;
}

export function GoogleMapCanvas({
  lat,
  lng,
  embedUrl,
  mapViewMode = "embed",
  onMapViewModeChange,
  onLocationChange,
  lang,
  t,
  fallbackContent,
}: GoogleMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "loaded" | "fallback">("idle");
  const apiKey = getGoogleMapsApiKey();

  // 1. Load Google Maps Script
  useEffect(() => {
    if (!apiKey) {
      setLoadStatus("fallback");
      return;
    }

    let isMounted = true;
    setLoadStatus("loading");

    loadGoogleMapsScript(lang)
      .then(() => {
        if (isMounted) setLoadStatus("loaded");
      })
      .catch((err) => {
        console.warn("Notice: Google Maps API unavailable, falling back to local interactive map:", err?.message);
        if (isMounted) setLoadStatus("fallback");
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey, lang]);

  // 2. Initialize Google Map & Draggable Marker
  useEffect(() => {
    if (loadStatus !== "loaded" || !containerRef.current || !window.google?.maps) return;

    if (!mapRef.current) {
      const mapInstance = new window.google.maps.Map(containerRef.current, {
        center: { lat, lng },
        zoom: 16,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false, // Handled by our custom UI
        gestureHandling: "greedy",
      });

      const markerIcon = {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: "#4F2396",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#FFFFFF",
        scale: 1.8,
        anchor: new window.google.maps.Point(12, 22),
      };

      const markerInstance = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        icon: markerIcon,
        title: lang === "ar" ? "موقع العقار (اسحب لتعديل الموقع)" : "Property Location (Drag to adjust)",
      });

      // Handle marker dragend
      markerInstance.addListener("dragend", () => {
        const pos = markerInstance.getPosition();
        if (pos) {
          const nextLat = Number(pos.lat().toFixed(5));
          const nextLng = Number(pos.lng().toFixed(5));
          onLocationChange(nextLat, nextLng);
        }
      });

      // Handle map click
      mapInstance.addListener("click", (e: any) => {
        if (e.latLng) {
          const nextLat = Number(e.latLng.lat().toFixed(5));
          const nextLng = Number(e.latLng.lng().toFixed(5));
          markerInstance.setPosition({ lat: nextLat, lng: nextLng });
          onLocationChange(nextLat, nextLng);
        }
      });

      mapRef.current = mapInstance;
      markerRef.current = markerInstance;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadStatus]);

  // 3. Keep Marker & Map synchronized when coordinates change externally
  useEffect(() => {
    if (loadStatus !== "loaded" || !mapRef.current || !markerRef.current) return;
    const currentPos = markerRef.current.getPosition();
    if (
      !currentPos ||
      Math.abs(currentPos.lat() - lat) > 0.0001 ||
      Math.abs(currentPos.lng() - lng) > 0.0001
    ) {
      markerRef.current.setPosition({ lat, lng });
      mapRef.current.panTo({ lat, lng });
    }
  }, [lat, lng, loadStatus]);

  if (loadStatus === "fallback") {
    const resolvedEmbedSrc =
      embedUrl ||
      `https://maps.google.com/maps?q=${Number(lat.toFixed(6))},${Number(lng.toFixed(6))}&hl=${lang}&z=15&output=embed`;

    return (
      <div className="relative h-full w-full">
        {/* Map Mode Switcher: Embedded Google Map vs Interactive Pin Grid */}
        {onMapViewModeChange && (
          <div className="absolute top-2.5 start-2.5 z-30 inline-flex items-center rounded-xl bg-white/95 p-0.5 shadow-md backdrop-blur-md border border-slate-200/90">
            <button
              type="button"
              onClick={() => onMapViewModeChange("embed")}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition cursor-pointer ${
                mapViewMode === "embed"
                  ? "bg-[#4F2396] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t("Embedded Map", "خريطة جوجل")}
            </button>
            <button
              type="button"
              onClick={() => onMapViewModeChange("pin")}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition cursor-pointer ${
                mapViewMode === "pin"
                  ? "bg-[#4F2396] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t("Interactive Pin", "تحديد الدبوس")}
            </button>
          </div>
        )}

        {mapViewMode === "embed" ? (
          <iframe
            key={resolvedEmbedSrc}
            title={t("Property Location Google Map", "خريطة جوجل لموقع العقار")}
            src={resolvedEmbedSrc}
            className="h-full w-full border-0 bg-slate-100"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <>{fallbackContent}</>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {loadStatus === "loading" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-xs">
          <Loader2 className="h-7 w-7 animate-spin text-[#4F2396]" />
          <span className="mt-2 text-xs font-extrabold text-slate-700">
            {t("Loading Google Maps...", "جاري تحميل خرائط جوجل...")}
          </span>
        </div>
      )}

      {/* Google Map canvas mount target */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Status Pill Indicator */}
      <div className="absolute top-2.5 start-2.5 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold text-white shadow">
          <Layers size={11} className="text-emerald-400" />
          <span>Google Maps Live</span>
        </span>
      </div>
    </div>
  );
}

