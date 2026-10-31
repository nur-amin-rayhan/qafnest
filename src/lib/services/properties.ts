import { PROPERTIES, type Property } from "@/data/properties";
import { createClient } from "@/lib/supabase/client";

type PropertyRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  city: string;
  city_name: string | null;
  district: string | null;
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
};

function titleCase(value: string) {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fromRow(row: PropertyRow): Property {
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

  const fallback = PROPERTIES.find((p) => p.id === row.id);

  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    city: row.city.toLowerCase() as Property["city"],
    cityName,
    district: row.district || undefined,
    category,
    categoryName: row.category_name || titleCase(category),
    rating: Number(row.rating ?? 5),
    reviewsCount: Number(row.reviews_count ?? 0),
    specs,
    image: images[0] || fallback?.image || PROPERTIES[0].image,
    images,
    features: row.features || fallback?.features || [],
    amenities: fallback?.amenities,
    poolDetails: fallback?.poolDetails,
    majlisDetails: fallback?.majlisDetails,
    chaletForAr: fallback?.chaletForAr,
    bathroomsCount: fallback?.bathroomsCount,
    basePrice: Number(row.base_price),
    weekendPrice: row.weekend_price ? Number(row.weekend_price) : undefined,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    discountPercentage: row.discount_percentage ? Number(row.discount_percentage) : undefined,
    isLicensed: Boolean(row.is_licensed),
    instantBook: Boolean(row.instant_book),
    hasPool: Boolean(row.has_pool),
    selfCheckin: Boolean(row.self_checkin),
    section: "general",
    capacity: row.capacity ?? fallback?.capacity,
    bedroomsCount: row.bedrooms_count ?? fallback?.bedroomsCount,
    livingRoomsCount: row.living_rooms_count ?? fallback?.livingRoomsCount,
    checkinTime: row.checkin_time?.slice(0, 5) || undefined,
    checkoutTime: row.checkout_time?.slice(0, 5) || undefined,
    areaSqm: row.area_sqm ?? fallback?.areaSqm,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
  };
}

let cachedProperties: Promise<Property[]> | null = null;

/** Fetch approved listings; use the bundled catalog when Supabase is unavailable or empty. */
export function listProperties(options: { refresh?: boolean } = {}): Promise<Property[]> {
  if (!options.refresh && cachedProperties) return cachedProperties;

  cachedProperties = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("properties")
        .select("id,title,description,category,city,city_name,district,category_name,specs,base_price,weekend_price,original_price,discount_percentage,images,features,rating,reviews_count,instant_book,has_pool,self_checkin,is_licensed,capacity,bedrooms_count,living_rooms_count,checkin_time,checkout_time,area_sqm,lat,lng,is_approved,created_at")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data?.length) return (data as PropertyRow[]).map(fromRow);
    } catch (error) {
      console.warn("Using local property catalog because Supabase listings are unavailable:", error);
    }
    return PROPERTIES;
  })();

  return cachedProperties;
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const properties = await listProperties();
  return properties.find((property) => property.id === id) || null;
}

export function clearPropertyCache() {
  cachedProperties = null;
}
