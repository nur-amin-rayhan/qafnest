"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { validateImageFile } from "@/lib/storage/uploadBridge";
import {
  INITIAL_DRAFT,
  CATEGORIES,
  MAIN_FACILITIES,
  BATHROOM_AMENITIES,
  PROPERTY_AMENITIES,
  PROPERTY_FEATURES,
  type WizardDraft,
} from "./types";
import {
  getCityDisplay,
  getDistrictDisplay,
  reverseGeocodePin,
} from "@/lib/geo/saudiLocations";
import { coordsToCityPin, buildGoogleMapsUrl } from "@/lib/geo/mapsUrlParser";
import { resolveSaudiCity } from "@qafnest/shared";

export const TOTAL_STEPS = 11;
export const DRAFT_STORAGE_KEY = "qafnest-host-listing-draft-v2";

interface UseWizardDraftOptions {
  mode: string | null;
  editId: string | null;
  lang: string;
  t: (en: string, ar: string) => string;
}

export function useWizardDraft({ mode, editId, lang, t }: UseWizardDraftOptions) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(INITIAL_DRAFT);
  const [photos, setPhotos] = useState<{ file?: File; name: string; url: string }[]>([]);
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
        setDraft({ ...INITIAL_DRAFT, ...parsed });
        if (parsed.pin && typeof parsed.pin.x === "number" && typeof parsed.pin.y === "number") {
          setPin(parsed.pin);
        }
        if (mode === "resume" && typeof parsed.step === "number") {
          setStep(Math.min(TOTAL_STEPS - 1, Math.max(0, parsed.step)));
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
          description: rawDescAr ? rawDesc : hasArabicScript(rawDesc) ? "" : rawDesc,
          descriptionAr: rawDescAr || (hasArabicScript(rawDesc) ? rawDesc : ""),
          mainFacilities: matchGroup(MAIN_FACILITIES.map((item) => item.id)),
          bathroomAmenities: matchGroup(BATHROOM_AMENITIES.map((item) => item.id)),
          propertyAmenities: matchGroup(PROPERTY_AMENITIES.map((item) => item.id)),
          propertyFeatures: matchGroup(PROPERTY_FEATURES.map((item) => item.id)),
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

  const handleSetPin = (newPin: { x: number; y: number }) => {
    setPin(newPin);
    saveToLocal(draft, step, newPin);
  };

  const toggleItem = (
    key: "mainFacilities" | "bathroomAmenities" | "propertyAmenities" | "propertyFeatures",
    item: string
  ) => {
    const current = draft[key];
    const next = current.includes(item)
      ? current.filter((x) => x !== item)
      : [...current, item];
    updateDraft(key, next);
  };

  const handleAddPhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const f of rawFiles) {
      const val = validateImageFile(f);
      if (!val.valid) {
        setDraftError(val.error || t("Invalid file selected.", "تم اختيار ملف غير صالح."));
      } else {
        validFiles.push(f);
      }
    }

    const remainingSlots = Math.max(0, 12 - photos.length);
    const addedFiles = validFiles.slice(0, remainingSlots);

    setPhotos((prev) => [
      ...prev,
      ...addedFiles.map((f) => ({ file: f, name: f.name, url: URL.createObjectURL(f) })),
    ]);
    e.target.value = "";
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
      ...BATHROOM_AMENITIES.map((i) => ({ id: i.id, ar: i.ar, en: i.en })),
      ...PROPERTY_AMENITIES.map((i) => ({ id: i.id, ar: i.ar, en: i.en })),
      ...PROPERTY_FEATURES.map((i) => ({ id: i.id, ar: i.id, en: i.en })),
    ];

    const rawSelected = Array.from(
      new Set([
        ...draft.propertyFeatures,
        ...draft.mainFacilities,
        ...draft.propertyAmenities,
        ...draft.bathroomAmenities,
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
      if (draft.bedroomsCount > 0) specsParts.push(`${draft.bedroomsCount} غرف نوم`);
      if (draft.mainMajlisCount > 0) specsParts.push(`${draft.mainMajlisCount} مجلس رئيسي`);
      if (draft.bathroomsCount > 0) specsParts.push(`${draft.bathroomsCount} دورات مياه`);

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
    if (draft.bedroomsCount > 0) {
      specsPartsEn.push(`${draft.bedroomsCount} bedroom${draft.bedroomsCount === 1 ? "" : "s"}`);
    }
    if (draft.mainMajlisCount > 0) {
      specsPartsEn.push(`${draft.mainMajlisCount} main majlis`);
    }
    if (draft.bathroomsCount > 0) {
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
    if (step === 0) {
      return (
        draft.title.trim().length > 0 &&
        draft.titleAr.trim().length > 0 &&
        draft.category.length > 0
      );
    }
    if (step === 2) {
      return (
        draft.city.trim().length > 0 &&
        draft.district.trim().length > 0 &&
        draft.districtAr.trim().length > 0 &&
        (draft.address || "").trim().length > 0 &&
        (draft.addressAr || "").trim().length > 0
      );
    }
    if (step === 3)
      return (
        Number(draft.area) > 0 &&
        Number(draft.weekdayPrice) > 0 &&
        Number(draft.weekendPrice || draft.weekdayPrice) > 0 &&
        draft.tourismLicenseNumber.trim().length > 0
      );
    if (step === 9) {
      return (
        draft.description.trim().length >= 5 &&
        draft.descriptionAr.trim().length >= 5
      );
    }
    if (step === 10) return photos.length > 0;
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
    editingPropertyId,
    adminFeedback,
    loadingEdit,
    draftError,
    setDraftError,
    saveToLocal,
    updateDraft,
    handleSetPin,
    toggleItem,
    handleAddPhotos,
    generateAiDescription,
    canProceed,
  };
}

