"use client";

import React from "react";
import { MapPin, Map } from "lucide-react";

interface TabLocationProps {
  district: string;
  cityName: string;
  address?: string;
  lat?: number;
  lng?: number;
  lang?: "ar" | "en";
  t: (ar: string, en: string) => string;
}

export function TabLocation({ district, cityName, address, lat, lng, lang = "en", t }: TabLocationProps) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const queryTarget = hasCoords
    ? `${Number(lat!.toFixed(6))},${Number(lng!.toFixed(6))}`
    : `${address || ""} ${district} ${cityName}`.trim();
  const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(queryTarget)}&hl=${lang}&z=${
    hasCoords ? 15 : 13
  }&output=embed`;

  return (
    <section className="py-8 border-b border-gray-100 dark:border-white/10 space-y-4 scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
            {t("الموقع الجغرافي", "Location & Geography")}
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
            {t("الموقع والخريطة", "Location and Map")}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mt-1">
            <MapPin className="h-4 w-4 text-violet-500" />
            <span>
              {district} • {cityName}
            </span>
          </p>
          {address && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ps-5">
              {address}
            </p>
          )}
        </div>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryTarget)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F2396] hover:bg-[#431D82] text-white text-xs font-bold shadow-md transition"
        >
          <Map size={15} />
          <span>{t("فتح في خرائط Google", "Open in Google Maps")}</span>
        </a>
      </div>

      {/* Embedded Interactive Google Map */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-violet-200/80 bg-slate-100 dark:bg-slate-900 shadow-inner">
        <iframe
          key={embedSrc}
          title={`${district} ${cityName} Google Map`}
          src={embedSrc}
          className="h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t(
          "حفاظاً على الخصوصية، يظهر الموقع التقريبي للحي. يتم إرسال رابط اللوكيشن الدقيق وإرشادات الدخول الذاتي بعد تأكيد الحجز مباشرة.",
          "Approximate neighborhood location shown for privacy. Exact GPS coordinates and self-checkin instructions are provided upon confirmed reservation."
        )}
      </p>
    </section>
  );
}

