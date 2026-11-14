"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PropertyLightboxProps {
  lightboxIndex: number | null;
  setLightboxIndex: React.Dispatch<React.SetStateAction<number | null>>;
  videoIndex: number | null;
  setVideoIndex: React.Dispatch<React.SetStateAction<number | null>>;
  images: string[];
  videos?: string[];
  title: string;
  anchorLabel: (en: string, ar: string) => string;
}

export default function PropertyLightbox({
  lightboxIndex,
  setLightboxIndex,
  videoIndex,
  setVideoIndex,
  images,
  videos,
  title,
  anchorLabel,
}: PropertyLightboxProps) {
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight")
        setLightboxIndex((index) => (index === null ? null : (index + 1) % images.length));
      if (event.key === "ArrowLeft")
        setLightboxIndex((index) =>
          index === null ? null : (index - 1 + images.length) % images.length
        );
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, lightboxIndex, setLightboxIndex]);

  useEffect(() => {
    if (videoIndex === null) return;
    const count = videos?.length || 1;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVideoIndex(null);
      if (event.key === "ArrowRight")
        setVideoIndex((index) => (index === null ? null : (index + 1) % count));
      if (event.key === "ArrowLeft")
        setVideoIndex((index) => (index === null ? null : (index - 1 + count) % count));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [videos?.length, videoIndex, setVideoIndex]);

  return (
    <>
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[120] flex flex-col bg-[#08070D]/95 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={anchorLabel("Photo gallery", "معرض الصور")}
        >
          <div className="flex items-center justify-between text-white">
            <span className="text-sm font-semibold">
              {lightboxIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              aria-label={anchorLabel("Close photo gallery", "إغلاق معرض الصور")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative my-4 min-h-0 flex-1">
            <Image
              src={images[lightboxIndex]}
              alt={`${title} ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)
                  }
                  className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75 cursor-pointer"
                  aria-label={anchorLabel("Previous photo", "الصورة السابقة")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % images.length)}
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75 cursor-pointer"
                  aria-label={anchorLabel("Next photo", "الصورة التالية")}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          <div className="flex justify-center gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={`${image}-thumb-${index}`}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 cursor-pointer ${
                  index === lightboxIndex ? "border-violet-400" : "border-transparent opacity-60"
                }`}
                aria-label={`${anchorLabel("Show photo", "عرض الصورة")} ${index + 1}`}
              >
                <Image src={image} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {videoIndex !== null && videos?.[videoIndex] && (
        <div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#08070D]/95 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={anchorLabel("Property videos", "فيديوهات العقار")}
        >
          <div className="mb-3 flex w-full max-w-5xl items-center justify-between text-white">
            <span className="text-sm font-semibold">
              {videoIndex + 1} / {videos.length}
            </span>
            <button
              type="button"
              onClick={() => setVideoIndex(null)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              aria-label={anchorLabel("Close video", "إغلاق الفيديو")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <video
            key={videos[videoIndex]}
            src={videos[videoIndex]}
            controls
            autoPlay
            playsInline
            className="max-h-[78vh] w-full max-w-5xl rounded-2xl bg-black"
          />
          {videos.length > 1 && (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setVideoIndex((videoIndex - 1 + videos.length) % videos.length)
                }
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 cursor-pointer"
              >
                {anchorLabel("Previous", "السابق")}
              </button>
              <button
                type="button"
                onClick={() => setVideoIndex((videoIndex + 1) % videos.length)}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 cursor-pointer"
              >
                {anchorLabel("Next", "التالي")}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

