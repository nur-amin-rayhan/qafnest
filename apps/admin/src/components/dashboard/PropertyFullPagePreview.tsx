"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, X } from "lucide-react";
import { getLocalizedSaudiCity, getNumericUnitCode, pickBilingualText } from "@qafnest/shared";
import { PropertyItem } from "./types";
import { groupAmenities } from "@/lib/amenities";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { PreviewTopBar } from "./preview/PreviewTopBar";
import { PreviewHeader } from "./preview/PreviewHeader";
import { PreviewTitleBar } from "./preview/PreviewTitleBar";
import { PreviewGallery } from "./preview/PreviewGallery";
import { PreviewGuaranteeAccordion } from "./preview/PreviewGuaranteeAccordion";
import { PreviewHostCard } from "./preview/PreviewHostCard";
import { PreviewContentTabs } from "./preview/PreviewContentTabs";
import { PreviewPricingSidebar } from "./preview/PreviewPricingSidebar";

import { adminPath } from "@/lib/adminUrl";
interface PropertyFullPagePreviewProps {
  property: PropertyItem | null;
  isOpen?: boolean;
  onClose: () => void;
  onApprove?: (id: string) => Promise<void> | void;
  onRequestRevisions?: (property: PropertyItem) => void;
  isStandalonePage?: boolean;
}

type TabType = "specification" | "reviews" | "location" | "terms";

export function PropertyFullPagePreview({
  property,
  isOpen = true,
  onClose,
  onApprove,
  onRequestRevisions,
  isStandalonePage: _isStandalonePage = false,
}: PropertyFullPagePreviewProps) {
  const { lang: adminLang, dir: adminDir } = useAdminAuth();
  const [lang, setLang] = useState<"ar" | "en">(adminLang || "ar");

  useEffect(() => {
    if (adminLang) setLang(adminLang);
  }, [adminLang]);
  const [activeTab, setActiveTab] = useState<TabType>("specification");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Reservation simulation state
  const [nights, setNights] = useState(2);
  const [guestsCount, setGuestsCount] = useState(1);
  const [feeRule, setFeeRule] = useState<{
    feeMode: "percentage" | "fixed_amount";
    serviceFeePercent: number;
    fixedFeeAmountSar: number;
    vatRatePercent: number;
  }>({
    feeMode: "percentage",
    serviceFeePercent: 13,
    fixedFeeAmountSar: 0,
    vatRatePercent: 15,
  });

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch(adminPath(`/api/admin/financials/fees?t=${Date.now()}`), { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.config) return;
        setFeeRule({
          feeMode: data.config.guestFeeMode === "fixed_amount" ? "fixed_amount" : "percentage",
          serviceFeePercent: Number(data.config.guestServiceFeePercent ?? 13),
          fixedFeeAmountSar: Number(data.config.guestFixedFeeAmountSar ?? 0),
          vatRatePercent: Number(data.config.vatRatePercent ?? 15),
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Images setup
  const images = (property?.images && property.images.length > 0 ? property.images : []).filter(Boolean);

  // Preserve admin system language and direction on exit
  const handleExitPreview = useCallback(() => {
    try {
      if (typeof document !== "undefined") {
        document.documentElement.lang = adminLang;
        document.documentElement.dir = adminDir;
      }
    } catch {}
    onClose();
  }, [adminLang, adminDir, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleExitPreview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      try {
        if (typeof document !== "undefined") {
          document.documentElement.lang = adminLang;
          document.documentElement.dir = adminDir;
        }
      } catch {}
    };
  }, [adminLang, adminDir, handleExitPreview]);

  if (!isOpen || !property) return null;

  const isApproved = property.status === "approved" || property.is_approved;
  const isUnpublished = !isApproved;

  // Bilingual helper
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  // Title & Categorization
  const title = pickBilingualText(lang, property.title, property.title_ar, lang === "ar" ? "عقار" : "Property");
  const categoryName = property.category_name || property.category || "—";
  const cityName =
    property.city || property.city_name
      ? getLocalizedSaudiCity(property.city || property.city_name, lang)
      : "—";
  const district = pickBilingualText(lang, property.district, property.district_ar, cityName);
  const basePrice = Number(property.base_price ?? 0);
  const originalPrice = basePrice;
  const hasDiscount = false;
  const discountPercent = 0;

  // Capacity & Specs
  const areaSqm = property.area_sqm || 0;
  const bedrooms = property.bedrooms_count || 0;
  const bathrooms = property.bathrooms_count || bedrooms;
  const livingRooms = property.living_rooms_count || 0;
  const capacity = areaSqm ? Math.max(2, Math.round(areaSqm / 30)) : Math.max(1, bedrooms * 2);
  const numericUnit = getNumericUnitCode(property.id);
  const unitReference = property.tourism_license_number
    ? `${numericUnit} · LIC-${property.tourism_license_number}`
    : numericUnit;

  // Amenities
  const hasPool = Boolean(property.features?.some((f) => f.toLowerCase().includes("pool") || f.toLowerCase().includes("مسبح")));
  const categorizedAmenities = groupAmenities(property.features || [], hasPool);

  // Financial calculations synchronized with dynamic platform fee rules
  const subtotal = Math.round(basePrice * nights * 100) / 100;
  const serviceFee =
    feeRule.feeMode === "fixed_amount"
      ? Math.round(Math.max(0, feeRule.fixedFeeAmountSar) * 100) / 100
      : Math.round(subtotal * (feeRule.serviceFeePercent / 100) * 100) / 100;
  const vat = Math.round((subtotal + serviceFee) * (feeRule.vatRatePercent / 100) * 100) / 100;
  const estimatedTotal = Math.round((subtotal + serviceFee + vat) * 100) / 100;
  const splitInstallment = (estimatedTotal / 4).toFixed(2);

  return (
    <div
      className={`fixed inset-y-0 end-0 start-0 lg:start-64 xl:start-72 z-[45] overflow-y-auto bg-white text-gray-900 dark:bg-[#08070D] dark:text-gray-100 ${
        lang === "ar" ? "rtl" : "ltr"
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
      role="dialog"
      aria-modal="true"
    >
      {/* 1. Admin Moderation Top Bar */}
      <PreviewTopBar
        lang={lang}
        setLang={setLang}
        property={property}
        isApproved={Boolean(isApproved)}
        isUnpublished={isUnpublished}
        onApprove={onApprove}
        onRequestRevisions={onRequestRevisions}
        handleExitPreview={handleExitPreview}
        t={t}
      />

      {/* 2. Guest Portal Navbar Simulation */}
      <PreviewHeader cityName={cityName} capacity={capacity} t={t} />

      {/* 3. Main Guest Portal Canvas */}
      <main className="mx-auto max-w-[1360px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        {/* Title, Badges, Breadcrumbs & Save/Share */}
        <PreviewTitleBar
          property={property}
          title={title}
          categoryName={categoryName}
          cityName={cityName}
          district={district}
          unitReference={unitReference}
          capacity={capacity}
          areaSqm={areaSqm}
          isUnpublished={isUnpublished}
          lang={lang}
          t={t}
        />

        {/* 4. Full Hero Photo Gallery & Lightbox */}
        <PreviewGallery
          images={images}
          title={title}
          lightboxIndex={lightboxIndex}
          setLightboxIndex={setLightboxIndex}
          t={t}
        />

        {/* 5. Two-Column Layout */}
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
          {/* Left Column: Details & Tabs */}
          <div className="min-w-0">
            {/* QafNest Guarantee Accordion */}
            <PreviewGuaranteeAccordion
              tourismLicenseNumber={property.tourism_license_number}
              t={t}
            />

            {/* Description */}
            <section className="border-b border-violet-100/80 py-8 dark:border-violet-500/15">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
                {t("الوصف", "Description")}
              </h2>
              <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-gray-600 dark:text-gray-300">
                {lang === "ar"
                  ? property.description_ar || property.description || "لا يوجد وصف مضاف بعد."
                  : property.description || property.description_ar || "No description provided yet."}
              </p>

              {hasDiscount && (
                <div className="mt-6 flex items-center justify-between rounded-3xl border border-rose-200/90 bg-[#FDF2F2] p-5 dark:border-rose-500/30 dark:bg-rose-950/25 shadow-xs">
                  <div>
                    <span className="text-base sm:text-lg font-black tracking-tight text-rose-600 dark:text-rose-400">
                      {discountPercent}% OFF
                    </span>
                    <p className="mt-0.5 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {t("المضيف يقدم خصماً خاصاً للحجوزات المبكرة", "Host offers a special discount for early booking")}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100/80 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 shrink-0">
                    <Star className="h-5 w-5 fill-violet-700 text-violet-700 dark:fill-violet-300 dark:text-violet-300" />
                  </div>
                </div>
              )}
            </section>

            {/* Host Section */}
            <PreviewHostCard
              hostId={property.host_id}
              hostName={property.host_name}
              tourismLicenseNumber={property.tourism_license_number}
              t={t}
            />

            {/* Content Tabs (Specs, Amenities, Reviews, Location, Terms) */}
            <PreviewContentTabs
              property={property}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              lang={lang}
              t={t}
              categoryName={categoryName}
              cityName={cityName}
              district={district}
              capacity={capacity}
              bedrooms={bedrooms}
              bathrooms={bathrooms}
              livingRooms={livingRooms}
              areaSqm={areaSqm}
              hasPool={hasPool}
              categorizedAmenities={categorizedAmenities}
            />
          </div>

          {/* Right Column: Pricing Simulator Sidebar */}
          <PreviewPricingSidebar
            isUnpublished={isUnpublished}
            basePrice={basePrice}
            originalPrice={originalPrice}
            hasDiscount={hasDiscount}
            discountPercent={discountPercent}
            nights={nights}
            setNights={setNights}
            guestsCount={guestsCount}
            setGuestsCount={setGuestsCount}
            capacity={capacity}
            splitInstallment={splitInstallment}
            subtotal={subtotal}
            serviceFee={serviceFee}
            vat={vat}
            estimatedTotal={estimatedTotal}
            t={t}
          />
        </div>
      </main>

      {/* 6. Footer Simulation */}
      <footer className="mt-20 border-t border-gray-100 bg-surface-container-low py-10 dark:border-white/10 dark:bg-[#06060B]">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-white/10 dark:bg-[#12101a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-display font-black text-on-surface text-lg">
                Qaf<span className="text-[#7c3aed]">Nest</span><span className="text-[#FF9750]">.</span>
              </span>
              <p className="text-xs text-outline">
                {t("مرخصة من وزارة السياحة · ترخيص رقم: 73102999", "Licensed by the Ministry of Tourism · License Number: 73102999")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-on-surface-variant">
              <a href="tel:+966576707709" className="text-primary hover:underline">
                {t("الدعم: 0576707709", "Support: 0576707709")}
              </a>
              <span>•</span>
              <span>© {new Date().getFullYear()} QafNest</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 7. Floating Quick Close Button */}
      <button
        type="button"
        onClick={handleExitPreview}
        className="fixed bottom-6 end-6 z-40 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-[#0E0E1A]/95 hover:bg-rose-600 text-white px-4 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-black/50"
        aria-label={t("إغلاق المعاينة والعودة إلى لوحة الإدارة", "Close preview and return to admin operations")}
        title={t("إغلاق المعاينة (Esc)", "Close preview (Esc)")}
      >
        <X className="h-4 w-4 shrink-0" />
        <span>{t("إغلاق المعاينة", "Close Preview")}</span>
      </button>
    </div>
  );
}
