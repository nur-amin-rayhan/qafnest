"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  Lock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Building2,
  User,
  Phone,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  XCircle,
} from "lucide-react";
import {
  computePayoutSlaMetrics,
  isPayoutPostCheckoutEligible,
  validateLegalTransactionNumber,
} from "@qafnest/shared";
import type { AdminPayoutRecord } from "@/lib/services/adminFinancialsService";
import { downloadPayoutVoucherPdf } from "@/lib/services/downloadPayoutVoucherPdf";
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
  onReviewRequest?: (
    payoutId: string,
    decision: "approved" | "rejected",
    rejectionReason?: string
  ) => Promise<void>;
}

export function PayoutDetailsModal({
  payout,
  onClose,
  onUpdateStatus,
  onReviewRequest,
}: PayoutDetailsModalProps) {
  const { t, dir, lang } = useAdminAuth();
  const [copiedIban, setCopiedIban] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showHoldPrompt, setShowHoldPrompt] = useState(false);
  const [customHoldReason, setCustomHoldReason] = useState("");
  const [customSarieTxn, setCustomSarieTxn] = useState("");
  const [txnTouched, setTxnTouched] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);

  useEffect(() => {
    setCustomSarieTxn("");
    setTxnTouched(false);
    setShowHoldPrompt(false);
    setCustomHoldReason("");
    setShowRejectPrompt(false);
    setRejectReason("");
  }, [payout?.id]);

  if (!payout) return null;
  const sla = computePayoutSlaMetrics(payout);
  const checkoutEligibility = isPayoutPostCheckoutEligible(payout);
  const txnValidation = validateLegalTransactionNumber(customSarieTxn);
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

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadPayoutVoucherPdf(payout);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleStatusChange = async (
    status: "disbursed" | "pending" | "processing" | "on_hold",
    reason?: string
  ) => {
    if (status === "disbursed") {
      setTxnTouched(true);
      if (!checkoutEligibility.eligible || !txnValidation.valid) {
        return;
      }
    }
    setUpdating(true);
    try {
      await onUpdateStatus(
        payout.id,
        status,
        reason,
        status === "disbursed" ? txnValidation.cleaned : undefined
      );
      setShowHoldPrompt(false);
      setCustomSarieTxn("");
      setTxnTouched(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleReviewDecision = async (decision: "approved" | "rejected") => {
    if (!onReviewRequest) return;
    setReviewing(true);
    try {
      await onReviewRequest(
        payout.id,
        decision,
        decision === "rejected" ? rejectReason.trim() || undefined : undefined
      );
      setShowRejectPrompt(false);
      setRejectReason("");
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white"
    >
      <div className="w-full max-w-4xl rounded-xl bg-white dark:bg-[#0E0D16] p-5 sm:p-8 shadow-xl border border-slate-200/90 dark:border-slate-800 space-y-5 max-h-[92vh] overflow-y-auto print:border-none print:shadow-none print:max-w-none print:p-4 text-slate-900 dark:text-slate-100">
        {/* Modal Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">{payout.reference}</span>
            {payout.status === "disbursed" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 size={11} /> <span>{t("Disbursed", "تم الصرف")}</span>
              </span>
            )}
            {payout.status === "pending" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 text-[10px] font-semibold text-[#4F2396] dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                <Clock size={11} /> <span>{t("Scheduled", "مجدولة")}</span>
              </span>
            )}
            {payout.status === "on_hold" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                <AlertTriangle size={11} /> <span>{t("On Hold", "معلقة")}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer shadow-xs"
            >
              <Printer size={13} /> <span>{t("Print Voucher", "طباعة السند")}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Download size={13} className="text-[#4F2396] dark:text-purple-400" />{" "}
              <span>
                {downloadingPdf
                  ? t("Exporting...", "جاري التصدير...")
                  : t("Download Voucher", "تحميل السند (.PDF)")}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label={t("Close", "إغلاق")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Post-Checkout Escrow Protection & SLA Progress Strip */}
        <div
          className={`rounded-xl border p-3 flex flex-wrap items-center justify-between gap-2 text-xs ${
            sla.tier === "escrow"
              ? "border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300"
              : sla.isOverdue
              ? "border-rose-200 dark:border-rose-800/80 bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300"
              : sla.isUrgent
              ? "border-amber-200 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
              : sla.tier === "disbursed"
              ? "border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
              : "border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/40 text-slate-900 dark:text-slate-100"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {sla.tier === "escrow" ? <Lock size={14} /> : <Clock size={14} />}
            <span>
              {sla.tier === "escrow"
                ? t("Escrow Lock (Pre-Check-Out):", "حماية الضمان (قبل مغادرة الضيف):")
                : t("24h Post-Checkout SLA:", "مهلة الـ 24 ساعة بعد المغادرة:")}{" "}
              {lang === "ar" ? sla.countdownLabelAr : sla.countdownLabel}
            </span>
          </div>
          <div className="text-[11px] font-mono opacity-80">
            {t("Deadline:", "الموعد النهائي:")}{" "}
            {new Date(payout.slaDeadlineAt || Date.now()).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}
          </div>
        </div>

        {!checkoutEligibility.eligible && payout.status !== "disbursed" && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/40 p-3 space-y-1 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <Lock size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                {t(
                  "Disbursement Locked Until Guest Check-Out",
                  "صرف المستحقات مقفول حتى إتمام تسجيل خروج الضيف"
                )}
              </span>
            </div>
            <p className="text-[11px] ps-5 font-medium">
              {t(
                checkoutEligibility.reasonEn || "Host payout unlocks after guest check-out.",
                checkoutEligibility.reasonAr || "لا يمكن صرف أو طلب المستحقات قبل إتمام تسجيل مغادرة الضيف."
              )}
            </p>
          </div>
        )}

        {/* Host Payout Request Approval Queue */}
        {payout.payoutRequestStatus && payout.payoutRequestStatus !== "none" && payout.status !== "disbursed" && (
          <div className="rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 p-3.5 space-y-2.5 text-xs print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-[#4F2396] dark:text-purple-300">
                <ShieldCheck size={15} />
                <span>
                  {payout.payoutRequestStatus === "requested"
                    ? t("Host Early / Post-Checkout Payout Request Pending Review", "طلب صرف مستحقات من المضيف بانتظار الاعتماد")
                    : payout.payoutRequestStatus === "approved"
                    ? t("Admin Approved -> Sent to Finance for Bank Transfer", "تم اعتماد الطلب -> بانتظار تحويل قسم المالية وإيصال التحويل")
                    : t("Host Payout Request Declined", "تم رفض طلب التحويل المبكر")}
                </span>
              </div>
              {payout.requestedAt && (
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  {t("Requested:", "تاريخ الطلب:")} {new Date(payout.requestedAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}
                </span>
              )}
            </div>

            {payout.payoutRequestStatus === "rejected" && payout.rejectionReason && (
              <p className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">{payout.rejectionReason}</p>
            )}

            {payout.payoutRequestStatus === "requested" && onReviewRequest && (
              <div className="space-y-2 pt-1">
                {showRejectPrompt && (
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t("Optional decline reason shown to host...", "سبب الرفض (اختياري ويظهر للمضيف)...")}
                    className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-rose-400"
                  />
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReviewDecision("approved")}
                    disabled={reviewing || !checkoutEligibility.eligible}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F2396] hover:bg-[#3D1A78] text-white px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    <CheckCircle2 size={13} />
                    <span>
                      {reviewing
                        ? t("Approving...", "جارٍ الاعتماد...")
                        : t("Approve & Forward to Finance", "اعتماد وإحالة لقسم المالية")}
                    </span>
                  </button>
                  {!showRejectPrompt ? (
                    <button
                      type="button"
                      onClick={() => setShowRejectPrompt(true)}
                      disabled={reviewing}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 px-3 py-1.5 text-xs font-medium transition cursor-pointer"
                    >
                      <XCircle size={13} />
                      <span>{t("Decline Request", "رفض الطلب")}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReviewDecision("rejected")}
                        disabled={reviewing}
                        className="rounded-lg bg-rose-600 text-white hover:bg-rose-700 px-3 py-1.5 text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        {t("Confirm Decline", "تأكيد الرفض")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRejectPrompt(false)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {t("Cancel", "إلغاء")}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hold Reason Alert */}
        {payout.status === "on_hold" && payout.holdReason && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/80 dark:bg-rose-950/40 p-3 space-y-1 text-xs text-rose-900 dark:text-rose-200">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{t("Payout Hold Active:", "تعليق الدفعة مفعّل:")}</span>
            </div>
            <p className="text-[11px] ps-5 font-medium">{payout.holdReason}</p>
          </div>
        )}

        {/* Host Beneficiary & SAMA Banking Details */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/60 p-3.5 sm:p-4 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#4F2396] dark:text-purple-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium block">
                  {t("Host Partner / Beneficiary", "المضيف المستفيد")}
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{payout.hostName}</span>
                {payout.hostEmail && (
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">{payout.hostEmail}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono" dir="ltr">
              <Phone size={12} /> <span>{payout.hostPhone || "—"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t("Accommodation Property", "الوحدة السكنية")}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block mt-0.5">{payout.propertyTitle}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t("Beneficiary Bank", "البنك المستفيد")}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block mt-0.5 flex items-center gap-1">
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <span>{payout.bankName}</span>
              </span>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("SAMA Destination IBAN", "رقم الآيبان المعتمد (ساما)")}</span>
                {payout.iban && (
                  <button
                    type="button"
                    onClick={handleCopyIban}
                    className="text-[10px] text-[#4F2396] dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1 font-medium"
                  >
                    <Copy size={11} />{" "}
                    <span>{copiedIban ? t("Copied!", "تم النسخ!") : t("Copy IBAN", "نسخ الآيبان")}</span>
                  </button>
                )}
              </div>
              <span
                dir="ltr"
                className="font-mono font-semibold text-xs text-slate-900 dark:text-slate-100 block mt-0.5 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                {payout.iban || t("Not Configured", "غير محدد")}
              </span>
              {!payout.iban && (
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-1">
                  {t(
                    "To configure: Host opens Host Portal -> Financials -> Payout Method and saves Beneficiary Name + 24-char Saudi IBAN (SA + 22 digits).",
                    "للإعداد: يدخل المضيف إلى بوابة المضيف > المالية > وسيلة الصرف ويحفظ اسم المستفيد ورقم الآيبان السعودي (SA + 22 رقماً)."
                  )}
                </p>
              )}
            </div>
          </div>

          {payout.sarieTxnId && (
            <div className="border-t border-slate-200/80 dark:border-slate-800 pt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>{t("SAMA SARIE Txn ID:", "رقم حوالة نظام سريع:")}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{payout.sarieTxnId}</span>
            </div>
          )}
        </div>

        {/* Financial Breakdown Table */}
        <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden text-xs bg-white dark:bg-[#0E0D16]">
          <div className="bg-slate-50/90 dark:bg-slate-900/90 p-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
            <span>{t("Disbursement Settlement Breakdown", "تفاصيل تسوية المستحقات المالية")}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
              {t("SAMA Regulated", "خاضع لإشراف البنك المركزي")}
            </span>
          </div>
          <div className="p-3.5 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
            {payout.guestPaidTotal !== undefined && payout.guestPaidTotal > 0 && (
              <div className="flex justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 gap-2">
                <span>{t("Guest Total Paid (incl. Fee & 15% Gov VAT):", "إجمالي المدفوع من الضيف (شاملاً الرسوم وضريبة 15%):")}</span>
                <span className="font-mono shrink-0 text-slate-700 dark:text-slate-300">
                  {currencyLabel} {payout.guestPaidTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 gap-2">
              <span className="text-slate-600 dark:text-slate-400">
                {t(`Host Listing Gross (${payout.staysCount} stays):`, `إجمالي قيمة الإيجار (${payout.staysCount} إقامات):`)}
              </span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                {currencyLabel} {payout.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-[#4F2396] dark:text-purple-300 gap-2">
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
              <div className="flex justify-between pt-1 text-amber-700 dark:text-amber-400 gap-2">
                <span>{t("Less: Promo Code Deduction (post-commission):", "خصم: كود الخصم الترويجي (بعد العمولة):")}</span>
                <span className="font-mono shrink-0">
                  - {currencyLabel} {payout.promoDiscountAmount!.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-slate-500 dark:text-slate-400 text-[11px] gap-2">
              <span>{t("Gov ZATCA VAT (15% Full Booking — Remitted by Platform):", "ضريبة القيمة المضافة 15% (تُورّد بواسطة المنصة للزكاة):")}</span>
              <span className="font-mono shrink-0">
                {currencyLabel} {payout.vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {Boolean(payout.welcomeBonusSubsidyAmount && payout.welcomeBonusSubsidyAmount > 0) && (
              <div className="flex justify-between pt-1 text-purple-700 dark:text-purple-300 text-[11px] gap-2">
                <span>{t("Welcome Bonus Redeemed (100% Platform-Borne):", "مكافأة الترحيب المستخدمة (تتحملها المنصة بالكامل):")}</span>
                <span className="font-mono shrink-0">
                  {currencyLabel} {payout.welcomeBonusSubsidyAmount!.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 font-semibold text-sm text-slate-900 dark:text-slate-100 gap-2">
              <span>{t("Net SAMA SARIE Bank Disbursement:", "صافي التحويل البنكي المستحق عبر نظام سريع:")}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base shrink-0 font-bold">
                {currencyLabel} {payout.netPayoutAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Included Stays List */}
        {payout.bookings && payout.bookings.length > 0 && (
          <div className="space-y-1.5 text-xs">
            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
              {t("Reconciled Stays in this Transfer:", "الإقامات المشمولة في هذه الحوالة:")}
            </span>
            <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {payout.bookings.map((b) => (
                <div key={b.id} className="p-2.5 bg-slate-50/75 dark:bg-slate-900/60 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-semibold text-[#4F2396] dark:text-purple-400 block">{b.reference}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t("Guest:", "الضيف:")} {b.guestName} · {b.checkIn} → {b.checkOut} ({b.nights}
                      {t("n", "ل")})
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                    {currencyLabel} {b.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hold Input Modal/View */}
        {showHoldPrompt && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 text-xs border border-slate-200 dark:border-slate-800 animate-in fade-in">
            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
              {t("Specify Reason for Placing Payout On Hold:", "تحديد سبب تعليق الدفعة:")}
            </span>
            <div className="flex flex-wrap gap-1">
              {holdPresets.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCustomHoldReason(r)}
                  className="rounded-lg bg-white dark:bg-slate-800 px-2 py-1 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:text-[#4F2396] dark:hover:text-purple-400 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
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
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-1 focus:ring-[#4F2396]"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowHoldPrompt(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t("Cancel", "إلغاء")}
              </button>
              <button
                type="button"
                disabled={!customHoldReason.trim() || updating}
                onClick={() => handleStatusChange("on_hold", customHoldReason)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {t("Confirm Hold", "تأكيد التعليق")}
              </button>
            </div>
          </div>
        )}

        {/* Mandatory Legal SARIE / Bank Reference Entry before Settlement */}
        {payout.status !== "disbursed" && !showHoldPrompt && (
          <div className="p-3.5 bg-slate-50/75 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="font-semibold text-slate-900 dark:text-slate-100 block">
                {t(
                  "Legal Bank / SAMA SARIE Transaction Number *",
                  "رقم العملية البنكية الرسمي / سريع (إلزامي للتسوية) *"
                )}
              </label>
              <span className="text-[10px] font-semibold text-[#4F2396] dark:text-purple-300">
                {t("From Finance Receipt", "من إيصال قسم المالية")}
              </span>
            </div>
            <input
              type="text"
              value={customSarieTxn}
              onChange={(e) => {
                setCustomSarieTxn(e.target.value);
                if (!txnTouched) setTxnTouched(true);
              }}
              placeholder={t(
                "Enter official bank / SARIE receipt number (e.g. SARIE-20261115-884120)",
                "أدخل الرقم المرجعي الرسمي من إيصال التحويل البنكي"
              )}
              dir="ltr"
              className={`w-full rounded-lg border bg-white dark:bg-slate-950 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100 outline-none ${
                txnTouched && !txnValidation.valid
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-slate-200 dark:border-slate-700 focus:border-[#4F2396]"
              }`}
            />
            {txnTouched && !txnValidation.valid && (
              <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                {t(
                  txnValidation.errorEn || "Legal bank transaction number is required before settlement.",
                  txnValidation.errorAr || "رقم العملية البنكية الرسمي إلزامي قبل إتمام التسوية."
                )}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-800 print:hidden">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-500" />{" "}
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
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 px-3 py-1.5 text-xs font-medium transition cursor-pointer"
                  >
                    <PauseCircle size={14} /> <span>{t("Place on Hold", "تعليق الدفعة")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusChange("pending")}
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 px-3 py-1.5 text-xs font-medium transition cursor-pointer"
                  >
                    <PlayCircle size={14} /> <span>{t("Release Hold", "فك التعليق")}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleStatusChange("disbursed")}
                  disabled={updating || !checkoutEligibility.eligible || !txnValidation.valid}
                  title={
                    !checkoutEligibility.eligible
                      ? t("Escrow locked until guest check-out", "محجوز في الضمان حتى مغادرة الضيف")
                      : !txnValidation.valid
                      ? t("Enter a valid Legal Bank / SARIE Transaction Number first", "أدخل رقم العملية البنكية الرسمي أولاً")
                      : undefined
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={14} />{" "}
                  <span>
                    {updating
                      ? t("Processing...", "جارٍ التنفيذ...")
                      : !checkoutEligibility.eligible
                      ? t("Locked (Pre-Checkout)", "مقفول (قبل المغادرة)")
                      : t("Settle & Disburse via SARIE", "صرف وتحويل عبر نظام سريع")}
                  </span>
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 size={13} /> <span>{t("Settled & Transferred", "تمت التسوية والتحويل")}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
