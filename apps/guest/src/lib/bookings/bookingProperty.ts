import {
  extractBilingualPropertyFields,
  resolvePropertyGoogleMapsUrl,
} from "@qafnest/shared";

export const BOOKING_PROPERTY_SELECT_FIELDS =
  "id, title, title_ar, city, city_name, state, state_ar, district, district_ar, street, street_ar, address, address_ar, postal_code, google_maps_url, lat, lng, images, external_host_id";

export interface BookingPropertyDetails {
  id: string;
  title: string;
  titleAr?: string | null;
  title_ar?: string | null;
  city?: string | null;
  city_name: string | null;
  state?: string | null;
  stateAr?: string | null;
  state_ar?: string | null;
  district?: string | null;
  districtAr?: string | null;
  district_ar?: string | null;
  street?: string | null;
  streetAr?: string | null;
  street_ar?: string | null;
  address?: string | null;
  addressAr?: string | null;
  address_ar?: string | null;
  postalCode?: string | null;
  postal_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  googleMapsUrl?: string | null;
  google_maps_url?: string | null;
  images: string[] | null;
}

function cleanString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function cleanCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Formats a Supabase property row into a consistent booking property payload,
 * exposing exact coordinates, street address, and Google Maps link only when confirmed & paid.
 */
export function formatBookingPropertyPayload(
  rawProp: Record<string, unknown>,
  includeExactLocation: boolean
): BookingPropertyDetails {
  const p = extractBilingualPropertyFields(rawProp);
  const cityName = cleanString(p.city_name) || cleanString(p.city) || "";
  const lat = includeExactLocation ? cleanCoord(p.lat) : null;
  const lng = includeExactLocation ? cleanCoord(p.lng) : null;

  const googleMapsUrl = includeExactLocation
    ? resolvePropertyGoogleMapsUrl({
        title: cleanString(p.title),
        titleAr: cleanString(p.title_ar),
        city: cityName || null,
        state: cleanString(p.state),
        stateAr: cleanString(p.state_ar),
        district: cleanString(p.district),
        districtAr: cleanString(p.district_ar),
        street: cleanString(p.street),
        streetAr: cleanString(p.street_ar),
        address: cleanString(p.address),
        addressAr: cleanString(p.address_ar),
        postalCode: cleanString(p.postal_code),
        lat,
        lng,
        googleMapsUrl: cleanString(p.google_maps_url),
      }) || null
    : null;

  return {
    id: String(p.id || ""),
    title: typeof p.title === "string" ? p.title : "",
    titleAr: cleanString(p.title_ar),
    title_ar: cleanString(p.title_ar),
    city: cityName || cleanString(p.city),
    city_name: cityName || null,
    state: cleanString(p.state),
    stateAr: cleanString(p.state_ar),
    state_ar: cleanString(p.state_ar),
    district: cleanString(p.district),
    districtAr: cleanString(p.district_ar),
    district_ar: cleanString(p.district_ar),
    street: includeExactLocation ? cleanString(p.street) : null,
    streetAr: includeExactLocation ? cleanString(p.street_ar) : null,
    street_ar: includeExactLocation ? cleanString(p.street_ar) : null,
    address: includeExactLocation ? cleanString(p.address) : null,
    addressAr: includeExactLocation ? cleanString(p.address_ar) : null,
    address_ar: includeExactLocation ? cleanString(p.address_ar) : null,
    postalCode: includeExactLocation ? cleanString(p.postal_code) : null,
    postal_code: includeExactLocation ? cleanString(p.postal_code) : null,
    lat,
    lng,
    googleMapsUrl,
    google_maps_url: googleMapsUrl,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
  };
}
