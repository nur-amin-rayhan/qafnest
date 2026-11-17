import { type Property } from "@/data/properties";
import {
  extractBilingualPropertyFields,
  isMissingBilingualColumnError,
  stripBilingualFromSelect,
} from "@qafnest/shared";
import { createClient } from "@/lib/supabase/client";
import {
  getLocalizedPropertyTitle,
  getLocalizedDistrictName,
} from "@/lib/localization/localeHelper";

type PropertyRow = {
  id: string;
  slug?: string | null;
  title: string;
  title_ar?: string | null;
  description: string | null;
  description_ar?: string | null;
  category: string;
  city: string;
  city_name: string | null;
  district: string | null;
  district_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  street?: string | null;
  street_ar?: string | null;
  postal_code?: string | null;
  state?: string | null;
  state_ar?: string | null;
  google_maps_url?: string | null;
  category_name: string | null;
  specs: string | null;
  base_price: number;
  weekend_price: number | null;
  original_price: number | null;
  discount_percentage: number | null;
  images: string[] | null;
  features: string[] | null;
  rating: number | null;
  reviews_count: number | null;
  instant_book: boolean | null;
  has_pool: boolean | null;
  self_checkin: boolean | null;
  is_licensed: boolean | null;
  capacity: number | null;
  bedrooms_count: number | null;
  bathrooms_count?: number | null;
  living_rooms_count: number | null;
  checkin_time: string | null;
  checkout_time: string | null;
  custom_day_pricing?: any;
  sunday_price?: number | null;
  monday_price?: number | null;
  tuesday_price?: number | null;
  wednesday_price?: number | null;
  thursday_price?: number | null;
  friday_price?: number | null;
  saturday_price?: number | null;
  area_sqm: number | null;
  lat: number | null;
  lng: number | null;
  is_approved: boolean;
  host_id?: string | null;
  external_host_id?: string | null;
};

function titleCase(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferSection(row: PropertyRow): Property["section"] {
  const slug = (row.slug || "").toLowerCase();
  const title = (row.title || "").toLowerCase();
  const city = (row.city || "").toLowerCase();

  if (slug.startsWith("kidia") || title.includes("qiddiya") || title.includes("tuwaiq") || title.includes("najd") || title.includes("diriyah")) return "kidia";
  if (slug.startsWith("sea") || city === "jeddah" || city === "khobar" || title.includes("beach") || title.includes("sea") || title.includes("obhur") || title.includes("corniche")) return "sea";
  if (slug.startsWith("fog") || city === "abha" || title.includes("fog") || title.includes("misty") || title.includes("soudah")) return "fog";
  if (slug.startsWith("roses") || city === "taif" || title.includes("rose") || title.includes("ward") || title.includes("hada")) return "roses";
  if (slug.startsWith("deal") || (row.discount_percentage && Number(row.discount_percentage) >= 15)) return "deals";
  if (city === "riyadh") return "kidia";
  return "general";
}

function fromRow(rawRow: PropertyRow): Property {
  const row = extractBilingualPropertyFields(rawRow as unknown as Record<string, unknown>) as unknown as PropertyRow;
  const images = row.images?.filter(Boolean) || [];
  const category = ["chalet", "villa", "farm", "camp", "penthouse"].includes(row.category)
    ? row.category as Property["category"]
    : "villa";
  const cityName = row.city_name || titleCase(row.city);
  const specs = row.specs || [
    titleCase(category),
    row.bedrooms_count ? `${row.bedrooms_count} Bedrooms` : null,
    row.capacity ? `Up to ${row.capacity} Guests` : null,
  ].filter(Boolean).join(" · ");

  return {
    id: row.id,
    slug: row.slug || undefined,
    title: row.title,
    titleAr: row.title_ar?.trim() || getLocalizedPropertyTitle(row, "ar"),
    description: row.description || undefined,
    descriptionAr: row.description_ar?.trim() || undefined,
    city: row.city.toLowerCase() as Property["city"],
    cityName,
    district: row.district || undefined,
    districtAr: row.district_ar?.trim() || getLocalizedDistrictName(row.district, "ar"),
    address: row.address || undefined,
    addressAr: row.address_ar || undefined,
    street: row.street || undefined,
    streetAr: row.street_ar || undefined,
    postalCode: row.postal_code || undefined,
    state: row.state || undefined,
    stateAr: row.state_ar || undefined,
    googleMapsUrl: row.google_maps_url || undefined,
    category,
    categoryName: row.category_name || titleCase(category),
    rating: Number(row.rating ?? 0),
    reviewsCount: Number(row.reviews_count ?? 0),
    specs,
    image: images[0] || "",
    images,
    features: row.features && row.features.length > 0 ? row.features : [],
    basePrice: Number(row.base_price),
    weekendPrice: row.weekend_price ? Number(row.weekend_price) : undefined,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    discountPercentage: row.discount_percentage ? Number(row.discount_percentage) : undefined,
    isLicensed: Boolean(row.is_licensed),
    instantBook: Boolean(row.instant_book),
    hasPool: Boolean(row.has_pool),
    selfCheckin: Boolean(row.self_checkin),
    isApproved: Boolean(row.is_approved),
    status: row.is_approved ? "approved" : "pending",
    section: inferSection(row),
    capacity: row.capacity ?? undefined,
    bedroomsCount: row.bedrooms_count ?? undefined,
    bathroomsCount: row.bathrooms_count ?? undefined,
    livingRoomsCount: row.living_rooms_count ?? undefined,
    checkinTime: row.checkin_time?.slice(0, 5) || undefined,
    checkoutTime: row.checkout_time?.slice(0, 5) || undefined,
    customDayPricing: row.custom_day_pricing || undefined,
    sundayPrice: row.sunday_price ? Number(row.sunday_price) : undefined,
    mondayPrice: row.monday_price ? Number(row.monday_price) : undefined,
    tuesdayPrice: row.tuesday_price ? Number(row.tuesday_price) : undefined,
    wednesdayPrice: row.wednesday_price ? Number(row.wednesday_price) : undefined,
    thursdayPrice: row.thursday_price ? Number(row.thursday_price) : undefined,
    fridayPrice: row.friday_price ? Number(row.friday_price) : undefined,
    saturdayPrice: row.saturday_price ? Number(row.saturday_price) : undefined,
    areaSqm: row.area_sqm ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    hostId: row.host_id || undefined,
  };
}

const BILINGUAL_SELECT_FIELDS =
  "id,slug,title,title_ar,description,description_ar,category,city,city_name,state,state_ar,district,district_ar,address,address_ar,street,street_ar,postal_code,google_maps_url,category_name,specs,base_price,weekend_price,original_price,discount_percentage,images,features,rating,reviews_count,instant_book,has_pool,self_checkin,is_licensed,capacity,bedrooms_count,living_rooms_count,checkin_time,checkout_time,area_sqm,lat,lng,is_approved,created_at,host_id,external_host_id";

const LEGACY_SELECT_FIELDS = stripBilingualFromSelect(BILINGUAL_SELECT_FIELDS);

const PROPS_SESSION_KEY = "qafnest_props_swr_v1";
const PROPS_SESSION_TTL_MS = 120_000;

let cachedProperties: Promise<Property[]> | null = null;
let memorySnapshot: Property[] | null = null;

/** Synchronous snapshot for instant SPA back/forward transitions without hydration mismatch. */
export function getMemoryPropertiesSnapshot(): Property[] | null {
  return memorySnapshot;
}

/** Client-only warm session cache reader for fast hard-reload paint before network resolves. */
export function readSessionPropertiesSnapshot(): Property[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PROPS_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; data?: Property[] };
    if (
      Array.isArray(parsed?.data) &&
      parsed.data.length > 0 &&
      typeof parsed.ts === "number" &&
      Date.now() - parsed.ts < PROPS_SESSION_TTL_MS
    ) {
      memorySnapshot = parsed.data;
      return parsed.data;
    }
  } catch {
    // Ignore storage read errors in restricted browsers
  }
  return null;
}

function writePropertiesCache(data: Property[]) {
  memorySnapshot = data;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      PROPS_SESSION_KEY,
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // Ignore quota/storage errors
  }
}

/** Fetch approved listings; use the bundled catalog only when Supabase is unavailable. */
export function listProperties(options: { refresh?: boolean } = {}): Promise<Property[]> {
  if (!options.refresh && cachedProperties) return cachedProperties;

  cachedProperties = (async () => {
    try {
      const supabase = createClient();
      const initial = await supabase
        .from("properties")
        .select(BILINGUAL_SELECT_FIELDS)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      let data = initial.data as PropertyRow[] | null;
      let error = initial.error;

      if (error && isMissingBilingualColumnError(error)) {
        const retry = await supabase
          .from("properties")
          .select(LEGACY_SELECT_FIELDS)
          .eq("is_approved", true)
          .order("created_at", { ascending: false });
        data = retry.data as PropertyRow[] | null;
        error = retry.error;
      }

      if (error) throw error;

      const dbProperties = (data || []).map((row) => fromRow(row as PropertyRow));
      writePropertiesCache(dbProperties);
      return dbProperties;
    } catch (error) {
      console.warn("Using local property catalog because Supabase listings are unavailable:", error);
    }
    return [];
  })();

  return cachedProperties;
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const properties = await listProperties();
  const match = properties.find(
    (property) => property.id === id || (property.slug && property.slug === id)
  );
  if (match) return match;

  // Fallback for previewing unpublished listings directly by id or slug
  try {
    const supabase = createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const initial = await (isUuid
      ? supabase.from("properties").select(BILINGUAL_SELECT_FIELDS).eq("id", id).maybeSingle()
      : supabase.from("properties").select(BILINGUAL_SELECT_FIELDS).eq("slug", id).maybeSingle());

    let data = initial.data as PropertyRow | null;
    let error = initial.error;

    if (error && isMissingBilingualColumnError(error)) {
      const retry = await (isUuid
        ? supabase.from("properties").select(LEGACY_SELECT_FIELDS).eq("id", id).maybeSingle()
        : supabase.from("properties").select(LEGACY_SELECT_FIELDS).eq("slug", id).maybeSingle());
      data = retry.data as PropertyRow | null;
      error = retry.error;
    }

    if (data && !error) {
      return fromRow(data as PropertyRow);
    }
  } catch {
    // If table query fails, fallback to null
  }

  return null;
}

export function clearPropertyCache() {
  cachedProperties = null;
  memorySnapshot = null;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(PROPS_SESSION_KEY);
    } catch {}
  }
}
