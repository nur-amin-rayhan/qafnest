"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Users,
  ArrowRight,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import type { Property } from "@/data/properties";
import PricingBreakdownModule from "@/components/property/PricingBreakdownModule";
import { useAuth } from "@/context/AuthContext";
import { dispatchOpenIdentityModal } from "@/components/modals/GuestIdentityGateModal";
import type { PricingBreakdown } from "@/lib/services/pricing";
import type { PaymentMethod } from "./types";

interface ReservationSidebarProps {
  property: Property;
  title: string;
  location: string;
  images: string[];
  activeImageIndex: number;
  setActiveImageIndex: React.Dispatch<React.SetStateAction<number>>;
  nights: number;
  bookingCheckinDate: string;
  bookingCheckoutDate: string;
  bookingCheckinTime: string;
  bookingCheckoutTime: string;
  bookingGuestsCount: number;
  editStayHref: string;
  baseStayRate: number;
  setPricing: (pricing: PricingBreakdown) => void;
  hasDiscount: boolean;
  isTwelveHourStay?: boolean;
  formatPrice: (amount: number) => string;
  language: string;
  label: (en: string, ar: string) => string;
  handlePay: () => void;
  isPayDisabled: boolean;
  paymentBusy: boolean;
  phoneVerified: boolean;
  paymentMethod: PaymentMethod | null;
  walletSplitActive?: boolean;
  walletBalance?: number;
  remainingAmount?: number;
  user: unknown;
  paymentMessage: string | null;
  identityVerified?: boolean;
}

export default function ReservationSidebar({
  property,
  title,
  location,
  images,
  activeImageIndex,
  setActiveImageIndex,
  nights,
  bookingCheckinDate,
  bookingCheckoutDate,
  bookingCheckinTime,
  bookingCheckoutTime,
  bookingGuestsCount,
  editStayHref,
  baseStayRate,
  setPricing,
  hasDiscount,
  isTwelveHourStay = false,
  formatPrice,
  language,
  label,
  handlePay,
  isPayDisabled,
  paymentBusy,
  phoneVerified,
  paymentMethod,
  walletSplitActive = false,
  walletBalance = 0,
  remainingAmount,
  user,
  paymentMessage,
  identityVerified: propIdentityVerified,
}: ReservationSidebarProps) {
  const { profile, user: authUser } = useAuth();
  
  // Saudi Government ID Verification Gate Toggle (Nafath / Elm Yaqeen)
  // Kept inactive while government provider (Nafath / Elm Yaqeen) API credentials are pending.
  // When active (true), requires verified National ID / Iqama via Nafath/Yaqeen before payment.
  // When inactive (false), phone verification is sufficient to proceed to payment.
  const REQUIRE_GOVERNMENT_ID_VERIFICATION = false;

  const identityVerified = REQUIRE_GOVERNMENT_ID_VERIFICATION
    ? (propIdentityVerified ?? Boolean(profile?.is_verified || authUser?.app_metadata?.is_verified))
    : true;
  const searchParams = useSearchParams();
  const initialCoupon = searchParams?.get("coupon") || null;
  const nightlyDisplayRate = Math.round((baseStayRate / Math.max(1, nights)) * 100) / 100;
  const previousImage = () =>
    setActiveImageIndex((index) => (index - 1 + images.length) % images.length);
  const nextImage = () =>
    setActiveImageIndex((index) => (index + 1) % images.length);

  return (
    <aside className="min-w-0 lg:sticky lg:top-24">
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg dark:border-slate-800 dark:bg-[#110F18]">
        <div className="relative h-52 bg-gray-100">
          <Image
            src={images[activeImageIndex]}
            alt={`${title} ${activeImageIndex + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 400px"
            className="object-cover transition duration-300"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-12 text-white">
            <h2 className="line-clamp-1 font-bold">{title}</h2>
            <p className="mt-1 text-xs text-white/80">{location}</p>
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={previousImage}
                aria-label={label("Previous property photo", "الصورة السابقة للعقار")}
                className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur transition hover:bg-black/65 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                aria-label={label("Next property photo", "الصورة التالية للعقار")}
                className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur transition hover:bg-black/65 cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span
                className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur"
                aria-live="polite"
              >
                {activeImageIndex + 1} / {images.length}
              </span>
              <div
                className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5"
                role="group"
                aria-label={label("Property photos", "صور العقار")}
              >
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`${label("Show photo", "عرض الصورة")} ${index + 1}`}
                    aria-pressed={index === activeImageIndex}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      index === activeImageIndex
                        ? "w-5 bg-white"
                        : "w-1.5 bg-white/60 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4 dark:border-white/10">
            <div>
              {hasDiscount && !isTwelveHourStay && (
                <div className="text-xs sm:text-sm font-bold text-rose-500 dark:text-rose-400 line-through tracking-tight">
                  {formatPrice(property.originalPrice || 0)}
                </div>
              )}
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-gray-950 dark:text-white">
                  {formatPrice(isTwelveHourStay ? baseStayRate : nightlyDisplayRate)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  / {isTwelveHourStay ? label("12-Hour Stay", "إقامة 12 ساعة") : label("night", "ليلة")}
                </span>
              </div>
            </div>
            {hasDiscount && !isTwelveHourStay && (
              <span className="rounded-xl border border-rose-200/80 bg-rose-50 px-3 py-1 text-xs font-black uppercase text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400 shadow-xs">
                {property.discountPercentage ||
                  Math.round(
                    (1 -
                      property.basePrice /
                        (property.originalPrice || property.basePrice)) *
                      100
                  )}
                % OFF
              </span>
            )}
          </div>

          <div className="py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {isTwelveHourStay
                  ? label("12-Hour Stay (12:00 AM – 12:00 PM)", "إقامة 12 ساعة (12:00 ص – 12:00 م)")
                  : `${nights} ${label(nights === 1 ? "night" : "nights", "ليلة")}`}
              </span>
            </div>

            <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200/85 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="p-3.5">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5 text-[#4F2396] dark:text-purple-300" />
                  {label("Check-in", "الوصول")}
                </span>
                <p className="mt-2 text-xs font-extrabold text-gray-900 dark:text-white">
                  {bookingCheckinDate}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <Clock3 className="h-3 w-3 text-slate-400" />
                  {bookingCheckinTime}
                </p>
              </div>
              <div className="border-s border-slate-200/85 p-3.5 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5 text-[#4F2396] dark:text-purple-300" />
                  {label("Check-out", "المغادرة")}
                </span>
                <p className="mt-2 text-xs font-extrabold text-gray-900 dark:text-white">
                  {bookingCheckoutDate}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <Clock3 className="h-3 w-3 text-slate-400" />
                  {bookingCheckoutTime}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200/85 bg-slate-50/60 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-900/40">
              <span className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                <Users className="h-4 w-4 text-[#4F2396] dark:text-purple-300" />
                {label("Guests", "الضيوف")}
              </span>
              <span className="font-extrabold text-gray-900 dark:text-white">
                {bookingGuestsCount}
              </span>
            </div>
            <Link
              href={editStayHref}
              className="mt-3 inline-block text-xs font-semibold text-[#4F2396] hover:underline dark:text-purple-300"
            >
              {label("Edit dates, times or guests", "تعديل التواريخ أو الأوقات أو الضيوف")}
            </Link>
          </div>

          {/* Dynamic Pricing Engine */}
          <div className="border-t border-gray-100 pt-4 dark:border-white/10">
            <PricingBreakdownModule
              baseRate={baseStayRate}
              nights={isTwelveHourStay ? 1 : nights}
              nightlyRate={isTwelveHourStay ? baseStayRate : nightlyDisplayRate}
              originalPrice={isTwelveHourStay ? undefined : property.originalPrice}
              initialCouponCode={initialCoupon}
              category={property.category}
              language={language as "en" | "ar"}
              onPricingChange={(updatedPricing) => setPricing(updatedPricing)}
              showInstallments={false}
              isTwelveHourStay={isTwelveHourStay}
            />
          </div>

          <button
            type="button"
            onClick={handlePay}
            disabled={isPayDisabled}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition ${
              isPayDisabled
                ? "bg-gray-200 text-gray-400 dark:bg-white/10 dark:text-gray-500 cursor-not-allowed shadow-none"
                : "bg-[#4F2396] hover:bg-[#3d1979] text-white shadow-lg shadow-violet-950/20 cursor-pointer active:scale-[0.99]"
            }`}
          >
            {paymentBusy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            )}
            {paymentBusy
              ? label("Connecting to payment service…", "جارٍ الاتصال بخدمة الدفع…")
              : !phoneVerified
              ? user
                ? label("Verify mobile to pay", "تحقق من رقم الجوال للدفع")
                : label("Sign in to continue to payment", "سجل الدخول للمتابعة إلى الدفع")
              : REQUIRE_GOVERNMENT_ID_VERIFICATION && !identityVerified
              ? label("Verify ID via Nafath to pay", "وثق الهوية عبر نفاذ للدفع")
              : !paymentMethod
              ? walletSplitActive
                ? label("Select gateway for remainder", "اختر وسيلة دفع المتبقي")
                : label("Select a payment method", "اختر طريقة الدفع")
              : walletSplitActive && typeof remainingAmount === "number"
              ? label(
                  `Pay ${remainingAmount.toFixed(2)} SAR (+${walletBalance.toFixed(2)} Wallet)`,
                  `ادفع ${remainingAmount.toFixed(2)} ر.س (+${walletBalance.toFixed(2)} من المحفظة)`
                )
              : label("Pay now", "ادفع الآن")}
          </button>
          {/* Nafath / Elm Yaqeen Verification CTA - activate when REQUIRE_GOVERNMENT_ID_VERIFICATION is true */}
          {Boolean(REQUIRE_GOVERNMENT_ID_VERIFICATION && user && phoneVerified && !identityVerified) && (
            <button
              type="button"
              onClick={dispatchOpenIdentityModal}
              className="mt-2.5 w-full rounded-xl border border-purple-200 bg-purple-50/70 px-3.5 py-2 text-xs font-semibold text-[#4F2396] transition hover:bg-purple-100 dark:border-purple-500/30 dark:bg-purple-950/30 dark:text-purple-200 cursor-pointer"
            >
              {label("Verify National ID / Iqama Now", "توثيق الهوية الوطنية أو الإقامة الآن")}
            </button>
          )}
          <p className="mt-2 text-center text-[10px] leading-5 text-gray-500 dark:text-gray-400">
            {label(
              "OTP and payment stay here. No charge is made until a secure gateway is connected.",
              "سيبقى التحقق والدفع هنا. لن يتم الخصم قبل ربط بوابة دفع آمنة."
            )}
          </p>
        </div>
      </section>
      {paymentMessage && (
        <div
          role="status"
          className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {paymentMessage}
        </div>
      )}
    </aside>
  );
}

