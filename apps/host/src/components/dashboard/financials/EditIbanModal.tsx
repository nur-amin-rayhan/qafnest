"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Building2,
  Trash2,
  CheckCircle2,
  Loader2,
  Plus,
} from "lucide-react";
import {
  detectSaudiBank,
  validateSaudiIban,
  formatSaudiIban,
} from "@/lib/financials/saudiBanks";
import type { HostPayoutIban } from "@/lib/services/hostFinancialsService";

interface EditIbanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIban: HostPayoutIban;
  onSave: (iban: string, accountHolder: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  mode?: "add" | "edit";
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function EditIbanModal({
  isOpen,
  onClose,
  currentIban,
  onSave,
  onDelete,
  mode,
  lang,
  t,
}: EditIbanModalProps) {
  const isAddMode = mode === "add" || !currentIban.iban;

  const [ibanInput, setIbanInput] = useState(isAddMode ? "" : currentIban.iban);
  const [holderInput, setHolderInput] = useState(
    isAddMode ? "" : currentIban.accountHolder
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever modal opens or currentIban changes
  useEffect(() => {
    if (isOpen) {
      const isAdd = mode === "add" || !currentIban.iban;
      setIbanInput(isAdd ? "" : currentIban.iban || "");
      setHolderInput(isAdd ? "" : currentIban.accountHolder || "");
      setError(null);
      setConfirmDelete(false);
      setSaving(false);
      setDeleting(false);
    }
  }, [isOpen, currentIban, mode]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanIban = ibanInput.replace(/\s+/g, "").toUpperCase();
  const detectedBank = detectSaudiBank(cleanIban);
  const validation = validateSaudiIban(cleanIban);
  const hasMinBankCode = cleanIban.startsWith("SA") && cleanIban.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid) {
      setError(
        lang === "ar"
          ? validation.errorAr || "آيبان غير صحيح"
          : validation.errorEn || "Invalid Saudi IBAN"
      );
      return;
    }
    if (!holderInput.trim()) {
      setError(t("Please enter account holder name", "يرجى كتابة اسم المستفيد"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(cleanIban, holderInput.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update IBAN");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove IBAN");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-[#4F2396]">
              {isAddMode ? <Plus size={20} /> : <CreditCard size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {isAddMode
                  ? t("Add Payout Bank Account", "إضافة حساب بنكي للاستلام")
                  : t("Edit Payout Bank Account", "تعديل الحساب البنكي للتحويل")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t(
                  "Must match the Saudi National ID of the registered host.",
                  "يجب أن يطابق هوية المضيف المسجلة بنكياً لدى سماء."
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-800">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Delete confirmation banner if triggered inside modal */}
        {confirmDelete ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  {t(
                    "Are you sure you want to delete this bank account?",
                    "هل أنت متأكد من رغبتك في حذف هذا الحساب البنكي؟"
                  )}
                </h4>
                <p className="mt-1 text-[11px] text-rose-700 leading-relaxed">
                  {t(
                    "Booking remittances will be paused until you add a new verified Saudi IBAN.",
                    "سيتم إيقاف التحويلات البنكية مؤقتاً حتى تقوم بإضافة آيبان سعودي جديد وتوثيقه."
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {t("Cancel", "إلغاء")}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                <span>{deleting ? t("Deleting...", "جارٍ الحذف...") : t("Confirm Delete", "تأكيد الحذف")}</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t("Account Holder Full Name", "اسم صاحب الحساب (رباعي)")}
            </label>
            <input
              type="text"
              value={holderInput}
              onChange={(e) => setHolderInput(e.target.value)}
              placeholder={t(
                "e.g. Account Holder Full Name",
                "مثال: الاسم الكامل لصاحب الحساب كما في الهوية"
              )}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#4F2396] focus:bg-white transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {t("Saudi IBAN (24 characters)", "رقم الآيبان السعودي (24 خانة)")}
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {cleanIban.length}/24
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={ibanInput}
                onChange={(e) =>
                  setIbanInput(e.target.value.replace(/\s+/g, "").toUpperCase())
                }
                placeholder="SA00 0000 0000 0000 0000 0000"
                maxLength={24}
                required
                dir="ltr"
                className={`w-full rounded-2xl border px-4 py-3 font-mono text-sm font-black text-slate-900 outline-none transition tracking-wider ${
                  validation.valid
                    ? "border-emerald-300 bg-emerald-50/20 focus:border-emerald-500"
                    : "border-slate-200 bg-slate-50 focus:border-[#4F2396] focus:bg-white"
                }`}
              />
            </div>
            <p className="mt-1 text-[11px] font-mono text-slate-400" dir="ltr">
              {formatSaudiIban(cleanIban)}
            </p>
          </div>

          {/* Real-Time Auto-Detected Saudi Bank Badge */}
          {hasMinBankCode && detectedBank && (
            <div className="flex items-center justify-between rounded-2xl border border-violet-100 bg-violet-50/70 p-3.5 text-xs animate-in fade-in">
              <span className="flex items-center gap-2 font-black text-[#4F2396]">
                <Building2 size={16} className="text-[#4F2396]" />
                <span>{lang === "ar" ? detectedBank.nameAr : detectedBank.nameEn}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-lg text-[11px]">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>{t("SAMA Licensed Bank", "بنك مرخص لدى سماء")}</span>
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            {/* Delete button (only in edit mode when an account exists) */}
            {!isAddMode && onDelete && !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{t("Delete this account", "حذف هذا الحساب")}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto rounded-2xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition"
              >
                {t("Cancel", "إلغاء")}
              </button>
              <button
                type="submit"
                disabled={saving || deleting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#4F2396] px-6 py-2.5 text-xs font-black text-white hover:bg-[#3d1979] shadow-md shadow-violet-950/20 disabled:opacity-50 cursor-pointer transition"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{t("Saving & Verifying...", "جارٍ التوثيق والحفظ...")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>
                      {isAddMode
                        ? t("Add & Verify IBAN", "إضافة وتوثيق الآيبان")
                        : t("Save & Update IBAN", "حفظ وتحديث الآيبان")}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
