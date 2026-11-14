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
  living_rooms_count: number | null;
  checkin_time: string | null;
  checkout_time: string | null;
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
    livingRoomsCount: row.living_rooms_count ?? undefined,
    checkinTime: row.checkin_time?.slice(0, 5) || undefined,
    checkoutTime: row.checkout_time?.slice(0, 5) || undefined,
    areaSqm: row.area_sqm ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    hostId: row.host_id || undefined,
  };
}

const BILINGUAL_SELECT_FIELDS =
  "id,slug,title,title_ar,description,description_ar,category,city,city_name,state,state_ar,district,district_ar,address,address_ar,street,street_ar,postal_code,google_maps_url,category_name,specs,base_price,weekend_price,original_price,discount_percentage,images,features,rating,reviews_count,instant_book,has_pool,self_checkin,is_licensed,capacity,bedrooms_count,living_rooms_count,checkin_time,checkout_time,area_sqm,lat,lng,is_approved,created_at,host_id,external_host_id";

const LEGACY_SELECT_FIELDS = stripBilingualFromSelect(BILINGUAL_SELECT_FIELDS);

let cachedProperties: Promise<Property[]> | null = null;

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
    const initial = await supabase
      .from("properties")
      .select(BILINGUAL_SELECT_FIELDS)
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();

    let data = initial.data as PropertyRow | null;
    let error = initial.error;

    if (error && isMissingBilingualColumnError(error)) {
      const retry = await supabase
        .from("properties")
        .select(LEGACY_SELECT_FIELDS)
        .or(`id.eq.${id},slug.eq.${id}`)
        .single();
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
}
