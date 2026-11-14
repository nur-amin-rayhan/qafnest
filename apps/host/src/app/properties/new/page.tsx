"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useHostAuth } from "@/context/HostAuthContext";
import { WizardBrandAside } from "@/components/listing-wizard/WizardBrandAside";
import { WizardProgressFooter } from "@/components/listing-wizard/WizardProgressFooter";
import { StepCategoryLocation } from "@/components/listing-wizard/StepCategoryLocation";
import { StepDetailsPricing } from "@/components/listing-wizard/StepDetailsPricing";
import { StepSpecifications } from "@/components/listing-wizard/StepSpecifications";
import { StepAmenitiesFeatures } from "@/components/listing-wizard/StepAmenitiesFeatures";
import { StepPhotosDescription } from "@/components/listing-wizard/StepPhotosDescription";
import { DeletePropertyModal } from "@/components/dashboard/properties/DeletePropertyModal";
import { deleteHostPropertyRequest } from "@/lib/hostPropertyActions";
import {
  DRAFT_STORAGE_KEY,
  TOTAL_STEPS,
  useWizardDraft,
} from "@/components/listing-wizard/useWizardDraft";
import { useWizardSubmit } from "@/components/listing-wizard/useWizardSubmit";
import { localizeHostPath } from "@/lib/hostLocale";

function NewPropertyWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const editId = searchParams.get("edit");
  const { user, loading: authLoading, openHostAuthModal, lang, setLang } = useHostAuth();
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const {
    step,
    setStep,
    draft,
    pin,
    photos,
    setPhotos,
    editingPropertyId,
    adminFeedback,
    loadingEdit,
    draftError,
    setDraftError,
    saveToLocal,
    updateDraft,
    handleSetPin,
    toggleItem,
    handleAddPhotos,
    generateAiDescription,
    canProceed,
  } = useWizardDraft({ mode, editId, lang, t });

  const {
    submitting,
    submitError,
    setSubmitError,
    submitListing,
  } = useWizardSubmit({
    user,
    draft,
    photos,
    pin,
    editingPropertyId,
    router,
    openHostAuthModal,
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState(false);
  const [deletePropertyError, setDeletePropertyError] = useState<string | null>(null);

  const handleConfirmDeleteEditingProperty = async () => {
    if (!editingPropertyId || !user?.id) return;
    setDeletingProperty(true);
    setDeletePropertyError(null);
    try {
      await deleteHostPropertyRequest(editingPropertyId, user.id, lang);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem("qafnest-host-listing-draft-v1");
      } catch {}
      setDeleteModalOpen(false);
      router.push(localizeHostPath("/app?listing=deleted", lang));
      router.refresh();
    } catch (err) {
      setDeletePropertyError(
        err instanceof Error
          ? err.message
          : t("Could not delete this property.", "تعذر حذف العقار.")
      );
    } finally {
      setDeletingProperty(false);
    }
  };

  // Dynamic document title synced with live property title
  useEffect(() => {
    const trimmed =
      lang === "ar"
        ? draft.titleAr.trim() || draft.title.trim()
        : draft.title.trim() || draft.titleAr.trim();
    const baseLabel = editingPropertyId
      ? lang === "ar"
        ? "تعديل العقار"
        : "Edit Property"
      : lang === "ar"
      ? "تسجيل عقار جديد"
      : "Register New Property";
    document.title = trimmed ? `${trimmed} — QafNest Host` : `${baseLabel} — QafNest Host`;
  }, [draft.title, draft.titleAr, editingPropertyId, lang]);

  // Auth protection guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(
        `${localizeHostPath("/", lang)}?auth=required&returnUrl=${encodeURIComponent(
          localizeHostPath("/properties/new", lang)
        )}`
      );
      openHostAuthModal("signup", localizeHostPath("/properties/new?mode=new", lang));
    }
  }, [authLoading, user, router, openHostAuthModal, lang]);

  const handleNext = async () => {
    if (!canProceed()) return;
    if (step < TOTAL_STEPS - 1) {
      const nextIdx = step + 1;
      setStep(nextIdx);
      saveToLocal(draft, nextIdx);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      await submitListing();
    }
  };

  const handlePrev = () => {
    if (step === 0) {
      router.push(localizeHostPath("/app", lang));
      return;
    }
    const prevIdx = Math.max(0, step - 1);
    setStep(prevIdx);
    saveToLocal(draft, prevIdx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (authLoading || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="flex flex-col items-center gap-3 text-center p-8">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-200 border-t-[#4F2396]" />
          <p className="text-sm font-bold text-slate-700">
            {t(
              "Verifying host authentication...",
              "جارٍ التحقق من تسجيل دخول المضيف والتحويل..."
            )}
          </p>
        </div>
      </div>
    );
  }

  if (loadingEdit) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="flex flex-col items-center gap-3 text-center p-8">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-200 border-t-[#4F2396]" />
          <p className="text-sm font-bold text-slate-700">
            {t(
              "Loading property details for editing...",
              "جارٍ تحميل تفاصيل العقار للتعديل..."
            )}
          </p>
        </div>
      </div>
    );
  }

  const activeError = submitError || draftError;

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-white text-slate-900 flex flex-col lg:flex-row font-body"
    >
      {/* 1. Geometric Brand Panel */}
      <WizardBrandAside
        lang={lang}
        setLang={setLang}
        t={t}
        propertyTitle={
          lang === "ar"
            ? draft.titleAr.trim() || draft.title.trim()
            : draft.title.trim() || draft.titleAr.trim()
        }
        category={draft.category}
        isEditing={Boolean(editingPropertyId)}
        step={step}
        totalSteps={TOTAL_STEPS}
      />

      {/* 2. Main Wizard Card */}
      <main className="flex-1 flex items-center justify-center bg-white px-4 py-8 sm:py-12">
        <div className="w-full max-w-[460px] min-h-[760px] rounded-2xl border border-slate-200/90 bg-white shadow-[0_6px_30px_rgba(0,0,0,0.05)] flex flex-col justify-between overflow-hidden">
          {/* Card Body */}
          <div className="p-6 sm:p-8 flex-1 space-y-6">
            {editingPropertyId && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3.5 py-2.5">
                <span className="text-[11px] font-bold text-slate-600">
                  {t("Editing property", "تعديل العقار")}{" "}
                  <span className="font-mono text-slate-900">#{editingPropertyId.slice(0, 8)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDeletePropertyError(null);
                    setDeleteModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>{t("Delete Property", "حذف العقار")}</span>
                </button>
              </div>
            )}

            {activeError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold leading-5 text-rose-700"
              >
                {activeError}
              </div>
            )}

            {/* Admin Review Feedback Banner */}
            {adminFeedback && (
              <div
                role="alert"
                className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900"
              >
                <div className="flex items-center gap-1.5 font-black text-amber-950 mb-1">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                  <span>
                    {t(
                      "Admin Review Feedback & Revisions Required:",
                      "ملاحظات مراجعة الإدارة ومطلوب التعديل:"
                    )}
                  </span>
                </div>
                <p className="font-semibold leading-relaxed text-amber-800">
                  {adminFeedback}
                </p>
                <div className="mt-2 text-[11px] text-amber-700 font-medium">
                  {t(
                    "Update the required fields and submit your revisions. The property will be re-sent for admin review.",
                    "عدّل الحقول المطلوبة ثم أعد إرسال العقار ليتم مراجعته واعتماده من قبل الإدارة."
                  )}
                </div>
              </div>
            )}

            {/* Steps 0, 1, 2: Info & Location */}
            {(step === 0 || step === 1 || step === 2) && (
              <StepCategoryLocation
                step={step}
                draft={draft}
                updateDraft={updateDraft}
                pin={pin}
                setPin={handleSetPin}
                lang={lang}
                t={t}
              />
            )}

            {/* Step 3: Area, Pricing & Facilities */}
            {step === 3 && (
              <StepDetailsPricing
                draft={draft}
                updateDraft={updateDraft}
                toggleItem={toggleItem}
                lang={lang}
                t={t}
              />
            )}

            {/* Steps 4, 5, 6: Bedrooms, Majlis, Bathrooms */}
            {(step === 4 || step === 5 || step === 6) && (
              <StepSpecifications
                step={step}
                draft={draft}
                updateDraft={updateDraft}
                toggleItem={toggleItem}
                lang={lang}
                t={t}
              />
            )}

            {/* Steps 7, 8: Amenities & Features */}
            {(step === 7 || step === 8) && (
              <StepAmenitiesFeatures
                step={step}
                draft={draft}
                toggleItem={toggleItem}
                lang={lang}
                t={t}
              />
            )}

            {/* Steps 9, 10: Description & Photos */}
            {(step === 9 || step === 10) && (
              <StepPhotosDescription
                step={step}
                draft={draft}
                updateDraft={updateDraft}
                photos={photos}
                setPhotos={setPhotos}
                generateAiDescription={generateAiDescription}
                handleAddPhotos={handleAddPhotos}
                lang={lang}
                t={t}
              />
            )}
          </div>

          {/* Progress Bar & Actions */}
          <WizardProgressFooter
            step={step}
            totalSteps={TOTAL_STEPS}
            canProceed={canProceed()}
            submitting={submitting}
            onPrev={handlePrev}
            onNext={handleNext}
            t={t}
          />
        </div>
      </main>

      <DeletePropertyModal
        property={
          deleteModalOpen && editingPropertyId
            ? {
                id: editingPropertyId,
                title: draft.title,
                titleAr: draft.titleAr,
              }
            : null
        }
        busy={deletingProperty}
        error={deletePropertyError}
        lang={lang}
        t={t}
        onCancel={() => {
          if (!deletingProperty) {
            setDeletePropertyError(null);
            setDeleteModalOpen(false);
          }
        }}
        onConfirm={handleConfirmDeleteEditingProperty}
      />
    </div>
  );
}

export default function NewPropertyWizardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <NewPropertyWizardInner />
    </Suspense>
  );
}
