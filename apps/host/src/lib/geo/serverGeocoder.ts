import { SAUDI_ALL_CITIES, resolveSaudiCity } from "@qafnest/shared";

export interface ServerGeocodedLocation {
  found: boolean;
  source: "google" | "nominatim" | "fallback";
  lat: number;
  lng: number;
  cityId: string;
  cityEn: string;
  cityAr: string;
  state: string;
  stateAr: string;
  district: string;
  districtAr: string;
  street: string;
  streetAr: string;
  postalCode: string;
  address: string;
  addressAr: string;
  direction: "شمال" | "جنوب" | "شرق" | "غرب" | "وسط";
  directionEn: string;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  street?: string;
  residential?: string;
  footway?: string;
  path?: string;
  track?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  hamlet?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  province?: string;
  region?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResponse {
  lat?: string;
  lon?: string;
  name?: string;
  category?: string;
  type?: string;
  display_name?: string;
  importance?: number;
  address?: NominatimAddress;
}

interface StructuredGeoProviderResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  street: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  addrType?: string;
  addNum?: string;
  snapDistanceMeters?: number;
}

interface PhotonFeatureProperties {
  osm_key?: string;
  osm_value?: string;
  type?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  district?: string;
  locality?: string;
  city?: string;
  county?: string;
  state?: string;
  postcode?: string;
}

const DIRECTION_EN_MAP: Record<"شمال" | "جنوب" | "شرق" | "غرب" | "وسط", string> = {
  شمال: "North",
  جنوب: "South",
  شرق: "East",
  غرب: "West",
  وسط: "Central",
};

const HAS_ARABIC_RE = /[\u0600-\u06FF]/;
const HAS_LATIN_RE = /[A-Za-z]/;

function stripBidiChars(value: string): string {
  return value.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "");
}

function normalizeArabicDigits(value: string): string {
  return value.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

function hasArabic(value?: string | null): boolean {
  return Boolean(value && HAS_ARABIC_RE.test(value));
}

function hasLatin(value?: string | null): boolean {
  return Boolean(value && HAS_LATIN_RE.test(value));
}

function isSaudiShortCode(value: string): boolean {
  return /^[A-Z]{4}\d{4}(?:[،,\s]+\d{4,5})?$/i.test(value.trim());
}

function isPlusCode(value: string): boolean {
  return /^[2-9CFGHJMPQRVWX]{4,8}\+[2-9CFGHJMPQRVWX]{2,4}/i.test(value.trim());
}

function isNoiseHint(value?: string | null): boolean {
  if (!value) return true;
  const trimmed = stripBidiChars(value).trim();
  if (!trimmed || trimmed.length < 3) return true;
  if (/^\d{1,3}°/.test(trimmed)) return true; // DMS coordinates like 24°48'37.8"N
  if (/^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(trimmed)) return true;
  if (isSaudiShortCode(trimmed) || isPlusCode(trimmed)) return true;
  if (/^(?:google maps|خرائط\s*google|saudi arabia|المملكة العربية السعودية|السعودية|unnamed road)$/i.test(trimmed)) {
    return true;
  }
  return false;
}

function normalizeHints(hint?: string | null): string {
  if (!hint) return "";
  const cleaned = stripBidiChars(hint).replace(/\s+/g, " ").trim();
  if (isNoiseHint(cleaned)) return "";
  return cleaned;
}

function extractBuildingNumberPrefix(value?: string | null): string {
  if (!value) return "";
  const clean = normalizeArabicDigits(stripBidiChars(value)).trim();
  const match = clean.match(/^(\d{3,5})\s+(?:[\u0600-\u06FFA-Za-z])/);
  return match?.[1] || "";
}

function stripLeadingBuildingNumber(street: string, addNum?: string): string {
  const clean = stripBidiChars(street).trim();
  if (!clean) return "";
  if (addNum) {
    const escaped = addNum.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const stripped = clean.replace(new RegExp(`^${escaped}\\s+`), "").trim();
    if (stripped) return stripped;
  }
  return clean.replace(/^\d{3,5}\s+/, "").trim();
}

function approxDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLatMeters = (lat2 - lat1) * 111320;
  const dLngMeters = (lng2 - lng1) * 111320 * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot(dLatMeters, dLngMeters);
}

function normalizeComparableName(val?: string | null): string {
  return (val || "")
    .toLowerCase()
    .replace(/^(?:al|el)[-\s]+/i, "")
    .replace(/[-\s_]+/g, " ")
    .trim();
}

function dedupeJoin(parts: Array<string | undefined | null>, separator: string): string {
  const result: string[] = [];
  for (const raw of parts) {
    const clean = (raw || "").trim();
    if (!clean) continue;
    const norm = clean.toLowerCase().replace(/[-\s]+/g, " ");
    const alreadyCovered = result.some(
      (existing) => existing.toLowerCase().replace(/[-\s]+/g, " ") === norm
    );
    if (!alreadyCovered) {
      result.push(clean);
    }
  }
  return result.join(separator);
}

const ARABIC_SAUDI_TERMS: Record<string, string> = {
  "الملك": "King",
  "الأمير": "Prince",
  "الامير": "Prince",
  "عبدالعزيز": "Abdulaziz",
  "عبد العزيز": "Abdulaziz",
  "فهد": "Fahd",
  "سلمان": "Salman",
  "عبدالله": "Abdullah",
  "عبد الله": "Abdullah",
  "فيصل": "Faisal",
  "خالد": "Khalid",
  "سلطان": "Sultan",
  "سعود": "Saud",
  "تركي": "Turki",
  "محمد": "Mohammed",
  "بندر": "Bandar",
  "أنس": "Anas",
  "مالك": "Malik",
  "عثمان": "Othman",
  "عفان": "Affan",
  "أبو": "Abu",
  "بكر": "Bakr",
  "بدر": "Badr",
  "مسعود": "Mas'ud",
  "البدري": "Al Badri",
  "القباني": "Al Qabbani",
  "عمر": "Omar",
  "علي": "Ali",
  "الأول": "Al Awwal",
  "الثاني": "Al Thani",
  "بن": "Bin",
  "رقم": "No.",
  "العام": "Main",
  "الرئيسي": "Main",
  "الدائري": "Ring",
  "الشمالي": "North",
  "الجنوبي": "South",
  "الشرقي": "East",
  "الغربي": "West",
  "العليا": "Al Olaya",
  "الملقا": "Al Malqa",
  "النرجس": "Al Narjis",
  "الياسمين": "Al Yasmin",
  "العمارية": "Al Ammariyah",
  "الدرعية": "Diriyah",
  "حطين": "Hittin",
  "أبحر": "Abhur",
  "الشمالية": "Al Shamaliyah",
  "الكورنيش": "Corniche",
  "المطار": "Airport",
  "المدينة": "Al Madinah",
  "الرياض": "Riyadh",
  "جدة": "Jeddah",
  "طيبة": "Taibah",
  "الشاطئ": "Al Shati",
  "التخصصي": "Takhassusi",
  "العروبة": "Al Urubah",
  "التحلية": "Tahlia",
};

const ARABIC_CHAR_MAP: Record<string, string> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "aa",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "j",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  ة: "ah",
  و: "w",
  ي: "y",
  ى: "a",
  ئ: "i",
  ؤ: "o",
  ء: "",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

function romanizeArabicWord(word: string): string {
  const mapped = ARABIC_SAUDI_TERMS[word];
  if (mapped) return mapped;
  if (word.startsWith("ال") && word.length > 2) {
    const rest = word.slice(2);
    const restMapped = ARABIC_SAUDI_TERMS[rest];
    if (restMapped) return restMapped.startsWith("Al ") ? restMapped : `Al ${restMapped}`;
    return `Al ${romanizeArabicWord(rest)}`;
  }
  let out = "";
  for (const ch of word) {
    out += ARABIC_CHAR_MAP[ch] ?? ch;
  }
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : "";
}

function arabicRoadToEnglishFallback(input: string): string {
  const clean = normalizeArabicDigits(stripBidiChars(input))
    .replace(/[^\u0600-\u06FFA-Za-z0-9.\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";
  if (!hasArabic(clean)) return clean;

  const numPrefix = clean.match(/^(\d{3,5})\s+(.*)$/);
  const leadingNum = numPrefix?.[1] || "";
  const restClean = numPrefix?.[2]?.trim() || clean;

  let suffix = "";
  let body = restClean;
  if (restClean.startsWith("طريق ")) {
    suffix = "Rd";
    body = restClean.slice("طريق ".length).trim();
  } else if (restClean.startsWith("شارع ")) {
    suffix = "St";
    body = restClean.slice("شارع ".length).trim();
  } else if (restClean.startsWith("ممر ")) {
    suffix = "Ln";
    body = restClean.slice("ممر ".length).trim();
  } else if (restClean.startsWith("جادة ")) {
    suffix = "Ave";
    body = restClean.slice("جادة ".length).trim();
  }

  const tokens = body.split(" ").filter(Boolean).map((w) => (hasArabic(w) ? romanizeArabicWord(w) : w));
  const combined = [leadingNum, ...tokens, suffix].filter(Boolean).join(" ").trim();
  return combined || clean;
}

function englishRoadToArabicFallback(input: string): string {
  const clean = stripBidiChars(input).trim();
  if (!clean) return "";
  if (hasArabic(clean)) return clean;
  return clean
    .replace(/\bStreet\s+No\.?\s*/i, "شارع رقم ")
    .replace(/\bRoad\b|\bRd\b/gi, "طريق")
    .replace(/\bStreet\b|\bSt\b/gi, "شارع")
    .trim();
}

function isStreetOrBuildingSegment(seg: string): boolean {
  const clean = normalizeArabicDigits(seg).trim();
  if (/^\d{3,5}\s+[\u0600-\u06FFA-Za-z]/.test(clean) && !isSaudiShortCode(clean)) {
    return true;
  }
  return (
    /\b(street|st|road|rd|avenue|ave|highway|blvd|boulevard|way|drive|dr)\b/i.test(clean) ||
    /(شارع|طريق|جادة|ممر|ميدان)/.test(clean)
  );
}

function isCityDistrictOrPostcodeSegment(
  seg: string,
  cityEn: string,
  cityAr: string,
  districtEn: string,
  districtAr: string
): boolean {
  const clean = normalizeArabicDigits(seg).trim();
  const norm = normalizeComparableName(clean);
  if (!norm || /^\d{4,6}$/.test(clean) || isSaudiShortCode(clean) || isPlusCode(clean) || isNoiseHint(clean)) {
    return true;
  }
  const withoutPostal = normalizeComparableName(clean.replace(/\b\d{5}\b/g, "").trim());
  const cityDistSet = [cityEn, cityAr, districtEn, districtAr]
    .map(normalizeComparableName)
    .filter(Boolean);
  if (cityDistSet.includes(norm) || (withoutPostal && cityDistSet.includes(withoutPostal))) {
    return true;
  }
  if (/^(?:حي|منطقة|محافظة)\s+/i.test(clean)) {
    const withoutPrefix = normalizeComparableName(clean.replace(/^(?:حي|منطقة|محافظة)\s+/i, ""));
    if (withoutPrefix && cityDistSet.includes(withoutPrefix)) return true;
  }
  return false;
}

function extractStreetFromPlaceHint(
  hint: string,
  cityEn: string,
  cityAr: string,
  districtEn: string,
  districtAr: string
): string {
  const clean = normalizeHints(hint);
  if (!clean) return "";
  // Split compound titles like "8121 Abu Bakr Al Qabbani, Taibah, Jeddah 23835"
  const segments = clean.split(/[،,·|]/).map((s) => stripBidiChars(s).trim()).filter(Boolean);
  const explicitStreetSeg = segments.find((seg) => isStreetOrBuildingSegment(seg));
  if (explicitStreetSeg && !isNoiseHint(explicitStreetSeg)) return explicitStreetSeg;

  for (const seg of segments) {
    if (isCityDistrictOrPostcodeSegment(seg, cityEn, cityAr, districtEn, districtAr)) {
      continue;
    }
    return seg;
  }
  return "";
}

function computeDirectionFromCenter(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number
): "شمال" | "جنوب" | "شرق" | "غرب" | "وسط" {
  const dLat = lat - centerLat;
  const dLng = lng - centerLng;
  if (Math.abs(dLat) < 0.02 && Math.abs(dLng) < 0.02) return "وسط";
  if (Math.abs(dLat) >= Math.abs(dLng)) {
    return dLat >= 0 ? "شمال" : "جنوب";
  }
  return dLng >= 0 ? "شرق" : "غرب";
}

function findNearestSaudiCity(lat: number, lng: number) {
  let best = SAUDI_ALL_CITIES[0];
  let bestDist = Infinity;
  for (const city of SAUDI_ALL_CITIES) {
    const d = Math.hypot(city.lat - lat, city.lng - lng);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return { city: best, distanceDeg: bestDist };
}

function pickNominatimField(addr: NominatimAddress | undefined, keys: Array<keyof NominatimAddress>): string {
  if (!addr) return "";
  for (const k of keys) {
    const val = addr[k];
    if (typeof val === "string" && val.trim()) {
      return val.trim();
    }
  }
  return "";
}

async function fetchArcgisReverse(
  lat: number,
  lng: number,
  lang: "EN" | "AR"
): Promise<StructuredGeoProviderResult | null> {
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&langCode=${lang}&location=${encodeURIComponent(
    `${lng},${lat}`
  )}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "QafNest-Platform/1.0 (https://qafnest.com)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      error?: unknown;
      location?: { x?: number; y?: number };
      address?: {
        Address?: string;
        District?: string;
        Neighborhood?: string;
        City?: string;
        Subregion?: string;
        Region?: string;
        Postal?: string;
        Match_addr?: string;
        LongLabel?: string;
        Addr_type?: string;
        AddNum?: string;
      };
    };
    if (json.error || !json.address) return null;
    const a = json.address;
    const postal = (a.Postal || "").trim();
    const rawAddr = stripBidiChars(a.Address || "").trim();
    const addNum = normalizeArabicDigits(stripBidiChars(a.AddNum || "")).trim();
    const addrType = (a.Addr_type || "").trim();

    const snappedLat = typeof json.location?.y === "number" ? json.location.y : lat;
    const snappedLng = typeof json.location?.x === "number" ? json.location.x : lng;
    const snapDistanceMeters = approxDistanceMeters(lat, lng, snappedLat, snappedLng);

    // If ArcGIS PointAddress centroid snapped >12m away, it guessed a neighboring plot's building number.
    const isSnappedNeighbor = addrType === "PointAddress" && Boolean(addNum) && snapDistanceMeters > 12;
    const cleanAddr = isSnappedNeighbor ? stripLeadingBuildingNumber(rawAddr, addNum) : rawAddr;
    const street =
      cleanAddr && cleanAddr !== postal && addrType !== "Postal" ? cleanAddr : "";

    return {
      lat,
      lng,
      formattedAddress: stripBidiChars(a.LongLabel || a.Match_addr || "")
        .replace(/,\s*SAU$/, ", Saudi Arabia")
        .trim(),
      street,
      district: stripBidiChars(a.District || a.Neighborhood || "").trim(),
      city: stripBidiChars(a.City || a.Subregion || "").trim(),
      state: stripBidiChars(a.Region || "").trim(),
      postalCode: postal,
      addrType,
      addNum: isSnappedNeighbor ? "" : addNum,
      snapDistanceMeters,
    };
  } catch {
    return null;
  }
}

interface ArcgisForwardCandidate {
  score: number;
  lat: number;
  lng: number;
  address: string;
  stAddr: string;
  addrType: string;
  city: string;
  district: string;
}

async function fetchArcgisForward(
  searchText: string
): Promise<ArcgisForwardCandidate[]> {
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&SingleLine=${encodeURIComponent(
    searchText
  )}&countryCode=SAU&outFields=Match_addr,StAddr,AddNum,City,District,Postal,Region,Addr_type&maxLocations=5`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "QafNest-Platform/1.0 (https://qafnest.com)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      candidates?: Array<{
        score?: number;
        address?: string;
        location?: { x?: number; y?: number };
        attributes?: {
          StAddr?: string;
          Addr_type?: string;
          City?: string;
          District?: string;
        };
      }>;
    };
    return (json.candidates || [])
      .filter(
        (c) =>
          typeof c.location?.y === "number" &&
          typeof c.location?.x === "number" &&
          Number.isFinite(c.location.y) &&
          Number.isFinite(c.location.x)
      )
      .map((c) => ({
        score: Number(c.score || 0),
        lat: Number(c.location!.y),
        lng: Number(c.location!.x),
        address: stripBidiChars(c.address || "").trim(),
        stAddr: stripBidiChars(c.attributes?.StAddr || "").trim(),
        addrType: (c.attributes?.Addr_type || "").trim(),
        city: stripBidiChars(c.attributes?.City || "").trim(),
        district: stripBidiChars(c.attributes?.District || "").trim(),
      }));
  } catch {
    return [];
  }
}

function roadTokensLatin(raw: string): string[] {
  const english = hasArabic(raw) ? arabicRoadToEnglishFallback(raw) : raw;
  return normalizeArabicDigits(stripBidiChars(english))
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/\b\d{3,5}\b/g, " ")
    .replace(/\b(?:al|el|shari|street|st|road|rd|avenue|ave|way|drive|dr)\b/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .map((w) =>
      w
        .replace(/abi/g, "abu")
        .replace(/oo|ou/g, "u")
        .replace(/ee/g, "i")
    );
}

function areSimilarRoadNames(a: string, b: string): boolean {
  const ta = roadTokensLatin(a);
  const tb = roadTokensLatin(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const matches = ta.filter((w) => tb.some((u) => u === w || u.startsWith(w) || w.startsWith(u)));
  return matches.length >= Math.min(2, ta.length, tb.length);
}

function combineBuildingWithRoad(buildingNum: string, roadWithPossibleNum: string, addNum?: string): string {
  const cleanRoad = stripLeadingBuildingNumber(roadWithPossibleNum, addNum);
  if (!cleanRoad) return buildingNum;
  return `${buildingNum} ${cleanRoad}`.trim();
}

async function fetchNominatimReverse(lat: number, lng: number, lang: "en" | "ar"): Promise<NominatimResponse | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "QafNest-Platform/1.0 (https://qafnest.com)",
        "Accept-Language": lang,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResponse;
    return data && !("error" in data) ? data : null;
  } catch {
    return null;
  }
}

async function fetchPhotonReverse(lat: number, lng: number): Promise<PhotonFeatureProperties | null> {
  const url = `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "QafNest-Platform/1.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      features?: Array<{ properties?: PhotonFeatureProperties }>;
    };
    return json.features?.[0]?.properties || null;
  } catch {
    return null;
  }
}

async function fetchGoogleRestGeocode(
  params: { lat?: number; lng?: number; address?: string },
  lang: "en" | "ar"
): Promise<StructuredGeoProviderResult | null> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    "";
  if (!apiKey) return null;

  const qs =
    typeof params.lat === "number" && typeof params.lng === "number"
      ? `latlng=${params.lat},${params.lng}`
      : `address=${encodeURIComponent(params.address || "")}&region=sa`;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${qs}&language=${lang}&key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(5500), cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
        address_components?: Array<{ long_name: string; types: string[] }>;
      }>;
    };
    if (json.status !== "OK" || !json.results || json.results.length === 0) return null;
    const first = json.results[0];
    const comps = first.address_components || [];
    const pick = (...types: string[]) =>
      comps.find((c) => types.some((t) => c.types.includes(t)))?.long_name || "";

    const route = pick("route", "street_address");
    const streetNum = pick("street_number");
    return {
      lat: Number(first.geometry?.location?.lat ?? params.lat ?? 0),
      lng: Number(first.geometry?.location?.lng ?? params.lng ?? 0),
      formattedAddress: first.formatted_address || "",
      street: [streetNum, route].filter(Boolean).join(" ").trim(),
      district: pick("sublocality_level_1", "sublocality", "neighborhood"),
      city: pick("locality", "administrative_area_level_2"),
      state: pick("administrative_area_level_1"),
      postalCode: pick("postal_code"),
    };
  } catch {
    return null;
  }
}

/**
 * Resolves exact GPS coordinates into rich bilingual (EN + AR) address components
 * including City, State/Province/Region, District, Street, Postal Code, and Full Address.
 */
export async function reverseGeocodeReal(
  lat: number,
  lng: number,
  options?: { placeHint?: string | null; addressHint?: string | null; preferredCity?: string | null }
): Promise<ServerGeocodedLocation> {
  const cleanLat = Number(lat.toFixed(6));
  const cleanLng = Number(lng.toFixed(6));

  // Query Google REST (if keyed), ArcGIS EN+AR (free bilingual), and primary Nominatim EN in parallel
  const [googleEn, googleAr, arcgisEn, arcgisAr, nomEn] = await Promise.all([
    fetchGoogleRestGeocode({ lat: cleanLat, lng: cleanLng }, "en"),
    fetchGoogleRestGeocode({ lat: cleanLat, lng: cleanLng }, "ar"),
    fetchArcgisReverse(cleanLat, cleanLng, "EN"),
    fetchArcgisReverse(cleanLat, cleanLng, "AR"),
    fetchNominatimReverse(cleanLat, cleanLng, "en"),
  ]);

  const nomStreetEnRaw = [
    pickNominatimField(nomEn?.address, ["house_number"]),
    pickNominatimField(nomEn?.address, ["road", "pedestrian", "street", "residential", "footway", "path", "track"]) ||
      (nomEn?.category === "highway" && nomEn.name && !isNoiseHint(nomEn.name) ? nomEn.name.trim() : ""),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Only call Nominatim AR sequentially if ArcGIS AR lacked district/street (prevents 429 burst on Nominatim)
  const needsNomAr = !arcgisAr?.district || !arcgisAr?.street;
  const nomAr = needsNomAr ? await fetchNominatimReverse(cleanLat, cleanLng, "ar") : null;

  const nomStreetArRaw = [
    pickNominatimField(nomAr?.address, ["road", "pedestrian", "street", "residential", "footway", "path", "track"]) ||
      (nomAr?.category === "highway" && nomAr.name && !isNoiseHint(nomAr.name) ? nomAr.name.trim() : ""),
    pickNominatimField(nomAr?.address, ["house_number"]),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const hasInitialStreet = Boolean(
    googleEn?.street || googleAr?.street || arcgisEn?.street || arcgisAr?.street || nomStreetEnRaw || nomStreetArRaw
  );

  // If primary geocoders missed a street (very common in residential plots/chalets/farms in OSM), query Photon for nearest named road
  const photon = !hasInitialStreet ? await fetchPhotonReverse(cleanLat, cleanLng) : null;
  const photonStreetRaw = photon
    ? [
        photon.housenumber,
        photon.street || (photon.osm_key === "highway" || photon.type === "street" ? photon.name : ""),
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
    : "";

  const rawCityEn =
    googleEn?.city ||
    arcgisEn?.city ||
    pickNominatimField(nomEn?.address, ["city", "town", "village", "municipality", "state_district", "county"]) ||
    photon?.city ||
    "";
  const rawCityAr =
    googleAr?.city ||
    arcgisAr?.city ||
    pickNominatimField(nomAr?.address, ["city", "town", "village", "municipality", "state_district", "county"]) ||
    "";

  const matchedCity =
    resolveSaudiCity(rawCityEn) ||
    resolveSaudiCity(rawCityAr) ||
    resolveSaudiCity(options?.placeHint) ||
    resolveSaudiCity(options?.preferredCity);

  const nearest = findNearestSaudiCity(cleanLat, cleanLng);
  const effectiveSaudiCity = matchedCity || (nearest.distanceDeg < 0.8 ? nearest.city : undefined);

  const cityEn = effectiveSaudiCity?.en || (hasLatin(rawCityEn) ? rawCityEn : "") || rawCityEn || rawCityAr || "Riyadh";
  const cityAr = effectiveSaudiCity?.ar || (hasArabic(rawCityAr) ? rawCityAr : "") || rawCityAr || rawCityEn || "الرياض";
  const cityId = cityAr;

  const rawStateEn =
    googleEn?.state ||
    arcgisEn?.state ||
    pickNominatimField(nomEn?.address, ["state", "province", "region"]) ||
    effectiveSaudiCity?.regionEn ||
    "";
  const rawStateAr =
    googleAr?.state ||
    arcgisAr?.state ||
    pickNominatimField(nomAr?.address, ["state", "province", "region"]) ||
    effectiveSaudiCity?.regionAr ||
    rawStateEn;
  const stateEn = hasLatin(rawStateEn) ? rawStateEn : effectiveSaudiCity?.regionEn || rawStateEn;
  const stateAr = hasArabic(rawStateAr) ? rawStateAr : effectiveSaudiCity?.regionAr || rawStateAr;

  const rawDistrictEn =
    googleEn?.district ||
    arcgisEn?.district ||
    pickNominatimField(nomEn?.address, ["suburb", "neighbourhood", "quarter", "city_district", "hamlet", "residential"]) ||
    (photon?.district && hasLatin(photon.district) ? photon.district.trim() : "") ||
    (photon?.locality && hasLatin(photon.locality) ? photon.locality.trim() : "");

  const rawDistrictAr =
    googleAr?.district ||
    arcgisAr?.district ||
    pickNominatimField(nomAr?.address, ["suburb", "neighbourhood", "quarter", "city_district", "hamlet", "residential"]) ||
    (photon?.district && hasArabic(photon.district) ? photon.district.trim() : "") ||
    (photon?.locality && hasArabic(photon.locality) ? photon.locality.trim() : "");

  const resolvedDistrictEn =
    (hasLatin(rawDistrictEn) ? rawDistrictEn : "") ||
    (hasLatin(rawDistrictAr) ? rawDistrictAr : "") ||
    cityEn;
  const resolvedDistrictAr =
    (hasArabic(rawDistrictAr) ? rawDistrictAr : "") ||
    (hasArabic(rawDistrictEn) ? rawDistrictEn : "") ||
    cityAr;

  const hintStreet =
    extractStreetFromPlaceHint(options?.addressHint || "", cityEn, cityAr, resolvedDistrictEn, resolvedDistrictAr) ||
    extractStreetFromPlaceHint(options?.placeHint || "", cityEn, cityAr, resolvedDistrictEn, resolvedDistrictAr);

  const explicitBuildingNum = extractBuildingNumberPrefix(hintStreet);
  const hintHasRoadOrNum = Boolean(hintStreet && isStreetOrBuildingSegment(hintStreet));

  let baseStreetEn =
    googleEn?.street ||
    arcgisEn?.street ||
    (hasLatin(nomStreetEnRaw) ? nomStreetEnRaw : "") ||
    (hasLatin(photonStreetRaw) ? photonStreetRaw : "");

  let baseStreetAr =
    googleAr?.street ||
    arcgisAr?.street ||
    (hasArabic(nomStreetArRaw) ? nomStreetArRaw : "") ||
    (hasArabic(photonStreetRaw) ? photonStreetRaw : "");

  if (explicitBuildingNum && !googleEn?.street && !googleAr?.street) {
    // Explicit National Address building code (e.g. "4050 Abu Mas'ud Al Badri")
    // must never be overwritten by a neighboring ArcGIS PointAddress centroid (e.g. "5064").
    const sameRoadEn = Boolean(baseStreetEn && areSimilarRoadNames(hintStreet, baseStreetEn));
    const sameRoadAr = Boolean(baseStreetAr && areSimilarRoadNames(hintStreet, baseStreetAr));

    if (hasLatin(hintStreet)) {
      baseStreetEn = sameRoadEn
        ? combineBuildingWithRoad(explicitBuildingNum, baseStreetEn, arcgisEn?.addNum)
        : hintStreet;
      baseStreetAr = sameRoadAr
        ? combineBuildingWithRoad(explicitBuildingNum, baseStreetAr, arcgisAr?.addNum)
        : "";
    } else if (hasArabic(hintStreet)) {
      baseStreetAr = sameRoadAr
        ? combineBuildingWithRoad(explicitBuildingNum, baseStreetAr, arcgisAr?.addNum)
        : hintStreet;
      baseStreetEn = sameRoadEn
        ? combineBuildingWithRoad(explicitBuildingNum, baseStreetEn, arcgisEn?.addNum)
        : "";
    }
  } else if (hintHasRoadOrNum && !googleEn?.street && !googleAr?.street) {
    if (hasLatin(hintStreet) && !baseStreetEn) baseStreetEn = hintStreet;
    if (hasArabic(hintStreet) && !baseStreetAr) baseStreetAr = hintStreet;
  }

  let resolvedStreetEn = baseStreetEn || (hasLatin(hintStreet) ? hintStreet : "");
  let resolvedStreetAr = baseStreetAr || (hasArabic(hintStreet) ? hintStreet : "");

  if (!resolvedStreetEn && resolvedStreetAr) {
    resolvedStreetEn = arabicRoadToEnglishFallback(resolvedStreetAr);
  }
  if (!resolvedStreetAr && resolvedStreetEn) {
    resolvedStreetAr = englishRoadToArabicFallback(resolvedStreetEn);
  }
  if (!resolvedStreetEn) {
    resolvedStreetEn = `${resolvedDistrictEn || cityEn} Main Rd`;
  }
  if (!resolvedStreetAr) {
    resolvedStreetAr = `طريق ${resolvedDistrictAr || cityAr} الرئيسي`;
  }

  const postalCode =
    googleEn?.postalCode ||
    googleAr?.postalCode ||
    arcgisEn?.postalCode ||
    arcgisAr?.postalCode ||
    nomEn?.address?.postcode ||
    nomAr?.address?.postcode ||
    (photon?.postcode || "").trim() ||
    "";

  const cleanAddressHint = normalizeHints(options?.addressHint);
  const cleanPlaceHint = normalizeHints(options?.placeHint);
  const placeVenueName = cleanPlaceHint.split(/[،,·|]/)[0]?.trim() || "";
  const rawPlaceCheck = normalizeComparableName(placeVenueName);
  const isDuplicatePlaceHint =
    !placeVenueName ||
    isNoiseHint(placeVenueName) ||
    rawPlaceCheck === normalizeComparableName(cityEn) ||
    rawPlaceCheck === normalizeComparableName(cityAr) ||
    rawPlaceCheck === normalizeComparableName(resolvedDistrictEn) ||
    rawPlaceCheck === normalizeComparableName(resolvedDistrictAr) ||
    rawPlaceCheck === normalizeComparableName(resolvedStreetEn) ||
    rawPlaceCheck === normalizeComparableName(resolvedStreetAr) ||
    areSimilarRoadNames(placeVenueName, resolvedStreetEn) ||
    areSimilarRoadNames(placeVenueName, resolvedStreetAr);

  const builtAddressEn =
    googleEn?.formattedAddress ||
    dedupeJoin(
      [
        resolvedStreetEn,
        !isDuplicatePlaceHint && hasLatin(placeVenueName) ? placeVenueName : "",
        resolvedDistrictEn !== cityEn ? resolvedDistrictEn : "",
        cityEn,
        stateEn,
        postalCode,
        "Saudi Arabia",
      ],
      ", "
    );

  const builtAddressAr =
    googleAr?.formattedAddress ||
    dedupeJoin(
      [
        resolvedStreetAr,
        !isDuplicatePlaceHint && hasArabic(placeVenueName) ? placeVenueName : "",
        resolvedDistrictAr !== cityAr ? resolvedDistrictAr : "",
        cityAr,
        stateAr,
        postalCode,
        "المملكة العربية السعودية",
      ],
      "، "
    );

  const finalAddressEn =
    builtAddressEn ||
    cleanAddressHint ||
    nomEn?.display_name ||
    arcgisEn?.formattedAddress ||
    "";

  const finalAddressAr =
    builtAddressAr ||
    (hasArabic(cleanAddressHint) ? cleanAddressHint : "") ||
    arcgisAr?.formattedAddress ||
    nomAr?.display_name ||
    finalAddressEn;

  const centerLat = effectiveSaudiCity?.lat ?? cleanLat;
  const centerLng = effectiveSaudiCity?.lng ?? cleanLng;
  const direction = computeDirectionFromCenter(cleanLat, cleanLng, centerLat, centerLng);

  const source: ServerGeocodedLocation["source"] =
    googleEn || googleAr
      ? "google"
      : arcgisEn || arcgisAr || nomEn || nomAr || photon
        ? "nominatim"
        : "fallback";

  return {
    found: source !== "fallback",
    source,
    lat: cleanLat,
    lng: cleanLng,
    cityId,
    cityEn,
    cityAr,
    state: stateEn,
    stateAr,
    district: resolvedDistrictEn,
    districtAr: resolvedDistrictAr,
    street: resolvedStreetEn,
    streetAr: resolvedStreetAr,
    postalCode,
    address: finalAddressEn,
    addressAr: finalAddressAr,
    direction,
    directionEn: DIRECTION_EN_MAP[direction],
  };
}

/**
 * Forward-geocodes a place name, street query, or extracted Google Maps URL label
 * into coordinates + bilingual address metadata.
 */
export async function forwardGeocodeReal(
  query: string,
  options?: { cityHint?: string | null; addressHint?: string | null }
): Promise<ServerGeocodedLocation | null> {
  const trimmed = normalizeArabicDigits(stripBidiChars(query || "")).trim();
  if (!trimmed) return null;

  const cityObj = resolveSaudiCity(options?.cityHint) || resolveSaudiCity(trimmed);
  const queryWithContext =
    cityObj && !trimmed.toLowerCase().includes(cityObj.en.toLowerCase()) && !trimmed.includes(cityObj.ar)
      ? `${trimmed}, ${cityObj.en}, Saudi Arabia`
      : trimmed;

  const googleFirst = await fetchGoogleRestGeocode({ address: queryWithContext }, "en");
  if (googleFirst && (Math.abs(googleFirst.lat) > 0.0001 || Math.abs(googleFirst.lng) > 0.0001)) {
    return reverseGeocodeReal(googleFirst.lat, googleFirst.lng, {
      placeHint: trimmed,
      addressHint: options?.addressHint || trimmed,
      preferredCity: options?.cityHint || cityObj?.en,
    });
  }

  const runSearch = async (searchText: string, countryFilter: boolean): Promise<NominatimResponse[]> => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      searchText
    )}&addressdetails=1&limit=5${countryFilter ? "&countrycodes=sa" : ""}`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "QafNest-Platform/1.0 (https://qafnest.com)",
          "Accept-Language": "en",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5500),
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? (data as NominatimResponse[]) : [];
    } catch {
      return [];
    }
  };

  let results = await runSearch(queryWithContext, true);
  if (results.length === 0 && queryWithContext !== trimmed) {
    results = await runSearch(trimmed, true);
  }
  if (results.length === 0) {
    results = await runSearch(trimmed, false);
  }

  if (results.length === 0) {
    // Try ArcGIS forward geocoder (handles Saudi street names & National Address formats well)
    const strippedBuildingQuery = trimmed.replace(/^\d{3,5}\s+/, "").trim();
    const arcQueries = [queryWithContext];
    if (strippedBuildingQuery && strippedBuildingQuery !== trimmed) {
      arcQueries.push(
        cityObj && !strippedBuildingQuery.toLowerCase().includes(cityObj.en.toLowerCase()) && !strippedBuildingQuery.includes(cityObj.ar)
          ? `${strippedBuildingQuery}, ${cityObj.en}, Saudi Arabia`
          : strippedBuildingQuery
      );
    }

    let arcBest: ArcgisForwardCandidate | undefined;
    for (const aq of arcQueries) {
      const cands = await fetchArcgisForward(aq);
      const ranked = cands
        .map((c) => {
          let total = c.score;
          if (c.stAddr) total += 15;
          if (cityObj) {
            const hay = `${c.address} ${c.city}`.toLowerCase();
            if (hay.includes(cityObj.en.toLowerCase()) || hay.includes(cityObj.ar)) {
              total += 25;
            }
          }
          return { c, total };
        })
        .sort((a, b) => b.total - a.total);

      const top = ranked[0]?.c;
      if (top && (top.stAddr || top.score >= 82)) {
        arcBest = top;
        break;
      }
      if (!arcBest && top && top.score >= 78) {
        arcBest = top;
      }
    }

    if (arcBest) {
      return reverseGeocodeReal(arcBest.lat, arcBest.lng, {
        placeHint: trimmed,
        addressHint: options?.addressHint || trimmed,
        preferredCity: options?.cityHint || cityObj?.en,
      });
    }

    // Fallback forward search via Photon
    try {
      const phRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(queryWithContext)}&limit=3`,
        {
          headers: { "User-Agent": "QafNest-Platform/1.0 (https://qafnest.com)" },
          signal: AbortSignal.timeout(4500),
          cache: "no-store",
        }
      );
      if (phRes.ok) {
        const phJson = (await phRes.json()) as {
          features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
        };
        const coords = phJson.features?.[0]?.geometry?.coordinates;
        if (coords && Number.isFinite(coords[1]) && Number.isFinite(coords[0])) {
          return reverseGeocodeReal(coords[1], coords[0], {
            placeHint: trimmed,
            addressHint: options?.addressHint || trimmed,
            preferredCity: options?.cityHint || cityObj?.en,
          });
        }
      }
    } catch {}
    return null;
  }

  // Prefer results matching the requested city hint rather than arbitrary small towns with duplicate district names
  const scored = results
    .map((r) => {
      const hay = `${r.display_name || ""} ${r.address?.city || ""} ${r.address?.state || ""}`.toLowerCase();
      let score = Number(r.importance || 0);
      if (cityObj) {
        if (hay.includes(cityObj.en.toLowerCase()) || hay.includes(cityObj.ar)) {
          score += 5;
        }
      }
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.r;
  const bestLat = Number(best?.lat);
  const bestLng = Number(best?.lon);
  if (!Number.isFinite(bestLat) || !Number.isFinite(bestLng)) return null;

  return reverseGeocodeReal(bestLat, bestLng, {
    placeHint: trimmed,
    addressHint: options?.addressHint || trimmed,
    preferredCity: options?.cityHint || cityObj?.en,
  });
}
