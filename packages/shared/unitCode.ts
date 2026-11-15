import { getLocalizedSaudiCity } from "./saudiCities";

/**
 * Sequential numeric unit codes permanently assigned to flagship seeded properties.
 * Matches benchmark platforms (e.g. unit/201001) with concise 6-digit numeric codes.
 */
export const SEQUENTIAL_UNIT_CODES: Record<string, string> = {
  "kidia-falcon-ridge": "201001",
  "kidia-ammariyah-royal": "201002",
  "kidia-najd-palace": "201003",
  "kidia-diriyah-oasis": "201004",
  "kidia-hanifa-sunset": "201005",
  "kidia-tuwaiq-panorama": "201006",
  "sea-unique-vibe": "201007",
  "sea-self-checkin-nuzhah": "201008",
  "sea-two-bedroom-bawadi": "201009",
  "sea-self-checkin-muhammadiyah": "201010",
  "sea-elegant-studio": "201011",
  "sea-living-room-marwah": "201012",
  "fog-outdoor-seating": "201013",
  "fog-living-room-mahalah-1": "201014",
  "fog-two-bedroom-wasaif": "201015",
  "fog-living-room-mahalah-2": "201016",
  "fog-three-bedroom-arin": "201017",
  "fog-one-bedroom-muathafin": "201018",
  "roses-master-bed-sadad": "201019",
  "roses-two-bedroom-sarur": "201020",
  "roses-living-room-jal-1": "201021",
  "roses-master-bed-jal-2": "201022",
  "roses-living-room-shifa": "201023",
  "roses-outdoor-seating-wesam": "201024",
  "deal-master-bed-hazm": "201025",
  "deal-living-room-narjis-1": "201026",
  "deal-living-room-hitteen": "201027",
  "deal-elegant-malqa": "201028",
  "deal-living-room-narjis-2": "201029",
  "deal-living-room-suwaidi": "201030",
  "general-alula-stargazing": "201031",
  "general-mecca-sky-residence": "201032",
  "general-riyadh-kafd-penthouse": "201033",
  "general-khobar-azure": "201034",
  "search-riyadh-yasmeen-1": "201035",
  "search-riyadh-sahafah-1": "201036",
  "search-riyadh-aqeeq-1": "201037",
  "search-riyadh-qurtubah-1": "201038",
  "search-riyadh-malqa-1": "201039",
  "search-riyadh-aqeeq-2": "201040",
  "search-riyadh-malqa-studio-1": "201041",
  "search-riyadh-malqa-studio-2": "201042",
  "search-riyadh-yasmeen-2": "201043",
  "search-riyadh-aqeeq-studio-1": "201044",
  "search-riyadh-aqeeq-apt-3": "201045",
  "search-riyadh-aqeeq-studio-2": "201046",
};

/**
 * Generates or retrieves a deterministic 6-digit numeric Unit Number for any listing.
 */
export function getNumericUnitCode(id: string, explicitUnitCode?: string | null): string {
  const cleanExplicit = String(explicitUnitCode || "").trim();
  if (cleanExplicit && /^\d+$/.test(cleanExplicit)) {
    return cleanExplicit;
  }
  const cleanId = String(id || "").trim();
  if (!cleanId) return "201001";
  if (SEQUENTIAL_UNIT_CODES[cleanId]) {
    return SEQUENTIAL_UNIT_CODES[cleanId];
  }
  let hash = 2166136261;
  for (let index = 0; index < cleanId.length; index += 1) {
    hash ^= cleanId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const numericVal = 202000 + (Math.abs(hash) % 790000);
  return String(numericVal);
}

export interface SearchablePropertyLike {
  id: string;
  title?: string;
  title_ar?: string;
  slug?: string;
  unit_code?: string;
  unitCode?: string;
  tourism_license_number?: string;
  city?: string;
  city_name?: string;
  district?: string;
  district_ar?: string;
  address?: string;
  address_ar?: string;
  category?: string;
  category_name?: string;
  host_id?: string;
  host_name?: string;
  host_phone?: string;
  host_email?: string;
}

/**
 * Matches a property against title, location, host info, MoT license, UUID/slug, or numeric Unit Number (with or without '#' / 'QN-' / 'LIC-').
 */
export function matchesPropertySearchQuery(
  prop: SearchablePropertyLike,
  rawQuery: string
): boolean {
  const q = String(rawQuery || "").trim().toLowerCase();
  if (!q) return true;

  const normalizedCodeQuery = q.replace(/^[#\s]+/, "").replace(/^(unit|qn-|lic-)/i, "").trim();
  const unitCode = getNumericUnitCode(prop.id, prop.unit_code || prop.unitCode);
  const license = String(prop.tourism_license_number || "").toLowerCase();
  const qnRef = `qn-${String(prop.id || "").slice(0, 6).toLowerCase()}`;

  const candidates = [
    prop.id,
    prop.slug,
    unitCode,
    `#${unitCode}`,
    qnRef,
    license,
    license ? `lic-${license}` : "",
    prop.title,
    prop.title_ar,
    prop.city,
    prop.city_name,
    prop.city || prop.city_name ? getLocalizedSaudiCity(prop.city || prop.city_name, "en") : "",
    prop.city || prop.city_name ? getLocalizedSaudiCity(prop.city || prop.city_name, "ar") : "",
    prop.district,
    prop.district_ar,
    prop.address,
    prop.address_ar,
    prop.category,
    prop.category_name,
    prop.host_id,
    prop.host_name,
    prop.host_phone,
    prop.host_email,
  ];

  return candidates.some((val) => {
    const s = String(val || "").toLowerCase();
    if (!s) return false;
    return s.includes(q) || (normalizedCodeQuery.length > 0 && s.includes(normalizedCodeQuery));
  });
}
