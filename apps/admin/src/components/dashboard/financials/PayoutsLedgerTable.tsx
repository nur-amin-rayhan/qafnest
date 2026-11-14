"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, Copy, Eye, PauseCircle, Building2, CheckSquare, Square, BellRing } from "lucide-react";
import { computePayoutSlaMetrics } from "@qafnest/shared";
import type { AdminPayoutRecord } from "@/lib/services/adminFinancialsService";
import { PayoutDetailsModal } from "./PayoutDetailsModal";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface PayoutsLedgerTableProps {
  payouts: AdminPayoutRecord[];
  nowTick?: number;
  onUpdateStatus: (
    payoutId: string,
    status: "disbursed" | "pending" | "processing" | "on_hold",
    holdReason?: string,
    sarieTxnId?: string
  ) => Promise<void>;
  onBatchUpdateStatus?: (
    payoutIds: string[],
    status: "disbursed" | "pending" | "processing" | "on_hold"
  ) => Promise<void>;
  onSendReminder?: (payoutIds: string[]) => Promise<void>;
}

export function PayoutsLedgerTable({
  payouts,
  nowTick = Date.now(),
  onUpdateStatus,
  onBatchUpdateStatus,
  onSendReminder,
}: PayoutsLedgerTableProps) {
  const { t, dir, lang } = useAdminAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutRecord | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>("all");

  const banks = [
    { id: "all", label: t("All Banks", "جميع البنوك") },
    { id: "alrajhi", label: t("Al Rajhi Bank", "مصرف الراجحي") },
    { id: "snb", label: t("SNB", "البنك الأهلي SNB") },
    { id: "riyad", label: t("Riyad Bank", "بنك الرياض") },
    { id: "alinma", label: t("Alinma Bank", "مصرف الإنماء") },
  ];

  const filtered = payouts.filter((p) => {
    if (selectedBank === "all") return true;
    if (selectedBank === "alrajhi") return p.bankName.toLowerCase().includes("rajhi");
    if (selectedBank === "snb") return p.bankName.toLowerCase().includes("national") || p.bankName.includes("SNB");
    if (selectedBank === "riyad") return p.bankName.toLowerCase().includes("riyad");
    if (selectedBank === "alinma") return p.bankName.toLowerCase().includes("inma");
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchDisburse = async () => {
    if (onBatchUpdateStatus && selectedIds.length > 0) {
      await onBatchUpdateStatus(selectedIds, "disbursed");
      setSelectedIds([]);
    }
  };

  const handleBatchHold = async () => {
    if (onBatchUpdateStatus && selectedIds.length > 0) {
      await onBatchUpdateStatus(selectedIds, "on_hold");
      setSelectedIds([]);
    }
  };

  const currencyLabel = t("SAR", "ر.س");

  return (
    <div dir={dir} className="space-y-3">
      {/* Bank Quick Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-outline text-[11px] font-bold me-1 flex items-center gap-1 shrink-0">
          <Building2 size={13} /> {t("Bank:", "البنك:")}
        </span>
        {banks.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelectedBank(b.id)}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer shrink-0 ${
              selectedBank === b.id
                ? "bg-surface-container-high text-primary border border-primary/20"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/20 rounded-2xl animate-in fade-in text-xs">
          <span className="font-bold text-primary">
            {t(
              `${selectedIds.length} Payout${selectedIds.length > 1 ? "s" : ""} Selected`,
              `تم تحديد ${selectedIds.length} دفعة`
            )}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBatchDisburse}
              className="inline-flex items-center gap-1.5 rounded-xl bg-status-emerald px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
            >
              <CheckCircle2 size={13} />
              <span>{t(`Settle Selected (${selectedIds.length})`, `صرف المحدد (${selectedIds.length})`)}</span>
            </button>
            <button
              type="button"
              onClick={handleBatchHold}
              className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
            >
              <PauseCircle size={13} />
              <span>{t("Put on Hold", "تعليق الدفعة")}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-outline hover:text-on-surface cursor-pointer px-2"
            >
              {t("Cancel", "إلغاء")}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-surface-container-high rounded-2xl overflow-hidden bg-surface-container-lowest shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-[840px] w-full text-xs text-start">
            <thead className="bg-surface-container text-on-surface font-extrabold border-b border-surface-container-high">
              <tr>
                <th className="p-3.5 text-center w-8">
                  <button type="button" onClick={handleSelectAll} className="cursor-pointer text-outline hover:text-on-surface">
                    {selectedIds.length === filtered.length && filtered.length > 0 ? (
                      <CheckSquare size={15} className="text-primary" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>
                <th className="p-3.5 text-start">{t("Reference / Date", "المرجع / التاريخ")}</th>
                <th className="p-3.5 text-start">{t("Host & Property", "المضيف والعقار")}</th>
                <th className="p-3.5 text-start">{t("Destination IBAN", "حساب الآيبان المستفيد")}</th>
                <th className="p-3.5 text-end">{t("Gross (SAR)", "الإجمالي (ر.س)")}</th>
                <th className="p-3.5 text-end">{t("Fee", "العمولة")}</th>
                <th className="p-3.5 text-end">{t("Net Payout", "صافي المستحق")}</th>
                <th className="p-3.5 text-center">{t("24h SLA Window", "مهلة الصرف (24 ساعة)")}</th>
                <th className="p-3.5 text-center">{t("Status", "الحالة")}</th>
                <th className="p-3.5 text-end">{t("Actions", "الإجراءات")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-medium text-on-surface">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-outline font-semibold">
                    {t("No host payouts recorded yet.", "لا توجد دفعات مضيفين مسجلة حتى الآن.")}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const sla = computePayoutSlaMetrics(p, nowTick);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPayout(p)}
                      className={`hover:bg-surface-container-low/70 transition cursor-pointer ${
                        isSelected ? "bg-primary/5" : sla.isOverdue ? "bg-rose-50/40" : ""
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => toggleSelect(p.id)} className="cursor-pointer text-outline hover:text-primary">
                          {isSelected ? <CheckSquare size={15} className="text-primary" /> : <Square size={15} />}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-on-surface">
                          <span>{p.reference}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(p.id, p.reference);
                            }}
                            className="text-outline hover:text-on-surface cursor-pointer p-0.5"
                            title={t("Copy Reference", "نسخ المرجع")}
                          >
                            <Copy size={12} />
                          </button>
                          {copiedId === p.id && (
                            <span className="text-[10px] text-status-emerald font-bold">
                              {t("Copied!", "تم النسخ!")}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-on-surface-variant block mt-0.5">{p.scheduledDate}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-on-surface block">{p.hostName}</span>
                        <span className="text-[11px] text-on-surface-variant block mt-0.5 truncate max-w-[180px]">
                          {p.propertyTitle} ({p.staysCount} {t("stays", "إقامات")})
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="text-[11px] text-on-surface-variant block">
                          {p.bankName || t("Not Configured", "غير محدد")}
                        </span>
                        <span className="font-mono text-xs font-bold text-primary block mt-0.5" dir="ltr">
                          {p.iban && p.iban.length >= 8
                            ? `SA${p.iban.slice(2, 4)} **** ${p.iban.slice(-4)}`
                            : t("Not Configured", "غير محدد")}
                        </span>
                      </td>

                      <td className="p-3.5 text-end font-mono">
                        {p.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-end font-mono text-status-emerald">
                        {p.commissionAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-end font-mono font-black text-on-surface text-sm">
                        {currencyLabel} {p.netPayoutAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            sla.tier === "overdue"
                              ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                              : sla.tier === "urgent"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : sla.tier === "on_track"
                              ? "bg-violet-50 text-primary border-violet-200"
                              : sla.tier === "on_hold"
                              ? "bg-surface-container text-outline border-surface-container-high"
                              : "bg-emerald-50 text-status-emerald border-emerald-200"
                          }`}
                        >
                          <Clock size={10} />
                          <span>
                            {lang === "ar" ? sla.countdownLabelAr : sla.countdownLabel}
                          </span>
                        </span>
                        {p.remindedAt && p.status !== "disbursed" && (
                          <span className="text-[9px] text-outline block mt-0.5 font-mono">
                            {t(`Reminded (${p.reminderCount || 1}x)`, `تذكير (${p.reminderCount || 1}×)`)}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {p.status === "disbursed" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-status-emerald border border-emerald-200">
                            <CheckCircle2 size={11} /> <span>{t("Disbursed", "تم الصرف")}</span>
                          </span>
                        )}
                        {p.status === "processing" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                            <Clock size={11} /> <span>{t("Processing", "قيد المعالجة")}</span>
                          </span>
                        )}
                        {p.status === "pending" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-violet-200">
                            <Clock size={11} /> <span>{t("Pending", "قيد الانتظار")}</span>
                          </span>
                        )}
                        {p.status === "on_hold" && (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              <AlertTriangle size={11} /> <span>{t("On Hold", "معلق")}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {onSendReminder && (p.status === "pending" || p.status === "processing") && (
                            <button
                              type="button"
                              onClick={() => onSendReminder([p.id])}
                              className="rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 p-1.5 text-primary transition cursor-pointer"
                              title={t("Send 24h SLA Reminder", "إرسال تذكير مهلة 24 ساعة")}
                            >
                              <BellRing size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedPayout(p)}
                            className="inline-flex items-center gap-1 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-2.5 py-1 text-xs font-bold text-on-surface transition cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>{t("Details", "التفاصيل")}</span>
                          </button>
                          {p.status !== "disbursed" ? (
                            <button
                              type="button"
                              disabled={updatingId === p.id}
                              onClick={async () => {
                                setUpdatingId(p.id);
                                try {
                                  await onUpdateStatus(p.id, "disbursed");
                                } finally {
                                  setUpdatingId(null);
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-status-emerald px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 shadow-xs shrink-0"
                              title={t("Settle / Disburse via SAMA SARIE", "صرف وتحويل عبر نظام سريع")}
                            >
                              <CheckCircle2 size={12} />
                              <span>{t("Settle", "صرف")}</span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PayoutDetailsModal
        payout={selectedPayout}
        onClose={() => setSelectedPayout(null)}
        onUpdateStatus={onUpdateStatus}
      />
    </div>
  );
}
