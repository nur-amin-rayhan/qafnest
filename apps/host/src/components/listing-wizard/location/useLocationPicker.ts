"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { resolveSaudiCity } from "@qafnest/shared";
import { SAUDI_CITIES, getCityInfo, getDistrictDisplay, reverseGeocodePin } from "@/lib/geo/saudiLocations";
import {
  geocodeAddressHybrid,
  resolveGoogleMapsLinkHybrid,
  reverseGeocodeHybrid,
} from "@/lib/geo/googleGeocoder";
import {
  parseGoogleMapsCoordinates,
  coordsToCityPin,
  buildGoogleMapsUrl,
  buildGoogleMapsEmbedUrl,
  buildGoogleMapsIframeSnippet,
  extractGoogleMapsUrlFromInput,
  isGoogleMapsEmbedUrl,
  isGoogleMapsLinkLike,
} from "@/lib/geo/mapsUrlParser";
import type { WizardDraft } from "../types";

interface UseLocationPickerProps {
  draft: WizardDraft;
  updateDraft: <K extends keyof WizardDraft>(key: K, val: WizardDraft[K]) => void;
  pin: { x: number; y: number };
  setPin: (pin: { x: number; y: number }) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function useLocationPicker({
  draft,
  updateDraft,
  pin,
  setPin,
  lang,
  t,
}: UseLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [inputMode, setInputMode] = useState<"address" | "maps_url">("maps_url");
  const [searchQuery, setSearchQuery] = useState(draft.address || "");
  const [mapsUrlInput, setMapsUrlInput] = useState(draft.googleMapsUrl || "");
  const [customEmbedSrc, setCustomEmbedSrc] = useState<string>("");
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [hoverDistrict, setHoverDistrict] = useState<{
    ar: string;
    en: string;
    dirAr: string;
    dirEn: string;
  } | null>(null);

  const hasCity = Boolean(draft.city && draft.city.trim());
  const hasDistrict = Boolean(
    (draft.district && draft.district.trim()) ||
      (draft.districtAr && draft.districtAr.trim())
  );
  const hasCoords = typeof draft.latitude === "number" && typeof draft.longitude === "number";
  const hasSelectedLocation = Boolean(
    hasCity ||
      hasDistrict ||
      hasCoords ||
      (draft.address && draft.address.trim()) ||
      (draft.addressAr && draft.addressAr.trim())
  );

  const cityInfo = getCityInfo(draft.city || undefined);

  useEffect(() => {
    const preferredAddress =
      lang === "ar"
        ? draft.addressAr || draft.address
        : draft.address || draft.addressAr;
    if (preferredAddress) {
      setSearchQuery(preferredAddress);
    }
  }, [draft.address, draft.addressAr, lang]);

  useEffect(() => {
    if (draft.googleMapsUrl) {
      setMapsUrlInput(draft.googleMapsUrl);
    }
  }, [draft.googleMapsUrl]);

  const applyResolvedLocationToDraft = useCallback(
    (params: {
      lat: number;
      lng: number;
      cityId?: string;
      state?: string;
      stateAr?: string;
      districtEn: string;
      districtAr: string;
      streetEn: string;
      streetAr: string;
      postalCode: string;
      direction: string;
      addressEn: string;
      addressAr: string;
      shareUrl?: string;
      embedSrc?: string;
      pinCoords?: { x: number; y: number };
    }) => {
      const conv = coordsToCityPin(params.lat, params.lng, params.cityId || draft.city || undefined);
      const nextCityId = params.cityId || conv.cityId;
      const sharedCity = resolveSaudiCity(nextCityId);
      const nextState = params.state || sharedCity?.regionEn || "";
      const nextStateAr = params.stateAr || sharedCity?.regionAr || nextState;
      const nextShareUrl = params.shareUrl || buildGoogleMapsUrl(params.lat, params.lng);

      setPin(params.pinCoords || conv.pin);
      updateDraft("city", nextCityId);
      updateDraft("state", nextState);
      updateDraft("stateAr", nextStateAr);
      updateDraft("district", params.districtEn || params.districtAr || nextCityId);
      updateDraft("districtAr", params.districtAr || params.districtEn || nextCityId);
      updateDraft("street", params.streetEn || params.streetAr || "");
      updateDraft("streetAr", params.streetAr || params.streetEn || "");
      updateDraft("postalCode", params.postalCode);
      updateDraft("direction", params.direction);
      updateDraft("address", params.addressEn || params.addressAr || "");
      updateDraft("addressAr", params.addressAr || params.addressEn || "");
      updateDraft("latitude", params.lat);
      updateDraft("longitude", params.lng);
      updateDraft("googleMapsUrl", nextShareUrl);
      setMapsUrlInput(nextShareUrl);
      setCustomEmbedSrc(params.embedSrc ?? "");
      setSearchQuery(
        lang === "ar"
          ? params.addressAr || params.addressEn
          : params.addressEn || params.addressAr
      );
    },
    [draft.city, lang, setPin, updateDraft]
  );

  const commitReverseGeocode = useCallback(
    (x: number, y: number) => {
      const targetCityId = draft.city || cityInfo.id;
      const result = reverseGeocodePin(targetCityId, { x, y });
      applyResolvedLocationToDraft({
        lat: result.lat,
        lng: result.lng,
        cityId: targetCityId,
        districtEn: result.districtEn,
        districtAr: result.district,
        streetEn: result.streetEn,
        streetAr: result.street,
        postalCode: result.postalCode,
        direction: result.direction,
        addressEn: result.addressEn,
        addressAr: result.addressAr,
        pinCoords: { x, y },
      });
    },
    [applyResolvedLocationToDraft, draft.city, cityInfo.id]
  );

  const handleQuickCitySelect = (selectedCityId: string) => {
    const city = SAUDI_CITIES.find((c) => c.id === selectedCityId) || getCityInfo(selectedCityId);
    const sharedCity = resolveSaudiCity(city.id) || resolveSaudiCity(city.en);
    setPin(city.defaultPin);
    updateDraft("city", city.id);
    updateDraft("state", sharedCity?.regionEn || "");
    updateDraft("stateAr", sharedCity?.regionAr || "");
    updateDraft("district", "");
    updateDraft("districtAr", "");
    updateDraft("street", "");
    updateDraft("streetAr", "");
    updateDraft("postalCode", "");
    updateDraft("direction", "");
    updateDraft("address", "");
    updateDraft("addressAr", "");
    updateDraft("latitude", city.lat);
    updateDraft("longitude", city.lng);
    const cityShareUrl = buildGoogleMapsUrl(city.lat, city.lng);
    updateDraft("googleMapsUrl", cityShareUrl);
    setMapsUrlInput(cityShareUrl);
    setCustomEmbedSrc("");
    setSearchQuery("");
  };

  const updatePositionFromPointer = (clientX: number, clientY: number) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const clampedX = Math.max(6, Math.min(94, Math.round(((clientX - rect.left) / rect.width) * 1000) / 10));
    const clampedY = Math.max(8, Math.min(90, Math.round(((clientY - rect.top) / rect.height) * 1000) / 10));

    setPin({ x: clampedX, y: clampedY });
    const preview = reverseGeocodePin(draft.city, { x: clampedX, y: clampedY });
    setHoverDistrict({
      ar: preview.district,
      en: preview.districtEn,
      dirAr: preview.direction,
      dirEn: preview.directionEn,
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (mapRef.current) mapRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updatePositionFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) updatePositionFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    setHoverDistrict(null);
    try {
      if (mapRef.current?.hasPointerCapture(e.pointerId)) mapRef.current.releasePointerCapture(e.pointerId);
    } catch {}
    commitReverseGeocode(pin.x, pin.y);
  };

  // Forward geocoding with Google Maps / Nominatim Geocoder + fallback
  const handleLocateOnMap = async (customQuery?: string) => {
    const q = (customQuery ?? searchQuery).trim();
    if (!q) return;

    if (isGoogleMapsLinkLike(q)) {
      setInputMode("maps_url");
      setMapsUrlInput(q);
      await handleGoogleMapsUrlSubmit(q);
      return;
    }

    setIsResolvingUrl(true);
    try {
      const geoResult = await geocodeAddressHybrid(q, draft.city || undefined);
      const conv = coordsToCityPin(geoResult.lat, geoResult.lng, geoResult.cityId || draft.city || undefined);
      const pinReverse = reverseGeocodePin(conv.cityId, conv.pin);

      const hasAr = (v?: string) => Boolean(v && /[\u0600-\u06FF]/.test(v));
      const nextDistrictEn =
        geoResult.districtEn ||
        (geoResult.district && !hasAr(geoResult.district) ? geoResult.district : pinReverse.districtEn);
      const nextDistrictAr =
        geoResult.district && hasAr(geoResult.district) ? geoResult.district : pinReverse.district;
      const nextStreetEn =
        geoResult.streetEn ||
        (geoResult.street && !hasAr(geoResult.street) ? geoResult.street : pinReverse.streetEn);
      const nextStreetAr =
        geoResult.street && hasAr(geoResult.street) ? geoResult.street : pinReverse.street;
      const nextAddrEn =
        geoResult.addressEn ||
        (!hasAr(geoResult.addressEn) ? geoResult.addressEn : pinReverse.addressEn);
      const nextAddrAr =
        geoResult.addressAr ||
        (hasAr(geoResult.addressAr) ? geoResult.addressAr : pinReverse.addressAr);

      applyResolvedLocationToDraft({
        lat: geoResult.lat,
        lng: geoResult.lng,
        cityId: geoResult.cityId || conv.cityId,
        state: geoResult.state,
        stateAr: geoResult.stateAr,
        districtEn: nextDistrictEn,
        districtAr: nextDistrictAr,
        streetEn: nextStreetEn,
        streetAr: nextStreetAr,
        postalCode: geoResult.postalCode || pinReverse.postalCode,
        direction: geoResult.direction || pinReverse.direction,
        addressEn: nextAddrEn,
        addressAr: nextAddrAr,
        pinCoords: conv.pin,
      });

      const resolvedPlaceLabel =
        lang === "ar"
          ? [geoResult.stateAr || geoResult.cityId, nextDistrictAr].filter(Boolean).join(" — ")
          : [geoResult.state || geoResult.cityEn, nextDistrictEn].filter(Boolean).join(" — ");

      setFeedback({
        text:
          geoResult.source !== "fallback"
            ? t(
                `Location pinpointed${resolvedPlaceLabel ? `: ${resolvedPlaceLabel}` : "!"}`,
                `تم تحديد الموقع وتعبئة المدينة والمنطقة${resolvedPlaceLabel ? `: ${resolvedPlaceLabel}` : "!"}`
              )
            : t("Location placed on map successfully!", "تم تحديد الموقع على الخريطة بنجاح!"),
        isError: false,
      });
      setTimeout(() => setFeedback(null), 4500);
    } finally {
      setIsResolvingUrl(false);
    }
  };

  // Google Maps URL, Shareable Link, Embed Snippet, or Coordinates Extraction Handler
  const handleGoogleMapsUrlSubmit = async (customUrl?: string) => {
    const raw = (customUrl ?? mapsUrlInput).trim();
    if (!raw) return;

    const cleanUrl = extractGoogleMapsUrlFromInput(raw);
    const resolvedEmbed = isGoogleMapsEmbedUrl(cleanUrl) ? cleanUrl : "";

    setIsResolvingUrl(true);
    try {
      // Always resolve through hybrid geocoder when link/coords are provided so City, State, District & Full Address are auto-fetched accurately
      const resolved = await resolveGoogleMapsLinkHybrid(cleanUrl || raw, lang);
      if (resolved) {
        const preservedShareUrl =
          cleanUrl && isGoogleMapsLinkLike(cleanUrl) && !isGoogleMapsEmbedUrl(cleanUrl)
            ? cleanUrl
            : resolved.googleMapsUrl;

        applyResolvedLocationToDraft({
          lat: resolved.lat,
          lng: resolved.lng,
          cityId: resolved.cityId,
          state: resolved.state,
          stateAr: resolved.stateAr,
          districtEn: resolved.districtEn,
          districtAr: resolved.district,
          streetEn: resolved.streetEn,
          streetAr: resolved.street,
          postalCode: resolved.postalCode,
          direction: resolved.direction,
          addressEn: resolved.addressEn,
          addressAr: resolved.addressAr,
          shareUrl: preservedShareUrl,
          embedSrc: resolvedEmbed || resolved.embedUrl || buildGoogleMapsEmbedUrl(resolved.lat, resolved.lng, lang),
          pinCoords: resolved.pin,
        });

        const summary =
          lang === "ar"
            ? [resolved.cityId, resolved.stateAr, resolved.district].filter(Boolean).join(" • ")
            : [resolved.cityEn, resolved.state, resolved.districtEn].filter(Boolean).join(" • ");

        setFeedback({
          text: t(
            `Google Maps location extracted${summary ? ` (${summary})` : ""}`,
            `تم استخراج موقع جوجل مابس وتعبئة البيانات${summary ? ` (${summary})` : ""}`
          ),
          isError: false,
        });
        setTimeout(() => setFeedback(null), 5000);
        return;
      }

      // Offline fallback: extract raw coordinates locally
      const coords = parseGoogleMapsCoordinates(raw);
      if (!coords) {
        setFeedback({
          text: t(
            "Could not extract location from this link or coordinates.",
            "تعذر استخراج الموقع أو الإحداثيات من هذا الرابط."
          ),
          isError: true,
        });
        setTimeout(() => setFeedback(null), 5000);
        return;
      }

      const fallbackShare =
        cleanUrl && isGoogleMapsLinkLike(cleanUrl) && !isGoogleMapsEmbedUrl(cleanUrl)
          ? cleanUrl
          : undefined;
      await handleGoogleMapsLocationChange(coords.lat, coords.lng, resolvedEmbed, fallbackShare);
      setFeedback({
        text: t(
          `Pinned on map: ${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°`,
          `تم تثبيت الموقع على الخريطة: ${coords.lat.toFixed(4)}°، ${coords.lng.toFixed(4)}°`
        ),
        isError: false,
      });
      setTimeout(() => setFeedback(null), 4500);
    } finally {
      setIsResolvingUrl(false);
    }
  };

  // Direct location change from Google Maps marker drag or map click
  const handleGoogleMapsLocationChange = async (
    nextLat: number,
    nextLng: number,
    preservedEmbedSrc?: string,
    preservedShareUrl?: string
  ) => {
    const conv = coordsToCityPin(nextLat, nextLng, draft.city || undefined);
    const rev = await reverseGeocodeHybrid(nextLat, nextLng, conv.cityId);

    applyResolvedLocationToDraft({
      lat: nextLat,
      lng: nextLng,
      cityId: rev.cityId || conv.cityId,
      state: rev.state,
      stateAr: rev.stateAr,
      districtEn: rev.districtEn,
      districtAr: rev.district,
      streetEn: rev.streetEn,
      streetAr: rev.street,
      postalCode: rev.postalCode,
      direction: rev.direction,
      addressEn: rev.addressEn,
      addressAr: rev.addressAr,
      shareUrl: preservedShareUrl,
      embedSrc: preservedEmbedSrc || buildGoogleMapsEmbedUrl(nextLat, nextLng, lang),
      pinCoords: conv.pin,
    });
  };

  const handleNudge = (dx: number, dy: number) => {
    const nextX = Math.max(6, Math.min(94, Math.round((pin.x + dx) * 10) / 10));
    const nextY = Math.max(8, Math.min(90, Math.round((pin.y + dy) * 10) / 10));
    setPin({ x: nextX, y: nextY });
    commitReverseGeocode(nextX, nextY);
  };

  const handleResetCenter = () => {
    setPin(cityInfo.defaultPin);
    commitReverseGeocode(cityInfo.defaultPin.x, cityInfo.defaultPin.y);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFeedback({ text: t("Geolocation not supported", "المتصفح لا يدعم تحديد الموقع"), isError: true });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingGps(false);
        const { latitude, longitude } = pos.coords;
        handleGoogleMapsLocationChange(latitude, longitude);
        setFeedback({ text: t("Current GPS detected!", "تم تحديد موقعك الجغرافي بنجاح!"), isError: false });
        setTimeout(() => setFeedback(null), 4000);
      },
      () => {
        setIsLocatingGps(false);
        setFeedback({ text: t("Could not access location.", "تعذر الوصول للموقع."), isError: true });
        setTimeout(() => setFeedback(null), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const currentLat = draft.latitude ?? (hasCity ? cityInfo.lat : 24.7136);
  const currentLng = draft.longitude ?? (hasCity ? cityInfo.lng : 46.6753);
  const resolvedReverse = reverseGeocodePin(draft.city || cityInfo.id, pin);
  const embedZoom = hasCoords || hasDistrict ? 15 : hasCity ? 11 : 5;
  const embedUrl =
    customEmbedSrc ||
    buildGoogleMapsEmbedUrl(currentLat, currentLng, lang, undefined, embedZoom);
  const embedIframeCode = buildGoogleMapsIframeSnippet(
    currentLat,
    currentLng,
    lang,
    customEmbedSrc || undefined
  );

  return {
    mapRef,
    isDragging,
    zoomScale,
    setZoomScale,
    inputMode,
    setInputMode,
    searchQuery,
    setSearchQuery,
    mapsUrlInput,
    setMapsUrlInput,
    isResolvingUrl,
    handleGoogleMapsUrlSubmit,
    handleGoogleMapsLocationChange,
    handleQuickCitySelect,
    feedback,
    isLocatingGps,
    hoverDistrict,
    cityInfo,
    hasSelectedLocation,
    hasDistrict,
    currentLat,
    currentLng,
    embedUrl,
    embedIframeCode,
    localizedState:
      lang === "ar"
        ? draft.stateAr || draft.state || resolveSaudiCity(draft.city)?.regionAr || ""
        : draft.state || draft.stateAr || resolveSaudiCity(draft.city)?.regionEn || "",
    localizedDistrict: hasDistrict
      ? lang === "ar"
        ? draft.districtAr || getDistrictDisplay(draft.district, "ar", draft.city || cityInfo.id)
        : draft.district || getDistrictDisplay(draft.districtAr, "en", draft.city || cityInfo.id)
      : "",
    localizedStreet:
      lang === "ar"
        ? draft.streetAr || draft.street || ""
        : draft.street || draft.streetAr || "",
    localizedDirection: draft.direction
      ? lang === "ar"
        ? resolvedReverse.direction
        : resolvedReverse.directionEn
      : "",
    localizedAddress:
      lang === "ar"
        ? draft.addressAr || draft.address || ""
        : draft.address || draft.addressAr || "",
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleLocateOnMap,
    handleNudge,
    handleResetCenter,
    handleUseCurrentLocation,
  };
}
