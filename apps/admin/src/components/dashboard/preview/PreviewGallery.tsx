"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

interface PreviewGalleryProps {
  images: string[];
  title: string;
  lightboxIndex: number | null;
  setLightboxIndex: React.Dispatch<React.SetStateAction<number | null>>;
  t: (ar: string, en: string) => string;
}

export function PreviewGallery({
  images,
  title,
  lightboxIndex,
  setLightboxIndex,
  t,
}: PreviewGalleryProps) {
  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((idx) => (idx === null ? null : (idx + 1) % images.length));
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((idx) => (idx === null ? null : (idx - 1 + images.length) % images.length));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, lightboxIndex, setLightboxIndex]);

  if (images.length === 0) {
    return (
      <section aria-label={t("صور العقار", "Property photos")} className="relative mt-6">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-violet-200 bg-violet-50/20 py-16 text-center dark:border-violet-500/20 dark:bg-[#12101a]">
          <span className="material-symbols-outlined text-4xl text-outline">photo_library</span>
          <p className="mt-2 text-xs font-bold text-outline">
            {t("لم يتم رفع صور لهذا العقار بعد", "No photos uploaded for this property yet")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Hero Photo Grid (Mirrored 1:1 with Guest PropertyGallery) */}
      <section aria-label={t("صور العقار", "Property photos")} className="relative mt-6">
        <div className="grid gap-2.5 overflow-hidden rounded-3xl border border-violet-200/70 bg-violet-50/30 p-1.5 shadow-[0_12px_40px_rgba(109,40,217,0.08)] dark:border-violet-500/20 dark:bg-[#12101a] md:grid-cols-[1.15fr_1fr]">
          {/* Main Featured Photo */}
          <div className="group relative aspect-[4/3] min-h-[260px] overflow-hidden rounded-2xl bg-gray-100 md:aspect-auto md:min-h-[450px] lg:min-h-[480px]">
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="relative h-full w-full text-start cursor-pointer"
              aria-label={t("عرض الصورة الرئيسية", "Open main photo")}
            >
              <Image
                src={images[0]}
                alt={title}
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
            </button>

            {/* Bottom-Left Overlay Action Pill (SHOW ALL PHOTOS) */}
            <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 z-10 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-black/70 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition hover:bg-violet-700 hover:border-violet-400 cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5 text-violet-300" />
                <span>{t(`عرض كل الصور (${images.length})`, `Show all photos (${images.length})`)}</span>
              </button>
            </div>
          </div>

          {/* 4-Grid Secondary Photos (Identical 2x2 Equal Layout to Guest) */}
          <div className="hidden grid-cols-2 grid-rows-2 gap-2.5 md:grid h-full">
            {[1, 2, 3, 4].map((offset, index) => {
              const targetIdx = offset < images.length ? offset : offset % images.length;
              const img = images[targetIdx];
              return (
                <button
                  type="button"
                  key={`${img}-${index}`}
                  onClick={() => setLightboxIndex(targetIdx)}
                  className="group relative h-full w-full min-h-[215px] overflow-hidden rounded-2xl bg-gray-100 cursor-pointer"
                  aria-label={`${t("عرض الصورة", "Open photo")} ${index + 2}`}
                >
                  <Image
                    src={img}
                    alt={`${title} ${index + 2}`}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                  {index === 3 && images.length > 5 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-base font-extrabold text-white backdrop-blur-[2px]">
                      +{images.length - 5} {t("صور", "photos")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full Lightbox Modal (Mirrored 1:1 with Guest PropertyLightbox) */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[120] flex flex-col bg-[#08070D]/95 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={t("معرض الصور", "Photo gallery")}
        >
          <div className="flex items-center justify-between text-white">
            <span className="text-sm font-semibold">
              {lightboxIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
              aria-label={t("إغلاق معرض الصور", "Close photo gallery")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative my-4 min-h-0 flex-1 flex items-center justify-center">
            <div className="relative h-full w-full">
              <Image
                src={images[lightboxIndex]}
                alt={`${title} ${lightboxIndex + 1}`}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition cursor-pointer z-10"
                  aria-label={t("الصورة السابقة", "Previous photo")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition cursor-pointer z-10"
                  aria-label={t("الصورة التالية", "Next photo")}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 cursor-pointer transition ${
                  idx === lightboxIndex ? "border-violet-400" : "border-transparent opacity-60"
                }`}
                aria-label={`${t("عرض الصورة", "Show photo")} ${idx + 1}`}
              >
                <Image src={img} alt="" fill unoptimized sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

