import type { Property } from "../../../data/properties";

export function getBedrooms(property: Property): number | null {
  if (typeof property.bedroomsCount === "number") return property.bedroomsCount;
  const match = property.specs.match(/(\d+)\s*(?:bed(?:rooms?)?|master suites?)/i);
  return match ? Number(match[1]) : null;
}

/**
 * Sequential numeric unit codes permanently assigned to properties.
 * Matches benchmark platforms (e.g. Gathern unit/203480) with concise 6-digit numeric codes.
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
 * Generates or retrieves a unique, concise, permanently assigned numeric unit code.
 * Eliminates legacy alphanumeric QN-XXXXXX references in favor of concise sequential numeric codes.
 */
export function getNumericUnitCode(id: string): string {
  if (!id) return "201001";
  if (SEQUENTIAL_UNIT_CODES[id]) {
    return SEQUENTIAL_UNIT_CODES[id];
  }
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const numericVal = 202000 + (Math.abs(hash) % 790000);
  return String(numericVal);
}

export function getListingReference(id: string): string {
  return getNumericUnitCode(id);
}

export function getFeaturePresentation(feature: string) {
  const firstToken = feature.split(" ")[0] || "";
  const hasEmojiPrefix = firstToken.charCodeAt(0) >= 0xd800;
  return {
    icon: hasEmojiPrefix ? firstToken : "✓",
    label: hasEmojiPrefix ? feature.slice(firstToken.length).trim() : feature,
  };
}

export function buildAmenityGroups(
  property: Property,
  anchorLabel: (en: string, ar: string) => string
) {
  if (property.amenityGroups?.length) {
    return property.amenityGroups;
  }
  if (property.features.length) {
    return [
      {
        name: anchorLabel("Amenities", "المرافق"),
        items: property.features.map((feature) => getFeaturePresentation(feature).label),
      },
    ];
  }
  return [];
}
