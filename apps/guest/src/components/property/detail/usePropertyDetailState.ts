"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStayTotal, Property } from "@/data/properties";
import { useApp } from "@/context/AppContext";
import { propertyReservationHref } from "@/lib/propertyUrls";
import { addRecentlyViewed } from "@/lib/services/recentlyViewed";
import { getDayAfter } from "./ReservationPanel";
import type { PropertyDetailTab } from "./PropertyTabsContainer";

interface UsePropertyDetailStateOptions {
  property: Property;
  title: string;
  capacity: number;
}

export function usePropertyDetailState({
  property,
  title,
  capacity,
}: UsePropertyDetailStateOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const initialTab = new URLSearchParams(searchParamString).get("tab");

  const {
    checkinDate,
    setCheckinDate,
    checkinTime,
    setCheckinTime,
    checkoutDate,
    setCheckoutDate,
    checkoutTime,
    setCheckoutTime,
    guestsCount,
    setGuestsCount,
  } = useApp();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);
  const [shareNotice, setShareNotice] = useState(false);
  const [reviewStats, setReviewStats] = useState(() => ({
    average: property.rating,
    total: property.reviewsCount,
  }));

  const [activeTab, setActiveTab] = useState<PropertyDetailTab>(
    initialTab === "specification" ||
      initialTab === "reviews" ||
      initialTab === "location" ||
      initialTab === "terms"
      ? initialTab
      : "specification"
  );

  const selectedGuestsCount = Math.max(1, Math.min(guestsCount, capacity));

  // Record this property visit in recently viewed storage
  useEffect(() => {
    if (property?.id) {
      addRecentlyViewed(property.id);
    }
  }, [property?.id]);

  useEffect(() => {
    const requestedTab = new URLSearchParams(searchParamString).get("tab");
    if (
      requestedTab === "specification" ||
      requestedTab === "reviews" ||
      requestedTab === "location" ||
      requestedTab === "terms"
    ) {
      setActiveTab(requestedTab);
    }
  }, [searchParamString]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ propertyId: property.id, page: "1" });
    void fetch(`/api/reviews?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          summary?: { average?: number; total?: number };
        };
      })
      .then((result) => {
        if (!active || !result?.summary) return;
        setReviewStats({
          average: Number(result.summary.average || 0),
          total: Number(result.summary.total || 0),
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [property.id]);

  useEffect(() => {
    const params = new URLSearchParams(searchParamString);
    const checkin = params.get("check_in");
    const checkout = params.get("check_out");
    const checkinAt = params.get("check_in_time");
    const checkoutAt = params.get("check_out_time");
    const guests = Number(params.get("guests"));
    if (checkin) setCheckinDate(checkin);
    if (checkout) setCheckoutDate(checkout);
    if (checkinAt) setCheckinTime(checkinAt);
    else if (property.checkinTime) setCheckinTime(property.checkinTime);
    if (checkoutAt) setCheckoutTime(checkoutAt);
    else if (property.checkoutTime) setCheckoutTime(property.checkoutTime);
    if (Number.isInteger(guests) && guests > 0)
      setGuestsCount(Math.min(guests, capacity));
    else setGuestsCount(Math.max(1, Math.min(guestsCount, capacity)));
  }, [
    searchParamString,
    property,
    capacity,
    guestsCount,
    setCheckinDate,
    setCheckinTime,
    setCheckoutDate,
    setCheckoutTime,
    setGuestsCount,
  ]);

  const nights = useMemo(() => {
    if (!checkinDate || !checkoutDate) return 1;
    const start = Date.parse(`${checkinDate}T00:00:00Z`);
    const end = Date.parse(`${checkoutDate}T00:00:00Z`);
    const duration = Math.ceil((end - start) / 86_400_000);
    return Number.isFinite(duration) && duration > 0 ? duration : 1;
  }, [checkinDate, checkoutDate]);

  const estimatedTotal = getStayTotal(property, checkinDate, nights);

  const handleCheckinChange = (value: string) => {
    const isSameDay12h = checkinTime === "00:00" && checkinDate === checkoutDate;
    setCheckinDate(value);
    if (isSameDay12h) {
      setCheckoutDate(value);
    } else if (!checkoutDate || checkoutDate <= value) {
      setCheckoutDate(getDayAfter(value));
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice(true);
      window.setTimeout(() => setShareNotice(false), 1800);
    } catch {
      setShareNotice(false);
    }
  };

  const handleReserve = () => {
    const reservationParams = new URLSearchParams(searchParamString);
    reservationParams.set("check_in", checkinDate);
    reservationParams.set("check_out", checkoutDate);
    reservationParams.set("check_in_time", checkinTime);
    reservationParams.set("check_out_time", checkoutTime);
    reservationParams.set("guests", String(selectedGuestsCount));
    router.push(propertyReservationHref(property.id, reservationParams));
  };

  const selectTab = (tab: PropertyDetailTab) => setActiveTab(tab);

  return {
    lightboxIndex,
    setLightboxIndex,
    videoIndex,
    setVideoIndex,
    shareNotice,
    reviewStats,
    activeTab,
    selectTab,
    selectedGuestsCount,
    nights,
    estimatedTotal,
    handleCheckinChange,
    handleShare,
    handleReserve,
    checkinDate,
    checkinTime,
    setCheckinTime,
    checkoutDate,
    setCheckoutDate,
    checkoutTime,
    setCheckoutTime,
    setGuestsCount,
  };
}

