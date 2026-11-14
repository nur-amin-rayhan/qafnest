import { Property, normalizeCityId } from "@/data/properties";

export type LocatedProperty = Property & { lat: number; lng: number; approximate: boolean };
export type Point = { lat: number; lng: number };
export type Tile = { key: string; src: string; left: number; top: number };

export const TILE_SIZE = 256;

export const CITY_CENTERS: Record<string, Point> = {
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

export const DISTRICT_CENTERS: Record<string, Point> = {
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

export function hasCoordinates(
  property: Property
): property is Property & { lat: number; lng: number } {
  return (
    typeof property.lat === "number" &&
    Number.isFinite(property.lat) &&
    typeof property.lng === "number" &&
    Number.isFinite(property.lng)
  );
}

export function resolveMapLocation(property: Property): LocatedProperty | null {
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
  const lngOffset = (((Math.floor(hash / 1000) % 1000) / 999) - 0.5) * spread;

  return {
    ...property,
    lat: basePoint.lat + latOffset,
    lng: basePoint.lng + lngOffset,
    approximate: true,
  };
}

export function project(point: Point, zoom: number) {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const lat = Math.max(-85.0511, Math.min(85.0511, point.lat));
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((point.lng + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * worldSize,
  };
}

export function unproject(x: number, y: number, zoom: number): Point {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const lng = (x / worldSize) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / worldSize;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lat, lng };
}

export function fitZoom(properties: LocatedProperty[]) {
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

