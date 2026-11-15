"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { StepperRow } from "./StepperRow";
import {
  BATHROOM_AMENITIES,
  KITCHEN_AMENITIES,
  POOL_AMENITIES,
  WIZARD_STEPS,
  type WizardArrayField,
  type WizardDraft,
} from "./types";

interface StepSpecificationsProps {
  step: number;
  draft: WizardDraft;
  updateDraft: <K extends keyof WizardDraft>(key: K, val: WizardDraft[K]) => void;
  updateBedroomsCount: (nextCount: number) => void;
  toggleItem: (key: WizardArrayField, item: string) => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

interface AmenityPillGridProps {
  items: { id: string; en: string; ar: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  lang: "ar" | "en";
}

function AmenityPillGrid({ items, selectedIds, onToggle, lang }: AmenityPillGridProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`rounded-full border px-4 py-2 text-xs font-extrabold transition cursor-pointer ${
              selected
                ? "border-[#4F2396] bg-[#4F2396] text-white"
                : "border-slate-200 bg-white text-[#4F2396] hover:bg-violet-50"
            }`}
          >
            {lang === "ar" ? item.ar : item.en}
          </button>
        );
      })}
    </div>
  );
}

interface CustomAmenityInputProps {
  inputId: string;
  label: string;
  placeholder: string;
  presetItems: { id: string }[];
  selectedValues: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  t: (en: string, ar: string) => string;
}

function CustomAmenityInput({
  inputId,
  label,
  placeholder,
  presetItems,
  selectedValues,
  onAdd,
  onRemove,
  t,
}: CustomAmenityInputProps) {
  const [inputValue, setInputValue] = useState("");
  const presetIds = new Set(presetItems.map((item) => item.id));
  const customAmenities = selectedValues.filter((item) => !presetIds.has(item));

  const handleAdd = () => {
    const cleaned = inputValue.trim().replace(/\s+/g, " ");
    if (!cleaned) return;
    const alreadyExists = selectedValues.some(
      (existing) => existing.toLowerCase() === cleaned.toLowerCase()
    );
    if (!alreadyExists) {
      onAdd(cleaned);
    }
    setInputValue("");
  };

  return (
    <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-black text-slate-800">
          {label}
        </label>
        <span className="text-[11px] font-bold text-slate-400">
          {t("Optional", "اختياري")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="text"
          maxLength={60}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#4F2396]"
        />
        <button
          type="button"
          disabled={!inputValue.trim()}
          onClick={handleAdd}
          className="inline-flex items-center gap-1 rounded-xl bg-[#4F2396] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#3d1979] disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus size={14} />
          <span>{t("Add", "إضافة")}</span>
        </button>
      </div>

      {customAmenities.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {customAmenities.map((customItem) => (
            <button
              key={customItem}
              type="button"
              onClick={() => onRemove(customItem)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4F2396] bg-[#4F2396] px-3.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-[#3d1979] cursor-pointer"
              title={t("Click to remove", "اضغط للحذف")}
            >
              <span>{customItem}</span>
              <X size={13} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StepSpecifications({
  step,
  draft,
  updateDraft,
  updateBedroomsCount,
  toggleItem,
  lang,
  t,
}: StepSpecificationsProps) {
  if (step === WIZARD_STEPS.BEDROOM_DETAILS) {
    const allocatedBeds = draft.masterBedsCount + draft.singleBedsCount;
    const remainingBedSlots = Math.max(0, draft.bedroomsCount - allocatedBeds);
    const bedsAtBedroomLimit = draft.bedroomsCount <= 0 || remainingBedSlots <= 0;

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t("Bedroom Details", "تفاصيل غرف النوم")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              "Master and single bedroom counts are dynamically capped to never exceed your total bedrooms.",
              "عدد غرف النوم الماستر والمفردة مرتبط تلقائياً ولا يمكن أن يتجاوز إجمالي عدد غرف النوم."
            )}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <StepperRow
            label={t("Number of bedrooms", "عدد غرف النوم")}
            value={draft.bedroomsCount}
            onChange={updateBedroomsCount}
          />
          <StepperRow
            label={t("Number of master beds", "عدد غرف النوم الماستر / الأسرّة الماستر")}
            value={draft.masterBedsCount}
            max={draft.bedroomsCount - draft.singleBedsCount}
            disableIncrement={bedsAtBedroomLimit}
            onChange={(v) =>
              updateDraft(
                "masterBedsCount",
                Math.min(v, Math.max(0, draft.bedroomsCount - draft.singleBedsCount))
              )
            }
          />
          <StepperRow
            label={t("Number of single beds", "عدد غرف النوم المفردة / الأسرّة المفردة")}
            value={draft.singleBedsCount}
            max={draft.bedroomsCount - draft.masterBedsCount}
            disableIncrement={bedsAtBedroomLimit}
            onChange={(v) =>
              updateDraft(
                "singleBedsCount",
                Math.min(v, Math.max(0, draft.bedroomsCount - draft.masterBedsCount))
              )
            }
          />
        </div>

        <div className="rounded-xl border border-violet-200/70 bg-violet-50/70 px-3.5 py-2.5 text-xs font-bold text-[#4F2396]">
          {draft.bedroomsCount === 0
            ? t(
                "Increase the number of bedrooms above (at least 1) to assign master or single beds.",
                "ارفع عدد غرف النوم أعلاه (1 على الأقل) لتحديد الغرف الماستر والمفردة."
              )
            : t(
                `Allocated ${allocatedBeds} of ${draft.bedroomsCount} bedrooms (${remainingBedSlots} remaining).`,
                `تم توزيع ${allocatedBeds} من إجمالي ${draft.bedroomsCount} غرف نوم (المتبقي: ${remainingBedSlots}).`
              )}
        </div>
      </div>
    );
  }

  if (step === WIZARD_STEPS.MAJLIS_DETAILS) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t("Majlis Details", "تفاصيل المجالس")}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "Select all sitting areas available in your property",
              "اختر كل المرافق الموجودة في عقارك"
            )}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <StepperRow
            label={t("Main Majlis", "مجلس رئيسي")}
            value={draft.mainMajlisCount}
            onChange={(v) => updateDraft("mainMajlisCount", v)}
          />
          <StepperRow
            label={t("Additional Majlis", "مجلس إضافي")}
            value={draft.extraMajlisCount}
            onChange={(v) => updateDraft("extraMajlisCount", v)}
          />
          <StepperRow
            label={t("Outdoor Seating", "جلسة خارجية")}
            value={draft.outdoorSeatingCount}
            onChange={(v) => updateDraft("outdoorSeatingCount", v)}
          />
          <StepperRow
            label={t("External Annex", "ملحق خارجي")}
            value={draft.externalAnnexCount}
            onChange={(v) => updateDraft("externalAnnexCount", v)}
          />
        </div>
      </div>
    );
  }

  if (step === WIZARD_STEPS.POOL_DETAILS) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t("Swimming Pool Details", "تفاصيل المسبح")}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "Specify pool count and available pool features.",
              "حدد عدد المسابح والمزايا المتوفرة فيه."
            )}
          </p>
        </div>

        <StepperRow
          label={t("Number of swimming pools", "عدد المسابح")}
          value={draft.poolsCount}
          onChange={(v) => updateDraft("poolsCount", v)}
        />

        <hr className="border-slate-100" />

        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-900">
            {t("Pool Features & Amenities", "مواصفات ومرافق المسبح")}
          </h2>
          <AmenityPillGrid
            items={POOL_AMENITIES}
            selectedIds={draft.poolAmenities}
            onToggle={(id) => toggleItem("poolAmenities", id)}
            lang={lang}
          />
        </div>
      </div>
    );
  }

  if (step === WIZARD_STEPS.KITCHEN_DETAILS) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {t("Kitchen Details", "تفاصيل المطبخ")}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "Specify kitchen count and appliances available for guests.",
              "حدد عدد المطابخ والتجهيزات المتوفرة للضيوف."
            )}
          </p>
        </div>

        <StepperRow
          label={t("Number of kitchens", "عدد المطابخ")}
          value={draft.kitchensCount}
          onChange={(v) => updateDraft("kitchensCount", v)}
        />

        <hr className="border-slate-100" />

        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-900">
            {t("Kitchen Amenities & Appliances", "تجهيزات ومرافق المطبخ")}
          </h2>
          <AmenityPillGrid
            items={KITCHEN_AMENITIES}
            selectedIds={draft.kitchenAmenities}
            onToggle={(id) => toggleItem("kitchenAmenities", id)}
            lang={lang}
          />
        </div>

        <CustomAmenityInput
          inputId="custom-kitchen-amenity"
          label={t("Other Kitchen Amenity", "تجهيزات إضافية للمطبخ")}
          placeholder={t(
            "Type an appliance (e.g. Air Fryer, Dishwasher, Water Dispenser)",
            "اكتب مرفقاً إضافياً (مثال: قلاية هوائية، غسالة صحون، برادة مياه)"
          )}
          presetItems={KITCHEN_AMENITIES}
          selectedValues={draft.kitchenAmenities}
          onAdd={(val) => updateDraft("kitchenAmenities", [...draft.kitchenAmenities, val])}
          onRemove={(val) => toggleItem("kitchenAmenities", val)}
          t={t}
        />
      </div>
    );
  }

  if (step === WIZARD_STEPS.BATHROOM_DETAILS) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-slate-900">
          {t("Bathroom Details", "تفاصيل دورات المياه")}
        </h1>

        <StepperRow
          label={t("Number of bathrooms", "عدد دورات المياه")}
          value={draft.bathroomsCount}
          onChange={(v) => updateDraft("bathroomsCount", v)}
        />

        <hr className="border-slate-100" />

        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-900">
            {t("Bathroom Amenities", "مرافق دورات المياه")}
          </h2>
          <AmenityPillGrid
            items={BATHROOM_AMENITIES}
            selectedIds={draft.bathroomAmenities}
            onToggle={(id) => toggleItem("bathroomAmenities", id)}
            lang={lang}
          />
        </div>

        <CustomAmenityInput
          inputId="custom-bathroom-amenity"
          label={t("Other Bathroom Amenity", "مرافق إضافية لدورة المياه")}
          placeholder={t(
            "Type an amenity (e.g. Hair Dryer, Bidet, Vanity Mirror)",
            "اكتب مرفقاً إضافياً (مثال: مجفف شعر، شطاف، مرآة مكياج)"
          )}
          presetItems={BATHROOM_AMENITIES}
          selectedValues={draft.bathroomAmenities}
          onAdd={(val) => updateDraft("bathroomAmenities", [...draft.bathroomAmenities, val])}
          onRemove={(val) => toggleItem("bathroomAmenities", val)}
          t={t}
        />
      </div>
    );
  }

  return null;
}
