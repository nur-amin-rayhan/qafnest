"use client";

import React, { useState } from "react";
import { X, Printer, CheckCircle2, Clock, AlertTriangle, Copy, Building2, User, Phone, ShieldCheck, PauseCircle, PlayCircle } from "lucide-react";
import { computePayoutSlaMetrics } from "@qafnest/shared";
import type { AdminPayoutRecord } from "@/lib/services/adminFinancialsService";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface PayoutDetailsModalProps {
  payout: AdminPayoutRecord | null;
  onClose: () => void;
  onUpdateStatus: (
    payoutId: string,
    status: "disbursed" | "pending" | "processing" | "on_hold",
    holdReason?: string,
    sarieTxnId?: string
  ) => Promise<void>;
}

export function PayoutDetailsModal({ payout, onClose, onUpdateStatus }: PayoutDetailsModalProps) {
  const { t, dir, lang } = useAdminAuth();
  const [copiedIban, setCopiedIban] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showHoldPrompt, setShowHoldPrompt] = useState(false);
  const [customHoldReason, setCustomHoldReason] = useState("");
  const [customSarieTxn, setCustomSarieTxn] = useState("");

  if (!payout) return null;
  const sla = computePayoutSlaMetrics(payout);
  const currencyLabel = t("SAR", "ر.س");
  const holdPresets = [
    t("Security Deposit Damage Claim under Review", "مطالبة أضرار مبلغ التأمين قيد المراجعة"),
    t("IBAN Beneficiary Name Verification Required", "يتطلب التحقق من تطابق اسم المستفيد مع الآيبان"),
    t("Guest Dispute Inquiry", "استفسار أو نزاع من الضيف قيد التحقق"),
  ];

  const handleCopyIban = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(payout.iban);
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleStatusChange = async (
    status: "disbursed" | "pending" | "processing" | "on_hold",
    reason?: string
  ) => {
    setUpdating(true);
    try {
      await onUpdateStatus(
        payout.id,
        status,
        reason,
        status === "disbursed" && customSarieTxn.trim() ? customSarieTxn.trim() : undefined
      );
      setShowHoldPrompt(false);
      setCustomSarieTxn("");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-surface-container-lowest p-6 sm:p-8 shadow-2xl border border-surface-container-high space-y-5 max-h-[92vh] overflow-y-auto print:border-none print:shadow-none print:max-w-none print:p-4 text-on-surface">
        {/* Modal Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-container-high print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-on-surface">{payout.reference}</span>
            {payout.status === "disbursed" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-status-emerald border border-emerald-200">
                <CheckCircle2 size={11} /> <span>{t("Disbursed", "تم الصرف")}</span>
              </span>
            )}
            {payout.status === "pending" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-violet-200">
                <Clock size={11} /> <span>{t("Scheduled", "مجدولة")}</span>
              </span>
            )}
            {payout.status === "on_hold" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                <AlertTriangle size={11} /> <span>{t("On Hold", "معلقة")}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface transition cursor-pointer"
            >
              <Printer size={13} /> <span>{t("Print Voucher", "طباعة السند")}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-outline hover:bg-surface-container cursor-pointer"
              aria-label={t("Close", "إغلاق")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 24-Hour SLA Progress Strip */}
        <div
          className={`rounded-2xl border p-3 flex flex-wrap items-center justify-between gap-2 text-xs ${
            sla.isOverdue
              ? "border-rose-200 bg-rose-50/80 text-rose-900"
              : sla.isUrgent
              ? "border-amber-200 bg-amber-50/80 text-amber-900"
              : sla.tier === "disbursed"
              ? "border-emerald-200 bg-emerald-50/60 text-emerald-900"
              : "border-violet-200 bg-violet-50/50 text-on-surface"
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            <Clock size={14} />
            <span>
              {t("24h SLA Status:", "حالة مهلة الـ 24 ساعة:")}{" "}
              {lang === "ar" ? sla.countdownLabelAr : sla.countdownLabel}
            </span>
          </div>
          <div className="text-[11px] font-mono opacity-80">
            {t("Deadline:", "الموعد النهائي:")}{" "}
            {new Date(payout.slaDeadlineAt || Date.now()).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}
          </div>
        </div>

        {/* Hold Reason Alert */}
        {payout.status === "on_hold" && payout.holdReason && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 space-y-1 text-xs text-rose-900">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={14} className="text-rose-600 shrink-0" />
              <span>{t("Payout Hold Active:", "تعليق الدفعة مفعّل:")}</span>
            </div>
            <p className="text-[11px] ps-5 font-medium">{payout.holdReason}</p>
          </div>
        )}

        {/* Host Beneficiary & SAMA Banking Details */}
        <div className="rounded-2xl border border-surface-container-high bg-surface-container-low p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-surface-container pb-2">
            <div className="flex items-center gap-2">
              <User size={14} className="text-primary" />
              <span className="font-bold text-on-surface">{payout.hostName}</span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant font-mono" dir="ltr">
              <Phone size={12} /> <span>{payout.hostPhone || "—"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[11px] text-outline block">{t("Accommodation Property", "الوحدة السكنية")}</span>
              <span className="font-bold text-on-surface block mt-0.5">{payout.propertyTitle}</span>
            </div>
            <div>
              <span className="text-[11px] text-outline block">{t("Beneficiary Bank", "البنك المستفيد")}</span>
              <span className="font-bold text-on-surface block mt-0.5 flex items-center gap-1">
                <Building2 size={13} className="text-outline shrink-0" />
                <span>{payout.bankName}</span>
              </span>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-outline">{t("SAMA Destination IBAN", "رقم الآيبان المعتمد (ساما)")}</span>
                {payout.iban && (
                  <button
                    type="button"
                    onClick={handleCopyIban}
                    className="text-[10px] text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={11} />{" "}
                    <span>{copiedIban ? t("Copied!", "تم النسخ!") : t("Copy IBAN", "نسخ الآيبان")}</span>
                  </button>
                )}
              </div>
              <span
                dir="ltr"
                className="font-mono font-bold text-xs text-on-surface block mt-0.5 bg-surface-container-lowest p-2 rounded-xl border border-surface-container"
              >
                {payout.iban || t("Not Configured", "غير محدد")}
              </span>
            </div>
          </div>

          {payout.sarieTxnId && (
            <div className="border-t border-surface-container pt-1.5 flex items-center justify-between text-[11px] font-mono text-outline">
              <span>{t("SAMA SARIE Txn ID:", "رقم حوالة نظام سريع:")}</span>
              <span className="font-bold text-status-emerald">{payout.sarieTxnId}</span>
            </div>
          )}
        </div>

        {/* Financial Breakdown Table */}
        <div className="border border-surface-container-high rounded-2xl overflow-hidden text-xs">
          <div className="bg-surface-container p-3 font-extrabold text-on-surface flex items-center justify-between">
            <span>{t("Disbursement Settlement Breakdown", "تفاصيل تسوية المستحقات المالية")}</span>
            <span className="text-[11px] text-on-surface-variant font-normal">
              {t("SAMA Regulated", "خاضع لإشراف البنك المركزي")}
            </span>
          </div>
          <div className="p-3.5 space-y-1.5 divide-y divide-surface-container font-medium">
            {payout.guestPaidTotal !== undefined && payout.guestPaidTotal > 0 && (
              <div className="flex justify-between pt-1 text-[11px] text-outline gap-2">
                <span>{t("Guest Total Paid (incl. Fee & 15% Gov VAT):", "إجمالي المدفوع من الضيف (شاملاً الرسوم وضريبة 15%):")}</span>
                <span className="font-mono shrink-0">
                  {currencyLabel} {payout.guestPaidTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 gap-2">
              <span className="text-on-surface-variant">
                {t(`Host Listing Gross (${payout.staysCount} stays):`, `إجمالي قيمة الإيجار (${payout.staysCount} إقامات):`)}
              </span>
              <span className="font-mono font-bold shrink-0">
                {currencyLabel} {payout.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-primary gap-2">
              <span>
                {t(
                  `Less: ${Math.round((payout.commissionRate || 0.2) * 100)}% Host Commission (on listing):`,
                  `خصم: عمولة المنصة ${Math.round((payout.commissionRate || 0.2) * 100)}% (من قيمة العقار):`
                )}
              </span>
              <span className="font-mono shrink-0">
                - {currencyLabel} {payout.commissionAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {Boolean(payout.promoDiscountAmount && payout.promoDiscountAmount > 0) && (
              <div className="flex justify-between pt-1 text-amber-700 gap-2">
                <span>{t("Less: Promo Code Deduction (post-commission):", "خصم: كود الخصم الترويجي (بعد العمولة):")}</span>
                <span className="font-mono shrink-0">
                  - {currencyLabel} {payout.promoDiscountAmount!.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-outline text-[11px] gap-2">
              <span>{t("Gov ZATCA VAT (15% Full Booking — Remitted by Platform):", "ضريبة القيمة المضافة 15% (تُورّد بواسطة المنصة للزكاة):")}</span>
              <span className="font-mono shrink-0">
                {currencyLabel} {payout.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {Boolean(payout.welcomeBonusSubsidyAmount && payout.welcomeBonusSubsidyAmount > 0) && (
              <div className="flex justify-between pt-1 text-violet-700 text-[11px] gap-2">
                <span>{t("Welcome Bonus Redeemed (100% Platform-Borne):", "مكافأة الترحيب المستخدمة (تتحملها المنصة بالكامل):")}</span>
                <span className="font-mono shrink-0">
                  {currencyLabel} {payout.welcomeBonusSubsidyAmount!.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 font-black text-sm text-on-surface gap-2">
              <span>{t("Net SAMA SARIE Bank Disbursement:", "صافي التحويل البنكي المستحق عبر نظام سريع:")}</span>
              <span className="font-mono text-status-emerald text-base shrink-0">
                {currencyLabel} {payout.netPayoutAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Included Stays List */}
        {payout.bookings && payout.bookings.length > 0 && (
          <div className="space-y-1.5 text-xs">
            <span className="font-bold text-on-surface block">
              {t("Reconciled Stays in this Transfer:", "الإقامات المشمولة في هذه الحوالة:")}
            </span>
            <div className="border border-surface-container rounded-2xl overflow-hidden divide-y divide-surface-container">
              {payout.bookings.map((b) => (
                <div key={b.id} className="p-2.5 bg-surface-container-low flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-primary block">{b.reference}</span>
                    <span className="text-[11px] text-on-surface-variant">
                      {t("Guest:", "الضيف:")} {b.guestName} · {b.checkIn} → {b.checkOut} ({b.nights}
                      {t("n", "ل")})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-on-surface shrink-0">
                    {currencyLabel} {b.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hold Input Modal/View */}
        {showHoldPrompt && (
          <div className="p-3 bg-surface-container-high rounded-2xl space-y-2 text-xs border border-surface-container animate-in fade-in">
            <span className="font-bold text-on-surface block">
              {t("Specify Reason for Placing Payout On Hold:", "تحديد سبب تعليق الدفعة:")}
            </span>
            <div className="flex flex-wrap gap-1">
              {holdPresets.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCustomHoldReason(r)}
                  className="rounded-lg bg-surface-container-lowest px-2 py-1 text-[10px] font-semibold text-on-surface-variant hover:text-primary cursor-pointer border border-surface-container"
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customHoldReason}
              onChange={(e) => setCustomHoldReason(e.target.value)}
              placeholder={t("Enter custom hold reason...", "أدخل سبب التعليق...")}
              className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest p-2 text-xs text-on-surface outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowHoldPrompt(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-outline hover:bg-surface-container cursor-pointer"
              >
                {t("Cancel", "إلغاء")}
              </button>
              <button
                type="button"
                disabled={!customHoldReason.trim() || updating}
                onClick={() => handleStatusChange("on_hold", customHoldReason)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                {t("Confirm Hold", "تأكيد التعليق")}
              </button>
            </div>
          </div>
        )}

        {/* SARIE / Bank Reference Entry when pending */}
        {payout.status !== "disbursed" && !showHoldPrompt && (
          <div className="p-3 bg-surface-container-low rounded-2xl border border-surface-container space-y-1.5 text-xs print:hidden">
            <label className="font-bold text-on-surface block">
              {t("Bank Transfer Reference / SARIE Txn ID (Optional)", "مرجع التحويل البنكي / رقم عملية سريع (اختياري)")}
            </label>
            <input
              type="text"
              value={customSarieTxn}
              onChange={(e) => setCustomSarieTxn(e.target.value)}
              placeholder={t("e.g. SARIE-20261110-991042 (auto-generated if blank)", "مثال: SARIE-20261110-991042 (توليد تلقائي عند الترك فارغاً)")}
              dir="ltr"
              className="w-full rounded-xl border border-surface-container-high bg-surface-container-lowest p-2 font-mono text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-surface-container print:hidden">
          <span className="text-[11px] text-outline font-medium flex items-center gap-1">
            <ShieldCheck size={13} className="text-status-emerald" />{" "}
            <span>{t("SAMA & MoT Compliant", "متوافق مع البنك المركزي ووزارة السياحة")}</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {payout.status !== "disbursed" ? (
              <>
                {payout.status !== "on_hold" ? (
                  <button
                    type="button"
                    onClick={() => setShowHoldPrompt(true)}
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-2 text-xs font-bold transition cursor-pointer"
                  >
                    <PauseCircle size={14} /> <span>{t("Place on Hold", "تعليق الدفعة")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusChange("pending")}
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-status-emerald hover:bg-emerald-100 px-3 py-2 text-xs font-bold transition cursor-pointer"
                  >
                    <PlayCircle size={14} /> <span>{t("Release Hold", "فك التعليق")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleStatusChange("disbursed")}
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-status-emerald text-white hover:bg-emerald-700 px-4 py-2 text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  <CheckCircle2 size={14} />{" "}
                  <span>
                    {updating
                      ? t("Processing...", "جارٍ التنفيذ...")
                      : t("Settle & Disburse via SARIE", "صرف وتحويل عبر نظام سريع")}
                  </span>
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 text-status-emerald px-3 py-1.5 text-xs font-bold border border-emerald-200">
                <CheckCircle2 size={13} /> <span>{t("Settled & Transferred", "تمت التسوية والتحويل")}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
