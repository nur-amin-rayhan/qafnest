import { SAUDI_CITIES, getCityInfo } from "./saudiLocations";

export interface ParsedLocationResult {
  lat: number;
  lng: number;
  cityId: string;
  pin: { x: number; y: number };
}

/**
 * Extracts clean URL from raw link or `<iframe src="...">` embed snippet
 */
export function extractGoogleMapsUrlFromInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  const trimmed = input.trim();
  const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) {
    return iframeMatch[1].trim();
  }
  return trimmed;
}

/**
 * Extracts latitude and longitude from Google Maps share links, embed iframes, query strings, or raw coordinates.
 */
export function parseGoogleMapsCoordinates(input: string): { lat: number; lng: number } | null {
  const clean = extractGoogleMapsUrlFromInput(input);
  if (!clean) return null;

  let decoded = clean;
  try {
    decoded = decodeURIComponent(clean);
  } catch {
    decoded = clean;
  }

  // 1. Exact place pin coordinates (!3dlat!4dlng)
  const placeMatch = decoded.match(/!3d([+-]?\d+\.?\d*)!4d([+-]?\d+\.?\d*)/);
  if (placeMatch) {
    const lat = parseFloat(placeMatch[1]);
    const lng = parseFloat(placeMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 2. Google Maps Embed `pb=` coordinates (!2dlng!3dlat)
  const embedPbMatch = decoded.match(/!2d([+-]?\d+\.?\d*)!3d([+-]?\d+\.?\d*)/);
  if (embedPbMatch) {
    const lng = parseFloat(embedPbMatch[1]);
    const lat = parseFloat(embedPbMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 3. Query param coordinates (q=lat,lng, query=lat,lng, ll=lat,lng, center=lat,lng, destination=lat,lng)
  const queryMatch = decoded.match(
    /[?&](?:q|query|ll|center|destination|origin)=([+-]?\d+\.?\d*)[,\s]+([+-]?\d+\.?\d*)/
  );
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 4. Viewport / map center coordinates (@lat,lng)
  const atMatch = decoded.match(/@([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // 5. Raw coordinate string or URL path decimal coords: "24.7136, 46.6753" or "/search/24.7136,+46.6753"
  const rawMatch = decoded.match(
    /(?:^|\/search\/|\/dir\/|location[/:]\s*)([+-]?\d{1,2}(?:\.\d+)?)[,\s+]+([+-]?\d{1,3}(?:\.\d+)?)/
  );
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  return null;
}

/**
 * Check if the URL is a shortened Google Maps share link requiring server redirect resolution
 */
export function isShortGoogleMapsUrl(input: string): boolean {
  const clean = extractGoogleMapsUrlFromInput(input);
  if (!clean) return false;
  return /https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|share\.google|g\.co\/(?:kgs|maps))\/[A-Za-z0-9_-]+/i.test(
    clean
  );
}

/**
 * Checks if any string contains a recognizable Google Maps link (short, full, or embed)
 */
export function isGoogleMapsLinkLike(input: string): boolean {
  const clean = extractGoogleMapsUrlFromInput(input);
  if (!clean) return false;
  return /https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|share\.google|g\.co|(?:www\.|maps\.)?google\.[^/]+\/maps)/i.test(
    clean
  );
}

/**
 * Extracts a readable place/address query from Google Maps `/place/...`, `/search/...`,
 * or `?q=` / `?query=` URL parameters when not already raw numeric coordinates.
 */
export function extractGoogleMapsPlaceQuery(input: string): string {
  const clean = extractGoogleMapsUrlFromInput(input);
  if (!clean) return "";

  const placeMatch = clean.match(/\/maps\/(?:place|search)\/([^/?@]+)/i);
  if (placeMatch?.[1]) {
    try {
      const decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim();
      if (decoded && !/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(decoded)) {
        return decoded;
      }
    } catch {}
  }

  try {
    const u = new URL(clean);
    for (const key of ["q", "query", "destination", "daddr"]) {
      const val = u.searchParams.get(key)?.trim();
      if (val && !/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(val)) {
        return val;
      }
    }
  } catch {}

  return "";
}

/**
 * Checks whether input is a Google Maps Embed URL or iframe snippet
 */
export function isGoogleMapsEmbedUrl(input: string): boolean {
  const clean = extractGoogleMapsUrlFromInput(input);
  return clean.includes("/maps/embed") || clean.includes("output=embed");
}

/**
 * Validates latitude and longitude ranges
 */
export function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Builds canonical Google Maps share URL for coordinates
 */
export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${Number(lat.toFixed(6))},${Number(lng.toFixed(6))}`;
}

/**
 * Converts coordinates (or an existing Google Maps embed src URL) into an interactive Google Maps embed URL.
 */
export function buildGoogleMapsEmbedUrl(
  lat: number,
  lng: number,
  lang: "ar" | "en" = "en",
  customEmbedOrShareUrl?: string,
  zoom = 15
): string {
  if (customEmbedOrShareUrl) {
    const clean = extractGoogleMapsUrlFromInput(customEmbedOrShareUrl);
    if (clean.startsWith("https://www.google.com/maps/embed") || clean.startsWith("https://maps.google.com/maps/embed")) {
      return clean;
    }
  }
  return `https://maps.google.com/maps?q=${Number(lat.toFixed(6))},${Number(lng.toFixed(6))}&hl=${lang}&z=${zoom}&output=embed`;
}

/**
 * Builds copyable <iframe> embed snippet from coordinates or share URL
 */
export function buildGoogleMapsIframeSnippet(
  lat: number,
  lng: number,
  lang: "ar" | "en" = "en",
  customEmbedUrl?: string
): string {
  const src = buildGoogleMapsEmbedUrl(lat, lng, lang, customEmbedUrl);
  return `<iframe src="${src}" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}

/**
 * Converts GPS coordinates into the nearest Saudi city and normalized map pin {x, y}
 */
export function coordsToCityPin(
  lat: number,
  lng: number,
  preferredCityId?: string
): ParsedLocationResult {
  // If preferredCityId is given, check distance to preferred city
  let bestCity = preferredCityId ? getCityInfo(preferredCityId) : SAUDI_CITIES[0];
  let minDistance = Math.hypot(bestCity.lat - lat, bestCity.lng - lng);

  for (const city of SAUDI_CITIES) {
    const d = Math.hypot(city.lat - lat, city.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      bestCity = city;
    }
  }

  // Scale: 0.0035 degrees lat ~ 1% Y, 0.004 degrees lng ~ 1% X
  const rawX = 50 + (lng - bestCity.lng) / 0.004;
  const rawY = 50 - (lat - bestCity.lat) / 0.0035;

  const pinX = Math.max(8, Math.min(92, Math.round(rawX * 10) / 10));
  const pinY = Math.max(8, Math.min(92, Math.round(rawY * 10) / 10));

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    cityId: bestCity.id,
    pin: { x: pinX, y: pinY },
  };
}

