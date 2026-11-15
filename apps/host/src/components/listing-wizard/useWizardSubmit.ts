"use client";

import { useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { User } from "@supabase/supabase-js";
import {
  extractExtendedLocationToExternalMeta,
  isMissingBilingualColumnError,
  stripBilingualColumnsWithFallback,
} from "@qafnest/shared";
import { createHostDataClient } from "@/lib/supabase/hostDataClient";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { uploadPropertyImagesBridge } from "@/lib/storage/uploadBridge";
import {
  normalizeCategory,
  normalizeCity,
  type WizardDraft,
} from "./types";
import { DRAFT_STORAGE_KEY } from "./useWizardDraft";
import { getCityInfo } from "@/lib/geo/saudiLocations";
import { getHostLocaleFromPathname, localizeHostPath } from "@/lib/hostLocale";

interface UseWizardSubmitOptions {
  user: User | null;
  draft: WizardDraft;
  photos: { file?: File; name: string; url: string }[];
  pin: { x: number; y: number };
  editingPropertyId: string | null;
  router: AppRouterInstance;
  openHostAuthModal: (mode?: "signin" | "signup", returnUrl?: string) => void;
}

export function useWizardSubmit({
  user,
  draft,
  photos,
  pin,
  editingPropertyId,
  router,
  openHostAuthModal,
}: UseWizardSubmitOptions) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const submitListing = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      if (!user?.id) {
        const activeLocale =
          getHostLocaleFromPathname(typeof window !== "undefined" ? window.location.pathname : null) ??
          "ar";
        openHostAuthModal("signin", localizeHostPath("/properties/new", activeLocale));
        setSubmitting(false);
        return;
      }
      if (!draft.tourismLicenseNumber.trim()) {
        throw new Error(
          "Ministry of Tourism License Number is required before submitting your property."
        );
      }
      const effectiveHostId = user.id;
      const supabase = await createHostDataClient({
        useFirebaseAuth: user?.app_metadata?.provider === "firebase_phone",
      });

      // Retrieve host auth token for secure media uploads & API operations
      let hostAuthToken: string | undefined;
      try {
        if (isFirebaseConfigured()) {
          const fbUser = getFirebaseAuth().currentUser;
          if (fbUser) hostAuthToken = await fbUser.getIdToken();
        }
        if (!hostAuthToken && supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            hostAuthToken = sessionData.session.access_token;
          }
        }
      } catch {}

      // Upload any newly selected photo files
      const filesToUpload = photos
        .filter((p): p is { file: File; name: string; url: string } => Boolean(p.file))
        .map((p) => p.file);

      let uploadedUrls: string[] = [];
      if (filesToUpload.length > 0) {
        uploadedUrls = await uploadPropertyImagesBridge({
          supabase,
          hostId: effectiveHostId,
          files: filesToUpload,
          authToken: hostAuthToken,
        });
      }

      // Reconstruct images in exact order of `photos` array (photos[0] is the featured cover image)
      let fileUploadIdx = 0;
      const images: string[] = [];
      for (const item of photos) {
        if (item.file) {
          const uploadedUrl = uploadedUrls[fileUploadIdx++];
          if (uploadedUrl) images.push(uploadedUrl);
        } else if (item.url) {
          images.push(item.url);
        }
      }

      const normalizedCategory = normalizeCategory(draft.category);
      const slugBase =
        draft.title
          .trim()
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 48) || "property";

      const hasBedroom = draft.mainFacilities.includes("غرفة نوم");
      const hasMajlis = draft.mainFacilities.includes("مجلس");
      const hasPool = draft.mainFacilities.includes("مسبح");
      const hasKitchen = draft.mainFacilities.includes("مطبخ");
      const hasBathroom = draft.mainFacilities.includes("دورة مياه");

      const effectiveBedrooms = hasBedroom ? draft.bedroomsCount : 0;
      const effectiveMajlis = hasMajlis ? draft.mainMajlisCount : 0;
      const effectiveCapacity = Math.max(1, draft.guestCapacity || 2);

      const features = Array.from(
        new Set([
          ...draft.mainFacilities,
          ...(hasPool ? draft.poolAmenities : []),
          ...(hasKitchen ? draft.kitchenAmenities : []),
          ...(hasBathroom ? draft.bathroomAmenities : []),
          ...draft.propertyAmenities,
          ...draft.propertyFeatures,
        ])
      );

      const fallbackTitle = draft.title.trim() || draft.titleAr.trim();
      const fallbackDescription = draft.description.trim() || draft.descriptionAr.trim();
      const fallbackDistrict = draft.district.trim() || draft.districtAr.trim();
      const fallbackAddress = draft.address?.trim() || draft.addressAr?.trim() || null;

      // If editing an existing property, update via host properties API
      if (editingPropertyId) {
        const putRes = await fetch(`/api/host/properties/${editingPropertyId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(hostAuthToken ? { Authorization: `Bearer ${hostAuthToken}` } : {}),
          },
          body: JSON.stringify({
            title: fallbackTitle,
            title_ar: draft.titleAr.trim() || null,
            description: fallbackDescription,
            description_ar: draft.descriptionAr.trim() || null,
            category: normalizedCategory,
            category_name: draft.category,
            city: normalizeCity(draft.city),
            city_name: draft.city,
            state: draft.state?.trim() || null,
            state_ar: draft.stateAr?.trim() || null,
            district: fallbackDistrict,
            district_ar: draft.districtAr.trim() || null,
            address: fallbackAddress,
            address_ar: draft.addressAr?.trim() || null,
            street: draft.street.trim() || null,
            street_ar: draft.streetAr.trim() || null,
            postal_code: draft.postalCode.trim() || null,
            google_maps_url: draft.googleMapsUrl?.trim() || null,
            specs: `${draft.area} m² · ${effectiveBedrooms} bedrooms · ${effectiveMajlis} living rooms · Up to ${effectiveCapacity} Guests`,
            base_price: Number(draft.weekdayPrice),
            weekday_price: Number(draft.weekdayPrice),
            weekend_price: Number(draft.weekendPrice || draft.weekdayPrice),
            tourism_license_number: draft.tourismLicenseNumber.trim() || null,
            capacity: effectiveCapacity,
            bedrooms_count: effectiveBedrooms,
            living_rooms_count: effectiveMajlis,
            area_sqm: Number(draft.area),
            images,
            features,
            has_pool: hasPool,
            self_checkin: draft.propertyFeatures.includes("دخول ذاتي"),
            lat: draft.latitude ?? Number((getCityInfo(draft.city).lat + (50 - pin.y) * 0.0035).toFixed(6)),
            lng: draft.longitude ?? Number((getCityInfo(draft.city).lng + (pin.x - 50) * 0.004).toFixed(6)),
          }),
        });

        if (!putRes.ok) {
          const errData = await putRes.json();
          throw new Error(errData.message || "Failed to update property.");
        }

        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem("qafnest-host-listing-draft-v2");
        localStorage.removeItem("qafnest-host-listing-draft-v1");
        const activeLocale =
          getHostLocaleFromPathname(typeof window !== "undefined" ? window.location.pathname : null) ??
          "ar";
        router.push(localizeHostPath("/app?listing=resubmitted", activeLocale));
        router.refresh();
        return;
      }

      let insertSuccess = false;
      const propertyPayload = {
        host_id: effectiveHostId,
        title: fallbackTitle,
        title_ar: draft.titleAr.trim() || null,
        slug: `${slugBase}-${crypto.randomUUID().slice(0, 8)}`,
        description: fallbackDescription,
        description_ar: draft.descriptionAr.trim() || null,
        category: normalizedCategory,
        category_name: draft.category,
        city: normalizeCity(draft.city),
        city_name: draft.city,
        state: draft.state?.trim() || null,
        state_ar: draft.stateAr?.trim() || null,
        district: fallbackDistrict,
        district_ar: draft.districtAr.trim() || null,
        address: fallbackAddress,
        address_ar: draft.addressAr?.trim() || null,
        street: draft.street.trim() || null,
        street_ar: draft.streetAr.trim() || null,
        postal_code: draft.postalCode.trim() || null,
        google_maps_url: draft.googleMapsUrl?.trim() || null,
        specs: `${draft.area} m² · ${effectiveBedrooms} bedrooms · ${effectiveMajlis} living rooms · Up to ${effectiveCapacity} Guests`,
        base_price: Number(draft.weekdayPrice),
        weekday_price: Number(draft.weekdayPrice),
        weekend_price: Number(draft.weekendPrice || draft.weekdayPrice),
        images,
        features,
        is_approved: false,
        status: "pending",
        tourism_license_number: draft.tourismLicenseNumber.trim() || null,
        is_licensed: Boolean(draft.tourismLicenseNumber.trim()),
        capacity: effectiveCapacity,
        bedrooms_count: effectiveBedrooms,
        living_rooms_count: effectiveMajlis,
        area_sqm: Number(draft.area),
        self_checkin: draft.propertyFeatures.includes("دخول ذاتي"),
        has_pool: hasPool,
        checkin_time: "15:00",
        checkout_time: "12:00",
        lat: draft.latitude ?? Number((getCityInfo(draft.city).lat + (50 - pin.y) * 0.0035).toFixed(6)),
        lng: draft.longitude ?? Number((getCityInfo(draft.city).lng + (pin.x - 50) * 0.004).toFixed(6)),
      };

      const insertPayloadPrepared = extractExtendedLocationToExternalMeta(propertyPayload);
      let { error: insertError } = await supabase.from("properties").insert(insertPayloadPrepared);
      if (insertError && isMissingBilingualColumnError(insertError)) {
        const retry = await supabase
          .from("properties")
          .insert(stripBilingualColumnsWithFallback(propertyPayload));
        insertError = retry.error;
      }
      if (!insertError) {
        insertSuccess = true;
      } else {
        // If RLS blocked client-side direct insert, fallback to server API endpoint with verified auth token
        let fallbackToken = hostAuthToken;
        if (!fallbackToken) {
          try {
            if (isFirebaseConfigured()) {
              const fbUser = getFirebaseAuth().currentUser;
              if (fbUser) fallbackToken = await fbUser.getIdToken();
            }
          } catch {}
        }

        const apiRes = await fetch("/api/host/properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(fallbackToken ? { Authorization: `Bearer ${fallbackToken}` } : {}),
          },
          body: JSON.stringify(propertyPayload),
        });
        if (apiRes.ok) {
          insertSuccess = true;
        } else {
          const apiData = await apiRes.json();
          throw new Error(apiData.message || insertError.message || "Property could not be saved.");
        }
      }

      if (!insertSuccess) {
        throw new Error("Property submission could not be completed.");
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem("qafnest-host-listing-draft-v1");
      const activeLocale =
        getHostLocaleFromPathname(typeof window !== "undefined" ? window.location.pathname : null) ??
        "ar";
      router.push(localizeHostPath("/app?listing=submitted", activeLocale));
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Property submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    submitError,
    setSubmitError,
    submitListing,
  };
}

