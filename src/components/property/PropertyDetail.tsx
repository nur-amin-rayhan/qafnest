"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
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
} from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import AuthModal from "@/components/modals/AuthModal";
import HostModal from "@/components/modals/HostModal";
import AppModal from "@/components/modals/AppModal";
import SearchModal from "@/components/modals/SearchModal";
import InteractiveMapView from "@/components/search/InteractiveMapView";
import { getPropertyCapacity, getStayTotal, normalizeCityId, Property } from "@/data/properties";
import {
  CATEGORY_NAMES_AR,
  CITY_NAMES_AR,
  PROPERTY_SPECS_AR,
  PROPERTY_TITLES_AR,
} from "@/data/translations";
import { useApp } from "@/context/AppContext";
import { propertyReservationHref } from "@/lib/propertyUrls";

interface PropertyDetailProps {
  property: Property;
}

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

function getFeaturePresentation(feature: string) {
  const firstToken = feature.split(" ")[0] || "";
  const hasEmojiPrefix = firstToken.charCodeAt(0) >= 0xd800;
  return {
    icon: hasEmojiPrefix ? firstToken : "✓",
    label: hasEmojiPrefix ? feature.slice(firstToken.length).trim() : feature,
  };
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
  const estimatedTotal = getStayTotal(property, checkinDate, nights);

  return (
    <section className="rounded-3xl border border-violet-200 bg-white p-5 shadow-[0_18px_55px_rgba(70,35,130,0.12)] dark:border-violet-400/20 dark:bg-[#12101a] dark:shadow-[0_18px_55px_rgba(0,0,0,0.34)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {language === "ar" ? "السعر يبدأ من" : "Starting at"}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
              {formatPrice(property.basePrice)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {language === "ar" ? "/ ليلة" : "/ night"}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through dark:text-gray-500">
                {formatPrice(property.originalPrice || 0)}
              </span>
            )}
          </div>
        </div>
        {property.discountPercentage ? (
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
            {property.discountPercentage}% OFF
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
            min={checkinDate || undefined}
            onChange={(event) => onCheckoutChange(event.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-gray-900 outline-none dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
            aria-label={language === "ar" ? "تاريخ تسجيل المغادرة" : "Check-out date"}
          />
        </label>
      </div>

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
            onClick={() => onGuestsChange(Math.min(20, guestsCount + 1))}
            disabled={guestsCount >= 20}
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
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-800 active:scale-[0.99]"
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
  const {
    language,
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
  const [shareNotice, setShareNotice] = useState(false);
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
  const bedrooms = getBedrooms(property);
  const returnHref = searchParamString
    ? `/search?${searchParamString}`
    : `/search?city=${encodeURIComponent(normalizeCityId(property.city))}`;
  const hasListedCoordinates = Number.isFinite(property.lat) && Number.isFinite(property.lng);

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
    if (Number.isInteger(guests) && guests > 0) setGuestsCount(guests);
  }, [
    searchParamString,
    property,
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
    if (checkoutDate && value && checkoutDate <= value) setCheckoutDate("");
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
    reservationParams.set("guests", String(guestsCount));
    router.push(propertyReservationHref(property.id, reservationParams));
  };
  const anchorLabel = (en: string, ar: string) => language === "ar" ? ar : en;

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
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {property.rating.toFixed(1)}
                <span className="font-normal text-gray-500 dark:text-gray-400">({property.reviewsCount} {anchorLabel("reviews", "تقييم")})</span>
              </span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-violet-500" />{district}</span>
              <span>{specs}</span>
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
            </section>

            <section className="mt-5 lg:hidden">
              <ReservationPanel
                property={property}
                checkinDate={checkinDate}
                checkinTime={checkinTime}
                checkoutDate={checkoutDate}
                checkoutTime={checkoutTime}
                guestsCount={guestsCount}
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

            <nav className="sticky top-[68px] z-20 mt-7 flex gap-2 overflow-x-auto border-b border-gray-200 bg-white/95 py-2 backdrop-blur dark:border-white/10 dark:bg-[#08070D]/95" aria-label={anchorLabel("Property sections", "أقسام صفحة العقار")}>
              {[
                ["overview", anchorLabel("Overview", "نظرة عامة")],
                ["amenities", anchorLabel("Amenities", "المرافق")],
                ["reviews", anchorLabel("Reviews", "التقييمات")],
                ["location", anchorLabel("Location", "الموقع")],
              ].map(([id, label]) => (
                <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold text-gray-600 transition hover:bg-violet-50 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-violet-400/10 dark:hover:text-violet-300">{label}</a>
              ))}
            </nav>

            <section id="overview" className="scroll-mt-32 border-b border-gray-100 py-8 dark:border-white/10">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><Home className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-950 dark:text-white">{anchorLabel(`About this ${categoryName.toLowerCase()}`, `عن ${categoryName}`)}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600 dark:text-gray-300">
                    {property.description || anchorLabel(
                      `${title} is listed in ${district}. This ${categoryName.toLowerCase()} is set up for up to ${capacity} guests${bedrooms ? ` with ${bedrooms} ${bedrooms === 1 ? "bedroom" : "bedrooms"}` : ""}. Review the available features and stay details below before booking.`,
                      `${title} في ${district}. يستوعب هذا المكان حتى ${capacity} ضيوف${bedrooms ? ` ويضم ${bedrooms} غرف نوم` : ""}. راجع المرافق وتفاصيل الإقامة أدناه قبل الحجز.`
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Fact icon={<Users className="h-4 w-4" />} label={anchorLabel("Guests", "الضيوف")} value={`${capacity}`} />
                {bedrooms && <Fact icon={<BedDouble className="h-4 w-4" />} label={anchorLabel("Bedrooms", "غرف النوم")} value={`${bedrooms}`} />}
                {property.areaSqm && <Fact icon={<Maximize2 className="h-4 w-4" />} label={anchorLabel("Area", "المساحة")} value={`${property.areaSqm} m²`} />}
                <Fact icon={<MapPin className="h-4 w-4" />} label={anchorLabel("Destination", "الوجهة")} value={cityName} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {property.instantBook && <Badge icon={<Zap className="h-3.5 w-3.5" />} label={anchorLabel("Instant booking", "حجز فوري")} />}
                {property.selfCheckin && <Badge icon={<KeyRound className="h-3.5 w-3.5" />} label={anchorLabel("Self check-in", "دخول ذاتي")} />}
                {property.hasPool && <Badge icon={<Waves className="h-3.5 w-3.5" />} label={anchorLabel("Pool", "مسبح")} />}
                {property.isLicensed && <Badge icon={<ShieldCheck className="h-3.5 w-3.5" />} label={anchorLabel("Licensed", "مرخص")} />}
              </div>
            </section>

            <section id="amenities" className="scroll-mt-32 border-b border-gray-100 py-8 dark:border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">{anchorLabel("What's included", "المرافق المتاحة")}</span>
                <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white">{anchorLabel("Amenities and features", "المرافق والميزات")}</h2>
              </div>
              {property.features.length > 0 ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {property.features.map((feature) => {
                    const { icon, label } = getFeaturePresentation(feature);
                    return (
                      <div key={feature} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-base shadow-sm dark:bg-white/5">{icon}</span>
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{anchorLabel("No amenity details have been added to this listing yet.", "لم تتم إضافة تفاصيل المرافق لهذا العقار بعد.")}</p>
              )}
            </section>

            <section id="reviews" className="scroll-mt-32 border-b border-gray-100 py-8 dark:border-white/10">
              <div className="flex flex-col gap-5 rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50/70 p-5 dark:from-violet-400/10 dark:to-fuchsia-400/5 sm:flex-row sm:items-center sm:p-6">
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-[#171421]">
                  <Star className="mb-1 h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-xl font-extrabold text-gray-950 dark:text-white">{property.rating.toFixed(1)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-950 dark:text-white">{anchorLabel("Guest reviews", "تقييمات الضيوف")}</h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{property.reviewsCount} {anchorLabel("guest reviews for this stay", "تقييم لهذا المكان")}</p>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{anchorLabel("This demo listing includes an overall rating and review count. Individual review comments are not available in the current property data.", "تتضمن بيانات هذا العقار التقييم الإجمالي وعدد التقييمات فقط، ولا تتوفر تعليقات التقييمات الفردية حالياً.")}</p>
                </div>
              </div>
            </section>

            <section id="location" className="scroll-mt-32 py-8">
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
                {anchorLabel("Map locations without listing coordinates are shown as an approximate district or city area.", "تُعرض المواقع التي لا تحتوي على إحداثيات دقيقة كتقدير للحي أو المدينة.")}
              </p>
            </section>
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <ReservationPanel
              property={property}
              checkinDate={checkinDate}
              checkinTime={checkinTime}
              checkoutDate={checkoutDate}
              checkoutTime={checkoutTime}
              guestsCount={guestsCount}
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
            <span className="font-extrabold text-gray-950 dark:text-white">{new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", { maximumFractionDigits: 2 }).format(estimatedTotal)} {language === "ar" ? "ر.س" : "SAR"}</span>
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

      <Footer />
      <AuthModal />
      <HostModal />
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
