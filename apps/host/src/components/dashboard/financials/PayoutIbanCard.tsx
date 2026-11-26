"use client";

import React, { useState } from "react";
import {
  CreditCard,
  ShieldCheck,
  Edit3,
  Trash2,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Building2,
} from "lucide-react";
import type { HostPayoutIban } from "@/lib/services/hostFinancialsService";
import { EditIbanModal } from "./EditIbanModal";

interface PayoutIbanCardProps {
  ibanData: HostPayoutIban;
  onUpdateIban: (iban: string, accountHolder: string) => Promise<void>;
  onDeleteIban?: () => Promise<void>;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function PayoutIbanCard({
  ibanData,
  onUpdateIban,
  onDeleteIban,
  lang,
  t,
}: PayoutIbanCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("edit");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasConfiguredIban = Boolean(ibanData?.iban && ibanData.iban.trim().length > 0);

  const handleOpenAdd = () => {
    setModalMode("add");
    setModalOpen(true);
  };

  const handleOpenEdit = () => {
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleCopy = () => {
    if (!ibanData?.iban) return;
    navigator.clipboard.writeText(ibanData.iban);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!onDeleteIban) return;
    setIsDeleting(true);
    try {
      await onDeleteIban();
      setConfirmDeleteOpen(false);
    } catch {
      // toast or error handled in parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-[#4F2396] shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {t("Primary Bank Account (IBAN)", "الحساب البنكي المعتمد للتحويل")}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t(
                  "All your guest booking payouts are automatically transferred to this IBAN.",
                  "يتم إيداع عوائد حجوزاتك تلقائياً في هذا الحساب بدون أي تأخير."
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons Header */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {hasConfiguredIban ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-200 bg-violet-50/60 hover:bg-violet-100/70 px-3.5 py-2 text-xs font-black text-[#4F2396] transition cursor-pointer shrink-0"
                >
                  <Edit3 size={14} />
                  <span>{t("Edit", "تعديل")}</span>
                </button>
                {onDeleteIban && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 px-3.5 py-2 text-xs font-bold text-rose-600 transition cursor-pointer shrink-0"
                    title={t("Delete Bank Account", "حذف الحساب البنكي")}
                  >
                    <Trash2 size={14} />
                    <span>{t("Delete", "حذف")}</span>
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-[#4F2396] hover:bg-[#3d1979] px-4 py-2 text-xs font-black text-white shadow-sm shadow-violet-950/20 transition cursor-pointer shrink-0"
              >
                <Plus size={15} />
                <span>{t("Add Bank Account", "إضافة حساب بنكي")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Box */}
        {hasConfiguredIban ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                {t("Bank Name", "اسم البنك")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-black text-slate-900">
                <Building2 size={15} className="text-[#4F2396]" />
                <span>
                  {lang === "ar"
                    ? ibanData.bankNameAr || ibanData.bankNameEn
                    : ibanData.bankNameEn || ibanData.bankNameAr}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                {t("Account Holder", "اسم المستفيد")}
              </span>
              <span className="text-sm font-black text-slate-900">
                {ibanData.accountHolder || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                {t("IBAN", "رقم الآيبان")}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-black font-mono text-[#4F2396] tracking-wide"
                  dir="ltr"
                >
                  {ibanData.formattedIban || ibanData.iban}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                  title={copied ? t("Copied!", "تم النسخ!") : t("Copy IBAN", "نسخ الآيبان")}
                >
                  {copied ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs font-bold text-slate-400">
                {t("Verification Status", "حالة التوثيق")}
              </span>
              {ibanData.isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600">
                  <ShieldCheck size={14} />
                  <span>
                    {t(
                      "Valid IBAN Checksum (Pending SARIE Verification)",
                      "صيغة الآيبان صحيحة (MOD-97 · بانتظار التحقق البنكي)"
                    )}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                  <ShieldCheck size={14} />
                  <span>{t("Pending Verification", "قيد المراجعة")}</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 p-8 text-center space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-[#4F2396]">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">
                {t("No Payout Bank Account Linked", "لم يتم ربط حساب بنكي بعد")}
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {t(
                  "Link your Saudi IBAN to receive automatic payouts for bookings and instant SARIE remittances.",
                  "اربط حسابك البنكي السعودي لاستلام مستحقات وعوائد الحجوزات فوراً بنظام سريع وبأمان تام."
                )}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#4F2396] hover:bg-[#3d1979] px-5 py-2.5 text-xs font-black text-white shadow-md shadow-violet-950/20 transition cursor-pointer"
              >
                <Plus size={16} />
                <span>{t("Add Bank Account Now", "إضافة حساب بنكي الآن")}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      <EditIbanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentIban={ibanData}
        onSave={onUpdateIban}
        onDelete={onDeleteIban}
        mode={modalMode}
        lang={lang}
        t={t}
      />

      {/* Delete Confirmation Modal */}
      {confirmDeleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {t("Delete Bank Account?", "هل تريد بالتأكيد حذف الحساب البنكي؟")}
                </h3>
                <p className="text-xs text-slate-500">
                  {ibanData.formattedIban || ibanData.iban}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                "Removing this bank account will pause automated disbursements until you add a new verified Saudi IBAN. You can add a new account anytime.",
                "حذف الحساب البنكي سيوقف التحويلات التلقائية مؤقتاً حتى تقوم بإضافة آيبان سعودي جديد وتوثيقه. يمكنك إضافة حساب جديد في أي وقت."
              )}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition"
              >
                {t("Cancel", "إلغاء")}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>
                  {isDeleting
                    ? t("Deleting...", "جارٍ الحذف...")
                    : t("Delete Account", "حذف الحساب")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
