"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { WizardDraft } from "../types";

interface StepDescriptionFormProps {
  draft: WizardDraft;
  updateDraft: <K extends keyof WizardDraft>(key: K, val: WizardDraft[K]) => void;
  generateAiDescription: (targetLang?: "ar" | "en") => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function StepDescriptionForm({
  draft,
  updateDraft,
  generateAiDescription,
  t,
}: StepDescriptionFormProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-slate-900">
        {t("Description", "الوصف")}
      </h1>

      <p className="text-xs leading-5 text-slate-500">
        {t(
          "More than 75% of top hosts with high bookings and sales write a clear and distinctive description.",
          "أكثر من 75% من المضيفين المميزين، الذين لديهم حجوزات ومبيعات عالية يكتبون وصف واضح ومميز."
        )}
      </p>

      <p className="text-xs leading-5 text-slate-500">
        {t("Use the ", "استفد من ميزة ")}
        <span className="font-black text-[#4F2396]">
          {t("Improve Description", "تحسين الوصف")}
        </span>
        {t(
          " AI assistant to craft a better description for your unit and boost its visibility.",
          " عبر مساعد الذكاء الاصطناعي لتصنع وصفاً أفضل لوحدتك وتزيد من ظهورها وفرص حجزها."
        )}
      </p>

      <div className="grid grid-cols-1 gap-4">
        <div className="relative rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-black text-slate-900">
              {t("Property Description (English)", "وصف العقار (بالإنجليزية)")}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => generateAiDescription("en")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#dcd4ef] hover:bg-[#cbbce8] px-3 py-1.5 text-xs font-black text-[#4F2396] transition cursor-pointer"
            >
              <Sparkles size={13} />
              <span>{t("AI Write Text (EN)", "صياغة النص (إنجليزي)")}</span>
            </button>
          </div>
          <textarea
            rows={5}
            dir="ltr"
            value={draft.description}
            onChange={(e) => updateDraft("description", e.target.value)}
            placeholder="Write a distinctive English description for your unit, focusing on the features that make it an ideal stay for guests..."
            className="w-full resize-none border-0 text-xs sm:text-sm leading-6 text-slate-800 outline-none"
          />
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-black text-slate-900">
              {t("Property Description (Arabic)", "وصف العقار (بالعربية)")}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => generateAiDescription("ar")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#dcd4ef] hover:bg-[#cbbce8] px-3 py-1.5 text-xs font-black text-[#4F2396] transition cursor-pointer"
            >
              <Sparkles size={13} />
              <span>{t("AI Write Text (AR)", "صياغة النص (عربي)")}</span>
            </button>
          </div>
          <textarea
            rows={5}
            dir="rtl"
            value={draft.descriptionAr}
            onChange={(e) => updateDraft("descriptionAr", e.target.value)}
            placeholder="اكتب وصفاً مميزاً باللغة العربية لوحدتك، مع التركيز على المميزات التي تجعلها وجهة مثالية لضيوفك..."
            className="w-full resize-none border-0 text-xs sm:text-sm leading-6 text-slate-800 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

