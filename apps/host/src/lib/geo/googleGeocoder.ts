import { loadGoogleMapsScript } from "./googleMapsLoader";
import {
  getCityInfo,
  reverseGeocodePin,
  geocodeAddress,
  getDirectionDisplay,
} from "./saudiLocations";
import { coordsToCityPin } from "./mapsUrlParser";

export interface GeocoderResult {
  found: boolean;
  source: "google" | "nominatim" | "fallback";
  lat: number;
  lng: number;
  cityId: string;
  cityEn: string;
  state: string;
  stateAr: string;
  district: string;
  districtEn: string;
  street: string;
  streetEn: string;
  postalCode: string;
  direction: string;
  directionEn: string;
  addressAr: string;
  addressEn: string;
  pin: { x: number; y: number };
}

export interface ReverseGeocoderResult {
  source: "google" | "nominatim" | "fallback";
  cityId: string;
  cityEn: string;
  state: string;
  stateAr: string;
  district: string;
  districtEn: string;
  street: string;
  streetEn: string;
  postalCode: string;
  direction: string;
  directionEn: string;
  addressAr: string;
  addressEn: string;
}

interface ServerGeoResponse {
  success?: boolean;
  found?: boolean;
  source?: "google" | "nominatim" | "fallback";
  lat?: number;
  lng?: number;
  city?: string;
  cityId?: string;
  cityEn?: string;
  state?: string;
  stateAr?: string;
  district?: string;
  districtAr?: string;
  street?: string;
  streetAr?: string;
  postalCode?: string;
  address?: string;
  addressAr?: string;
  direction?: string;
  directionEn?: string;
}

async function callServerGeoEndpoint(payload: Record<string, unknown>): Promise<ServerGeoResponse | null> {
  try {
    const res = await fetch("/api/host/geo/resolve-maps-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ServerGeoResponse;
    return json?.success ? json : null;
  } catch {
    return null;
  }
}

/**
 * Resolves any Google Maps link or share URL via server (supporting short links + full bilingual address fetch).
 */
export async function resolveGoogleMapsLinkHybrid(
  url: string,
  lang: "ar" | "en" = "en"
): Promise<(GeocoderResult & { resolvedUrl: string; googleMapsUrl: string; embedUrl: string; placeName?: string }) | null> {
  try {
    const res = await fetch("/api/host/geo/resolve-maps-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, lang }),
    });
    const data = (await res.json()) as ServerGeoResponse & {
      resolvedUrl?: string;
      googleMapsUrl?: string;
      embedUrl?: string;
      placeName?: string;
    };
    if (!res.ok || !data?.success || typeof data.lat !== "number" || typeof data.lng !== "number") {
      return null;
    }

    const cityId = data.cityId || data.city || getCityInfo().id;
    const conv = coordsToCityPin(data.lat, data.lng, cityId);
    const cityInfo = getCityInfo(cityId);
    const dirId = data.direction || "وسط";

    return {
      found: Boolean(data.found ?? true),
      source: data.source || "nominatim",
      lat: data.lat,
      lng: data.lng,
      cityId,
      cityEn: data.cityEn || cityInfo.en,
      state: data.state || "",
      stateAr: data.stateAr || data.state || "",
      district: data.districtAr || data.district || "",
      districtEn: data.district || data.districtAr || "",
      street: data.streetAr || data.street || "",
      streetEn: data.street || data.streetAr || "",
      postalCode: data.postalCode || "",
      direction: dirId,
      directionEn: data.directionEn || getDirectionDisplay(dirId, "en"),
      addressAr: data.addressAr || data.address || "",
      addressEn: data.address || data.addressAr || "",
      pin: conv.pin,
      resolvedUrl: data.resolvedUrl || url,
      googleMapsUrl: data.googleMapsUrl || data.resolvedUrl || url,
      embedUrl: data.embedUrl || "",
      placeName: data.placeName,
    };
  } catch {
    return null;
  }
}

/**
 * Forward geocodes an address string into coordinates + bilingual address components.
 * Priority: Google JS Geocoder (if loaded & keyed) -> Server Nominatim/Google REST -> Saudi fallback.
 */
export async function geocodeAddressHybrid(
  addressQuery: string,
  preferredCityId?: string
): Promise<GeocoderResult> {
  const query = addressQuery.trim();
  const cityHint = preferredCityId ? getCityInfo(preferredCityId) : undefined;
  const fullQuery = cityHint && !query.includes(cityHint.id) && !query.toLowerCase().includes(cityHint.en.toLowerCase())
    ? `${query}, ${cityHint.en}, Saudi Arabia`
    : query;

  // 1. Try Server-Side Bilingual Geocoder (Google REST if keyed, otherwise OSM Nominatim EN + AR)
  const serverRes = await callServerGeoEndpoint({
    query: query,
    cityHint: cityHint?.en || preferredCityId || undefined,
  });

  if (serverRes && typeof serverRes.lat === "number" && typeof serverRes.lng === "number") {
    const cityId = serverRes.cityId || serverRes.city || cityHint?.id || getCityInfo().id;
    const conv = coordsToCityPin(serverRes.lat, serverRes.lng, cityId);
    const info = getCityInfo(cityId);
    const dirId = serverRes.direction || "وسط";

    return {
      found: Boolean(serverRes.found ?? true),
      source: serverRes.source || "nominatim",
      lat: serverRes.lat,
      lng: serverRes.lng,
      cityId,
      cityEn: serverRes.cityEn || info.en,
      state: serverRes.state || "",
      stateAr: serverRes.stateAr || serverRes.state || "",
      district: serverRes.districtAr || serverRes.district || "",
      districtEn: serverRes.district || serverRes.districtAr || "",
      street: serverRes.streetAr || serverRes.street || "",
      streetEn: serverRes.street || serverRes.streetAr || "",
      postalCode: serverRes.postalCode || "",
      direction: dirId,
      directionEn: serverRes.directionEn || getDirectionDisplay(dirId, "en"),
      addressAr: serverRes.addressAr || serverRes.address || "",
      addressEn: serverRes.address || serverRes.addressAr || "",
      pin: conv.pin,
    };
  }

  // 2. Fallback to Google JS Geocoder if configured on client
  try {
    const loaded = await loadGoogleMapsScript("en");
    const googleApi = typeof window !== "undefined" ? window.google : undefined;
    if (loaded && googleApi?.maps?.Geocoder) {
      const geocoder = new googleApi.maps.Geocoder();
      const response = await geocoder.geocode({
        address: fullQuery,
        componentRestrictions: { country: "SA" },
      });

      if (response.results && response.results.length > 0) {
        const res = response.results[0];
        const lat = res.geometry.location.lat();
        const lng = res.geometry.location.lng();
        const conv = coordsToCityPin(lat, lng, preferredCityId);
        const cityInfo = getCityInfo(conv.cityId);

        let district = "";
        let street = "";
        let postalCode = "";
        let state = "";
        for (const comp of res.address_components || []) {
          if (comp.types.includes("administrative_area_level_1")) {
            state = comp.long_name;
          }
          if (comp.types.includes("sublocality_level_1") || comp.types.includes("sublocality") || comp.types.includes("neighborhood")) {
            district = comp.long_name;
          }
          if (comp.types.includes("route") || comp.types.includes("street_address")) {
            street = comp.long_name;
          }
          if (comp.types.includes("postal_code")) {
            postalCode = comp.long_name;
          }
        }

        const localRev = reverseGeocodePin(cityInfo.id, conv.pin);
        return {
          found: true,
          source: "google",
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          cityId: cityInfo.id,
          cityEn: cityInfo.en,
          state: state || localRev.cityEn,
          stateAr: state || localRev.city,
          district: district || localRev.district,
          districtEn: district || localRev.districtEn,
          street: street || localRev.street,
          streetEn: street || localRev.streetEn,
          postalCode: postalCode || localRev.postalCode,
          direction: localRev.direction,
          directionEn: localRev.directionEn,
          addressAr: res.formatted_address,
          addressEn: res.formatted_address,
          pin: conv.pin,
        };
      }
    }
  } catch {
    // Fallback to offline database
  }

  // 3. Offline local fallback
  const local = geocodeAddress(query, preferredCityId);
  const cityInfo = getCityInfo(local.city);
  const firstDist = cityInfo.districts[0];
  return {
    found: local.found,
    source: "fallback",
    lat: local.lat,
    lng: local.lng,
    cityId: local.city,
    cityEn: local.cityEn,
    state: "",
    stateAr: "",
    district: local.district,
    districtEn: local.districtEn,
    street: firstDist?.streetSample || "طريق الملك فهد",
    streetEn: firstDist?.streetSampleEn || "King Fahd Rd",
    postalCode: firstDist?.postalCode || "12211",
    direction: local.direction,
    directionEn: local.directionEn,
    addressAr: local.addressAr,
    addressEn: local.addressEn,
    pin: local.pin,
  };
}

/**
 * Reverse geocodes lat/lng coordinates into structured bilingual address & State/Region fields.
 */
export async function reverseGeocodeHybrid(
  lat: number,
  lng: number,
  preferredCityId?: string
): Promise<ReverseGeocoderResult> {
  const serverRes = await callServerGeoEndpoint({
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    preferredCity: preferredCityId,
  });

  if (serverRes) {
    const cityId = serverRes.cityId || serverRes.city || preferredCityId || getCityInfo().id;
    const cityInfo = getCityInfo(cityId);
    const dirId = serverRes.direction || "وسط";

    return {
      source: serverRes.source || "nominatim",
      cityId,
      cityEn: serverRes.cityEn || cityInfo.en,
      state: serverRes.state || "",
      stateAr: serverRes.stateAr || serverRes.state || "",
      district: serverRes.districtAr || serverRes.district || "",
      districtEn: serverRes.district || serverRes.districtAr || "",
      street: serverRes.streetAr || serverRes.street || "",
      streetEn: serverRes.street || serverRes.streetAr || "",
      postalCode: serverRes.postalCode || "",
      direction: dirId,
      directionEn: serverRes.directionEn || getDirectionDisplay(dirId, "en"),
      addressAr: serverRes.addressAr || serverRes.address || "",
      addressEn: serverRes.address || serverRes.addressAr || "",
    };
  }

  try {
    const loaded = await loadGoogleMapsScript("en");
    const googleApi = typeof window !== "undefined" ? window.google : undefined;
    if (loaded && googleApi?.maps?.Geocoder) {
      const geocoder = new googleApi.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });

      if (response.results && response.results.length > 0) {
        const res = response.results[0];
        const conv = coordsToCityPin(lat, lng, preferredCityId);
        const cityInfo = getCityInfo(conv.cityId);

        let district = "";
        let street = "";
        let postalCode = "";
        let state = "";
        for (const comp of res.address_components || []) {
          if (comp.types.includes("administrative_area_level_1")) {
            state = comp.long_name;
          }
          if (comp.types.includes("sublocality_level_1") || comp.types.includes("sublocality") || comp.types.includes("neighborhood")) {
            district = comp.long_name;
          }
          if (comp.types.includes("route") || comp.types.includes("street_address")) {
            street = comp.long_name;
          }
          if (comp.types.includes("postal_code")) {
            postalCode = comp.long_name;
          }
        }

        const localRev = reverseGeocodePin(cityInfo.id, conv.pin);
        return {
          source: "google",
          cityId: cityInfo.id,
          cityEn: cityInfo.en,
          state: state || "",
          stateAr: state || "",
          district: district || localRev.district,
          districtEn: district || localRev.districtEn,
          street: street || localRev.street,
          streetEn: street || localRev.streetEn,
          postalCode: postalCode || localRev.postalCode,
          direction: localRev.direction,
          directionEn: localRev.directionEn,
          addressAr: res.formatted_address,
          addressEn: res.formatted_address,
        };
      }
    }
  } catch {
    // Fallback
  }

  const conv = coordsToCityPin(lat, lng, preferredCityId);
  const localRev = reverseGeocodePin(conv.cityId, conv.pin);
  return {
    source: "fallback",
    cityId: localRev.city,
    cityEn: localRev.cityEn,
    state: "",
    stateAr: "",
    district: localRev.district,
    districtEn: localRev.districtEn,
    street: localRev.street,
    streetEn: localRev.streetEn,
    postalCode: localRev.postalCode,
    direction: localRev.direction,
    directionEn: localRev.directionEn,
    addressAr: localRev.addressAr,
    addressEn: localRev.addressEn,
  };
}
