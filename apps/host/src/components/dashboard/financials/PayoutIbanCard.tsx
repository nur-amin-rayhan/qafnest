"use client";

import React, { useState } from "react";
import { CreditCard, ShieldCheck, Edit3 } from "lucide-react";
import type { HostPayoutIban } from "@/lib/services/hostFinancialsService";
import { EditIbanModal } from "./EditIbanModal";

interface PayoutIbanCardProps {
  ibanData: HostPayoutIban;
  onUpdateIban: (iban: string, accountHolder: string) => Promise<void>;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function PayoutIbanCard({ ibanData, onUpdateIban, lang, t }: PayoutIbanCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-100 text-[#4F2396]">
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

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-200 bg-violet-50/60 hover:bg-violet-100/70 px-4 py-2 text-xs font-black text-[#4F2396] transition cursor-pointer shrink-0"
          >
            <Edit3 size={14} />
            <span>{t("Edit IBAN", "تعديل الآيبان")}</span>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{t("Bank Name", "اسم البنك")}</span>
            <span className="text-sm font-black text-slate-900">
              {ibanData.iban
                ? lang === "ar"
                  ? ibanData.bankNameAr || ibanData.bankNameEn
                  : ibanData.bankNameEn || ibanData.bankNameAr
                : t("Not Configured", "غير مضاف")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{t("Account Holder", "اسم المستفيد")}</span>
            <span className="text-sm font-black text-slate-900">
              {ibanData.accountHolder || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">{t("IBAN", "رقم الآيبان")}</span>
            <span className="text-sm font-black font-mono text-[#4F2396] tracking-wide" dir={ibanData.iban ? "ltr" : undefined}>
              {ibanData.formattedIban || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-xs font-bold text-slate-400">{t("Verification Status", "حالة التوثيق")}</span>
            {ibanData.iban && ibanData.isVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600">
                <ShieldCheck size={14} />
                <span>{t("Verified by Saudi Central Bank (SAMA)", "موثق بنكياً لدى البنك المركزي السعودي")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                <ShieldCheck size={14} className="text-slate-300" />
                <span>{t("Not Configured — Add IBAN to verify", "غير مضاف — أضف الآيبان للتوثيق")}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <EditIbanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentIban={ibanData}
        onSave={onUpdateIban}
        lang={lang}
        t={t}
      />
    </>
  );
}
