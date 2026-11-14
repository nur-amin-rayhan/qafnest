"use client";

import React, { useState } from "react";
import { MapPin, CheckCircle2, ExternalLink } from "lucide-react";
import type { WizardDraft } from "./types";
import { CitySearchSelect } from "./location/CitySearchSelect";
import { LocationAddressSearch } from "./location/LocationAddressSearch";
import { LocationMapControls } from "./location/LocationMapControls";
import { LocationCoordinateCard } from "./location/LocationCoordinateCard";
import { LocationPinOverlay } from "./location/LocationPinOverlay";
import { GoogleMapCanvas } from "./location/GoogleMapCanvas";
import { useLocationPicker } from "./location/useLocationPicker";
import { getCityDisplay } from "@/lib/geo/saudiLocations";

interface InteractiveLocationPickerProps {
  draft: WizardDraft;
  updateDraft: <K extends keyof WizardDraft>(key: K, val: WizardDraft[K]) => void;
  pin: { x: number; y: number };
  setPin: (pin: { x: number; y: number }) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function InteractiveLocationPicker({
  draft,
  updateDraft,
  pin,
  setPin,
  lang,
  t,
}: InteractiveLocationPickerProps) {
  const [mapViewMode, setMapViewMode] = useState<"embed" | "pin">("embed");

  const {
    mapRef,
    isDragging,
    zoomScale,
    setZoomScale,
    inputMode,
    setInputMode,
    searchQuery,
    setSearchQuery,
    mapsUrlInput,
    setMapsUrlInput,
    isResolvingUrl,
    handleGoogleMapsUrlSubmit,
    handleGoogleMapsLocationChange,
    handleQuickCitySelect,
    feedback,
    isLocatingGps,
    hoverDistrict,
    cityInfo,
    hasSelectedLocation,
    currentLat,
    currentLng,
    embedUrl,
    embedIframeCode,
    localizedDistrict,
    localizedState,
    localizedStreet,
    localizedDirection,
    localizedAddress,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleLocateOnMap,
    handleNudge,
    handleResetCenter,
    handleUseCurrentLocation,
  } = useLocationPicker({
    draft,
    updateDraft,
    pin,
    setPin,
    lang,
    t,
  });

  return (
    <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* 1. Header & Instructions */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t("Property Address & Location", "عنوان العقار والموقع على الخريطة")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
          {t(
            "Paste your Google Maps location link to automatically detect & fill City, State, District and Full Address — or pick manually on the map.",
            "الصق رابط موقع جوجل مابس لتعبئة المدينة والمنطقة والحي والعنوان الكامل تلقائياً، أو حدد الموقع يدوياً على الخريطة."
          )}
        </p>
      </div>

      {/* Auto-detected Google Location Summary Pill Bar */}
      {hasSelectedLocation && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-black text-[#4F2396]">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              {t("Detected Location Details", "تفاصيل الموقع المستخرجة")}
            </span>
            {draft.googleMapsUrl && (
              <a
                href={draft.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-white border border-purple-200 px-2 py-0.5 text-[11px] font-extrabold text-[#4F2396] hover:bg-purple-100/50 transition"
              >
                <ExternalLink size={11} />
                <span>{t("Open Google Link", "فتح رابط جوجل")}</span>
              </a>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] font-bold text-slate-700">
            <div className="rounded-lg bg-white/90 px-2.5 py-1.5 border border-purple-100">
              <span className="text-slate-400 font-semibold">{t("City", "المدينة")}: </span>
              <span>{draft.city ? getCityDisplay(draft.city, lang) : "—"}</span>
            </div>
            <div className="rounded-lg bg-white/90 px-2.5 py-1.5 border border-purple-100">
              <span className="text-slate-400 font-semibold">{t("State / Region", "المنطقة / الإمارة")}: </span>
              <span>{localizedState || "—"}</span>
            </div>
            <div className="rounded-lg bg-white/90 px-2.5 py-1.5 border border-purple-100">
              <span className="text-slate-400 font-semibold">{t("District", "الحي")}: </span>
              <span>{localizedDistrict || "—"}</span>
            </div>
            <div className="rounded-lg bg-white/90 px-2.5 py-1.5 border border-purple-100">
              <span className="text-slate-400 font-semibold">{t("Street", "الشارع")}: </span>
              <span>{localizedStreet || "—"}</span>
            </div>
          </div>
          {localizedAddress && (
            <div className="flex items-start gap-1.5 text-[11px] font-bold text-slate-600 pt-0.5">
              <MapPin size={12} className="text-[#4F2396] shrink-0 mt-0.5" />
              <span className="break-words">{localizedAddress}</span>
            </div>
          )}
        </div>
      )}

      {/* Searchable City Dropdown */}
      <CitySearchSelect
        value={draft.city}
        onSelect={handleQuickCitySelect}
        lang={lang}
        t={t}
      />

      {/* 2. Dual-Input Address & Google Maps URL Search Bar */}
      <LocationAddressSearch
        inputMode={inputMode}
        setInputMode={setInputMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLocate={handleLocateOnMap}
        mapsUrlInput={mapsUrlInput}
        setMapsUrlInput={setMapsUrlInput}
        onExtractUrl={handleGoogleMapsUrlSubmit}
        isResolvingUrl={isResolvingUrl}
        feedback={feedback}
        cityInfo={cityInfo}
        selectedDistrict={draft.district}
        lang={lang}
        t={t}
      />

      {/* 3. Interactive Map Container with Google Maps Embed + Interactive Pin */}
      <div className="relative h-[330px] sm:h-[360px] w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-[#e9e6df] shadow-inner">
        <GoogleMapCanvas
          lat={currentLat}
          lng={currentLng}
          embedUrl={embedUrl}
          mapViewMode={mapViewMode}
          onMapViewModeChange={setMapViewMode}
          onLocationChange={handleGoogleMapsLocationChange}
          lang={lang}
          t={t}
          fallbackContent={
            <div
              ref={mapRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`relative h-full w-full select-none overflow-hidden touch-none ${
                isDragging ? "cursor-grabbing ring-2 ring-[#4F2396]/40" : "cursor-grab"
              }`}
            >
              <LocationPinOverlay
                pin={pin}
                zoomScale={zoomScale}
                cityInfo={cityInfo}
                isDragging={isDragging}
                hoverDistrict={hoverDistrict}
                localizedDistrict={localizedDistrict}
                localizedDirection={localizedDirection}
                lang={lang}
              />
            </div>
          }
        />

        {/* Custom Map Controls (shown in Pin Adjust mode) */}
        {mapViewMode === "pin" && (
          <LocationMapControls
            onNudge={handleNudge}
            onResetCenter={handleResetCenter}
            onZoomIn={() => setZoomScale((prev) => Math.min(1.6, prev + 0.2))}
            onZoomOut={() => setZoomScale((prev) => Math.max(1, prev - 0.2))}
            onUseCurrentLocation={handleUseCurrentLocation}
            isLocatingGps={isLocatingGps}
            t={t}
          />
        )}

        {/* Live Coordinate Card */}
        <LocationCoordinateCard
          localizedDistrict={localizedDistrict}
          localizedDirection={localizedDirection}
          localizedAddress={localizedAddress}
          currentLat={currentLat}
          currentLng={currentLng}
          googleMapsUrl={draft.googleMapsUrl}
          embedIframeCode={embedIframeCode}
          hasSelectedLocation={hasSelectedLocation}
          lang={lang}
          t={t}
        />
      </div>

      {/* Helpful User Tip */}
      <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-slate-500">
        <span>💡</span>
        <span>
          {t(
            "Paste any Google Maps share link (maps.app.goo.gl) or embed <iframe> code to automatically convert & preview it on the embedded map.",
            "الصق أي رابط مشاركة من خرائط جوجل أو كود التضمين <iframe> ليتم تحويله تلقائياً وعرضه على الخريطة المدمجة."
          )}
        </span>
      </div>
    </div>
  );
}
