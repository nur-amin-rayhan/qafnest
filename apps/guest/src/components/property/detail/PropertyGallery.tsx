"use client";

import React from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";

interface PropertyGalleryProps {
  images: string[];
  title: string;
  videos?: string[];
  onOpenLightbox: (index: number) => void;
  onOpenVideo: (index: number) => void;
  anchorLabel: (en: string, ar: string) => string;
}

export default function PropertyGallery({
  images,
  title,
  videos,
  onOpenLightbox,
  onOpenVideo,
  anchorLabel,
}: PropertyGalleryProps) {
  const extraImages = images.slice(1, 5);
  const hasExtras = extraImages.length > 0;
  const gridTemplateClass = hasExtras ? "md:grid-cols-[1.15fr_1fr]" : "md:grid-cols-1";
  const rightGridClass =
    extraImages.length === 1
      ? "grid-cols-1 grid-rows-1"
      : extraImages.length === 2
      ? "grid-cols-1 grid-rows-2"
      : "grid-cols-2 grid-rows-2";

  return (
    <section aria-label={anchorLabel("Property photos", "صور العقار")} className="relative mt-6">
      <div
        className={`grid gap-2.5 overflow-hidden rounded-3xl border border-violet-200/70 bg-violet-50/30 p-1.5 shadow-[0_12px_40px_rgba(109,40,217,0.08)] dark:border-violet-500/20 dark:bg-[#12101a] ${gridTemplateClass}`}
      >
        <div className="group relative aspect-[4/3] min-h-[260px] overflow-hidden rounded-2xl bg-gray-100 md:aspect-auto md:min-h-[450px] lg:min-h-[480px]">
          <button
            type="button"
            onClick={() => onOpenLightbox(0)}
            className="relative h-full w-full text-left cursor-pointer"
            aria-label={anchorLabel("Open main photo", "عرض الصورة الرئيسية")}
          >
            <Image
              src={images[0]}
              alt={title}
              fill
              priority
              sizes={hasExtras ? "(max-width: 768px) 100vw, 55vw" : "100vw"}
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
          </button>

          {/* Bottom-Left Overlay Action Pills (SHOW ALL PHOTOS / SHOW ALL VIDEOS) */}
          <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 z-10 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenLightbox(0)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-black/70 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition hover:bg-violet-700 hover:border-violet-400 cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5 text-violet-300" />
              {anchorLabel(
                images.length === 1 ? "View photo" : `Show all photos (${images.length})`,
                images.length === 1 ? "عرض الصورة" : `عرض كل الصور (${images.length})`
              )}
            </button>
            {videos?.length ? (
              <button
                type="button"
                onClick={() => onOpenVideo(0)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-black/70 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition hover:bg-violet-700 hover:border-violet-400 cursor-pointer"
              >
                <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] text-gray-900">
                  ▶
                </span>
                {anchorLabel("Show all videos", `عرض الفيديوهات (${videos.length})`)}
              </button>
            ) : null}
          </div>
        </div>

        {hasExtras && (
          <div className={`hidden h-full gap-2.5 md:grid ${rightGridClass}`}>
            {extraImages.map((image, idx) => {
              const targetIdx = idx + 1;
              const isSpanFullRow = extraImages.length === 3 && idx === 0;
              return (
                <button
                  type="button"
                  key={`${image}-${idx}`}
                  onClick={() => onOpenLightbox(targetIdx)}
                  className={`group relative h-full min-h-[215px] overflow-hidden rounded-2xl bg-gray-100 cursor-pointer ${
                    isSpanFullRow ? "col-span-2" : ""
                  }`}
                  aria-label={`${anchorLabel("Open photo", "عرض الصورة")} ${targetIdx + 1}`}
                >
                  <Image
                    src={image}
                    alt={`${title} ${targetIdx + 1}`}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                  {idx === 3 && images.length > 5 && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-base font-extrabold text-white backdrop-blur-[2px]">
                      +{images.length - 5} {anchorLabel("photos", "صور")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

