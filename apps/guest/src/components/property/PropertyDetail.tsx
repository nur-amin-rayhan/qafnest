"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Heart,
  Home,
  KeyRound,
  MapPin,
  Maximize2,
  Share2,
  ShieldCheck,
  Star,
  Users,
  Waves,
  X,
  Zap,
  Bath,
  Sofa,
} from "lucide-react";
import { groupAmenitiesByCategory, AmenityIcon } from "@/lib/amenities";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import AuthModal from "@/components/modals/AuthModal";
import AppModal from "@/components/modals/AppModal";
import SearchModal from "@/components/modals/SearchModal";
import InteractiveMapView from "@/components/search/InteractiveMapView";
import GuestReviewsPanel from "@/components/property/GuestReviewsPanel";
import { getPropertyCapacity, getStayTotal, normalizeCityId, Property } from "@/data/properties";
import {
  CATEGORY_NAMES_AR,
  CITY_NAMES_AR,
  PROPERTY_SPECS_AR,
  PROPERTY_TITLES_AR,
} from "@/data/translations";
import { useApp } from "@/context/AppContext";
import { propertyReservationHref } from "@/lib/propertyUrls";
import { getSampleReviews, isDemoProperty, summarizeReviews } from "@/lib/reviews/sampleReviews";
import { isPropertyAvailable } from "@/lib/services/availability";

interface PropertyDetailProps {
  property: Property;
}

type PropertyDetailTab = "specification" | "reviews" | "location" | "terms";

interface ReservationPanelProps {
  property: Property;
  checkinDate: string;
  checkinTime: string;
  checkoutDate: string;
  checkoutTime: string;
  guestsCount: number;
  nights: number;
  onCheckinChange: (value: string) => void;
  onCheckinTimeChange: (value: string) => void;
  onCheckoutChange: (value: string) => void;
  onCheckoutTimeChange: (value: string) => void;
  onGuestsChange: (value: number) => void;
  onReserve: () => void;
  compact?: boolean;
}

function getBedrooms(property: Property) {
  if (property.bedroomsCount) return property.bedroomsCount;
  const match = property.specs.match(/(\d+)\s*(?:bed(?:rooms?)?|master suites?)/i);
  return match ? Number(match[1]) : null;
}

function getListingReference(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `QN-${(hash >>> 0).toString(36).slice(0, 6).toUpperCase()}`;
}

function getFeaturePresentation(feature: string) {
  const firstToken = feature.split(" ")[0] || "";
  const hasEmojiPrefix = firstToken.charCodeAt(0) >= 0xd800;
  return {
    icon: hasEmojiPrefix ? firstToken : "✓",
    label: hasEmojiPrefix ? feature.slice(firstToken.length).trim() : feature,
  };
}

function getSaudiToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getDayAfter(isoDate: string) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function ReservationPanel({
  property,
  checkinDate,
  checkinTime,
  checkoutDate,
  checkoutTime,
  guestsCount,
  nights,
  onCheckinChange,
  onCheckinTimeChange,
  onCheckoutChange,
  onCheckoutTimeChange,
  onGuestsChange,
  onReserve,
  compact = false,
}: ReservationPanelProps) {
  const { language, formatPrice } = useApp();
  const title = language === "ar" ? property.titleAr || property.title : property.title;
  const hasDiscount = Boolean(
    property.originalPrice && property.originalPrice > property.basePrice
  );
  const maxGuests = getPropertyCapacity(property);
  const estimatedTotal = getStayTotal(property, checkinDate, nights);

  const todaySaudi = useMemo(() => getSaudiToday(), []);
  const minCheckoutDate = useMemo(
    () => (checkinDate ? getDayAfter(checkinDate) : getDayAfter(todaySaudi)),
    [checkinDate, todaySaudi]
  );

  const isAvailable = useMemo(() => {
    if (!checkinDate || !checkoutDate) return true;
    return isPropertyAvailable(property.id, checkinDate, checkoutDate);
  }, [property.id, checkinDate, checkoutDate]);

  return (
    <section className="rounded-3xl border border-violet-200 bg-white p-5 shadow-[0_18px_55px_rgba(70,35,130,0.12)] dark:border-violet-400/20 dark:bg-[#12101a] dark:shadow-[0_18px_55px_rgba(0,0,0,0.34)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          {hasDiscount ? (
            <>
              {/* Row 1: Strikethrough Original Price in Red */}
              <div className="text-sm sm:text-base font-bold text-rose-500 dark:text-rose-400 line-through tracking-tight">
                {formatPrice(property.originalPrice || 0)}
              </div>
              {/* Row 2: Discounted Nightly Price */}
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950 dark:text-white">
                  {formatPrice(property.basePrice)}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {language === "ar" ? "/ ليلة" : "/ night"}
                </span>
              </div>
              {/* Row 3: Total estimated price */}
              <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                {language === "ar"
                  ? `الإجمالي لـ ${nights} ${nights === 1 ? "ليلة" : "ليال"}: ${formatPrice(estimatedTotal)}`
                  : `Total for ${nights} ${nights === 1 ? "night" : "nights"}: ${formatPrice(estimatedTotal)}`}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {language === "ar" ? "السعر يبدأ من" : "Starting at"}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950 dark:text-white">
                  {formatPrice(property.basePrice)}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {language === "ar" ? "/ ليلة" : "/ night"}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                {language === "ar"
                  ? `الإجمالي لـ ${nights} ${nights === 1 ? "ليلة" : "ليال"}: ${formatPrice(estimatedTotal)}`
                  : `Total for ${nights} ${nights === 1 ? "night" : "nights"}: ${formatPrice(estimatedTotal)}`}
              </p>
            </>
          )}
        </div>

        {property.discountPercentage || hasDiscount ? (
          <span className="rounded-md bg-[#fee2e2] px-2.5 py-1 text-xs font-black uppercase tracking-wide text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 shrink-0 shadow-sm">
            {property.discountPercentage ||
              Math.round(
                ((property.originalPrice! - property.basePrice) /
                  property.originalPrice!) *
                  100
              )}% OFF
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <label className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
            {language === "ar" ? "تسجيل الوصول" : "Check-in"}
          </span>
          <input
            type="date"
            value={checkinDate}
            min={todaySaudi}
            onChange={(event) => onCheckinChange(event.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
            aria-label={language === "ar" ? "تاريخ تسجيل الوصول" : "Check-in date"}
          />
        </label>
        <label className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
            {language === "ar" ? "تسجيل المغادرة" : "Check-out"}
          </span>
          <input
            type="date"
            value={checkoutDate}
            min={minCheckoutDate}
            onChange={(event) => onCheckoutChange(event.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
            aria-label={language === "ar" ? "تاريخ تسجيل المغادرة" : "Check-out date"}
          />
        </label>
      </div>

      {!isAvailable && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            {language === "ar"
              ? "هذه التواريخ محجوزة بالفعل لهذا العقار. يُرجى اختيار تواريخ أخرى."
              : "These dates are already booked for this property. Please choose different dates."}
          </span>
        </div>
      )}

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <label className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Clock3 className="h-3.5 w-3.5 text-violet-500" />
            {language === "ar" ? "وقت تسجيل الوصول" : "Check-in time"}
          </span>
          <input
            type="time"
            value={checkinTime}
            onChange={(event) => onCheckinTimeChange(event.target.value)}
            step={900}
            required
            className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
            aria-label={language === "ar" ? "وقت تسجيل الوصول" : "Check-in time"}
          />
        </label>
        <label className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Clock3 className="h-3.5 w-3.5 text-violet-500" />
            {language === "ar" ? "وقت تسجيل المغادرة" : "Check-out time"}
          </span>
          <input
            type="time"
            value={checkoutTime}
            onChange={(event) => onCheckoutTimeChange(event.target.value)}
            step={900}
            required
            className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
            aria-label={language === "ar" ? "وقت تسجيل المغادرة" : "Check-out time"}
          />
        </label>
      </div>

      <div className="mt-2.5 flex items-center justify-between rounded-xl border border-gray-200 p-3 dark:border-white/10">
        <div>
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Users className="h-3.5 w-3.5 text-violet-500" />
            {language === "ar" ? "الضيوف" : "Guests"}
          </span>
          <span className="mt-1 block text-xs font-semibold text-gray-900 dark:text-white">
            {guestsCount} {language === "ar" ? "ضيوف" : guestsCount === 1 ? "guest" : "guests"}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onGuestsChange(Math.max(1, guestsCount - 1))}
            disabled={guestsCount <= 1}
            aria-label={language === "ar" ? "تقليل عدد الضيوف" : "Remove one guest"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-violet-400 disabled:opacity-40 dark:border-white/15 dark:text-white"
          >
            −
          </button>
          <span className="min-w-4 text-center text-sm font-bold text-gray-900 dark:text-white">
            {guestsCount}
          </span>
          <button
            type="button"
            onClick={() => onGuestsChange(Math.min(maxGuests, guestsCount + 1))}
            disabled={guestsCount >= maxGuests}
            aria-label={language === "ar" ? "زيادة عدد الضيوف" : "Add one guest"}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-violet-400 disabled:opacity-40 dark:border-white/15 dark:text-white"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onReserve}
        disabled={!isAvailable}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-[0.99] ${
          !isAvailable
            ? "cursor-not-allowed bg-gray-400 opacity-60 shadow-none dark:bg-gray-700"
            : "bg-violet-700 shadow-violet-900/20 hover:bg-violet-800"
        }`}
      >
        {language === "ar" ? "تابع الحجز" : "Continue to booking"}
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
      </button>

      <p className="mt-2 text-center text-[10px] text-gray-500 dark:text-gray-400">
        {language === "ar" ? "لن يتم تحصيل أي مبلغ الآن" : "You can review your stay before confirming"}
      </p>

      {!compact && (
        <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs dark:border-white/10">
          <div className="flex justify-between text-gray-600 dark:text-gray-300">
            <span>
              {formatPrice(property.basePrice)} × {nights} {language === "ar" ? "ليلة" : nights === 1 ? "night" : "nights"}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatPrice(estimatedTotal)}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900 dark:border-white/10 dark:text-white">
            <span>{language === "ar" ? "تقدير الإقامة" : "Estimated stay total"}</span>
            <span>{formatPrice(estimatedTotal)}</span>
          </div>
        </div>
      )}

      <p className="sr-only">{title}</p>
    </section>
  );
}

export default function PropertyDetail({ property }: PropertyDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const initialTab = new URLSearchParams(searchParamString).get("tab");
  const {
    language,
    formatPrice,
    wishlist,
    toggleWishlist,
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
  const [promiseExpanded, setPromiseExpanded] = useState(false);
  const [reviewStats, setReviewStats] = useState(() => {
    if (isDemoProperty(property.id)) {
      const summary = summarizeReviews(getSampleReviews(property.id, property));
      return { average: summary.average, total: summary.total };
    }
    return { average: property.rating, total: property.reviewsCount };
  });
  const [activeTab, setActiveTab] = useState<PropertyDetailTab>(
    initialTab === "specification" || initialTab === "reviews" || initialTab === "location" || initialTab === "terms"
      ? initialTab
      : "specification"
  );
  const isWishlisted = wishlist.includes(property.id);
  const images = useMemo(
    () => property.images?.length ? property.images : [property.image],
    [property.image, property.images]
  );
  const title =
    language === "ar"
      ? PROPERTY_TITLES_AR[property.id] || property.titleAr || property.title
      : property.title;
  const cityName = language === "ar" ? CITY_NAMES_AR[normalizeCityId(property.city)] || property.cityName : property.cityName;
  const categoryName = language === "ar" ? CATEGORY_NAMES_AR[property.category] || property.categoryName : property.categoryName;
  const district = language === "ar" ? property.districtAr || property.district || cityName : property.district || cityName;
  const specs = language === "ar" ? PROPERTY_SPECS_AR[property.specs] || property.specs : property.specs;
  const capacity = getPropertyCapacity(property);
  const selectedGuestsCount = Math.max(1, Math.min(guestsCount, capacity));
  const bedrooms = getBedrooms(property);
  const bathrooms = property.bathroomsCount || (bedrooms ? Math.max(1, bedrooms) : 2);
  const livingRooms = property.livingRoomsCount || 1;
  const chaletFor =
    language === "ar"
      ? property.chaletForAr || "عوائل فقط"
      : property.chaletForAr === "عوائل وعزاب"
      ? "Families & Singles"
      : "Families only";

  const categorizedAmenities = useMemo(() => {
    const list =
      property.amenities && property.amenities.length > 0
        ? property.amenities
        : property.features;
    return groupAmenitiesByCategory(list);
  }, [property.amenities, property.features]);

  const hasDiscount = Boolean(
    property.originalPrice && property.originalPrice > property.basePrice
  );
  const returnParams = new URLSearchParams(searchParamString);
  returnParams.delete("tab");
  returnParams.delete("review_booking");
  const returnParamString = returnParams.toString();
  const returnHref = returnParamString
    ? `/search?${returnParamString}`
    : `/search?city=${encodeURIComponent(normalizeCityId(property.city))}`;
  const hasListedCoordinates = Number.isFinite(property.lat) && Number.isFinite(property.lng);
  const anchorLabel = (en: string, ar: string) => language === "ar" ? ar : en;
  const detailTabs: Array<{ id: PropertyDetailTab; label: string }> = [
    { id: "specification", label: anchorLabel("Specification", "المواصفات") },
    { id: "reviews", label: anchorLabel("Guest reviews", "تقييمات الضيوف") },
    { id: "location", label: anchorLabel("Location & map", "الموقع والخريطة") },
    { id: "terms", label: anchorLabel("Terms & policies", "الشروط والسياسات") },
  ];
  const selectTab = (tab: PropertyDetailTab) => setActiveTab(tab);
  const unitReference = property.unitCode || getListingReference(property.id);
  const amenityGroups = property.amenityGroups?.length
    ? property.amenityGroups
    : property.features.length
      ? [{
          name: anchorLabel("Amenities", "المرافق"),
          items: property.features.map((feature) => getFeaturePresentation(feature).label),
        }]
      : [];

  useEffect(() => {
    const requestedTab = new URLSearchParams(searchParamString).get("tab");
    if (requestedTab === "specification" || requestedTab === "reviews" || requestedTab === "location" || requestedTab === "terms") {
      setActiveTab(requestedTab);
    }
  }, [searchParamString]);

  useEffect(() => {
    if (isDemoProperty(property.id)) return;
    let active = true;
    const params = new URLSearchParams({ propertyId: property.id, page: "1" });
    void fetch(`/api/reviews?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return await response.json() as { summary?: { average?: number; total?: number } };
      })
      .then((result) => {
        if (!active || !result?.summary) return;
        setReviewStats({
          average: Number(result.summary.average || 0),
          total: Number(result.summary.total || 0),
        });
      })
      .catch(() => undefined);
    return () => { active = false; };
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
    if (Number.isInteger(guests) && guests > 0) setGuestsCount(Math.min(guests, capacity));
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

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight") setLightboxIndex((index) => index === null ? null : (index + 1) % images.length);
      if (event.key === "ArrowLeft") setLightboxIndex((index) => index === null ? null : (index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, lightboxIndex]);

  useEffect(() => {
    if (videoIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVideoIndex(null);
      if (event.key === "ArrowRight") setVideoIndex((index) => index === null ? null : (index + 1) % (property.videos?.length || 1));
      if (event.key === "ArrowLeft") setVideoIndex((index) => index === null ? null : (index - 1 + (property.videos?.length || 1)) % (property.videos?.length || 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [property.videos?.length, videoIndex]);

  const nights = useMemo(() => {
    if (!checkinDate || !checkoutDate) return 1;
    const start = Date.parse(`${checkinDate}T00:00:00Z`);
    const end = Date.parse(`${checkoutDate}T00:00:00Z`);
    const duration = Math.ceil((end - start) / 86_400_000);
    return Number.isFinite(duration) && duration > 0 ? duration : 1;
  }, [checkinDate, checkoutDate]);
  const estimatedTotal = getStayTotal(property, checkinDate, nights);

  const handleCheckinChange = (value: string) => {
    setCheckinDate(value);
    if (!checkoutDate || checkoutDate <= value) {
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

  return (
    <div className="min-h-screen bg-white pb-24 text-gray-900 dark:bg-[#08070D] dark:text-gray-100 lg:pb-0">
      <Navbar />
      <main className="mx-auto max-w-[1360px] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <nav className="mb-5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-violet-600">{anchorLabel("Home", "الرئيسية")}</Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          <Link href={returnHref} className="transition hover:text-violet-600">{cityName}</Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          <span className="max-w-[48vw] truncate font-semibold text-gray-800 dark:text-gray-200">{title}</span>
        </nav>

        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">{categoryName}</span>
              {property.isLicensed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <ShieldCheck className="h-3 w-3" /> {anchorLabel("Licensed stay", "إقامة مرخصة")}
                </span>
              )}
              {property.instantBook && (
                <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-2.5 py-1 text-[10px] font-bold text-fuchsia-700 dark:bg-fuchsia-400/10 dark:text-fuchsia-300">
                  <Zap className="h-3 w-3" /> {anchorLabel("Instant booking", "حجز فوري")}
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white sm:text-3xl lg:text-4xl">{title}</h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {property.unitCode ? anchorLabel("Unit Code", "رمز الوحدة") : anchorLabel("Listing reference", "رقم الوحدة")} ({unitReference})
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-gray-100 py-3 text-xs text-gray-600 dark:border-white/10 dark:text-gray-300">
              <span className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                {reviewStats.total > 0 ? <>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {reviewStats.average.toFixed(1)} / 10
                  <span className="font-normal text-gray-500 dark:text-gray-400">({reviewStats.total} {anchorLabel("reviews", "تقييم")})</span>
                </> : <span className="font-normal text-gray-500 dark:text-gray-400">{anchorLabel("No ratings yet", "لا توجد تقييمات بعد")}</span>}
              </span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-violet-500" />{district}</span>
              {property.areaSqm && <span className="inline-flex items-center gap-1.5"><Maximize2 className="h-3.5 w-3.5 text-violet-500" />{anchorLabel("Unit area", "مساحة الوحدة")} {property.areaSqm} m²</span>}
              <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-violet-500" />{property.guestPolicy || anchorLabel(`Up to ${capacity} guests`, `حتى ${capacity} ضيوف`)}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/15 dark:text-gray-200 dark:hover:text-violet-300"
            >
              {shareNotice ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
              <span>{shareNotice ? anchorLabel("Copied", "تم النسخ") : anchorLabel("Share", "مشاركة")}</span>
              {shareNotice && <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(property.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                isWishlisted
                  ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-300"
                  : "border-gray-200 text-gray-700 hover:border-violet-300 dark:border-white/15 dark:text-gray-200"
              }`}
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
              {anchorLabel("Save", "حفظ")}
            </button>
          </div>
        </div>

        <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="min-w-0">
            <section aria-label={anchorLabel("Property photos", "صور العقار")} className="relative">
              <div className="grid gap-2 overflow-hidden rounded-3xl md:grid-cols-[1.2fr_1fr]">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="group relative aspect-[4/3] min-h-[250px] overflow-hidden bg-gray-100 text-left md:aspect-auto md:min-h-[430px]"
                  aria-label={anchorLabel("Open main photo", "عرض الصورة الرئيسية")}
                >
                  <Image src={images[0]} alt={title} fill priority sizes="(max-width: 768px) 100vw, 58vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-70" />
                </button>
                <div className="hidden grid-cols-2 grid-rows-2 gap-2 md:grid">
                  {images.slice(1, 5).map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      onClick={() => setLightboxIndex(index + 1)}
                      className="group relative min-h-[140px] overflow-hidden bg-gray-100"
                      aria-label={`${anchorLabel("Open photo", "عرض الصورة")} ${index + 2}`}
                    >
                      <Image src={image} alt={`${title} ${index + 2}`} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
                      {index === 3 && images.length > 5 && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white">+{images.length - 5}</span>}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/95 px-3 py-2 text-xs font-bold text-gray-900 shadow-lg backdrop-blur transition hover:bg-white dark:border-white/20 dark:bg-[#12101a]/95 dark:text-white"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                {anchorLabel(`View all ${images.length} photos`, `عرض الصور (${images.length})`)}
              </button>
              {property.videos?.length ? (
                <button
                  type="button"
                  onClick={() => setVideoIndex(0)}
                  className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-black/65 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur transition hover:bg-black/80"
                >
                  <span aria-hidden="true">▶</span>
                  {anchorLabel(`View ${property.videos.length} videos`, `عرض الفيديوهات (${property.videos.length})`)}
                </button>
              ) : null}
            </section>

            <section className="mt-5 lg:hidden">
              <ReservationPanel
                property={property}
                checkinDate={checkinDate}
                checkinTime={checkinTime}
                checkoutDate={checkoutDate}
                checkoutTime={checkoutTime}
                guestsCount={selectedGuestsCount}
                nights={nights}
                onCheckinChange={handleCheckinChange}
                onCheckinTimeChange={setCheckinTime}
                onCheckoutChange={setCheckoutDate}
                onCheckoutTimeChange={setCheckoutTime}
                onGuestsChange={setGuestsCount}
                onReserve={handleReserve}
                compact
              />
            </section>

            <section id="guarantee" className="mt-7 scroll-mt-32 overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#12101a]">
              <button
                type="button"
                onClick={() => setPromiseExpanded((expanded) => !expanded)}
                aria-expanded={promiseExpanded}
                className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-violet-50/50 dark:hover:bg-white/[0.03] sm:p-6"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-700 text-white shadow-md shadow-violet-900/15"><ShieldCheck className="h-7 w-7" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-gray-950 dark:text-white">{anchorLabel("QafNest guest support", "دعم ضيوف قاف نست")}</span>
                  <span className="mt-1 block text-sm text-gray-600 dark:text-gray-300">{anchorLabel("Clear listing details and support during your stay", "تفاصيل واضحة ودعم أثناء إقامتك")}</span>
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${promiseExpanded ? "rotate-180" : ""}`} />
              </button>
              {promiseExpanded && (
                <div className="border-t border-gray-100 px-5 py-5 text-sm leading-7 text-gray-600 dark:border-white/10 dark:text-gray-300 sm:px-6">
                  <p>{anchorLabel("Review the property description, amenities and host conditions before booking. If you need help with your reservation, contact QafNest support.", "راجع وصف العقار والمرافق وشروط المضيف قبل الحجز. إذا احتجت إلى مساعدة بشأن حجزك، تواصل مع دعم قاف نست.")}</p>
                  {property.tourismLicenseNumber && <p className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{anchorLabel("Tourism Ministry License Number", "رقم ترخيص وزارة السياحة")}: {property.tourismLicenseNumber}</p>}
                </div>
              )}
            </section>

            <section id="description" className="scroll-mt-32 border-b border-gray-100 py-8 dark:border-white/10">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">{anchorLabel("Description", "الوصف")}</h2>
              {property.tourismLicenseNumber && (
                <p className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {anchorLabel("Tourism Ministry License Number", "رقم ترخيص وزارة السياحة")}: {property.tourismLicenseNumber}. {specs}
                </p>
              )}
              <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-gray-600 dark:text-gray-300">
                {property.description || anchorLabel(
                  `${title} is in ${district}. This ${categoryName.toLowerCase()} accommodates up to ${capacity} guests. Review the property features, house rules and booking details before confirming your stay.`,
                  `${title} في ${district}. يستوعب هذا المكان حتى ${capacity} ضيوف. راجع المرافق وقواعد الإقامة وتفاصيل الحجز قبل تأكيد إقامتك.`
                )}
              </p>

              {/* Special Discount Highlight Banner (Gathern Style) */}
              {(hasDiscount || property.discountPercentage) && (
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-rose-200/90 bg-[#FDF2F2] p-4.5 sm:p-5 dark:border-rose-500/30 dark:bg-rose-950/25">
                  <div>
                    <span className="text-base sm:text-lg font-black tracking-tight text-rose-600 dark:text-rose-400">
                      {property.discountPercentage ||
                        Math.round(
                          ((property.originalPrice! - property.basePrice) /
                            property.originalPrice!) *
                            100
                        )}% OFF
                    </span>
                    <p className="mt-0.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {anchorLabel("Host offers a special discount for booking", "المضيف يقدم خصم خاص للحجز")}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-violet-100/70 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 shrink-0">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-violet-700 text-violet-700 dark:fill-violet-300 dark:text-violet-300" />
                  </div>
                </div>
              )}
            </section>

            <section className="border-b border-gray-100 py-8 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">{anchorLabel("Your host", "مضيفك")}</span>
                  <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">{anchorLabel("About the host", "عن المضيف")}</h2>
                </div>
                {property.host?.profileHref && <Link href={property.host.profileHref} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-xs font-bold text-violet-700 transition hover:bg-violet-50 dark:border-violet-400/20 dark:text-violet-300 dark:hover:bg-violet-400/10">{anchorLabel("View profile", "عرض الملف الشخصي")}<ChevronRight className="h-4 w-4 rtl:rotate-180" /></Link>}
              </div>
              {property.host ? (
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-gray-100 p-4 dark:border-white/10">
                  <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-700 font-bold text-white">{property.host.name.slice(0, 1).toUpperCase()}</span><span className="font-bold text-gray-900 dark:text-white">{property.host.name}</span></div>
                  {typeof property.host.reviewsCount === "number" && <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{property.host.reviewsCount} {anchorLabel("reviews", "تقييم")}</span>}
                  {typeof property.host.propertiesCount === "number" && <span className="text-sm text-gray-600 dark:text-gray-300">{anchorLabel(`Hosts ${property.host.propertiesCount} properties`, `يستضيف ${property.host.propertiesCount} عقارات`)}</span>}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-gray-100 p-4 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">{anchorLabel("Host profile details have not been added to this listing yet.", "لم تتم إضافة تفاصيل ملف المضيف إلى هذا العقار بعد.")}</p>
              )}
            </section>

            <div className="sticky top-[68px] z-20 mt-7 w-fit max-w-full overflow-x-auto rounded-full border border-gray-200 bg-white/95 p-1.5 backdrop-blur dark:border-white/10 dark:bg-[#08070D]/95" role="tablist" aria-label={anchorLabel("Property details", "تفاصيل العقار")}>
              {detailTabs.map((tab, index) => (
                <button
                  key={tab.id}
                  id={`property-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls="property-tab-panel"
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => selectTab(tab.id)}
                  onKeyDown={(event) => {
                    let nextIndex = index;
                    if (event.key === "ArrowRight") nextIndex = (index + 1) % detailTabs.length;
                    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + detailTabs.length) % detailTabs.length;
                    else if (event.key === "Home") nextIndex = 0;
                    else if (event.key === "End") nextIndex = detailTabs.length - 1;
                    else return;
                    event.preventDefault();
                    const nextTab = detailTabs[nextIndex];
                    selectTab(nextTab.id);
                    document.getElementById(`property-tab-${nextTab.id}`)?.focus();
                  }}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition ${activeTab === tab.id ? "bg-violet-800 text-white shadow-sm" : "text-gray-700 hover:bg-violet-50 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-violet-400/10 dark:hover:text-violet-300"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div id="property-tab-panel" role="tabpanel" tabIndex={0} aria-labelledby={`property-tab-${activeTab}`} className="outline-none">
            {activeTab === "specification" && (
              <section id="specification" className="scroll-mt-32 border-b border-gray-100 py-8 dark:border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                  {anchorLabel("Stay details", "تفاصيل الإقامة")}
                </span>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
                  {anchorLabel("Specification", "المواصفات")}
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{specs}</p>

                {property.isLicensed && property.tourismLicenseNumber && (
                  <div className="mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {anchorLabel("Tourism Ministry License Number", "رقم ترخيص وزارة السياحة")}:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">{property.tourismLicenseNumber}</span>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <Fact
                    icon={<Users className="h-4 w-4 text-violet-500" />}
                    label={anchorLabel("Capacity", "السعة الإجمالية")}
                    value={anchorLabel(`Up to ${capacity} guests`, `حتى ${capacity} ضيوف`)}
                  />
                  {bedrooms ? (
                    <Fact
                      icon={<BedDouble className="h-4 w-4 text-violet-500" />}
                      label={anchorLabel("Bedrooms", "غرف النوم")}
                      value={anchorLabel(`${bedrooms} Bedrooms`, `${bedrooms} غرف نوم`)}
                    />
                  ) : null}
                  <Fact
                    icon={<Bath className="h-4 w-4 text-violet-500" />}
                    label={anchorLabel("Bathrooms", "دورات المياه")}
                    value={anchorLabel(`${bathrooms} Baths`, `${bathrooms} دورات مياه`)}
                  />
                  <Fact
                    icon={<Sofa className="h-4 w-4 text-violet-500" />}
                    label={anchorLabel("Living spaces", "المجالس والصالات")}
                    value={
                      property.majlisDetails?.mainMajlisCapacity
                        ? anchorLabel(
                            `Majlis for ${property.majlisDetails.mainMajlisCapacity}`,
                            `مجلس يسع ${property.majlisDetails.mainMajlisCapacity}`
                          )
                        : anchorLabel(`${livingRooms} Living spaces`, `${livingRooms} مجالس`)
                    }
                  />
                  {property.areaSqm ? (
                    <Fact
                      icon={<Maximize2 className="h-4 w-4 text-violet-500" />}
                      label={anchorLabel("Area", "المساحة")}
                      value={`${property.areaSqm} ${anchorLabel("m²", "م²")}`}
                    />
                  ) : null}
                  <Fact
                    icon={<Users className="h-4 w-4 text-violet-500" />}
                    label={anchorLabel("Target audience", "الفئة المسموحة")}
                    value={chaletFor}
                  />
                </div>

                {/* Pool & Leisure Specs (Gathern Benchmark) */}
                {property.hasPool && (
                  <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 dark:border-cyan-900/30 dark:bg-cyan-950/20">
                    <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300 font-bold text-sm mb-2.5">
                      <Waves className="h-4 w-4" />
                      <span>{anchorLabel("Swimming Pool Specifications", "مواصفات المسبح")}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">{anchorLabel("Pool Type", "نوع المسبح")}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {property.poolDetails?.type === "indoor"
                            ? anchorLabel("Indoor Pool", "مسبح داخلي خاص")
                            : anchorLabel("Outdoor Pool", "مسبح خارجي خاص")}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">{anchorLabel("Safety Barrier", "حاجز الأمان")}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {property.poolDetails?.hasBarrier
                            ? anchorLabel("Child safety barrier present", "متوفر حاجز حماية للأطفال")
                            : anchorLabel("Open pool", "بدون حاجز")}
                        </span>
                      </div>
                      {property.poolDetails?.dimensions && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block">{anchorLabel("Dimensions", "أبعاد المسبح")}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{property.poolDetails.dimensions}</span>
                        </div>
                      )}
                      {property.poolDetails?.depth && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block">{anchorLabel("Depth", "عمق المسبح")}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{property.poolDetails.depth}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Majlis & Seating Specs (Gathern Benchmark) */}
                {property.majlisDetails && (
                  <div className="mt-3.5 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 dark:border-violet-900/30 dark:bg-violet-950/20">
                    <div className="flex items-center gap-2 text-violet-800 dark:text-violet-300 font-bold text-sm mb-2.5">
                      <Sofa className="h-4 w-4" />
                      <span>{anchorLabel("Living Rooms & Seating", "المجالس والجلسات")}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">{anchorLabel("Main Majlis", "المجلس الرئيسي")}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {anchorLabel(
                            `Seats up to ${property.majlisDetails.mainMajlisCapacity} persons`,
                            `يسع لـ ${property.majlisDetails.mainMajlisCapacity} شخص`
                          )}
                        </span>
                      </div>
                      {property.majlisDetails.outdoorSeatingCapacity && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block">{anchorLabel("Outdoor Seating", "الجلسة الخارجية")}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {anchorLabel(
                              `Seats up to ${property.majlisDetails.outdoorSeatingCapacity} persons`,
                              `تتسع لـ ${property.majlisDetails.outdoorSeatingCapacity} شخص`
                            )}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block">{anchorLabel("Access", "نوع الإقامة")}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{chaletFor}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {property.instantBook && <Badge icon={<Zap className="h-3.5 w-3.5" />} label={anchorLabel("Instant booking", "حجز فوري")} />}
                  {property.selfCheckin && <Badge icon={<KeyRound className="h-3.5 w-3.5" />} label={anchorLabel("Self check-in", "دخول ذاتي")} />}
                  {property.hasPool && <Badge icon={<Waves className="h-3.5 w-3.5" />} label={anchorLabel("Pool", "مسبح")} />}
                  {property.isLicensed && <Badge icon={<ShieldCheck className="h-3.5 w-3.5" />} label={anchorLabel("Licensed", "مرخص")} />}
                </div>

                {/* Categorized Amenities (Gathern Benchmark) */}
                <div className="mt-8 border-t border-gray-100 pt-6 dark:border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                    {anchorLabel("What's included", "المرافق المتاحة")}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">
                    {anchorLabel("Amenities & Facilities", "المرافق والمواصفات الكاملة")}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {anchorLabel("Comprehensive list of verified features and equipment available during your stay", "قائمة شاملة بكافة الخدمات والتجهيزات المتاحة لراحتك")}
                  </p>

                  {categorizedAmenities.length > 0 ? (
                    <div className="mt-6 space-y-6">
                      {categorizedAmenities.map((group) => (
                        <div
                          key={group.id}
                          className="rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-white/[0.02] p-4 sm:p-5"
                        >
                          <div className="flex items-center gap-2 mb-3.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                              <AmenityIcon name={group.iconName} className="h-4 w-4" />
                            </span>
                            <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                              {anchorLabel(group.titleEn, group.titleAr)}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {group.amenities.map((amenity) => (
                              <div
                                key={amenity.id}
                                className="flex items-center gap-2.5 rounded-xl border border-gray-200/70 dark:border-white/10 bg-white dark:bg-[#12101a] px-3.5 py-2.5 text-xs sm:text-[13px] text-gray-800 dark:text-gray-200 shadow-sm"
                              >
                                <span className="text-violet-600 dark:text-violet-400 shrink-0">
                                  <AmenityIcon name={amenity.iconName} className="h-4 w-4" />
                                </span>
                                <span className="font-medium">
                                  {anchorLabel(amenity.nameEn, amenity.nameAr)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : amenityGroups.length ? (
                    <div className="mt-6 space-y-4">
                      {amenityGroups.map((group) => (
                        <div key={group.name} className="grid gap-3 py-4 sm:grid-cols-[220px_minmax(0,1fr)]">
                          <h4 className="flex items-start gap-2 text-sm font-bold text-gray-900 dark:text-white">
                            <Home className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
                            {group.name}
                          </h4>
                          <ul className="grid gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                            {group.items.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <span className="text-violet-600 dark:text-violet-300">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      {anchorLabel("No amenity details have been added to this listing yet.", "لم تتم إضافة تفاصيل المرافق لهذا العقار بعد.")}
                    </p>
                  )}
                </div>
              </section>
            )}

            {activeTab === "reviews" && <GuestReviewsPanel property={property} />}

            {activeTab === "location" && <section id="location" className="scroll-mt-32 py-8">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">{anchorLabel("Explore the area", "اكتشف المنطقة")}</span>
                  <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">{anchorLabel("Location and map", "الموقع والخريطة")}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><MapPin className="h-3.5 w-3.5 text-violet-500" />{district}</p>
                </div>
                {!hasListedCoordinates && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">{anchorLabel("Approximate area", "موقع تقريبي")}</span>}
              </div>
              <InteractiveMapView
                properties={[property]}
                selectedPropertyId={property.id}
                onSelectProperty={() => undefined}
                onClose={() => router.push(returnHref)}
              />
              <p className="mt-2 text-[10px] text-gray-500 dark:text-gray-400">
                {anchorLabel("For privacy, map locations may be approximate. Exact access details are shared after booking confirmation.", "حفاظاً على الخصوصية، قد يكون موقع الخريطة تقريبياً. تتم مشاركة تفاصيل الوصول الدقيقة بعد تأكيد الحجز.")}
              </p>
            </section>}

            {activeTab === "terms" && <section id="terms" className="scroll-mt-32 border-t border-gray-100 py-8 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">{anchorLabel("Before you book", "قبل الحجز")}</span>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">{anchorLabel("Terms & policies", "الشروط والسياسات")}</h2>
              <div className="mt-5 divide-y divide-gray-100 dark:divide-white/10">
                <div className="py-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white"><Home className="h-4 w-4 text-violet-600 dark:text-violet-300" />{anchorLabel("Booking conditions (by the host)", "شروط الحجز (من المضيف)")}</h3>
                  {property.bookingConditions?.length ? <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-gray-600 dark:text-gray-300">{property.bookingConditions.map((condition) => <li key={condition}>{condition}</li>)}</ul> : <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{anchorLabel("No host-specific conditions have been added. Please confirm any special requirements before booking.", "لم تتم إضافة شروط خاصة من المضيف. يرجى تأكيد أي متطلبات خاصة قبل الحجز.")}</p>}
                </div>
                <div className="py-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white"><ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-300" />{anchorLabel("Cancellation and refund policy", "سياسة الإلغاء والاسترداد")}</h3>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{property.cancellationPolicy || anchorLabel("Cancellation and refund terms are shown during checkout before payment.", "تظهر شروط الإلغاء والاسترداد أثناء إتمام الحجز قبل الدفع.")}</p>
                </div>
              </div>
            </section>}
            </div>
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <ReservationPanel
              property={property}
              checkinDate={checkinDate}
              checkinTime={checkinTime}
              checkoutDate={checkoutDate}
              checkoutTime={checkoutTime}
              guestsCount={selectedGuestsCount}
              nights={nights}
              onCheckinChange={handleCheckinChange}
              onCheckinTimeChange={setCheckinTime}
              onCheckoutChange={setCheckoutDate}
              onCheckoutTimeChange={setCheckoutTime}
              onGuestsChange={setGuestsCount}
              onReserve={handleReserve}
            />
            <p className="mt-3 text-center text-[10px] text-gray-500 dark:text-gray-400">{anchorLabel("Booking dates and guest count follow your search.", "تتوافق تواريخ الحجز وعدد الضيوف مع بحثك.")}</p>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-lg dark:border-white/10 dark:bg-[#0b0912]/95 lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <div>
            <span className="block text-[10px] text-gray-500 dark:text-gray-400">{nights} {anchorLabel(nights === 1 ? "night" : "nights", "ليلة")}</span>
            <div className="flex items-baseline gap-1.5">
              {hasDiscount && (
                <span className="text-xs text-rose-500 line-through font-bold">
                  {formatPrice((property.originalPrice || property.basePrice) * nights)}
                </span>
              )}
              <span className="font-extrabold text-base sm:text-lg text-gray-950 dark:text-white">
                {formatPrice(estimatedTotal)}
              </span>
            </div>
          </div>
          <button type="button" onClick={handleReserve} className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-violet-800">{anchorLabel("Continue", "متابعة")}</button>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-[#08070D]/95 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={anchorLabel("Photo gallery", "معرض الصور")}>
          <div className="flex items-center justify-between text-white">
            <span className="text-sm font-semibold">{lightboxIndex + 1} / {images.length}</span>
            <button type="button" onClick={() => setLightboxIndex(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={anchorLabel("Close photo gallery", "إغلاق معرض الصور")}><X className="h-5 w-5" /></button>
          </div>
          <div className="relative my-4 min-h-0 flex-1">
            <Image src={images[lightboxIndex]} alt={`${title} ${lightboxIndex + 1}`} fill sizes="100vw" className="object-contain" priority />
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75" aria-label={anchorLabel("Previous photo", "الصورة السابقة")}><ChevronLeft className="h-5 w-5" /></button>
                <button type="button" onClick={() => setLightboxIndex((lightboxIndex + 1) % images.length)} className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75" aria-label={anchorLabel("Next photo", "الصورة التالية")}><ChevronRight className="h-5 w-5" /></button>
              </>
            )}
          </div>
          <div className="flex justify-center gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button key={`${image}-thumb-${index}`} type="button" onClick={() => setLightboxIndex(index)} className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${index === lightboxIndex ? "border-violet-400" : "border-transparent opacity-60"}`} aria-label={`${anchorLabel("Show photo", "عرض الصورة")} ${index + 1}`}>
                <Image src={image} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {videoIndex !== null && property.videos?.[videoIndex] && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#08070D]/95 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={anchorLabel("Property videos", "فيديوهات العقار")}>
          <div className="mb-3 flex w-full max-w-5xl items-center justify-between text-white">
            <span className="text-sm font-semibold">{videoIndex + 1} / {property.videos.length}</span>
            <button type="button" onClick={() => setVideoIndex(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={anchorLabel("Close video", "إغلاق الفيديو")}><X className="h-5 w-5" /></button>
          </div>
          <video key={property.videos[videoIndex]} src={property.videos[videoIndex]} controls autoPlay playsInline className="max-h-[78vh] w-full max-w-5xl rounded-2xl bg-black" />
          {property.videos.length > 1 && <div className="mt-4 flex gap-3"><button type="button" onClick={() => setVideoIndex((videoIndex - 1 + property.videos!.length) % property.videos!.length)} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">{anchorLabel("Previous", "السابق")}</button><button type="button" onClick={() => setVideoIndex((videoIndex + 1) % property.videos!.length)} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">{anchorLabel("Next", "التالي")}</button></div>}
        </div>
      )}

      <Footer />
      <AuthModal />
      <AppModal />
      <SearchModal />
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3.5 dark:border-white/10 dark:bg-[#12101a]">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">{icon}</span>
      <span className="mt-3 block text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
      <span className="mt-0.5 block truncate text-sm font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50/70 px-3 py-1.5 text-[11px] font-semibold text-violet-800 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">{icon}{label}</span>;
}
