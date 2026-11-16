import { resolveSaudiCity } from "@qafnest/shared";
import { SAUDI_CITIES, type CityInfo, type DistrictInfo } from "./saudiLocationsData";

export { DIRECTION_OPTIONS, SAUDI_CITIES, type CityInfo, type DistrictInfo } from "./saudiLocationsData";

const DIRECTION_EN_MAP = {
  شمال: "North",
  جنوب: "South",
  شرق: "East",
  غرب: "West",
  وسط: "Central",
} as const;

type DirectionAr = keyof typeof DIRECTION_EN_MAP;

/** Normalizes text by trimming and stripping Arabic diacritics / tatweel. */
export function normalizeSearchText(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

/** Returns city info or defaults to Riyadh. */
export function getCityInfo(cityName?: string): CityInfo {
  if (!cityName) return SAUDI_CITIES[0];

  const sharedMatch = resolveSaudiCity(cityName);
  if (sharedMatch) {
    const byShared = SAUDI_CITIES.find(
      (c) =>
        c.en.toLowerCase() === sharedMatch.en.toLowerCase() ||
        normalizeSearchText(c.id) === normalizeSearchText(sharedMatch.ar)
    );
    if (byShared) return byShared;
  }

  const norm = normalizeSearchText(cityName);
  return (
    SAUDI_CITIES.find((c) => normalizeSearchText(c.id) === norm || c.en.toLowerCase() === norm) ||
    SAUDI_CITIES.find(
      (c) =>
        normalizeSearchText(c.id).includes(norm) ||
        norm.includes(normalizeSearchText(c.id)) ||
        c.en.toLowerCase().includes(norm)
    ) ||
    SAUDI_CITIES[0]
  );
}

/** Normalizes direction to canonical Arabic id. */
export function toDirectionId(dir: string | undefined): DirectionAr | "" {
  if (!dir?.trim()) return "";
  const norm = dir.trim().toLowerCase();
  if (dir === "شمال" || norm === "north") return "شمال";
  if (dir === "جنوب" || norm === "south") return "جنوب";
  if (dir === "شرق" || norm === "east") return "شرق";
  if (dir === "غرب" || norm === "west") return "غرب";
  if (dir === "وسط" || norm === "central" || norm === "center") return "وسط";
  return "";
}

export function getDirectionDisplay(dir: string | undefined, lang: "ar" | "en"): string {
  const canonical = toDirectionId(dir) || "وسط";
  return lang === "ar" ? canonical : DIRECTION_EN_MAP[canonical];
}

export function getCityDisplay(cityName: string | undefined, lang: "ar" | "en"): string {
  if (!cityName?.trim()) return "";
  const c = getCityInfo(cityName);
  return lang === "ar" ? c.id : c.en;
}

export function toCityId(cityName: string | undefined): string {
  return cityName?.trim() ? getCityInfo(cityName).id : "";
}

function findDistrictMatch(districtName: string, cityName?: string): DistrictInfo | undefined {
  const city = getCityInfo(cityName);
  const norm = normalizeSearchText(districtName);
  const lower = districtName.toLowerCase().trim();

  const foundInCity = city.districts.find(
    (d) => normalizeSearchText(d.id) === norm || d.en.toLowerCase() === lower || normalizeSearchText(d.id).includes(norm)
  );
  if (foundInCity) return foundInCity;

  for (const c of SAUDI_CITIES) {
    const f = c.districts.find((d) => normalizeSearchText(d.id) === norm || d.en.toLowerCase() === lower);
    if (f) return f;
  }
  return undefined;
}

export function getDistrictDisplay(districtName: string | undefined, lang: "ar" | "en", cityName?: string): string {
  if (!districtName?.trim()) return lang === "ar" ? "حي مختار" : "Selected District";
  const match = findDistrictMatch(districtName, cityName);
  return match ? (lang === "ar" ? match.id : match.en) : districtName;
}

export function toDistrictId(districtName: string | undefined, cityName?: string): string {
  if (!districtName?.trim()) return "";
  return findDistrictMatch(districtName, cityName)?.id || districtName;
}

export function determineDirection(x: number, y: number): DirectionAr {
  const dx = x - 50;
  const dy = y - 50;
  if (Math.hypot(dx, dy) < 12) return "وسط";
  if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? "شمال" : "جنوب";
  return dx < 0 ? "غرب" : "شرق";
}

export function reverseGeocodePin(cityName: string, pin: { x: number; y: number }) {
  const city = getCityInfo(cityName);
  const direction = determineDirection(pin.x, pin.y);
  const directionEn = DIRECTION_EN_MAP[direction];

  let nearestDistrict = city.districts[0];
  let minDistance = Number.MAX_VALUE;
  for (const dist of city.districts) {
    const d = Math.hypot(dist.x - pin.x, dist.y - pin.y);
    if (d < minDistance) {
      minDistance = d;
      nearestDistrict = dist;
    }
  }

  const street = nearestDistrict?.streetSample || "الطريق العام";
  const streetEn = nearestDistrict?.streetSampleEn || "Main Road";
  const district = nearestDistrict?.id || `${direction} ${city.id}`;
  const districtEn = nearestDistrict?.en || `${directionEn} ${city.en}`;
  const postalCode = nearestDistrict?.postalCode || "";
  const postalPart = postalCode ? ` ${postalCode}` : "";

  return {
    city: city.id,
    cityEn: city.en,
    district,
    districtEn,
    direction,
    directionEn,
    street,
    streetEn,
    addressAr: `${street}، ${district}، ${city.id}${postalPart}، المملكة العربية السعودية`,
    addressEn: `${streetEn}, ${districtEn}, ${city.en}${postalPart}, Saudi Arabia`,
    lat: Number((city.lat + (50 - pin.y) * 0.0035).toFixed(5)),
    lng: Number((city.lng + (pin.x - 50) * 0.004).toFixed(5)),
    postalCode,
  };
}

function buildDistrictMatchPayload(city: CityInfo, dist: DistrictInfo) {
  return {
    found: true,
    city: city.id,
    cityEn: city.en,
    district: dist.id,
    districtEn: dist.en,
    direction: dist.direction,
    directionEn: dist.directionEn,
    pin: { x: dist.x, y: dist.y },
    addressAr: `${dist.streetSample}، ${dist.id}، ${city.id} ${dist.postalCode}، المملكة العربية السعودية`,
    addressEn: `${dist.streetSampleEn}, ${dist.en}, ${city.en} ${dist.postalCode}, Saudi Arabia`,
    lat: dist.lat,
    lng: dist.lng,
  };
}

export function geocodeAddress(query: string, currentCityName?: string) {
  const normQuery = normalizeSearchText(query);
  const currentCity = getCityInfo(currentCityName);

  if (!normQuery) {
    const def = currentCity.districts[0];
    const dir = (def?.direction || "وسط") as DirectionAr;
    return {
      found: false,
      city: currentCity.id,
      cityEn: currentCity.en,
      district: def?.id || "حي الملقا",
      districtEn: def?.en || "Al-Malqa",
      direction: dir,
      directionEn: DIRECTION_EN_MAP[dir],
      pin: def ? { x: def.x, y: def.y } : { x: 50, y: 50 },
      addressAr: `${def?.streetSample || "طريق الملك فهد"}، ${def?.id || "حي الملقا"}، ${currentCity.id}، المملكة العربية السعودية`,
      addressEn: `${def?.streetSampleEn || "King Fahd Rd"}, ${def?.en || "Al-Malqa"}, ${currentCity.en}, Saudi Arabia`,
      lat: currentCity.lat,
      lng: currentCity.lng,
    };
  }

  const matchesDistrict = (d: DistrictInfo) => {
    const distNorm = normalizeSearchText(d.id);
    return (
      normQuery.includes(distNorm) ||
      distNorm.includes(normQuery) ||
      normQuery.includes(d.en.toLowerCase()) ||
      d.keywords.some((k) => normQuery.includes(normalizeSearchText(k)))
    );
  };

  const currentMatch = currentCity.districts.find(matchesDistrict);
  if (currentMatch) return buildDistrictMatchPayload(currentCity, currentMatch);

  for (const city of SAUDI_CITIES) {
    if (normQuery.includes(normalizeSearchText(city.id)) || normQuery.includes(city.en.toLowerCase())) {
      const distMatch = city.districts.find(matchesDistrict);
      if (distMatch) return buildDistrictMatchPayload(city, distMatch);

      const firstDist = city.districts[0];
      const dir = (firstDist?.direction || "وسط") as DirectionAr;
      return {
        found: true,
        city: city.id,
        cityEn: city.en,
        district: firstDist?.id || "وسط المدينة",
        districtEn: firstDist?.en || "Downtown",
        direction: dir,
        directionEn: DIRECTION_EN_MAP[dir],
        pin: city.defaultPin,
        addressAr: `${firstDist?.streetSample || "شارع الملك فهد"}، ${firstDist?.id || "الوسط"}، ${city.id}، المملكة العربية السعودية`,
        addressEn: `${firstDist?.streetSampleEn || "King Fahd St"}, ${firstDist?.en || "Downtown"}, ${city.en}, Saudi Arabia`,
        lat: city.lat,
        lng: city.lng,
      };
    }

    const crossMatch = city.districts.find(matchesDistrict);
    if (crossMatch) return buildDistrictMatchPayload(city, crossMatch);
  }

  return {
    found: false,
    city: currentCity.id,
    cityEn: currentCity.en,
    district: currentCity.districts[0]?.id || "حي الرفيعة",
    districtEn: currentCity.districts[0]?.en || "Al-Rafiah",
    direction: "وسط" as const,
    directionEn: "Central" as const,
    pin: { x: 50, y: 50 },
    addressAr: `${query.trim()}، ${currentCity.id}، المملكة العربية السعودية`,
    addressEn: `${query.trim()}, ${currentCity.en}, Saudi Arabia`,
    lat: currentCity.lat,
    lng: currentCity.lng,
  };
}
