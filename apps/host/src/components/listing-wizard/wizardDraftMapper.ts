import {
  INITIAL_DRAFT,
  CATEGORIES,
  MAIN_FACILITIES,
  POOL_AMENITIES,
  KITCHEN_AMENITIES,
  BATHROOM_AMENITIES,
  PROPERTY_AMENITIES,
  PROPERTY_FEATURES,
  WIZARD_STEPS,
  type WizardDraft,
} from "./types";
import { getCityDisplay, getDistrictDisplay, reverseGeocodePin } from "@/lib/geo/saudiLocations";
import { coordsToCityPin, buildGoogleMapsUrl } from "@/lib/geo/mapsUrlParser";
import { resolveSaudiCity } from "@qafnest/shared";

const KITCHEN_CUSTOM_RE =
  /kitchen|fridge|refrigerator|freezer|oven|stove|microwave|dishwasher|kettle|coffee|espresso|toaster|blender|fryer|grill|cook|utensil|cutlery|plate|cup|pot|pan|dining|water dispenser|مطبخ|ثلاجة|فرن|ميكروويف|غلاية|قهوة|طبخ|أواني|شواء|برادة/i;

const HAS_ARABIC_RE = /[\u0600-\u06FF]/;

/** Maps a fetched property API payload into WizardDraft state + initial map pin + image list. */
export function mapPropertyToWizardDraft(
  p: Record<string, any>,
  uiLang: "ar" | "en"
): {
  draftUpdate: Partial<WizardDraft>;
  pin: { x: number; y: number } | null;
  photos: { file?: File; name: string; url: string }[];
} {
  const loadedFeatures: string[] = Array.isArray(p.features) ? p.features : [];
  const matchGroup = (list: string[]) => loadedFeatures.filter((f) => list.includes(f));

  const mainFacilityIds = MAIN_FACILITIES.map((item) => item.id);
  const poolAmenityIds = POOL_AMENITIES.map((item) => item.id);
  const kitchenAmenityIds = KITCHEN_AMENITIES.map((item) => item.id);
  const bathroomAmenityIds = BATHROOM_AMENITIES.map((item) => item.id);
  const propertyAmenityIds = PROPERTY_AMENITIES.map((item) => item.id);
  const propertyFeatureIds = PROPERTY_FEATURES.map((item) => item.id);

  const knownNonCustomIds = new Set([
    ...mainFacilityIds,
    ...poolAmenityIds,
    ...kitchenAmenityIds,
    ...bathroomAmenityIds,
    ...propertyAmenityIds,
    ...propertyFeatureIds,
  ]);
  const customAmenities = loadedFeatures.filter((f) => !knownNonCustomIds.has(f));
  const hasKitchenCtx = loadedFeatures.includes("مطبخ") || matchGroup(kitchenAmenityIds).length > 0;

  const matchedKitchenAmenities = [
    ...matchGroup(kitchenAmenityIds),
    ...customAmenities.filter(
      (f) => KITCHEN_CUSTOM_RE.test(f) || (hasKitchenCtx && !loadedFeatures.includes("دورة مياه") && matchGroup(bathroomAmenityIds).length === 0)
    ),
  ];
  const matchedKitchenSet = new Set(matchedKitchenAmenities);
  const matchedBathroomAmenities = [
    ...matchGroup(bathroomAmenityIds),
    ...customAmenities.filter((f) => !matchedKitchenSet.has(f)),
  ];

  const loadedMainFacilities = matchGroup(mainFacilityIds);
  if (p.has_pool && !loadedMainFacilities.includes("مسبح")) loadedMainFacilities.push("مسبح");
  if ((p.bedrooms_count ?? 0) > 0 && !loadedMainFacilities.includes("غرفة نوم")) loadedMainFacilities.push("غرفة نوم");
  if ((p.living_rooms_count ?? 0) > 0 && !loadedMainFacilities.includes("مجلس")) loadedMainFacilities.push("مجلس");
  if (matchedKitchenAmenities.length > 0 && !loadedMainFacilities.includes("مطبخ")) loadedMainFacilities.push("مطبخ");
  if (matchedBathroomAmenities.length > 0 && !loadedMainFacilities.includes("دورة مياه")) loadedMainFacilities.push("دورة مياه");

  const rawCity = p.city_name || p.city || "";
  const hasCoords = typeof p.lat === "number" && typeof p.lng === "number";
  const coordsInfo = hasCoords ? coordsToCityPin(p.lat, p.lng, rawCity || undefined) : null;
  const resolvedReverse = coordsInfo ? reverseGeocodePin(rawCity || coordsInfo.cityId, coordsInfo.pin) : null;

  const formattedCity = rawCity ? getCityDisplay(rawCity, uiLang) : "";
  const formattedDistrict = p.district ? getDistrictDisplay(p.district, uiLang, rawCity) : "";
  const computedAddress = p.address || [formattedDistrict, formattedCity].filter(Boolean).join(", ");
  const hasAr = (val?: string | null) => Boolean(val && HAS_ARABIC_RE.test(val));

  const rawTitle = p.title || "";
  const rawTitleAr = p.title_ar || "";
  const rawDistrict = p.district || "";
  const rawDistrictAr = p.district_ar || "";
  const rawDesc = p.description || "";
  const rawDescAr = p.description_ar || "";
  const rawAddress = p.address || computedAddress || "";
  const rawAddressAr = p.address_ar || "";
  const matchedSharedCity = resolveSaudiCity(rawCity);

  const draftUpdate: Partial<WizardDraft> = {
    ...INITIAL_DRAFT,
    title: rawTitleAr ? rawTitle : hasAr(rawTitle) ? "" : rawTitle,
    titleAr: rawTitleAr || (hasAr(rawTitle) ? rawTitle : ""),
    category: p.category_name || p.category || "",
    city: rawCity,
    state: p.state || matchedSharedCity?.regionEn || "",
    stateAr: p.state_ar || matchedSharedCity?.regionAr || "",
    district: rawDistrictAr ? rawDistrict : hasAr(rawDistrict) ? "" : rawDistrict,
    districtAr: rawDistrictAr || (hasAr(rawDistrict) ? rawDistrict : ""),
    street: p.street || "",
    streetAr: p.street_ar || "",
    postalCode: p.postal_code || "",
    direction: resolvedReverse?.direction || "",
    address: rawAddressAr ? rawAddress : hasAr(rawAddress) ? "" : rawAddress,
    addressAr: rawAddressAr || (hasAr(rawAddress) ? rawAddress : ""),
    latitude: hasCoords ? p.lat : undefined,
    longitude: hasCoords ? p.lng : undefined,
    googleMapsUrl: p.google_maps_url || (hasCoords ? buildGoogleMapsUrl(p.lat, p.lng) : ""),
    area: p.area_sqm !== undefined && p.area_sqm !== null ? String(p.area_sqm) : "0",
    guestCapacity:
      p.capacity !== undefined && p.capacity !== null && Number(p.capacity) > 0
        ? Number(p.capacity)
        : Math.max(2, Number(p.bedrooms_count || 0) * 2 + 2),
    bedroomsCount: p.bedrooms_count !== undefined && p.bedrooms_count !== null ? Number(p.bedrooms_count) : 0,
    weekdayPrice: p.weekday_price || p.base_price ? String(p.weekday_price || p.base_price) : "",
    weekendPrice: p.weekend_price || p.base_price ? String(p.weekend_price || p.base_price) : "",
    tourismLicenseNumber: p.tourism_license_number || "",
    mainMajlisCount: p.living_rooms_count !== undefined && p.living_rooms_count !== null ? Number(p.living_rooms_count) : 0,
    poolsCount: p.has_pool ? 1 : 0,
    kitchensCount: loadedFeatures.some((f) => kitchenAmenityIds.includes(f) || f === "مطبخ") ? 1 : 0,
    description: rawDescAr ? rawDesc : hasAr(rawDesc) ? "" : rawDesc,
    descriptionAr: rawDescAr || (hasAr(rawDesc) ? rawDesc : ""),
    mainFacilities: loadedMainFacilities,
    poolAmenities: matchGroup(poolAmenityIds),
    kitchenAmenities: matchedKitchenAmenities,
    bathroomAmenities: matchedBathroomAmenities,
    propertyAmenities: matchGroup(propertyAmenityIds),
    propertyFeatures: matchGroup(propertyFeatureIds),
  };

  const photos = Array.isArray(p.images)
    ? p.images.map((imgUrl: string, idx: number) => ({ name: `Photo ${idx + 1}`, url: imgUrl }))
    : [];

  return { draftUpdate, pin: coordsInfo ? coordsInfo.pin : null, photos };
}

/** Generates localized marketing description text from draft specs and amenities. */
export function buildWizardDescription(draft: WizardDraft, effectiveLang: "ar" | "en"): string {
  const catEntry = CATEGORIES.find((c) => c.id === draft.category || c.en.toLowerCase() === draft.category.toLowerCase());
  const localizedCategory = catEntry
    ? effectiveLang === "ar"
      ? catEntry.id
      : catEntry.en
    : effectiveLang === "ar"
    ? "وحدة ضيافة"
    : "Private Stay";

  const localizedCity = draft.city ? getCityDisplay(draft.city, effectiveLang) : "";
  const districtSource =
    effectiveLang === "ar" ? draft.districtAr.trim() || draft.district.trim() : draft.district.trim() || draft.districtAr.trim();
  const localizedDistrict = districtSource ? getDistrictDisplay(districtSource, effectiveLang, draft.city) : "";
  const locationPhrase = [localizedCity, localizedDistrict].filter(Boolean).join(" - ");

  const allCatalogItems = [
    ...MAIN_FACILITIES.map((i) => ({ id: i.id, ar: i.id, en: i.en })),
    ...POOL_AMENITIES.map((i) => ({ id: i.id, ar: i.ar, en: i.en })),
    ...KITCHEN_AMENITIES.map((i) => ({ id: i.id, ar: i.ar, en: i.en })),
    ...BATHROOM_AMENITIES.map((i) => ({ id: i.id, ar: i.ar, en: i.en })),
    ...PROPERTY_AMENITIES.map((i) => ({ id: i.id, ar: i.ar, en: i.en })),
    ...PROPERTY_FEATURES.map((i) => ({ id: i.id, ar: i.id, en: i.en })),
  ];

  const hasBedroom = draft.mainFacilities.includes("غرفة نوم");
  const hasMajlis = draft.mainFacilities.includes("مجلس");
  const hasPool = draft.mainFacilities.includes("مسبح");
  const hasKitchen = draft.mainFacilities.includes("مطبخ");
  const hasBathroom = draft.mainFacilities.includes("دورة مياه");

  const rawSelected = Array.from(
    new Set([
      ...draft.propertyFeatures,
      ...draft.mainFacilities,
      ...(hasPool ? draft.poolAmenities : []),
      ...(hasKitchen ? draft.kitchenAmenities : []),
      ...draft.propertyAmenities,
      ...(hasBathroom ? draft.bathroomAmenities : []),
    ])
  );

  const localizedAmenities = rawSelected
    .map((item) => {
      const match = allCatalogItems.find((e) => e.id === item || e.en.toLowerCase() === item.toLowerCase());
      return match ? (effectiveLang === "ar" ? match.ar : match.en) : item;
    })
    .filter(Boolean)
    .slice(0, 6);

  const areaNum = Number(draft.area);

  if (effectiveLang === "ar") {
    const specsParts: string[] = [];
    if (areaNum > 0) specsParts.push(`مساحة ${areaNum} متر مربع`);
    if (draft.guestCapacity > 0) specsParts.push(`تتسع حتى ${draft.guestCapacity} ضيوف`);
    if (hasBedroom && draft.bedroomsCount > 0) specsParts.push(`${draft.bedroomsCount} غرف نوم`);
    if (hasMajlis && draft.mainMajlisCount > 0) specsParts.push(`${draft.mainMajlisCount} مجلس رئيسي`);
    if (hasBathroom && draft.bathroomsCount > 0) specsParts.push(`${draft.bathroomsCount} دورات مياه`);

    const intro = `استمتع بإقامة استثنائية في ${draft.titleAr.trim() || draft.title.trim() || "وحدتنا الفاخرة"} (${localizedCategory})${locationPhrase ? ` الواقعة في ${locationPhrase}` : ""}.`;
    const specsClause = specsParts.length > 0 ? ` تتميز الوحدة بـ${specsParts.join(" و")}.` : "";
    const amenitiesClause =
      localizedAmenities.length > 0
        ? ` تشمل المرافق والخدمات ${localizedAmenities.join("، ")} لتجربة ضيافة لا تُنسى للعائلة والأصدقاء.`
        : " مصممة بعناية لتوفير إقامة مريحة وتجربة ضيافة لا تُنسى للعائلة والأصدقاء.";
    return `${intro}${specsClause}${amenitiesClause}`;
  }

  const specsPartsEn: string[] = [];
  if (areaNum > 0) specsPartsEn.push(`${areaNum} sqm of thoughtfully designed space`);
  if (draft.guestCapacity > 0) specsPartsEn.push(`capacity for up to ${draft.guestCapacity} guests`);
  if (hasBedroom && draft.bedroomsCount > 0) specsPartsEn.push(`${draft.bedroomsCount} bedroom${draft.bedroomsCount === 1 ? "" : "s"}`);
  if (hasMajlis && draft.mainMajlisCount > 0) specsPartsEn.push(`${draft.mainMajlisCount} main majlis`);
  if (hasBathroom && draft.bathroomsCount > 0) specsPartsEn.push(`${draft.bathroomsCount} bathroom${draft.bathroomsCount === 1 ? "" : "s"}`);

  const introEn = `Enjoy an exceptional stay at ${draft.title.trim() || draft.titleAr.trim() || "our luxury unit"} (${localizedCategory})${locationPhrase ? ` located in ${locationPhrase}` : ""}.`;
  const specsClauseEn = specsPartsEn.length > 0 ? ` Featuring ${specsPartsEn.join(", ")}.` : "";
  const amenitiesClauseEn =
    localizedAmenities.length > 0
      ? ` Highlights include ${localizedAmenities.join(", ")} for an unforgettable getaway with family and friends.`
      : " Thoughtfully curated for comfort and an unforgettable hospitality experience with family and friends.";
  return `${introEn}${specsClauseEn}${amenitiesClauseEn}`;
}

export function canProceedWizardStep(
  step: number,
  draft: WizardDraft,
  photosCount: number,
  optimizingPhotos: boolean
): boolean {
  if (step === WIZARD_STEPS.CATEGORY_TITLE) {
    return draft.title.trim().length > 0 && draft.titleAr.trim().length > 0 && draft.category.length > 0;
  }
  if (step === WIZARD_STEPS.LOCATION) {
    return Boolean(
      draft.city.trim() && draft.district.trim() && draft.districtAr.trim() &&
      (draft.address || "").trim() && (draft.addressAr || "").trim()
    );
  }
  if (step === WIZARD_STEPS.DETAILS_PRICING) {
    return (
      Number(draft.area) > 0 &&
      draft.guestCapacity >= 1 &&
      Number(draft.weekdayPrice) > 0 &&
      Number(draft.weekendPrice || draft.weekdayPrice) > 0 &&
      draft.tourismLicenseNumber.trim().length > 0
    );
  }
  if (step === WIZARD_STEPS.DESCRIPTION) {
    return draft.description.trim().length >= 5 && draft.descriptionAr.trim().length >= 5;
  }
  if (step === WIZARD_STEPS.PHOTOS) return photosCount > 0 && !optimizingPhotos;
  return true;
}
