"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Eye,
  PauseCircle,
  Building2,
  CheckSquare,
  Square,
  BellRing,
  Lock,
} from "lucide-react";
import { computePayoutSlaMetrics, isPayoutPostCheckoutEligible } from "@qafnest/shared";
import type { AdminPayoutRecord } from "@/lib/services/adminFinancialsService";
import { PayoutDetailsModal } from "./PayoutDetailsModal";
import { BatchSettlementTxnModal } from "./BatchSettlementTxnModal";
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
    status: "disbursed" | "pending" | "processing" | "on_hold",
    sarieTxnId?: string
  ) => Promise<void>;
  onReviewRequest?: (
    payoutId: string,
    decision: "approved" | "rejected",
    rejectionReason?: string
  ) => Promise<void>;
  onSendReminder?: (payoutIds: string[]) => Promise<void>;
}

export function PayoutsLedgerTable({
  payouts,
  nowTick = Date.now(),
  onUpdateStatus,
  onBatchUpdateStatus,
  onReviewRequest,
  onSendReminder,
}: PayoutsLedgerTableProps) {
  const { t, dir, lang } = useAdminAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutRecord | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>("all");
  const [showBatchTxnModal, setShowBatchTxnModal] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  useEffect(() => {
    setSelectedPayout((prev) =>
      prev ? payouts.find((p) => p.id === prev.id) || null : null
    );
  }, [payouts]);

  useEffect(() => {
    if (typeof window === "undefined" || payouts.length === 0) return;
    const targetId = new URLSearchParams(window.location.search).get("payoutId");
    if (targetId && selectedPayout?.id !== targetId) {
      const match = payouts.find((p) => p.id === targetId);
      if (match) {
        setSelectedPayout(match);
      }
    }
  }, [payouts, selectedPayout?.id]);

  const handleCloseModal = () => {
    setSelectedPayout(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("payoutId")) {
        url.searchParams.delete("payoutId");
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      }
    }
  };

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

  const handleBatchDisburse = () => {
    if (onBatchUpdateStatus && selectedIds.length > 0) {
      setShowBatchTxnModal(true);
    }
  };

  const handleConfirmBatchDisburse = async (legalTxnId: string) => {
    if (!onBatchUpdateStatus || selectedIds.length === 0) return;
    setBatchSubmitting(true);
    try {
      await onBatchUpdateStatus(selectedIds, "disbursed", legalTxnId);
      setSelectedIds([]);
      setShowBatchTxnModal(false);
    } finally {
      setBatchSubmitting(false);
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
        <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium me-1 flex items-center gap-1 shrink-0">
          <Building2 size={13} /> {t("Bank:", "البنك:")}
        </span>
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto">
          {banks.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBank(b.id)}
              className={`rounded-md px-2.5 py-1 text-[11px] transition cursor-pointer shrink-0 whitespace-nowrap ${
                selectedBank === b.id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-xl animate-in fade-in text-xs">
          <span className="font-bold text-[#4F2396] dark:text-purple-300">
            {t(
              `${selectedIds.length} Payout${selectedIds.length > 1 ? "s" : ""} Selected`,
              `تم تحديد ${selectedIds.length} دفعة`
            )}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBatchDisburse}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-xs"
            >
              <CheckCircle2 size={13} />
              <span>{t(`Settle Selected (${selectedIds.length})`, `صرف المحدد (${selectedIds.length})`)}</span>
            </button>
            <button
              type="button"
              onClick={handleBatchHold}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
            >
              <PauseCircle size={13} />
              <span>{t("Put on Hold", "تعليق الدفعة")}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer px-2"
            >
              {t("Cancel", "إلغاء")}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0E0D16] shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-[840px] w-full text-xs sm:text-sm text-start">
            <thead className="bg-slate-50/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 text-xs">
              <tr>
                <th className="p-3.5 text-center w-8">
                  <button type="button" onClick={handleSelectAll} className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {selectedIds.length === filtered.length && filtered.length > 0 ? (
                      <CheckSquare size={16} className="text-[#4F2396] dark:text-purple-400" />
                    ) : (
                      <Square size={16} />
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-900 dark:text-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium text-xs sm:text-sm">
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
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
                        isSelected
                          ? "bg-purple-50/50 dark:bg-purple-950/20"
                          : sla.isOverdue
                          ? "bg-rose-50/40 dark:bg-rose-950/20"
                          : ""
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleSelect(p.id)}
                          className="cursor-pointer text-slate-400 hover:text-[#4F2396] dark:hover:text-purple-400"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-[#4F2396] dark:text-purple-400" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          <span>{p.reference}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(p.id, p.reference);
                            }}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                            title={t("Copy Reference", "نسخ المرجع")}
                          >
                            <Copy size={13} />
                          </button>
                          {copiedId === p.id && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              {t("Copied!", "تم النسخ!")}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">{p.scheduledDate}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm block">{p.hostName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 truncate max-w-[200px]">
                          {p.propertyTitle} ({p.staysCount} {t("stays", "إقامات")})
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">
                          {p.bankName || t("Not Configured", "غير محدد")}
                        </span>
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 block mt-0.5" dir="ltr">
                          {p.iban && p.iban.length >= 8
                            ? `SA${p.iban.slice(2, 4)} **** ${p.iban.slice(-4)}`
                            : t("Not Configured", "غير محدد")}
                        </span>
                      </td>

                      <td className="p-3.5 text-end font-mono font-medium text-slate-900 dark:text-slate-100 text-sm">
                        {p.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-end font-mono font-medium text-emerald-600 dark:text-emerald-400 text-sm">
                        {p.commissionAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-end font-mono font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                        {currencyLabel} {p.netPayoutAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            sla.tier === "escrow"
                              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                              : sla.tier === "overdue"
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 animate-pulse"
                              : sla.tier === "urgent"
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              : sla.tier === "on_track"
                              ? "bg-purple-50 dark:bg-purple-950/60 text-[#4F2396] dark:text-purple-300 border-purple-200 dark:border-purple-800"
                              : sla.tier === "on_hold"
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {sla.tier === "escrow" ? <Lock size={12} /> : <Clock size={12} />}
                          <span>
                            {lang === "ar" ? sla.countdownLabelAr : sla.countdownLabel}
                          </span>
                        </span>
                        {p.remindedAt && p.status !== "disbursed" && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5 font-mono">
                            {t(`Reminded (${p.reminderCount || 1}x)`, `تذكير (${p.reminderCount || 1}×)`)}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {p.status === "disbursed" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 size={13} /> <span>{t("Disbursed", "تم الصرف")}</span>
                            </span>
                          )}
                          {p.status === "processing" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Clock size={13} /> <span>{t("Processing", "قيد المعالجة")}</span>
                            </span>
                          )}
                          {p.status === "pending" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 text-xs font-semibold text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <Clock size={13} /> <span>{t("Pending", "قيد الانتظار")}</span>
                            </span>
                          )}
                          {p.status === "on_hold" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <AlertTriangle size={13} /> <span>{t("On Hold", "معلق")}</span>
                            </span>
                          )}
                          {p.status !== "disbursed" && p.payoutRequestStatus === "requested" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 text-xs font-bold text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {t("Host Req · Review", "طلب مضيف")}
                            </span>
                          )}
                          {p.status !== "disbursed" && p.payoutRequestStatus === "approved" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {t("Approved · Awaiting Txn", "معتمد للمالية")}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {onSendReminder && (p.status === "pending" || p.status === "processing") && sla.tier !== "escrow" && (
                            <button
                              type="button"
                              onClick={() => onSendReminder([p.id])}
                              className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 p-1.5 text-[#4F2396] dark:text-purple-300 transition cursor-pointer"
                              title={t("Send 24h SLA Reminder", "إرسال تذكير مهلة 24 ساعة")}
                            >
                              <BellRing size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedPayout(p)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-xs"
                          >
                            <Eye size={13} />
                            <span>{t("Details", "التفاصيل")}</span>
                          </button>
                          {p.status !== "disbursed" ? (
                            isPayoutPostCheckoutEligible(p).eligible ? (
                              <button
                                type="button"
                                onClick={() => setSelectedPayout(p)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-xs shrink-0"
                                title={t("Open dossier to enter Legal Txn # & settle", "فتح السجل لإدخال المرجع الرسمي والتسوية")}
                              >
                                <CheckCircle2 size={13} />
                                <span>{t("Txn & Settle", "صرف برقم")}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedPayout(p)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition cursor-pointer shrink-0"
                                title={t("Locked in escrow until guest check-out", "محجوز في الضمان حتى مغادرة الضيف")}
                              >
                                <Lock size={12} />
                                <span>{t("Escrow", "ضمان")}</span>
                              </button>
                            )
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
        onClose={handleCloseModal}
        onUpdateStatus={onUpdateStatus}
        onReviewRequest={onReviewRequest}
      />

      <BatchSettlementTxnModal
        isOpen={showBatchTxnModal}
        titleEn={`Settle ${selectedIds.length} Selected Payout(s)`}
        titleAr={`تسوية ${selectedIds.length} دفعة محددة`}
        subtitleEn="Enter the official Legal Bank / SARIE Transaction Reference from Finance before marking selected payouts as disbursed."
        subtitleAr="أدخل الرقم المرجعي الرسمي من إيصال التحويل البنكي قبل اعتماد صرف الدفعات المحددة."
        submitting={batchSubmitting}
        onClose={() => setShowBatchTxnModal(false)}
        onConfirm={handleConfirmBatchDisburse}
      />
    </div>
  );
}
