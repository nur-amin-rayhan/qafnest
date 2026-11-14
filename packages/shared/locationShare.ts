import { normalizePhoneInput } from "./phone";

export interface PropertyLocationFields {
  title?: string | null;
  titleAr?: string | null;
  title_ar?: string | null;
  city?: string | null;
  cityName?: string | null;
  city_name?: string | null;
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
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim();
    }
  }
  return "";
}

/**
 * Normalizes a WhatsApp target phone into digits-only E.164 (e.g. "0551234567" -> "966551234567")
 * for reliable `https://wa.me/<digits>` deep links across Saudi and international numbers.
 */
export function normalizeWhatsAppPhoneDigits(phone?: string | null): string {
  if (!phone || !phone.trim()) return "";
  const e164 = normalizePhoneInput(phone);
  if (e164) {
    return e164.replace(/\D/g, "");
  }
  const rawDigits = phone.replace(/\D/g, "");
  if (rawDigits.startsWith("00") && rawDigits.length > 6) {
    return rawDigits.slice(2);
  }
  if (/^05\d{8}$/.test(rawDigits)) {
    return `966${rawDigits.slice(1)}`;
  }
  return rawDigits;
}

/**
 * Resolves the canonical Google Maps share URL for a property or booking:
 * prefers the saved/pasted Google Maps link when valid, otherwise constructs
 * an exact coordinate deep link or query fallback.
 */
export function resolvePropertyGoogleMapsUrl(fields: PropertyLocationFields): string {
  const savedUrl = firstNonEmpty(fields.googleMapsUrl, fields.google_maps_url);
  if (savedUrl && /^https?:\/\//i.test(savedUrl)) {
    return savedUrl;
  }

  const lat = typeof fields.lat === "number" ? fields.lat : Number(fields.lat);
  const lng = typeof fields.lng === "number" ? fields.lng : Number(fields.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (Math.abs(lat) > 0.0001 || Math.abs(lng) > 0.0001)) {
    return `https://www.google.com/maps/search/?api=1&query=${Number(lat.toFixed(6))},${Number(lng.toFixed(6))}`;
  }

  const queryParts = [
    firstNonEmpty(fields.address, fields.addressAr, fields.address_ar),
    firstNonEmpty(fields.street, fields.streetAr, fields.street_ar),
    firstNonEmpty(fields.district, fields.districtAr, fields.district_ar),
    firstNonEmpty(fields.cityName, fields.city_name, fields.city),
    firstNonEmpty(fields.state, fields.stateAr, fields.state_ar),
  ].filter(Boolean);

  const query =
    queryParts.length > 0
      ? Array.from(new Set(queryParts)).join(", ")
      : firstNonEmpty(fields.title, fields.titleAr, fields.title_ar) || "Saudi Arabia";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Formats a human-readable localized address line from property fields without duplication.
 */
export function formatPropertyAddressLine(
  fields: PropertyLocationFields,
  locale: "en" | "ar"
): string {
  const address =
    locale === "ar"
      ? firstNonEmpty(fields.addressAr, fields.address_ar, fields.address)
      : firstNonEmpty(fields.address, fields.addressAr, fields.address_ar);

  if (address) {
    return address;
  }

  const street =
    locale === "ar"
      ? firstNonEmpty(fields.streetAr, fields.street_ar, fields.street)
      : firstNonEmpty(fields.street, fields.streetAr, fields.street_ar);
  const district =
    locale === "ar"
      ? firstNonEmpty(fields.districtAr, fields.district_ar, fields.district)
      : firstNonEmpty(fields.district, fields.districtAr, fields.district_ar);
  const city = firstNonEmpty(fields.cityName, fields.city_name, fields.city);
  const state =
    locale === "ar"
      ? firstNonEmpty(fields.stateAr, fields.state_ar, fields.state)
      : firstNonEmpty(fields.state, fields.stateAr, fields.state_ar);
  const postalCode = firstNonEmpty(fields.postalCode, fields.postal_code);

  const parts: string[] = [];
  for (const part of [street, district, city, state, postalCode]) {
    if (!part) continue;
    const lower = part.toLowerCase();
    if (!parts.some((existing) => existing.toLowerCase().includes(lower) || lower.includes(existing.toLowerCase()))) {
      parts.push(part);
    }
  }

  return parts.join(locale === "ar" ? "، " : ", ") || (locale === "ar" ? "المملكة العربية السعودية" : "Saudi Arabia");
}

/**
 * Builds clipboard text for "Copy Location" containing the property title, full fetched address,
 * coordinates (when present), and exact Google Maps URL.
 */
export function buildLocationCopyText(
  fields: PropertyLocationFields & { bookingRef?: string | null },
  locale: "en" | "ar"
): string {
  const title =
    locale === "ar"
      ? firstNonEmpty(fields.titleAr, fields.title_ar, fields.title) || "QafNest"
      : firstNonEmpty(fields.title, fields.titleAr, fields.title_ar) || "QafNest";
  const fullAddress = formatPropertyAddressLine(fields, locale);
  const mapsUrl = resolvePropertyGoogleMapsUrl(fields);
  const lat = typeof fields.lat === "number" ? fields.lat : Number(fields.lat);
  const lng = typeof fields.lng === "number" ? fields.lng : Number(fields.lng);
  const hasCoords =
    Number.isFinite(lat) && Number.isFinite(lng) && (Math.abs(lat) > 0.0001 || Math.abs(lng) > 0.0001);

  const lines = [
    fields.bookingRef ? `${title} (${fields.bookingRef})` : title,
    fullAddress,
    hasCoords ? `${Number(lat.toFixed(6))}, ${Number(lng.toFixed(6))}` : null,
    mapsUrl,
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
}

/**
 * Builds an accurate `https://wa.me/...` link sharing property address, Google Maps link,
 * and optional reservation/PIN info without losing country code formatting.
 */
export function buildBookingWhatsAppLocationUrl(
  params: PropertyLocationFields & {
    recipientPhone?: string | null;
    guestName?: string | null;
    bookingRef?: string | null;
    smartLockPin?: string | null;
  },
  locale: "en" | "ar"
): string {
  const title =
    locale === "ar"
      ? firstNonEmpty(params.titleAr, params.title_ar, params.title) || "العقار"
      : firstNonEmpty(params.title, params.titleAr, params.title_ar) || "Property";
  const fullAddress = formatPropertyAddressLine(params, locale);
  const mapsUrl = resolvePropertyGoogleMapsUrl(params);
  const digits = normalizeWhatsAppPhoneDigits(params.recipientPhone);

  const greeting =
    locale === "ar"
      ? params.guestName
        ? `السلام عليكم ${params.guestName}، مرحباً بك في ${title}!`
        : `موقع عقار قاف نست: ${title}`
      : params.guestName
      ? `Hello ${params.guestName}, welcome to ${title}!`
      : `QafNest Property Location: ${title}`;

  const lines = [
    greeting,
    params.bookingRef
      ? locale === "ar"
        ? `تأكيد الحجز: ${params.bookingRef}`
        : `Reservation: ${params.bookingRef}`
      : null,
    fullAddress
      ? locale === "ar"
        ? `العنوان: ${fullAddress}`
        : `Address: ${fullAddress}`
      : null,
    locale === "ar" ? `📍 موقع العقار على خرائط جوجل:\n${mapsUrl}` : `📍 Google Maps Location:\n${mapsUrl}`,
    params.smartLockPin
      ? locale === "ar"
        ? `🔑 رمز القفل الذكي: ${params.smartLockPin} (المس الشاشة ثم أدخل الرمز متبوعاً بـ #)`
        : `🔑 Smart Lock PIN: ${params.smartLockPin}`
      : null,
    locale === "ar" ? "نتمنى لك إقامة مميزة!" : "Enjoy your stay!",
  ].filter((l): l is string => Boolean(l));

  const encoded = encodeURIComponent(lines.join("\n"));
  return digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
