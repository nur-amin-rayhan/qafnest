import type { Property } from "../../../data/properties";
import { SEQUENTIAL_UNIT_CODES, getNumericUnitCode } from "@qafnest/shared";

export { SEQUENTIAL_UNIT_CODES, getNumericUnitCode };

export function getBedrooms(property: Property): number | null {
  if (typeof property.bedroomsCount === "number") return property.bedroomsCount;
  const match = property.specs.match(/(\d+)\s*(?:bed(?:rooms?)?|master suites?)/i);
  return match ? Number(match[1]) : null;
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
