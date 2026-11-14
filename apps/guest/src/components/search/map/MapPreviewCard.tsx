"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LocatedProperty } from "./mapConstants";
import { propertyDetailHref, propertyReservationHref } from "@/lib/propertyUrls";
import {
  getLocalizedPropertyTitle,
  getLocalizedPropertyLocation,
} from "@/lib/localization/localeHelper";

interface MapPreviewCardProps {
  selectedProperty: LocatedProperty;
  isPropertyDetail: boolean;
  language: string;
  checkinDate: string;
  checkoutDate: string;
  checkinTime: string;
  checkoutTime: string;
  guestsCount: number;
  searchParamsString: string;
}

export default function MapPreviewCard({
  selectedProperty,
  isPropertyDetail,
  language,
  checkinDate,
  checkoutDate,
  checkinTime,
  checkoutTime,
  guestsCount,
  searchParamsString,
}: MapPreviewCardProps) {
  const router = useRouter();

  const handleActionClick = () => {
    if (isPropertyDetail) {
      const reservationParams = new URLSearchParams(searchParamsString);
      reservationParams.set("check_in", checkinDate);
      reservationParams.set("check_out", checkoutDate);
      reservationParams.set("check_in_time", checkinTime);
      reservationParams.set("check_out_time", checkoutTime);
      reservationParams.set("guests", String(guestsCount));
      router.push(propertyReservationHref(selectedProperty.id, reservationParams));
      return;
    }
    router.push(propertyDetailHref(selectedProperty.id, searchParamsString));
  };

  return (
    <div className="absolute bottom-5 left-4 right-4 z-40 sm:left-4 sm:right-auto sm:w-[340px]">
      <div className="flex gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-white/15 dark:bg-[#161324]/95">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-28">
          <Image
            src={selectedProperty.image}
            alt={getLocalizedPropertyTitle(selectedProperty, language === "ar" ? "ar" : "en")}
            fill
            priority
            sizes="120px"
            className="object-cover"
          />
          <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {selectedProperty.rating > 0
              ? `★ ${selectedProperty.rating.toFixed(1)} / 10`
              : language === "ar"
                ? "لا توجد تقييمات"
                : "No rating"}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex min-w-0 items-center gap-1.5">
              <h4 className="line-clamp-1 min-w-0 text-xs font-bold text-gray-900 dark:text-white sm:text-sm">
                {getLocalizedPropertyTitle(selectedProperty, language === "ar" ? "ar" : "en")}
              </h4>
              {selectedProperty.approximate && (
                <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                  {language === "ar" ? "موقع تقريبي" : "Approx. area"}
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">
              {getLocalizedPropertyLocation(selectedProperty, language === "ar" ? "ar" : "en").location}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-1.5 dark:border-white/5">
            <span className="text-sm font-extrabold text-violet-700 dark:text-fuchsia-300">
              {selectedProperty.basePrice} {language === "ar" ? "ر.س /ليلة" : "SAR /night"}
            </span>
            <button
              type="button"
              onClick={handleActionClick}
              className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 cursor-pointer"
            >
              {isPropertyDetail
                ? language === "ar" ? "احجز" : "Book"
                : language === "ar" ? "التفاصيل" : "View details"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

