"use client";

import React from "react";
import { Bath, BedDouble, Building2, FileImage, Sofa, Sparkles } from "lucide-react";

interface PhotoRequirementsChecklistProps {
  t: (en: string, ar: string) => string;
}

export function PhotoRequirementsChecklist({ t }: PhotoRequirementsChecklistProps) {
  return (
    <div className="space-y-3">
      {/* Automated WebP & Size Optimization Guidelines */}
      <div className="rounded-2xl border border-violet-200/80 bg-violet-50/70 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-black text-[#4F2396]">
          <FileImage size={16} className="shrink-0" />
          <span>{t("Photo Size, Dimension & Format Guidelines", "إرشادات الصيغة والحجم والأبعاد المثالية")}</span>
        </div>
        <ul className="space-y-1 text-[11px] font-bold leading-5 text-slate-700 list-disc ps-4">
          <li>
            {t(
              "Auto-compressed to lightweight WebP in your browser for fast mobile loading.",
              "يتم ضغط الصور تلقائياً إلى صيغة WebP خفيفة لتحميل أسرع على الجوال."
            )}
          </li>
          <li>
            {t(
              "Max file size: 2 MB after auto-optimization (supports raw uploads up to 15 MB).",
              "الحد الأقصى لحجم الملف: 2 ميجابايت بعد الضغط التلقائي (يدعم رفع صور خام حتى 15 ميجابايت)."
            )}
          </li>
          <li>
            {t(
              "Recommended dimensions: 1920 × 1080 px (or longest side <= 1920 px) in crisp landscape/vertical framing.",
              "الأبعاد الموصى بها: 1920 × 1080 بكسل (أو ألا يتجاوز أطول ضلع 1920 بكسل) بجودة عالية."
            )}
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-[#f9f8fc] p-4 space-y-3">
      <p className="text-xs font-black leading-5 text-[#4F2396]">
        {t(
          "Based on your selections during registration, you are required to upload at least one photo for each of the following:",
          "على حسب خياراتك أثناء التسجيل، مطلوب منك رفع صورة واحدة كحد أدنى لكلاً من الآتي:"
        )}
      </p>

      <hr className="border-slate-200/60" />

      <div className="space-y-2.5 text-xs font-bold text-[#4F2396]">
        <div className="flex items-center gap-2.5">
          <BedDouble size={16} className="text-slate-500 shrink-0" />
          <span>
            <strong>{t("1 photo", "1 صورة")}</strong>{" "}
            {t("Bedrooms (one for each)", "غرف النوم (واحدة لكلاً منها)")}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Sofa size={16} className="text-slate-500 shrink-0" />
          <span>
            <strong>{t("4 photos", "4 صور")}</strong>{" "}
            {t("Majlis / Living Rooms (one for each)", "المجالس (واحدة لكلاً منها)")}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Bath size={16} className="text-slate-500 shrink-0" />
          <span>
            <strong>{t("1 photo", "1 صورة")}</strong>{" "}
            {t("Bathrooms (one for each)", "دورات المياه (واحدة لكلاً منها)")}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Building2 size={16} className="text-slate-500 shrink-0" />
          <span>
            <strong>{t("1 photo", "1 صورة")}</strong>{" "}
            {t("Building & Exterior", "المبنى والمظهر الخارجي")}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Sparkles size={16} className="text-slate-500 shrink-0" />
          <span className="leading-5">
            <strong>{t("5 photos", "5 صور")}</strong>{" "}
            {t(
              "Facilities & Features (Pool, Balcony, Garden, Sea View, etc.)",
              "المرافق والمميزات (مسبح، بلكونة، إطلالة، حديقة، شلال)"
            )}
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}

