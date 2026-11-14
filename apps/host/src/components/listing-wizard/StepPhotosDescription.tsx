"use client";

import React, { ChangeEvent } from "react";
import { WizardDraft } from "./types";
import { validateImageFile } from "@/lib/storage/uploadBridge";
import { StepDescriptionForm } from "./photos/StepDescriptionForm";
import { FeaturedCoverPhotoCard } from "./photos/FeaturedCoverPhotoCard";
import { PhotoGalleryGrid } from "./photos/PhotoGalleryGrid";
import { PhotoRequirementsChecklist } from "./photos/PhotoRequirementsChecklist";

interface StepPhotosDescriptionProps {
  step: number;
  draft: WizardDraft;
  updateDraft: <K extends keyof WizardDraft>(key: K, val: WizardDraft[K]) => void;
  photos: { file?: File; name: string; url: string }[];
  setPhotos: React.Dispatch<
    React.SetStateAction<{ file?: File; name: string; url: string }[]>
  >;
  generateAiDescription: (targetLang?: "ar" | "en") => void;
  handleAddPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function StepPhotosDescription({
  step,
  draft,
  updateDraft,
  photos,
  setPhotos,
  generateAiDescription,
  handleAddPhotos,
  lang,
  t,
}: StepPhotosDescriptionProps) {
  // Promote any photo to index 0 as the Featured Cover Photo
  const setAsFeatured = (idx: number) => {
    if (idx <= 0 || idx >= photos.length) return;
    setPhotos((prev) => {
      const target = prev[idx];
      const remaining = prev.filter((_, i) => i !== idx);
      return [target, ...remaining];
    });
  };

  // Reorder photos within the gallery
  const movePhoto = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    setPhotos((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  // Remove a photo
  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Replace the featured cover photo directly
  const handleReplaceFeaturedPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const val = validateImageFile(file);
    if (!val.valid) {
      alert(val.error || t("Invalid file selected.", "تم اختيار ملف غير صالح."));
      return;
    }
    const newFeatured = { file, name: file.name, url: URL.createObjectURL(file) };
    setPhotos((prev) => {
      if (prev.length === 0) return [newFeatured];
      return [newFeatured, ...prev.slice(1)];
    });
    e.target.value = "";
  };

  // Step 9: Description
  if (step === 9) {
    return (
      <StepDescriptionForm
        draft={draft}
        updateDraft={updateDraft}
        generateAiDescription={generateAiDescription}
        lang={lang}
        t={t}
      />
    );
  }

  // Step 10: Property Photos & Featured Cover Image
  if (step === 10) {
    const featuredPhoto = photos.length > 0 ? photos[0] : null;
    const galleryPhotos = photos.length > 1 ? photos.slice(1) : [];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t("Property Photos & Featured Image", "صور العقار وصورة الغلاف الرئيسية")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              "Select your best photo as the Featured Cover Image. Guests see this image first on search cards and at the top of your property page.",
              "حدد صورتك الأفضل كصورة غلاف رئيسية. هذه هي أول صورة يراها الضيوف في نتائج البحث وفي أعلى صفحة إعلانك."
            )}
          </p>
        </div>

        {/* 1. FEATURED COVER PHOTO SECTION */}
        <FeaturedCoverPhotoCard
          featuredPhoto={featuredPhoto}
          handleReplaceFeaturedPhoto={handleReplaceFeaturedPhoto}
          removePhoto={removePhoto}
          handleAddPhotos={handleAddPhotos}
          t={t}
        />

        {/* 2. ADDITIONAL GALLERY PHOTOS SECTION */}
        <PhotoGalleryGrid
          photos={photos}
          galleryPhotos={galleryPhotos}
          setAsFeatured={setAsFeatured}
          movePhoto={movePhoto}
          removePhoto={removePhoto}
          handleAddPhotos={handleAddPhotos}
          t={t}
        />

        {/* 3. PHOTO REQUIREMENTS CHECKLIST */}
        <PhotoRequirementsChecklist t={t} />
      </div>
    );
  }

  return null;
}
