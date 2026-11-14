"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Property, normalizeCityId } from "@/data/properties";
import { useApp } from "@/context/AppContext";
import { getLocalizedPropertyTitle } from "@/lib/localization/localeHelper";
import {
  LocatedProperty,
  Point,
  Tile,
  TILE_SIZE,
  CITY_CENTERS,
  resolveMapLocation,
  project,
  unproject,
  fitZoom,
} from "./map/mapConstants";
import MapControls from "./map/MapControls";
import MapPreviewCard from "./map/MapPreviewCard";

interface InteractiveMapViewProps {
  properties: Property[];
  selectedPropertyId: string | null;
  onSelectProperty: (propertyId: string) => void;
  onClose: () => void;
}

export default function InteractiveMapView({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onClose,
}: InteractiveMapViewProps) {
  const {
    language,
    checkinDate,
    checkinTime,
    checkoutDate,
    checkoutTime,
    guestsCount,
  } = useApp();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; center: Point } | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(12);
  const [center, setCenter] = useState<Point>({ lat: 24.7136, lng: 46.6753 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const locatedProperties = useMemo(
    () =>
      properties
        .map(resolveMapLocation)
        .filter((property): property is LocatedProperty => Boolean(property)),
    [properties]
  );
  const coordinateKey = locatedProperties
    .map(({ id, lat, lng }) => `${id}:${lat}:${lng}`)
    .join("|");
  const selectedProperty =
    locatedProperties.find((property) => property.id === selectedPropertyId) ?? null;
  const isPropertyDetail = selectedProperty
    ? pathname === `/property/${encodeURIComponent(selectedProperty.id)}`
    : false;
  const missingCoordinatesCount = properties.length - locatedProperties.length;
  const approximateCoordinatesCount = locatedProperties.filter(
    (property) => property.approximate
  ).length;
  const listedCoordinatesCount = locatedProperties.length - approximateCoordinatesCount;

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewport({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (locatedProperties.length > 0) {
      const latitudes = locatedProperties.map((property) => property.lat);
      const longitudes = locatedProperties.map((property) => property.lng);
      setCenter({
        lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
        lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      });
      setZoomLevel(fitZoom(locatedProperties));
      if (!locatedProperties.some((property) => property.id === selectedPropertyId)) {
        onSelectProperty(locatedProperties[0].id);
      }
      return;
    }

    const city = normalizeCityId(properties[0]?.city || "riyadh");
    setCenter(CITY_CENTERS[city] || CITY_CENTERS.riyadh);
    setZoomLevel(12);
    // Refit only when the filtered set of geocoded listings changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinateKey]);

  const centerWorld = useMemo(() => project(center, zoomLevel), [center, zoomLevel]);
  const tiles = useMemo<Tile[]>(() => {
    if (viewport.width === 0 || viewport.height === 0) return [];
    const tileCount = 2 ** zoomLevel;
    const leftWorld = centerWorld.x - viewport.width / 2;
    const topWorld = centerWorld.y - viewport.height / 2;
    const minX = Math.floor(leftWorld / TILE_SIZE);
    const maxX = Math.floor((leftWorld + viewport.width) / TILE_SIZE);
    const minY = Math.max(0, Math.floor(topWorld / TILE_SIZE));
    const maxY = Math.min(tileCount - 1, Math.floor((topWorld + viewport.height) / TILE_SIZE));
    const visibleTiles: Tile[] = [];

    for (let tileY = minY; tileY <= maxY; tileY += 1) {
      for (let tileX = minX; tileX <= maxX; tileX += 1) {
        const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
        visibleTiles.push({
          key: `${zoomLevel}-${tileX}-${tileY}`,
          src: `https://tile.openstreetmap.org/${zoomLevel}/${wrappedX}/${tileY}.png`,
          left: tileX * TILE_SIZE - leftWorld,
          top: tileY * TILE_SIZE - topWorld,
        });
      }
    }
    return visibleTiles;
  }, [centerWorld, viewport, zoomLevel]);

  const getMarkerPosition = useCallback(
    (property: LocatedProperty) => {
      const point = project(property, zoomLevel);
      return {
        left: viewport.width / 2 + point.x - centerWorld.x,
        top: viewport.height / 2 + point.y - centerWorld.y,
      };
    },
    [centerWorld, viewport, zoomLevel]
  );

  const resetMap = () => {
    if (locatedProperties.length > 0) {
      const latitudes = locatedProperties.map((property) => property.lat);
      const longitudes = locatedProperties.map((property) => property.lng);
      setCenter({
        lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
        lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      });
      setZoomLevel(fitZoom(locatedProperties));
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a")) return;
    dragRef.current = { x: event.clientX, y: event.clientY, center };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const startWorld = project(dragRef.current.center, zoomLevel);
    setCenter(
      unproject(
        startWorld.x - (event.clientX - dragRef.current.x),
        startWorld.y - (event.clientY - dragRef.current.y),
        zoomLevel
      )
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className={`${
        isFullscreen
          ? "fixed inset-0 z-[90] h-screen w-screen rounded-none"
          : "relative h-[420px] lg:h-[680px] rounded-3xl"
      } overflow-hidden border border-gray-200 dark:border-white/10 bg-[#e8ede9] dark:bg-[#10131a] shadow-xl`}
    >
      <div
        ref={mapRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute inset-0 overflow-hidden touch-none ${
          dragRef.current ? "cursor-grabbing" : "cursor-grab"
        }`}
        aria-label={language === "ar" ? "خريطة مواقع العقارات" : "Map of property locations"}
      >
        <div
          className="absolute inset-0 bg-[#e8ede9] dark:bg-[#151b20]"
          style={{
            backgroundImage:
              "linear-gradient(28deg, transparent 47%, rgba(255,255,255,.82) 48%, rgba(255,255,255,.82) 49%, transparent 50%), linear-gradient(116deg, transparent 44%, rgba(255,255,255,.65) 45%, rgba(255,255,255,.65) 46%, transparent 47%), linear-gradient(90deg, rgba(105,133,117,.05) 1px, transparent 1px), linear-gradient(0deg, rgba(105,133,117,.05) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 72px 72px, 72px 72px",
          }}
        />

        {tiles.map((tile) => (
          // eslint-disable-next-line @next/next/no-img-element -- Map tiles are individually positioned inside the pannable map surface.
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable={false}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            className={`absolute max-w-none select-none transition-opacity duration-200 ${
              isMuted ? "opacity-70 grayscale-[0.3]" : "opacity-100"
            }`}
            style={{ left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }}
          />
        ))}

        {locatedProperties.map((property) => {
          const position = getMarkerPosition(property);
          if (
            position.left < -70 ||
            position.top < -45 ||
            position.left > viewport.width + 70 ||
            position.top > viewport.height + 45
          )
            return null;

          const isSelected = selectedPropertyId === property.id;
          const displayPrice = Math.round(property.basePrice);

          return (
            <button
              key={property.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onSelectProperty(property.id);
              }}
              style={{ left: position.left, top: position.top }}
              className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-extrabold shadow-lg transition-all ${
                isSelected
                  ? "z-30 scale-110 bg-violet-700 text-white ring-4 ring-violet-400/30"
                  : "border border-white/90 bg-white text-gray-900 hover:scale-110 hover:bg-violet-600 hover:text-white"
              }`}
              aria-label={`${getLocalizedPropertyTitle(property, language === "ar" ? "ar" : "en")}, ${displayPrice} ${language === "ar" ? "ر.س لليلة" : "SAR per night"}`}
            >
              {displayPrice} {language === "ar" ? "ر.س" : "SAR"}
            </button>
          );
        })}

        {locatedProperties.length === 0 && (
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 text-center text-xs font-semibold text-gray-700 shadow-lg dark:border-white/10 dark:bg-[#171522]/95 dark:text-gray-200">
            {language === "ar"
              ? "لا تتوفر إحداثيات دقيقة لهذه العقارات بعد"
              : "No usable location data is available for these listings yet"}
          </div>
        )}
      </div>

      <div className="absolute left-4 top-4 z-40 max-w-[calc(100%-100px)] rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[11px] font-semibold text-gray-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#181524]/90 dark:text-gray-200">
        {locatedProperties.length} {language === "ar" ? "موقع على الخريطة" : "mapped listings"}
        <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">
          · {listedCoordinatesCount} {language === "ar" ? "إحداثيات مدخلة" : "listed coords"}·{" "}
          {approximateCoordinatesCount} {language === "ar" ? "تقريبي" : "approximate"}
        </span>
        {missingCoordinatesCount > 0 && (
          <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">
            · {missingCoordinatesCount} {language === "ar" ? "بدون موقع" : "without coordinates"}
          </span>
        )}
      </div>

      {/* Map Controls (Recenter, Zoom, Style, Fullscreen, Close) */}
      <MapControls
        onClose={onClose}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((val) => !val)}
        isMuted={isMuted}
        onToggleMuted={() => setIsMuted((val) => !val)}
        onResetMap={resetMap}
        onZoomIn={() => setZoomLevel((level) => Math.min(17, level + 1))}
        onZoomOut={() => setZoomLevel((level) => Math.max(4, level - 1))}
        language={language}
      />

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 right-2 z-30 rounded bg-white/85 px-1.5 py-0.5 text-[10px] text-gray-600 shadow-sm hover:text-violet-700"
      >
        © OpenStreetMap contributors
      </a>

      {/* Selected Property Preview Popup Card */}
      {selectedProperty && (
        <MapPreviewCard
          selectedProperty={selectedProperty}
          isPropertyDetail={isPropertyDetail}
          language={language}
          checkinDate={checkinDate}
          checkoutDate={checkoutDate}
          checkinTime={checkinTime}
          checkoutTime={checkoutTime}
          guestsCount={guestsCount}
          searchParamsString={searchParams.toString()}
        />
      )}
    </div>
  );
}
