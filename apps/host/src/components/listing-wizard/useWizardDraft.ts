"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { optimizePropertyImageToWebP } from "@/lib/storage/uploadBridge";
import {
  INITIAL_DRAFT,
  getVisibleWizardSteps,
  type WizardArrayField,
  type WizardDraft,
} from "./types";
import {
  buildWizardDescription,
  canProceedWizardStep,
  mapPropertyToWizardDraft,
} from "./wizardDraftMapper";

export const TOTAL_STEPS = 13;
export const DRAFT_STORAGE_KEY = "qafnest-host-listing-draft-v3";

interface UseWizardDraftOptions {
  mode: string | null;
  editId: string | null;
  lang: string;
  t: (en: string, ar: string) => string;
}

function clampBedDistribution(bedroomsCount: number, masterBedsCount: number, singleBedsCount: number) {
  const safeBedrooms = Math.max(0, bedroomsCount);
  const clampedMaster = Math.min(Math.max(0, masterBedsCount), safeBedrooms);
  const clampedSingle = Math.min(Math.max(0, singleBedsCount), Math.max(0, safeBedrooms - clampedMaster));
  return { bedroomsCount: safeBedrooms, masterBedsCount: clampedMaster, singleBedsCount: clampedSingle };
}

export function useWizardDraft({ mode, editId, lang, t }: UseWizardDraftOptions) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(INITIAL_DRAFT);
  const [photos, setPhotos] = useState<{ file?: File; name: string; url: string }[]>([]);
  const [optimizingPhotos, setOptimizingPhotos] = useState(false);
  const [pin, setPin] = useState({ x: 50, y: 50 });
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [draftError, setDraftError] = useState("");
  const tRef = useRef(t);
  tRef.current = t;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    try {
      localStorage.removeItem("qafnest-host-listing-draft-v1");
      localStorage.removeItem("qafnest-host-listing-draft-v2");
      if (mode === "new") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraft(INITIAL_DRAFT);
        setPin({ x: 50, y: 50 });
        setStep(0);
        return;
      }
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (stored && !editId) {
        const parsed = JSON.parse(stored);
        const restoredDraft: WizardDraft = { ...INITIAL_DRAFT, ...parsed };
        setDraft(restoredDraft);
        if (parsed.pin && typeof parsed.pin.x === "number" && typeof parsed.pin.y === "number") {
          setPin(parsed.pin);
        }
        if (mode === "resume" && typeof parsed.step === "number") {
          const validSteps = getVisibleWizardSteps(restoredDraft.mainFacilities);
          setStep(validSteps.includes(parsed.step) ? parsed.step : validSteps[0]);
        }
      }
    } catch {}
  }, [mode, editId]);

  useEffect(() => {
    if (!editId) return;
    let isMounted = true;
    setLoadingEdit(true);

    async function fetchPropertyForEdit() {
      try {
        let authToken: string | undefined;
        try {
          if (isFirebaseConfigured()) {
            const fbUser = getFirebaseAuth().currentUser;
            if (fbUser) authToken = await fbUser.getIdToken();
          }
        } catch {}

        const res = await fetch(`/api/host/properties/${editId}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (!res.ok) throw new Error("Could not load property details");
        const json = await res.json();
        const p = json.property;
        if (!p || !isMounted) return;

        setEditingPropertyId(p.id);
        setAdminFeedback(p.admin_feedback || p.rejection_reason || null);

        const mapped = mapPropertyToWizardDraft(p, langRef.current === "ar" ? "ar" : "en");
        setDraft((prev) => ({ ...prev, ...mapped.draftUpdate }));
        if (mapped.pin) setPin(mapped.pin);
        if (mapped.photos.length > 0) setPhotos(mapped.photos);
      } catch (err) {
        console.error("Error loading property for edit:", err);
        setDraftError(tRef.current("Failed to load property details.", "فشل تحميل تفاصيل العقار للتعديل."));
      } finally {
        if (isMounted) setLoadingEdit(false);
      }
    }

    void fetchPropertyForEdit();
    return () => {
      isMounted = false;
    };
  }, [editId]);

  const saveToLocal = (nextDraft: WizardDraft, nextStep: number, nextPin?: { x: number; y: number }) => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...nextDraft, pin: nextPin ?? pin, step: nextStep }));
  };

  const updateDraft = <K extends keyof WizardDraft>(key: K, val: WizardDraft[K]) => {
    setDraft((prev) => {
      const updated = { ...prev, [key]: val };
      saveToLocal(updated, step);
      return updated;
    });
  };

  const updateBedroomsCount = (nextCount: number) => {
    setDraft((prev) => {
      const updated = { ...prev, ...clampBedDistribution(nextCount, prev.masterBedsCount, prev.singleBedsCount) };
      saveToLocal(updated, step);
      return updated;
    });
  };

  const handleSetPin = (newPin: { x: number; y: number }) => {
    setPin(newPin);
    saveToLocal(draft, step, newPin);
  };

  const toggleItem = (key: WizardArrayField, item: string) => {
    setDraft((prev) => {
      const current = prev[key];
      const next = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
      const updated = { ...prev, [key]: next };
      saveToLocal(updated, step);
      return updated;
    });
  };

  const handleAddPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    e.target.value = "";
    if (rawFiles.length === 0) return;

    const candidateFiles = rawFiles.slice(0, Math.max(0, 12 - photos.length));
    if (candidateFiles.length === 0) return;

    setDraftError("");
    setOptimizingPhotos(true);
    const optimizedFiles: File[] = [];
    try {
      for (const f of candidateFiles) {
        try {
          optimizedFiles.push(await optimizePropertyImageToWebP(f));
        } catch (err) {
          setDraftError(err instanceof Error ? err.message : t("Invalid file selected.", "تم اختيار ملف غير صالح."));
        }
      }
      if (optimizedFiles.length > 0) {
        setPhotos((prev) => [
          ...prev,
          ...optimizedFiles.map((f) => ({ file: f, name: f.name, url: URL.createObjectURL(f) })),
        ]);
      }
    } finally {
      setOptimizingPhotos(false);
    }
  };

  const generateAiDescription = (targetLang?: "ar" | "en") => {
    const effectiveLang: "ar" | "en" = targetLang ?? (lang === "ar" ? "ar" : "en");
    const text = buildWizardDescription(draft, effectiveLang);
    updateDraft(effectiveLang === "ar" ? "descriptionAr" : "description", text);
  };

  return {
    step,
    setStep,
    draft,
    setDraft,
    pin,
    setPin,
    photos,
    setPhotos,
    optimizingPhotos,
    editingPropertyId,
    adminFeedback,
    loadingEdit,
    draftError,
    setDraftError,
    saveToLocal,
    updateDraft,
    updateBedroomsCount,
    handleSetPin,
    toggleItem,
    handleAddPhotos,
    generateAiDescription,
    canProceed: () => canProceedWizardStep(step, draft, photos.length, optimizingPhotos),
  };
}
