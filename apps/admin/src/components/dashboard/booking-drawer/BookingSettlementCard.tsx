"use client";

import React from "react";
import { Building2, ExternalLink, Landmark, RotateCcw } from "lucide-react";
import type { BookingSettlementBreakdown } from "@qafnest/shared/platformFee";
import { validateLegalTransactionNumber } from "@qafnest/shared";
import type { SelectedBookingDetail } from "../types";

export function BookingTransferRefundBanner({
  selectedBooking,
  isCancelled,
  currencyLabel,
  bookingStatusMap,
  refundTxnNumber,
  setRefundTxnNumber,
  refundTxnTouched,
  setRefundTxnTouched,
  updatingAction,
  onDisburseRefund,
  t,
}: {
  selectedBooking: SelectedBookingDetail;
  isCancelled: boolean;
  currencyLabel: string;
  bookingStatusMap: Record<string, string>;
  refundTxnNumber: string;
  setRefundTxnNumber: (v: string) => void;
  refundTxnTouched: boolean;
  setRefundTxnTouched: (v: boolean) => void;
  updatingAction: "confirm" | "cancel" | "disburse" | null;
  onDisburseRefund: (txn: string) => void;
  t: (en: string, ar: string) => string;
}) {
  const refund = selectedBooking.refund;
  const transferClaim = selectedBooking.transferClaim;
  if (!transferClaim && !(isCancelled && refund)) return null;

  const refundTxnValidation = validateLegalTransactionNumber(refundTxnNumber);
  const refundStatusMap: Record<string, string> = {
    disbursed: t("DISBURSED", "تم الصرف"),
    pending: t("PENDING", "قيد الانتظار"),
    processing: t("PROCESSING", "قيد المعالجة"),
    failed: t("FAILED", "فشل الصرف"),
    cancelled: t("CANCELLED", "ملغي"),
  };
  const policyTierMap: Record<string, string> = {
    non_refundable: t("Non-Refundable (0%)", "غير قابل للاسترداد (٠٪)"),
    admin_override: t("Exceptional Manual Refund", "استرداد استثنائي يدوي"),
    "1hr_instant_grace": t("Legacy 1h Grace (100%)", "سماح سابق (١٠٠٪)"),
    over_48h: t("Legacy 48h+ (100%)", "سياسة سابقة (١٠٠٪)"),
    full_48h: t("Legacy 48h+ (100%)", "سياسة سابقة (١٠٠٪)"),
    "24_48h": t("Legacy 24h–48h (50%)", "سياسة سابقة (٥٠٪)"),
    under_24h: t("Non-Refundable (0%)", "غير قابل للاسترداد (٠٪)"),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {transferClaim && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>{t("Guest Submitted Bank Transfer Reference", "إشعار تحويل بنكي مرفوع من الضيف")}</span>
          </div>
          <p className="font-mono font-bold">
            {t("Ref", "المرجع")}: #{transferClaim.transferReference} ({transferClaim.bankName})
          </p>
          <p className="text-[11px] text-amber-800">
            {t("Sender", "المحول")}: {transferClaim.senderName || t("Guest", "ضيف")} ·{" "}
            {t("Status", "الحالة")}: {bookingStatusMap[transferClaim.status] || transferClaim.status}
          </p>
        </div>
      )}

      {isCancelled && refund && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2.5">
          <div className="flex items-center justify-between font-bold text-emerald-900 text-sm">
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-emerald-700" />
              {t("Refund Lifecycle Tracking", "متابعة دورة الاسترداد المالي")}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] uppercase font-bold">
              {refundStatusMap[refund.status] || refund.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-slate-700 pt-1.5 border-t border-emerald-200/70">
            <div>
              <span className="text-slate-500 block text-[11px]">{t("Refund Amount", "مبلغ الاسترداد")}</span>
              <strong className="text-emerald-800 font-mono text-sm">
                {refund.refundAmount} {currencyLabel}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">{t("Policy Tier", "شريحة السياسة")}</span>
              <strong className="text-slate-800">{policyTierMap[refund.policyTier] || refund.policyTier}</strong>
            </div>
          </div>
          {refund.status !== "disbursed" && (
            <div className="space-y-2 pt-2 border-t border-emerald-200/70">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t("Legal Bank Refund Transaction Number *", "رقم العملية البنكية الرسمي للاسترداد *")}
                </label>
                <input
                  type="text"
                  value={refundTxnNumber}
                  onChange={(e) => {
                    setRefundTxnNumber(e.target.value);
                    if (!refundTxnTouched) setRefundTxnTouched(true);
                  }}
                  dir="ltr"
                  placeholder={t("Enter legal bank receipt reference (min 6 chars)", "أدخل الرقم المرجعي الرسمي من إيصال التحويل البنكي")}
                  className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-emerald-600"
                />
                {refundTxnTouched && !refundTxnValidation.valid && (
                  <p className="text-[10px] font-bold text-rose-600 mt-1">
                    {t(refundTxnValidation.errorEn || "Legal bank transaction number is required.", refundTxnValidation.errorAr || "رقم العملية البنكية الرسمي مطلوب.")}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={updatingAction !== null || !refundTxnValidation.valid}
                onClick={() => {
                  setRefundTxnTouched(true);
                  if (!refundTxnValidation.valid) return;
                  onDisburseRefund(refundTxnValidation.cleaned);
                }}
                className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {updatingAction === "disburse" ? t("Marking...", "جاري التحديث...") : t("Mark Refund Disbursed via Bank Rail", "تأكيد إتمام التحويل البنكي للاسترداد")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BookingSettlementSections({
  selectedBooking,
  s,
  stayNights,
  currencyLabel,
  onOpenFinancials,
  onClose,
  t,
}: {
  selectedBooking: SelectedBookingDetail;
  s: BookingSettlementBreakdown;
  stayNights: number;
  currencyLabel: string;
  onOpenFinancials?: () => void;
  onClose: () => void;
  t: (en: string, ar: string) => string;
}) {
  const payout = selectedBooking.payoutSummary;
  return (
    <>
      <section className="rounded-2xl bg-surface-container-lowest border border-surface-container p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-container">
          <h3 className="font-title-sm text-sm font-black text-on-surface">
            {t("Guest Billing, ZATCA VAT & Host Settlement", "الفاتورة والضريبة وحصة المضيف والتسوية")}
          </h3>
          <span className="text-[11px] font-mono text-outline">
            {t("DB ID:", "المعرف:")} {selectedBooking.dbId || selectedBooking.id}
          </span>
        </div>

        <div className="space-y-2.5 text-xs text-on-surface-variant">
          <div className="flex justify-between gap-2">
            <span>{t(`Listing Base Subtotal (${stayNights} nights)`, `أصل سعر الإقامة (${stayNights} ليالٍ)`)}</span>
            <span className="font-mono font-semibold text-on-surface shrink-0">
              {s.listingAmountSar.toFixed(2)} {currencyLabel}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span>{t("Guest Service Fee", "رسوم خدمة الضيف")}</span>
            <span className="font-mono shrink-0">+{s.guestServiceFeeSar.toFixed(2)} {currencyLabel}</span>
          </div>
          {s.promoDiscountSar > 0 && (
            <div className="flex justify-between gap-2 text-emerald-700">
              <span>{t("Promo Discount", "خصم العرض")}</span>
              <span className="font-mono shrink-0">-{s.promoDiscountSar.toFixed(2)} {currencyLabel}</span>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <span>{t(`ZATCA VAT (${s.vatRatePercent}%)`, `ضريبة القيمة المضافة (${s.vatRatePercent}%)`)}</span>
            <span className="font-mono shrink-0">+{s.governmentVatRemittanceSar.toFixed(2)} {currencyLabel}</span>
          </div>

          <div className="flex justify-between text-sm sm:text-base text-on-surface pt-3 font-bold border-t border-surface-container">
            <span>{t("Gross Guest Billing", "المبلغ الإجمالي المدفوع من الضيف")}</span>
            <span className="text-primary font-mono font-black">{selectedBooking.amount.toFixed(2)} {currencyLabel}</span>
          </div>

          <div className="mt-3 pt-3 border-t border-dashed border-surface-container space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <span>{t(`Host Commission (${s.hostCommissionPercent}%)`, `عمولة المنصة من المضيف (${s.hostCommissionPercent}%)`)}</span>
              <span className="font-mono text-rose-600 shrink-0">-{s.hostCommissionAmountSar.toFixed(2)} {currencyLabel}</span>
            </div>
            {s.platformWelcomeBonusSubsidySar > 0 && (
              <div className="flex justify-between gap-2 text-violet-700">
                <span>{t("Welcome Bonus Subsidy (Platform-borne)", "دعم مكافأة الترحيب (على المنصة)")}</span>
                <span className="font-mono shrink-0">-{s.platformWelcomeBonusSubsidySar.toFixed(2)} {currencyLabel}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-emerald-700">
              <span>{t("Host Net Payout", "صافي مستحق المضيف")}</span>
              <span className="font-mono shrink-0">{s.hostNetPayoutSar.toFixed(2)} {currencyLabel}</span>
            </div>
            <div className="flex justify-between font-bold text-on-surface">
              <span>{t("Platform Net Revenue", "صافي إيراد المنصة")}</span>
              <span className="font-mono shrink-0">{s.platformNetRevenueSar.toFixed(2)} {currencyLabel}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface-container-lowest border border-surface-container p-5 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-status-emerald" />
            <h3 className="font-title-sm text-sm font-black text-on-surface">
              {t("Host Disbursement & SAMA SARIE Status", "حالة التحويل البنكي للمضيف (سريع)")}
            </h3>
          </div>
          {onOpenFinancials && (
            <button
              type="button"
              onClick={() => {
                onOpenFinancials();
                onClose();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold transition cursor-pointer print:hidden"
            >
              <span>{t("Open Financials & Payouts", "فتح سجل المدفوعات")}</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {payout ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-container-low">
              <span className="text-[11px] text-outline block">{t("Payout Voucher", "مرجع الصرف")}</span>
              <span className="font-mono font-bold text-primary">{payout.reference}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low">
              <span className="text-[11px] text-outline block">{t("Disbursement Status", "حالة الصرف")}</span>
              <span className="font-bold text-on-surface capitalize">{payout.status.replace(/_/g, " ")}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low">
              <span className="text-[11px] text-outline block">{t("Beneficiary Bank", "البنك المستفيد")}</span>
              <span className="font-semibold text-on-surface">{payout.bankName || t("Not Configured", "غير محدد")}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low">
              <span className="text-[11px] text-outline block">{t("Destination IBAN", "رقم الآيبان")}</span>
              <span className="font-mono font-bold text-on-surface break-all" dir="ltr">
                {payout.iban || t("Host IBAN pending setup", "بانتظار إضافة الآيبان من المضيف")}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl">{selectedBooking.payoutStatus}</p>
        )}
      </section>
    </>
  );
}
