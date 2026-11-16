import {
  approxDistanceMeters,
  normalizeArabicDigits,
  stripBidiChars,
  stripLeadingBuildingNumber,
} from "./serverGeocoderText";
import type {
  ArcgisForwardCandidate,
  NominatimResponse,
  PhotonFeatureProperties,
  StructuredGeoProviderResult,
} from "./serverGeocoderTypes";

const GEO_HEADERS = {
  "User-Agent": "QafNest-Platform/1.0 (https://qafnest.com)",
  Accept: "application/json",
};

export async function fetchArcgisReverse(
  lat: number,
  lng: number,
  lang: "EN" | "AR"
): Promise<StructuredGeoProviderResult | null> {
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&langCode=${lang}&location=${encodeURIComponent(`${lng},${lat}`)}`;
  try {
    const res = await fetch(url, { headers: GEO_HEADERS, signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      error?: unknown;
      location?: { x?: number; y?: number };
      address?: Record<string, string | undefined>;
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
    const isSnappedNeighbor = addrType === "PointAddress" && Boolean(addNum) && snapDistanceMeters > 12;
    const cleanAddr = isSnappedNeighbor ? stripLeadingBuildingNumber(rawAddr, addNum) : rawAddr;
    const street = cleanAddr && cleanAddr !== postal && addrType !== "Postal" ? cleanAddr : "";

    return {
      lat,
      lng,
      formattedAddress: stripBidiChars(a.LongLabel || a.Match_addr || "").replace(/,\s*SAU$/, ", Saudi Arabia").trim(),
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

export async function fetchArcgisForward(searchText: string): Promise<ArcgisForwardCandidate[]> {
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&SingleLine=${encodeURIComponent(searchText)}&countryCode=SAU&outFields=Match_addr,StAddr,AddNum,City,District,Postal,Region,Addr_type&maxLocations=5`;
  try {
    const res = await fetch(url, { headers: GEO_HEADERS, signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      candidates?: Array<{
        score?: number;
        address?: string;
        location?: { x?: number; y?: number };
        attributes?: { StAddr?: string; Addr_type?: string; City?: string; District?: string };
      }>;
    };
    return (json.candidates || [])
      .filter((c) => typeof c.location?.y === "number" && typeof c.location?.x === "number" && Number.isFinite(c.location.y) && Number.isFinite(c.location.x))
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

export async function fetchNominatimReverse(lat: number, lng: number, lang: "en" | "ar"): Promise<NominatimResponse | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: { ...GEO_HEADERS, "Accept-Language": lang },
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

export async function fetchNominatimForward(searchText: string, countryFilter: boolean): Promise<NominatimResponse[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchText)}&addressdetails=1&limit=5${countryFilter ? "&countrycodes=sa" : ""}`;
  try {
    const res = await fetch(url, {
      headers: { ...GEO_HEADERS, "Accept-Language": "en" },
      signal: AbortSignal.timeout(5500),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as NominatimResponse[]) : [];
  } catch {
    return [];
  }
}

export async function fetchPhotonReverse(lat: number, lng: number): Promise<PhotonFeatureProperties | null> {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`, {
      headers: { "User-Agent": "QafNest-Platform/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { features?: Array<{ properties?: PhotonFeatureProperties }> };
    return json.features?.[0]?.properties || null;
  } catch {
    return null;
  }
}

export async function fetchPhotonForwardCoords(query: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=3`, {
      headers: { "User-Agent": "QafNest-Platform/1.0 (https://qafnest.com)" },
      signal: AbortSignal.timeout(4500),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> };
    const coords = json.features?.[0]?.geometry?.coordinates;
    return coords && Number.isFinite(coords[1]) && Number.isFinite(coords[0]) ? coords : null;
  } catch {
    return null;
  }
}

export async function fetchGoogleRestGeocode(
  params: { lat?: number; lng?: number; address?: string },
  lang: "en" | "ar"
): Promise<StructuredGeoProviderResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim() || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
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
    if (json.status !== "OK" || !json.results?.length) return null;

    const first = json.results[0];
    const comps = first.address_components || [];
    const pick = (...types: string[]) => comps.find((c) => types.some((t) => c.types.includes(t)))?.long_name || "";

    return {
      lat: Number(first.geometry?.location?.lat ?? params.lat ?? 0),
      lng: Number(first.geometry?.location?.lng ?? params.lng ?? 0),
      formattedAddress: first.formatted_address || "",
      street: [pick("street_number"), pick("route", "street_address")].filter(Boolean).join(" ").trim(),
      district: pick("sublocality_level_1", "sublocality", "neighborhood"),
      city: pick("locality", "administrative_area_level_2"),
      state: pick("administrative_area_level_1"),
      postalCode: pick("postal_code"),
    };
  } catch {
    return null;
  }
}
