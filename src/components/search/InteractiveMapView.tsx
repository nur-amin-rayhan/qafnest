"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Crosshair, Expand, Layers, Minimize2, Minus, Plus, X } from "lucide-react";
import { Property, normalizeCityId } from "@/data/properties";
import { useApp } from "@/context/AppContext";
import { propertyDetailHref, propertyReservationHref } from "@/lib/propertyUrls";

interface InteractiveMapViewProps {
  properties: Property[];
  selectedPropertyId: string | null;
  onSelectProperty: (propertyId: string) => void;
  onClose: () => void;
}

type LocatedProperty = Property & { lat: number; lng: number; approximate: boolean };
type Point = { lat: number; lng: number };
type Tile = { key: string; src: string; left: number; top: number };

const TILE_SIZE = 256;
const CITY_CENTERS: Record<string, Point> = {
  riyadh: { lat: 24.7136, lng: 46.6753 },
  jeddah: { lat: 21.4858, lng: 39.1925 },
  alula: { lat: 26.6084, lng: 37.9232 },
  khobar: { lat: 26.2172, lng: 50.1971 },
  dammam: { lat: 26.4207, lng: 50.0888 },
  abha: { lat: 18.2164, lng: 42.5053 },
  taif: { lat: 21.2703, lng: 40.4158 },
  mecca: { lat: 21.3891, lng: 39.8579 },
  madinah: { lat: 24.4539, lng: 39.6142 },
  tabuk: { lat: 28.3838, lng: 36.555 },
  buraidah: { lat: 26.326, lng: 43.975 },
  alhafuf: { lat: 25.383, lng: 49.586 },
};

const DISTRICT_CENTERS: Record<string, Point> = {
  "riyadh|tuwaiq": { lat: 24.585, lng: 46.48 },
  "riyadh|qiddiya": { lat: 24.57, lng: 46.35 },
  "riyadh|ammariyah": { lat: 24.73, lng: 46.49 },
  "riyadh|diriyah": { lat: 24.733, lng: 46.575 },
  "riyadh|hanifa": { lat: 24.685, lng: 46.61 },
  "riyadh|hazm": { lat: 24.551, lng: 46.592 },
  "riyadh|narjis": { lat: 24.87, lng: 46.64 },
  "riyadh|hitteen": { lat: 24.76, lng: 46.605 },
  "riyadh|malqa": { lat: 24.81, lng: 46.602 },
  "riyadh|suwaidi": { lat: 24.55, lng: 46.67 },
  "riyadh|kafd": { lat: 24.767, lng: 46.643 },
  "jeddah|hamra": { lat: 21.523, lng: 39.156 },
  "jeddah|nuzhah": { lat: 21.619, lng: 39.157 },
  "jeddah|bawadi": { lat: 21.591, lng: 39.172 },
  "jeddah|muhammadiyah": { lat: 21.633, lng: 39.11 },
  "jeddah|marwah": { lat: 21.609, lng: 39.16 },
  "abha|mahalah": { lat: 18.24, lng: 42.58 },
  "abha|wasaif": { lat: 18.23, lng: 42.5 },
  "abha|arin": { lat: 18.2, lng: 42.53 },
  "abha|muathafin": { lat: 18.205, lng: 42.49 },
  "taif|sadad": { lat: 21.26, lng: 40.39 },
  "taif|sarur": { lat: 21.22, lng: 40.39 },
  "taif|jal": { lat: 21.28, lng: 40.42 },
  "taif|shifa": { lat: 21.08, lng: 40.32 },
  "taif|wesam": { lat: 21.24, lng: 40.47 },
  "alula|sharaan": { lat: 26.67, lng: 37.91 },
  "mecca|central": { lat: 21.4225, lng: 39.8262 },
  "khobar|prince turki": { lat: 26.29, lng: 50.22 },
};

function hasCoordinates(
  property: Property
): property is Property & { lat: number; lng: number } {
  return (
    typeof property.lat === "number" &&
    Number.isFinite(property.lat) &&
    typeof property.lng === "number" &&
    Number.isFinite(property.lng)
  );
}

function resolveMapLocation(property: Property): LocatedProperty | null {
  if (hasCoordinates(property)) return { ...property, approximate: false };

  const city = normalizeCityId(property.city);
  const district = (property.district || "").toLowerCase();
  const districtEntry = Object.entries(DISTRICT_CENTERS).find(
    ([key]) => key.startsWith(`${city}|`) && district.includes(key.slice(city.length + 1))
  );
  const basePoint = districtEntry?.[1] || CITY_CENTERS[city];
  if (!basePoint) return null;

  // Give listings in an approximate area slightly separated pins so each remains selectable.
  const hash = Array.from(property.id).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0
  );
  const spread = districtEntry ? 0.002 : 0.01;
  const latOffset = (((hash % 1000) / 999) - 0.5) * spread;
  const lngOffset = ((((Math.floor(hash / 1000) % 1000) / 999) - 0.5) * spread);

  return {
    ...property,
    lat: basePoint.lat + latOffset,
    lng: basePoint.lng + lngOffset,
    approximate: true,
  };
}

function project(point: Point, zoom: number) {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const lat = Math.max(-85.0511, Math.min(85.0511, point.lat));
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((point.lng + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * worldSize,
  };
}

function unproject(x: number, y: number, zoom: number): Point {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const lng = (x / worldSize) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / worldSize;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng };
}

function fitZoom(properties: LocatedProperty[]) {
  if (properties.length < 2) return 13;
  const latitudes = properties.map((property) => property.lat);
  const longitudes = properties.map((property) => property.lng);
  const latSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const lngSpan = Math.max(...longitudes) - Math.min(...longitudes);
  const span = Math.max(latSpan, lngSpan * 0.8);
  if (span > 20) return 5;
  if (span > 5) return 7;
  if (span > 1) return 9;
  if (span > 0.15) return 11;
  if (span > 0.03) return 13;
  return 15;
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
  const router = useRouter();
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
    () => properties.map(resolveMapLocation).filter((property): property is LocatedProperty => Boolean(property)),
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
  const approximateCoordinatesCount = locatedProperties.filter((property) => property.approximate).length;
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
        className={`absolute inset-0 overflow-hidden touch-none ${dragRef.current ? "cursor-grabbing" : "cursor-grab"}`}
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
          ) return null;

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
              aria-label={`${property.title}, ${displayPrice} SAR per night`}
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
          · {listedCoordinatesCount} {language === "ar" ? "إحداثيات مدخلة" : "listed coords"}
          · {approximateCoordinatesCount} {language === "ar" ? "تقريبي" : "approximate"}
        </span>
        {missingCoordinatesCount > 0 && (
          <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">
            · {missingCoordinatesCount} {language === "ar" ? "بدون موقع" : "without coordinates"}
          </span>
        )}
      </div>

      <div className="absolute right-4 top-4 z-40 flex flex-col gap-2 rtl:right-auto rtl:left-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white/95 text-gray-800 shadow-lg transition hover:bg-gray-50 dark:border-white/10 dark:bg-[#181524]/95 dark:text-white dark:hover:bg-white/10"
          aria-label={language === "ar" ? "عرض القائمة" : "Show listings"}
          title={language === "ar" ? "عرض القائمة" : "Show listings"}
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsFullscreen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white/95 text-gray-800 shadow-lg transition hover:bg-gray-50 dark:border-white/10 dark:bg-[#181524]/95 dark:text-white dark:hover:bg-white/10"
          aria-label={isFullscreen ? "Exit fullscreen map" : "Expand map"}
          title={isFullscreen ? "Exit fullscreen map" : "Expand map"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setIsMuted((value) => !value)}
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 shadow-lg transition dark:border-white/10 ${
            isMuted ? "bg-violet-700 text-white" : "bg-white/95 text-gray-800 dark:bg-[#181524]/95 dark:text-white"
          }`}
          aria-label={language === "ar" ? "تغيير نمط الخريطة" : "Toggle map style"}
          title={language === "ar" ? "تغيير نمط الخريطة" : "Toggle map style"}
        >
          <Layers className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetMap}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white/95 text-gray-800 shadow-lg transition hover:bg-gray-50 dark:border-white/10 dark:bg-[#181524]/95 dark:text-white dark:hover:bg-white/10"
          aria-label={language === "ar" ? "إعادة توسيط الخريطة" : "Center map"}
          title={language === "ar" ? "إعادة توسيط الخريطة" : "Center map"}
        >
          <Crosshair className="h-4 w-4" />
        </button>
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/95 shadow-lg dark:border-white/10 dark:bg-[#181524]/95">
          <button
            type="button"
            onClick={() => setZoomLevel((level) => Math.min(17, level + 1))}
            className="flex h-10 w-10 items-center justify-center text-gray-800 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
            aria-label={language === "ar" ? "تكبير" : "Zoom in"}
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="h-px bg-gray-200 dark:bg-white/10" />
          <button
            type="button"
            onClick={() => setZoomLevel((level) => Math.max(4, level - 1))}
            className="flex h-10 w-10 items-center justify-center text-gray-800 transition hover:bg-gray-100 dark:text-white dark:hover:bg-white/10"
            aria-label={language === "ar" ? "تصغير" : "Zoom out"}
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 right-2 z-30 rounded bg-white/85 px-1.5 py-0.5 text-[10px] text-gray-600 shadow-sm hover:text-violet-700"
      >
        © OpenStreetMap contributors
      </a>

      {selectedProperty && (
        <div className="absolute bottom-5 left-4 right-4 z-40 sm:left-4 sm:right-auto sm:w-[340px]">
          <div className="flex gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-white/15 dark:bg-[#161324]/95">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-28">
              <Image
                src={selectedProperty.image}
                alt={selectedProperty.title}
                fill
                priority
                sizes="120px"
                className="object-cover"
              />
              <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                ★ {selectedProperty.rating.toFixed(1)}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <div className="flex min-w-0 items-center gap-1.5">
                  <h4 className="line-clamp-1 min-w-0 text-xs font-bold text-gray-900 dark:text-white sm:text-sm">
                  {language === "ar"
                    ? selectedProperty.titleAr || selectedProperty.title
                    : selectedProperty.title}
                  </h4>
                  {selectedProperty.approximate && (
                    <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                      {language === "ar" ? "موقع تقريبي" : "Approx. area"}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">
                  {language === "ar"
                    ? selectedProperty.districtAr || selectedProperty.district || selectedProperty.cityName
                    : selectedProperty.district || selectedProperty.cityName}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-1.5 dark:border-white/5">
                <span className="text-sm font-extrabold text-violet-700 dark:text-fuchsia-300">
                  {selectedProperty.basePrice} {language === "ar" ? "ر.س /ليلة" : "SAR /night"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (isPropertyDetail) {
                      const reservationParams = new URLSearchParams(searchParams.toString());
                      reservationParams.set("check_in", checkinDate);
                      reservationParams.set("check_out", checkoutDate);
                      reservationParams.set("check_in_time", checkinTime);
                      reservationParams.set("check_out_time", checkoutTime);
                      reservationParams.set("guests", String(guestsCount));
                      router.push(propertyReservationHref(selectedProperty.id, reservationParams));
                      return;
                    }
                    router.push(propertyDetailHref(selectedProperty.id, searchParams.toString()));
                  }}
                  className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
                >
                  {isPropertyDetail
                    ? language === "ar" ? "احجز" : "Book"
                    : language === "ar" ? "التفاصيل" : "View details"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
