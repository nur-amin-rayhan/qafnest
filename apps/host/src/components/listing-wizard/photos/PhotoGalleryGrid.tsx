"use client";

import React, { ChangeEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Plus, Star, Trash2 } from "lucide-react";

interface PhotoGalleryGridProps {
  photos: { file?: File; name: string; url: string }[];
  galleryPhotos: { file?: File; name: string; url: string }[];
  setAsFeatured: (idx: number) => void;
  movePhoto: (from: number, to: number) => void;
  removePhoto: (idx: number) => void;
  handleAddPhotos: (e: ChangeEvent<HTMLInputElement>) => void;
  t: (en: string, ar: string) => string;
}

export function PhotoGalleryGrid({
  photos,
  galleryPhotos,
  setAsFeatured,
  movePhoto,
  removePhoto,
  handleAddPhotos,
  t,
}: PhotoGalleryGridProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-900">
            {t(
              `Additional Gallery Photos (${galleryPhotos.length})`,
              `صور المعرض الإضافية (${galleryPhotos.length})`
            )}
          </h2>
          <p className="text-xs text-slate-500">
            {t(
              "Click 'Set as Cover' on any photo below to make it the featured image.",
              "انقر على 'اجعلها الرئيسية' على أي صورة أدناه لتصبح هي صورة الغلاف."
            )}
          </p>
        </div>

        {photos.length < 12 && (
          <label className="inline-flex items-center gap-1.5 rounded-xl border border-[#4F2396] bg-white px-3.5 py-1.5 text-xs font-black text-[#4F2396] hover:bg-[#f4f2f9] transition cursor-pointer shadow-xs">
            <Plus size={14} className="stroke-[3]" />
            <span>{t("Add Photos", "إضافة صور")}</span>
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

      {/* GALLERY GRID */}
      {galleryPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {galleryPhotos.map((ph, idx) => {
            const realIndex = idx + 1; // index in main `photos` array
            return (
              <div
                key={realIndex}
                className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 border border-slate-200 shadow-xs"
              >
                <Image
                  src={ph.url}
                  alt={ph.name}
                  fill
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-105 duration-200"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-90 group-hover:opacity-100 transition-opacity" />

                {/* Top Row: Index Badge & Delete Button */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-black/60 text-white text-[10px] font-black backdrop-blur-xs">
                    #{realIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePhoto(realIndex)}
                    className="grid h-6 w-6 place-items-center rounded-md bg-red-600/90 hover:bg-red-600 text-white shadow-xs cursor-pointer transition"
                    title={t("Delete photo", "حذف الصورة")}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Bottom Row: Set as Main Cover + Reorder Buttons */}
                <div className="absolute bottom-2 left-2 right-2 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setAsFeatured(realIndex)}
                    className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-[#4F2396] hover:bg-[#3D1A78] text-white text-[11px] font-black py-1 px-2 shadow-xs transition cursor-pointer"
                    title={t("Set as Featured Cover Photo", "تعيين كصورة غلاف رئيسية")}
                  >
                    <Star size={11} className="fill-amber-300 text-amber-300" />
                    <span>{t("Set as Cover", "اجعلها الرئيسية")}</span>
                  </button>

                  {/* Reorder Arrows */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => movePhoto(realIndex, realIndex - 1)}
                      disabled={realIndex <= 1}
                      className="h-5 w-5 grid place-items-center rounded bg-black/60 hover:bg-black text-white text-[10px] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition"
                      title={t("Move Earlier", "تقديم")}
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <span className="text-[10px] text-white/80 font-bold">
                      {t("Photo", "صورة")} {realIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => movePhoto(realIndex, realIndex + 1)}
                      disabled={realIndex >= photos.length - 1}
                      className="h-5 w-5 grid place-items-center rounded bg-black/60 hover:bg-black text-white text-[10px] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition"
                      title={t("Move Later", "تأخير")}
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        photos.length > 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
            <p className="text-xs text-slate-500 font-bold">
              {t(
                "You have 1 featured photo. Click 'Add Photos' above to add more images for bedrooms, majlis, and facilities.",
                "لديك صورة رئيسية واحدة. انقر على 'إضافة صور' أعلاه لإضافة المزيد من صور غرف النوم والمجالس والمرافق."
              )}
            </p>
          </div>
        )
      )}
    </div>
  );
}

