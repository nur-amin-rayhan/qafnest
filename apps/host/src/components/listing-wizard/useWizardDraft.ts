"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { optimizePropertyImageToWebP } from "@/lib/storage/uploadBridge";
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
  getVisibleWizardSteps,
  type WizardArrayField,
  type WizardDraft,
} from "./types";
import {
  getCityDisplay,
  getDistrictDisplay,
  reverseGeocodePin,
} from "@/lib/geo/saudiLocations";
import { coordsToCityPin, buildGoogleMapsUrl } from "@/lib/geo/mapsUrlParser";
import { resolveSaudiCity } from "@qafnest/shared";

export const TOTAL_STEPS = 13;
export const DRAFT_STORAGE_KEY = "qafnest-host-listing-draft-v3";

interface UseWizardDraftOptions {
  mode: string | null;
  editId: string | null;
  lang: string;
  t: (en: string, ar: string) => string;
}

/** Clamps master & single bed counts so their sum never exceeds total bedrooms. */
function clampBedDistribution(bedroomsCount: number, masterBedsCount: number, singleBedsCount: number) {
  const safeBedrooms = Math.max(0, bedroomsCount);
  const clampedMaster = Math.min(Math.max(0, masterBedsCount), safeBedrooms);
  const clampedSingle = Math.min(Math.max(0, singleBedsCount), Math.max(0, safeBedrooms - clampedMaster));
  return {
    bedroomsCount: safeBedrooms,
    masterBedsCount: clampedMaster,
    singleBedsCount: clampedSingle,
  };
}

export function useWizardDraft({ mode, editId, lang, t }: UseWizardDraftOptions) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(INITIAL_DRAFT);
  const [photos, setPhotos] = useState<{ file?: File; name: string; url: string }[]>([]);
  const [optimizingPhotos, setOptimizingPhotos] = useState(false);
  const [pin, setPin] = useState({ x: 50, y: 50 });
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [draftError, setDraftError] = useState("");
  const tRef = useRef(t);
  tRef.current = t;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    try {
      localStorage.removeItem("qafnest-host-listing-draft-v1");
      localStorage.removeItem("qafnest-host-listing-draft-v2");
      if (mode === "new") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraft(INITIAL_DRAFT);
        setPin({ x: 50, y: 50 });
        setStep(0);
        return;
      }
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored && !editId) {
        const parsed = JSON.parse(stored);
        const restoredDraft: WizardDraft = { ...INITIAL_DRAFT, ...parsed };
        setDraft(restoredDraft);
        if (parsed.pin && typeof parsed.pin.x === "number" && typeof parsed.pin.y === "number") {
          setPin(parsed.pin);
        }
        if (mode === "resume" && typeof parsed.step === "number") {
          const validSteps = getVisibleWizardSteps(restoredDraft.mainFacilities);
          setStep(validSteps.includes(parsed.step) ? parsed.step : validSteps[0]);
        }
      }
    } catch {
      // ignore
    }
  }, [mode, editId]);

  // Load existing property details when in Edit mode
  useEffect(() => {
    if (!editId) return;
    let isMounted = true;
    setLoadingEdit(true);

    async function fetchPropertyForEdit() {
      try {
        let authToken: string | undefined;
        try {
          if (isFirebaseConfigured()) {
            const fbUser = getFirebaseAuth().currentUser;
            if (fbUser) authToken = await fbUser.getIdToken();
          }
        } catch {}

        const res = await fetch(`/api/host/properties/${editId}`, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Could not load property details");
        const json = await res.json();
        const p = json.property;
        if (!p || !isMounted) return;

        setEditingPropertyId(p.id);
        setAdminFeedback(p.admin_feedback || p.rejection_reason || null);

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
        const isKitchenCustomAmenity = (label: string) => {
          const lower = label.toLowerCase();
          return (
            lower.includes("kitchen") ||
            lower.includes("fridge") ||
            lower.includes("refrigerator") ||
            lower.includes("freezer") ||
            lower.includes("oven") ||
            lower.includes("stove") ||
            lower.includes("microwave") ||
            lower.includes("dishwasher") ||
            lower.includes("kettle") ||
            lower.includes("coffee") ||
            lower.includes("espresso") ||
            lower.includes("toaster") ||
            lower.includes("blender") ||
            lower.includes("fryer") ||
            lower.includes("grill") ||
            lower.includes("cook") ||
            lower.includes("utensil") ||
            lower.includes("cutlery") ||
            lower.includes("plate") ||
            lower.includes("cup") ||
            lower.includes("pot") ||
            lower.includes("pan") ||
            lower.includes("dining") ||
            lower.includes("water dispenser") ||
            label.includes("مطبخ") ||
            label.includes("ثلاجة") ||
            label.includes("فرن") ||
            label.includes("ميكروويف") ||
            label.includes("غلاية") ||
            label.includes("قهوة") ||
            label.includes("طبخ") ||
            label.includes("أواني") ||
            label.includes("شواء") ||
            label.includes("برادة")
          );
        };

        const customAmenities = loadedFeatures.filter((f) => !knownNonCustomIds.has(f));
        const hasLoadedKitchenContext =
          loadedFeatures.includes("مطبخ") || matchGroup(kitchenAmenityIds).length > 0;
        const matchedKitchenAmenities = [
          ...matchGroup(kitchenAmenityIds),
          ...customAmenities.filter((f) =>
            isKitchenCustomAmenity(f) || (hasLoadedKitchenContext && !loadedFeatures.includes("دورة مياه") && matchGroup(bathroomAmenityIds).length === 0)
          ),
        ];
        const matchedKitchenSet = new Set(matchedKitchenAmenities);
        const matchedBathroomAmenities = [
          ...matchGroup(bathroomAmenityIds),
          ...customAmenities.filter((f) => !matchedKitchenSet.has(f)),
        ];

        const loadedMainFacilities = matchGroup(mainFacilityIds);
        if (p.has_pool && !loadedMainFacilities.includes("مسبح")) {
          loadedMainFacilities.push("مسبح");
        }
        if ((p.bedrooms_count ?? 0) > 0 && !loadedMainFacilities.includes("غرفة نوم")) {
          loadedMainFacilities.push("غرفة نوم");
        }
        if ((p.living_rooms_count ?? 0) > 0 && !loadedMainFacilities.includes("مجلس")) {
          loadedMainFacilities.push("مجلس");
        }
        if (matchedKitchenAmenities.length > 0 && !loadedMainFacilities.includes("مطبخ")) {
          loadedMainFacilities.push("مطبخ");
        }
        if (matchedBathroomAmenities.length > 0 && !loadedMainFacilities.includes("دورة مياه")) {
          loadedMainFacilities.push("دورة مياه");
        }

        const rawCity = p.city_name || p.city || "";
        const hasCoords = typeof p.lat === "number" && typeof p.lng === "number";
        const coordsInfo = hasCoords ? coordsToCityPin(p.lat, p.lng, rawCity || undefined) : null;
        const resolvedReverse = coordsInfo
          ? reverseGeocodePin(rawCity || coordsInfo.cityId, coordsInfo.pin)
          : null;
        const uiLang: "ar" | "en" = langRef.current === "ar" ? "ar" : "en";
        const formattedCity = rawCity ? getCityDisplay(rawCity, uiLang) : "";
        const formattedDistrict = p.district
          ? getDistrictDisplay(p.district, uiLang, rawCity)
          : "";
        const computedAddress =
          p.address ||
          [formattedDistrict, formattedCity].filter(Boolean).join(", ");

        const hasArabicScript = (val?: string | null) => Boolean(val && /[\u0600-\u06FF]/.test(val));
        const rawTitle = p.title || "";
        const rawTitleAr = p.title_ar || "";
        const rawDistrict = p.district || "";
        const rawDistrictAr = p.district_ar || "";
        const rawDesc = p.description || "";
        const rawDescAr = p.description_ar || "";
        const rawAddress = p.address || computedAddress || "";
        const rawAddressAr = p.address_ar || "";

        const matchedSharedCity = resolveSaudiCity(rawCity);

        setDraft((prev) => ({
          ...prev,
          title: rawTitleAr ? rawTitle : hasArabicScript(rawTitle) ? "" : rawTitle,
          titleAr: rawTitleAr || (hasArabicScript(rawTitle) ? rawTitle : ""),
          category: p.category_name || p.category || "",
          city: rawCity,
          state: p.state || matchedSharedCity?.regionEn || "",
          stateAr: p.state_ar || matchedSharedCity?.regionAr || "",
          district: rawDistrictAr ? rawDistrict : hasArabicScript(rawDistrict) ? "" : rawDistrict,
          districtAr: rawDistrictAr || (hasArabicScript(rawDistrict) ? rawDistrict : ""),
          street: p.street || "",
          streetAr: p.street_ar || "",
          postalCode: p.postal_code || "",
          direction: resolvedReverse?.direction || "",
          address: rawAddressAr ? rawAddress : hasArabicScript(rawAddress) ? "" : rawAddress,
          addressAr: rawAddressAr || (hasArabicScript(rawAddress) ? rawAddress : ""),
          latitude: hasCoords ? p.lat : undefined,
          longitude: hasCoords ? p.lng : undefined,
          googleMapsUrl:
            p.google_maps_url || (hasCoords ? buildGoogleMapsUrl(p.lat, p.lng) : ""),
          area:
            p.area_sqm !== undefined && p.area_sqm !== null
              ? String(p.area_sqm)
              : "0",
          guestCapacity:
            p.capacity !== undefined && p.capacity !== null && Number(p.capacity) > 0
              ? Number(p.capacity)
              : Math.max(2, (Number(p.bedrooms_count || 0) * 2) + 2),
          bedroomsCount:
            p.bedrooms_count !== undefined && p.bedrooms_count !== null
              ? Number(p.bedrooms_count)
              : 0,
          weekdayPrice:
            p.weekday_price || p.base_price
              ? String(p.weekday_price || p.base_price)
              : "",
          weekendPrice:
            p.weekend_price || p.base_price
              ? String(p.weekend_price || p.base_price)
              : "",
          tourismLicenseNumber: p.tourism_license_number || "",
          mainMajlisCount:
            p.living_rooms_count !== undefined && p.living_rooms_count !== null
              ? Number(p.living_rooms_count)
              : 0,
          poolsCount: p.has_pool ? 1 : 0,
          kitchensCount: loadedFeatures.some((f) => kitchenAmenityIds.includes(f) || f === "مطبخ") ? 1 : 0,
          description: rawDescAr ? rawDesc : hasArabicScript(rawDesc) ? "" : rawDesc,
          descriptionAr: rawDescAr || (hasArabicScript(rawDesc) ? rawDesc : ""),
          mainFacilities: loadedMainFacilities,
          poolAmenities: matchGroup(poolAmenityIds),
          kitchenAmenities: matchedKitchenAmenities,
          bathroomAmenities: matchedBathroomAmenities,
          propertyAmenities: matchGroup(propertyAmenityIds),
          propertyFeatures: matchGroup(propertyFeatureIds),
        }));

        if (coordsInfo) {
          setPin(coordsInfo.pin);
        }

        if (Array.isArray(p.images) && p.images.length > 0) {
          setPhotos(
            p.images.map((imgUrl: string, idx: number) => ({
              name: `Photo ${idx + 1}`,
              url: imgUrl,
            }))
          );
        }
      } catch (err) {
        console.error("Error loading property for edit:", err);
        setDraftError(
          tRef.current("Failed to load property details.", "فشل تحميل تفاصيل العقار للتعديل.")
        );
      } finally {
        if (isMounted) setLoadingEdit(false);
      }
    }

    void fetchPropertyForEdit();
    return () => {
      isMounted = false;
    };
  }, [editId]);

  const saveToLocal = (
    nextDraft: WizardDraft,
    nextStep: number,
    nextPin?: { x: number; y: number }
  ) => {
    const payload = { ...nextDraft, pin: nextPin ?? pin, step: nextStep };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  };

  const updateDraft = <K extends keyof WizardDraft>(key: K, val: WizardDraft[K]) => {
    setDraft((prev) => {
      const updated = { ...prev, [key]: val };
      saveToLocal(updated, step);
      return updated;
    });
  };

  const updateBedroomsCount = (nextCount: number) => {
    setDraft((prev) => {
      const clamped = clampBedDistribution(nextCount, prev.masterBedsCount, prev.singleBedsCount);
      const updated = { ...prev, ...clamped };
      saveToLocal(updated, step);
      return updated;
    });
  };

  const handleSetPin = (newPin: { x: number; y: number }) => {
    setPin(newPin);
    saveToLocal(draft, step, newPin);
  };

  const toggleItem = (key: WizardArrayField, item: string) => {
    setDraft((prev) => {
      const current = prev[key];
      const next = current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item];
      const updated = { ...prev, [key]: next };
      saveToLocal(updated, step);
      return updated;
    });
  };

  const handleAddPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    e.target.value = "";
    if (rawFiles.length === 0) return;

    const remainingSlots = Math.max(0, 12 - photos.length);
    const candidateFiles = rawFiles.slice(0, remainingSlots);
    if (candidateFiles.length === 0) return;

    setDraftError("");
    setOptimizingPhotos(true);
    const optimizedFiles: File[] = [];

    try {
      for (const f of candidateFiles) {
        try {
          const webpFile = await optimizePropertyImageToWebP(f);
          optimizedFiles.push(webpFile);
        } catch (err) {
          setDraftError(
            err instanceof Error
              ? err.message
              : t("Invalid file selected.", "تم اختيار ملف غير صالح.")
          );
        }
      }

      if (optimizedFiles.length > 0) {
        setPhotos((prev) => [
          ...prev,
          ...optimizedFiles.map((f) => ({
            file: f,
            name: f.name,
            url: URL.createObjectURL(f),
          })),
        ]);
      }
    } finally {
      setOptimizingPhotos(false);
    }
  };

  const generateAiDescription = (targetLang?: "ar" | "en") => {
    const effectiveLang: "ar" | "en" = targetLang ?? (lang === "ar" ? "ar" : "en");

    const catEntry = CATEGORIES.find(
      (c) => c.id === draft.category || c.en.toLowerCase() === draft.category.toLowerCase()
    );
    const localizedCategory = catEntry
      ? effectiveLang === "ar"
        ? catEntry.id
        : catEntry.en
      : effectiveLang === "ar"
        ? "وحدة ضيافة"
        : "Private Stay";

    const localizedCity = draft.city ? getCityDisplay(draft.city, effectiveLang) : "";
    const districtSource =
      effectiveLang === "ar"
        ? draft.districtAr.trim() || draft.district.trim()
        : draft.district.trim() || draft.districtAr.trim();
    const localizedDistrict = districtSource
      ? getDistrictDisplay(districtSource, effectiveLang, draft.city)
      : "";
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
        const match = allCatalogItems.find(
          (entry) => entry.id === item || entry.en.toLowerCase() === item.toLowerCase()
        );
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

      const intro = `استمتع بإقامة استثنائية في ${draft.titleAr.trim() || draft.title.trim() || "وحدتنا الفاخرة"} (${localizedCategory})${
        locationPhrase ? ` الواقعة في ${locationPhrase}` : ""
      }.`;
      const specsClause =
        specsParts.length > 0 ? ` تتميز الوحدة بـ${specsParts.join(" و")}.` : "";
      const amenitiesClause =
        localizedAmenities.length > 0
          ? ` تشمل المرافق والخدمات ${localizedAmenities.join("، ")} لتجربة ضيافة لا تُنسى للعائلة والأصدقاء.`
          : " مصممة بعناية لتوفير إقامة مريحة وتجربة ضيافة لا تُنسى للعائلة والأصدقاء.";

      updateDraft("descriptionAr", `${intro}${specsClause}${amenitiesClause}`);
      return;
    }

    const specsPartsEn: string[] = [];
    if (areaNum > 0) specsPartsEn.push(`${areaNum} sqm of thoughtfully designed space`);
    if (draft.guestCapacity > 0) {
      specsPartsEn.push(`capacity for up to ${draft.guestCapacity} guests`);
    }
    if (hasBedroom && draft.bedroomsCount > 0) {
      specsPartsEn.push(`${draft.bedroomsCount} bedroom${draft.bedroomsCount === 1 ? "" : "s"}`);
    }
    if (hasMajlis && draft.mainMajlisCount > 0) {
      specsPartsEn.push(`${draft.mainMajlisCount} main majlis`);
    }
    if (hasBathroom && draft.bathroomsCount > 0) {
      specsPartsEn.push(`${draft.bathroomsCount} bathroom${draft.bathroomsCount === 1 ? "" : "s"}`);
    }

    const introEn = `Enjoy an exceptional stay at ${draft.title.trim() || draft.titleAr.trim() || "our luxury unit"} (${localizedCategory})${
      locationPhrase ? ` located in ${locationPhrase}` : ""
    }.`;
    const specsClauseEn =
      specsPartsEn.length > 0 ? ` Featuring ${specsPartsEn.join(", ")}.` : "";
    const amenitiesClauseEn =
      localizedAmenities.length > 0
        ? ` Highlights include ${localizedAmenities.join(", ")} for an unforgettable getaway with family and friends.`
        : " Thoughtfully curated for comfort and an unforgettable hospitality experience with family and friends.";

    updateDraft("description", `${introEn}${specsClauseEn}${amenitiesClauseEn}`);
  };

  const canProceed = () => {
    if (step === WIZARD_STEPS.CATEGORY_TITLE) {
      return (
        draft.title.trim().length > 0 &&
        draft.titleAr.trim().length > 0 &&
        draft.category.length > 0
      );
    }
    if (step === WIZARD_STEPS.LOCATION) {
      return (
        draft.city.trim().length > 0 &&
        draft.district.trim().length > 0 &&
        draft.districtAr.trim().length > 0 &&
        (draft.address || "").trim().length > 0 &&
        (draft.addressAr || "").trim().length > 0
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
      return (
        draft.description.trim().length >= 5 &&
        draft.descriptionAr.trim().length >= 5
      );
    }
    if (step === WIZARD_STEPS.PHOTOS) return photos.length > 0 && !optimizingPhotos;
    return true;
  };

  return {
    step,
    setStep,
    draft,
    setDraft,
    pin,
    setPin,
    photos,
    setPhotos,
    optimizingPhotos,
    editingPropertyId,
    adminFeedback,
    loadingEdit,
    draftError,
    setDraftError,
    saveToLocal,
    updateDraft,
    updateBedroomsCount,
    handleSetPin,
    toggleItem,
    handleAddPhotos,
    generateAiDescription,
    canProceed,
  };
}
