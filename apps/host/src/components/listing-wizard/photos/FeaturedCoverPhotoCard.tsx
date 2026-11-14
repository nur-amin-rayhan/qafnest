"use client";

import React, { ChangeEvent } from "react";
import Image from "next/image";
import { Camera, ImagePlus, Sparkles, Star, Trash2 } from "lucide-react";

interface FeaturedCoverPhotoCardProps {
  featuredPhoto: { file?: File; name: string; url: string } | null;
  handleReplaceFeaturedPhoto: (e: ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (idx: number) => void;
  handleAddPhotos: (e: ChangeEvent<HTMLInputElement>) => void;
  t: (en: string, ar: string) => string;
}

export function FeaturedCoverPhotoCard({
  featuredPhoto,
  handleReplaceFeaturedPhoto,
  removePhoto,
  handleAddPhotos,
  t,
}: FeaturedCoverPhotoCardProps) {
  return (
    <div className="rounded-2xl border-2 border-[#4F2396]/20 bg-gradient-to-br from-[#faf8fe] to-[#f4eefa] p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#4F2396] text-white">
            <Star size={15} className="fill-amber-300 text-amber-300" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              {t("Featured Cover Photo", "صورة الغلاف الرئيسية (المميزة)")}
            </h2>
            <p className="text-[11px] text-slate-500">
              {t(
                "Primary hero image displayed to guests",
                "الصورة الأولى التي تظهر للضيوف في الصفحة الرئيسية والبحث"
              )}
            </p>
          </div>
        </div>

        {featuredPhoto && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5">
            {t("Active Cover", "الغلاف الحالي")}
          </span>
        )}
      </div>

      {featuredPhoto ? (
        /* PREVIEW OF THE CURRENT FEATURED IMAGE */
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-xl border-2 border-[#4F2396] bg-slate-900 shadow-md group">
          <Image
            src={featuredPhoto.url}
            alt={featuredPhoto.name || "Featured Property Cover"}
            fill
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35 pointer-events-none" />

          {/* Badges on Featured Image */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4F2396] px-3 py-1 text-xs font-black text-white shadow-md">
              <Star size={13} className="fill-amber-300 text-amber-300" />
              <span>{t("Featured / Main Image", "الصورة الرئيسية")}</span>
            </span>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              {/* Replace Cover Photo */}
              <label className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 hover:bg-white px-3 py-1.5 text-xs font-black text-slate-800 shadow-md cursor-pointer transition">
                <Camera size={13} className="text-[#4F2396]" />
                <span>{t("Replace", "استبدال")}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleReplaceFeaturedPhoto}
                  className="sr-only"
                />
              </label>

              {/* Remove Cover Photo */}
              <button
                type="button"
                onClick={() => removePhoto(0)}
                className="grid h-7 w-7 place-items-center rounded-xl bg-red-600/90 hover:bg-red-600 text-white shadow-md cursor-pointer transition"
                title={t("Remove", "حذف")}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Bottom Info Banner */}
          <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none flex items-center justify-between">
            <span className="text-xs font-bold drop-shadow-md flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-300" />
              <span>
                {t(
                  "Seen first by guests on search & explore",
                  "ستظهر هذه الصورة أولاً للضيوف في نتائج البحث"
                )}
              </span>
            </span>
            <span className="text-[11px] font-bold text-white/80">{featuredPhoto.name}</span>
          </div>
        </div>
      ) : (
        /* EMPTY STATE: DIRECT UPLOAD FOR FEATURED PHOTO */
        <label className="flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-[#4F2396]/50 bg-white p-6 sm:p-8 text-center text-[#4F2396] hover:bg-[#faf8fe] transition cursor-pointer shadow-xs group">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#4F2396] text-white shadow-sm group-hover:scale-105 transition-transform">
            <ImagePlus size={24} />
          </div>
          <div className="space-y-0.5">
            <span className="text-sm font-black text-slate-900 block">
              {t("Upload Featured Cover Photo", "رفع صورة الغلاف الرئيسية")}
            </span>
            <span className="text-xs text-slate-500 block">
              {t(
                "Click to select your main photo (or select multiple photos)",
                "انقر لاختيار صورتك الرئيسية (أو اختر عدة صور دفعة واحدة)"
              )}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F2396] px-4 py-2 text-xs font-black text-white shadow-xs">
            <Star size={13} className="fill-amber-300 text-amber-300" />
            <span>{t("Choose Photo", "اختر الصورة")}</span>
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={handleAddPhotos}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}

