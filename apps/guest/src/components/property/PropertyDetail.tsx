"use client";

import React, { useMemo } from "react";
import { groupAmenitiesByCategory } from "@/lib/amenities";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import AuthModal from "@/components/modals/AuthModal";
import AppModal from "@/components/modals/AppModal";
import SearchModal from "@/components/modals/SearchModal";
import {
  getPropertyCapacity,
  normalizeCityId,
  Property,
} from "@/data/properties";
import {
  PROPERTY_SPECS_AR,
} from "@/data/translations";
import {
  getLocalizedPropertyLocation,
  getLocalizedPropertyTitle,
  getLocalizedCategoryName,
  formatLocalizedPropertySpecs,
  type Locale,
} from "@/lib/localization/localeHelper";
import { useApp } from "@/context/AppContext";

import ReservationPanel from "./detail/ReservationPanel";
import PropertyGallery from "./detail/PropertyGallery";
import PropertyLightbox from "./detail/PropertyLightbox";
import PropertyHostCard from "./detail/PropertyHostCard";
import PropertyGuaranteeSection from "./detail/PropertyGuaranteeSection";
import { PropertyHeaderSection } from "./detail/PropertyHeaderSection";
import { PropertyDescriptionSection } from "./detail/PropertyDescriptionSection";
import { PropertyMobileFooter } from "./detail/PropertyMobileFooter";
import {
  PropertyTabsContainer,
  type PropertyDetailTab,
} from "./detail/PropertyTabsContainer";
import { usePropertyDetailState } from "./detail/usePropertyDetailState";
import {
  getBedrooms,
  getListingReference,
  buildAmenityGroups,
} from "./detail/propertyDetailHelpers";

interface PropertyDetailProps {
  property: Property;
}

export default function PropertyDetail({ property }: PropertyDetailProps) {
  const { language, formatPrice, wishlist, toggleWishlist } = useApp();

  const isWishlisted = wishlist.includes(property.id);
  const images = useMemo(() => {
    const valid = (property.images || []).filter(
      (img): img is string => typeof img === "string" && img.trim().length > 0
    );
    if (valid.length > 0) return valid;
    if (property.image && property.image.trim().length > 0) return [property.image];
    return ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&fit=crop"];
  }, [property.image, property.images]);

  const locale: Locale = language === "ar" ? "ar" : "en";
  const title = getLocalizedPropertyTitle(property, locale);
  const categoryName = getLocalizedCategoryName(property.category, locale);
  const { city: cityName, district } = getLocalizedPropertyLocation(property, locale);
  const specs =
    language === "ar"
      ? PROPERTY_SPECS_AR[property.specs] || formatLocalizedPropertySpecs(property, locale)
      : formatLocalizedPropertySpecs(property, locale);
  const capacity = getPropertyCapacity(property);
  const bedrooms = getBedrooms(property);
  const bathrooms =
    property.bathroomsCount ?? (bedrooms !== null && bedrooms > 0 ? bedrooms : 1);
  const livingRooms = property.livingRoomsCount ?? 0;
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
  const hasListedCoordinates =
    Number.isFinite(property.lat) && Number.isFinite(property.lng);
  const anchorLabel = (en: string, ar: string) => (language === "ar" ? ar : en);

  const detailTabs: Array<{ id: PropertyDetailTab; label: string }> = [
    { id: "specification", label: anchorLabel("Specification", "المواصفات") },
    { id: "reviews", label: anchorLabel("Guest reviews", "تقييمات الضيوف") },
    { id: "location", label: anchorLabel("Location & map", "الموقع والخريطة") },
    { id: "terms", label: anchorLabel("Terms & policies", "الشروط والسياسات") },
  ];

  const unitReference =
    property.unitCode && /^\d+$/.test(property.unitCode)
      ? property.unitCode
      : getListingReference(property.id);
  const amenityGroups = buildAmenityGroups(property, anchorLabel);

  const returnHref = `/search?city=${encodeURIComponent(normalizeCityId(property.city))}`;

  const {
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
  } = usePropertyDetailState({
    property,
    title,
    capacity,
  });

  return (
    <div className="min-h-screen bg-white pb-24 text-gray-900 dark:bg-[#08070D] dark:text-gray-100 lg:pb-0">
      <Navbar />
      <main className="mx-auto max-w-[1360px] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        {/* Header Breadcrumb, Title & Badges */}
        <PropertyHeaderSection
          property={property}
          title={title}
          cityName={cityName}
          district={district}
          categoryName={categoryName}
          capacity={capacity}
          returnHref={returnHref}
          unitReference={unitReference}
          reviewStats={reviewStats}
          shareNotice={shareNotice}
          isWishlisted={isWishlisted}
          language={language}
          onShare={handleShare}
          onToggleWishlist={() => toggleWishlist(property.id)}
          anchorLabel={anchorLabel}
        />

        {/* FULL-WIDTH HERO PHOTO GALLERY */}
        <PropertyGallery
          images={images}
          title={title}
          videos={property.videos}
          onOpenLightbox={setLightboxIndex}
          onOpenVideo={setVideoIndex}
          anchorLabel={anchorLabel}
        />

        {/* Mobile Reservation Panel */}
        <section className="mt-6 lg:hidden">
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

        {/* 2-COLUMN CONTENT + STICKY RESERVATION PANEL */}
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_435px]">
          <div className="min-w-0">
            {/* Guarantee / Guest Support */}
            <PropertyGuaranteeSection
              property={property}
              anchorLabel={anchorLabel}
            />

            {/* Description & Special Discount Highlight */}
            <PropertyDescriptionSection
              property={property}
              title={title}
              district={district}
              categoryName={categoryName}
              capacity={capacity}
              specs={specs}
              hasDiscount={hasDiscount}
              anchorLabel={anchorLabel}
            />

            {/* Host Section */}
            <PropertyHostCard property={property} anchorLabel={anchorLabel} />

            {/* Tabs Container */}
            <PropertyTabsContainer
              property={property}
              activeTab={activeTab}
              selectTab={selectTab}
              detailTabs={detailTabs}
              specs={specs}
              capacity={capacity}
              bedrooms={bedrooms}
              bathrooms={bathrooms}
              livingRooms={livingRooms}
              chaletFor={chaletFor}
              categorizedAmenities={categorizedAmenities}
              amenityGroups={amenityGroups}
              district={district}
              hasListedCoordinates={hasListedCoordinates}
              returnHref={returnHref}
              anchorLabel={anchorLabel}
            />
          </div>

          {/* Desktop Sticky Reservation Panel */}
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
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Fixed Action Bar */}
      <PropertyMobileFooter
        property={property}
        nights={nights}
        hasDiscount={hasDiscount}
        estimatedTotal={estimatedTotal}
        formatPrice={formatPrice}
        onReserve={handleReserve}
        anchorLabel={anchorLabel}
      />

      {/* Lightbox & Video Player Modals */}
      <PropertyLightbox
        lightboxIndex={lightboxIndex}
        setLightboxIndex={setLightboxIndex}
        videoIndex={videoIndex}
        setVideoIndex={setVideoIndex}
        images={images}
        videos={property.videos}
        title={title}
        anchorLabel={anchorLabel}
      />

      <Footer />
      <AuthModal />
      <AppModal />
      <SearchModal />
    </div>
  );
}
