"use client";

import React from "react";
import Link from "next/link";
import { Globe, X } from "lucide-react";
import { CATEGORIES } from "./types";

interface WizardBrandAsideProps {
  lang: "ar" | "en";
  setLang: (lang: "ar" | "en") => void;
  t: (en: string, ar: string) => string;
  propertyTitle?: string;
  category?: string;
  isEditing?: boolean;
  step?: number;
  totalSteps?: number;
}

export function WizardBrandAside({
  lang,
  setLang,
  t,
  propertyTitle,
  category,
  isEditing = false,
  step,
  totalSteps,
}: WizardBrandAsideProps) {
  const trimmedTitle = propertyTitle?.trim();
  const catObj = category
    ? CATEGORIES.find(
        (c) => c.id === category || c.en.toLowerCase() === category.toLowerCase()
      )
    : undefined;
  const localizedCategory = catObj
    ? lang === "ar"
      ? catObj.id
      : catObj.en
    : category;

  const headingText = trimmedTitle
    ? trimmedTitle
    : isEditing
      ? t("Edit Property", "تعديل بيانات العقار")
      : t("Register New Property", "تسجيل عقار جديد");

  return (
    <aside className="relative flex lg:w-[36%] xl:w-[35%] min-h-[200px] lg:min-h-screen flex-col items-center justify-center overflow-hidden bg-[#4F2396] p-8 text-white select-none shrink-0">
      {/* Subtle Repeating Geometric Pattern Overlay matching Gathern's purple right side */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20px 20px, rgba(255,255,255,0.35) 2px, transparent 0), linear-gradient(to right, rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Top Bar inside Brand Panel: Exit & Language Toggle */}
      <div className="absolute top-5 inset-x-6 z-20 flex items-center justify-between">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur-sm transition"
        >
          <X size={14} />
          <span>{t("Dashboard", "لوحة المضيف")}</span>
        </Link>
        <button
          type="button"
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur-sm transition cursor-pointer"
        >
          <Globe size={14} />
          <span>{lang === "ar" ? "EN" : "العربية"}</span>
        </button>
      </div>

      {/* Center Logo + Divider + Dynamic Title & Mode */}
      <div className="relative z-10 text-center max-w-xs mx-auto space-y-2">
        <div className="text-5xl sm:text-6xl font-black tracking-[-0.05em] text-white">
          Qaf<span className="text-violet-200">Nest</span>
          <span className="text-[#FF9750]">.</span>
        </div>
        <div className="mx-auto my-4 h-[2px] w-16 bg-white/80" />
        {(localizedCategory || isEditing) && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black tracking-wide text-violet-100 backdrop-blur-xs">
            <span>
              {isEditing
                ? t("Editing Listing", "تعديل العقار")
                : t("New Listing", "إدراج جديد")}
            </span>
            {localizedCategory && (
              <>
                <span className="opacity-60">•</span>
                <span>{localizedCategory}</span>
              </>
            )}
          </div>
        )}
        <p className="text-xl sm:text-2xl font-extrabold text-white line-clamp-2 px-2">
          {headingText}
        </p>
        {typeof step === "number" && typeof totalSteps === "number" && (
          <p className="text-xs font-bold text-violet-200/90">
            {t(`Step ${step + 1} of ${totalSteps}`, `الخطوة ${step + 1} من ${totalSteps}`)}
          </p>
        )}
      </div>
    </aside>
  );
}
