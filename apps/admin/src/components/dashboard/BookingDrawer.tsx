"use client";

import React, { useState } from "react";
import type { SelectedBookingDetail } from "./types";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  calculateBookingSettlement,
  DEFAULT_FEE_CONFIG,
  type BookingSettlementBreakdown,
  type PlatformFeeConfig,
} from "@qafnest/shared/platformFee";
import { RotateCcw, CheckCircle2, AlertTriangle, Building2, Calendar, User, CreditCard } from "lucide-react";

import { adminPath } from "@/lib/adminUrl";
interface BookingDrawerProps {
  selectedBooking: SelectedBookingDetail | null;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
  triggerToast: (msg: string) => void;
}

export default function BookingDrawer({
  selectedBooking,
  onClose,
  onRefresh,
  triggerToast,
}: BookingDrawerProps) {
  const { lang, dir, t } = useAdminAuth();
  const [updatingAction, setUpdatingAction] = useState<"confirm" | "cancel" | "disburse" | null>(null);
  const [confirmCancelPrompt, setConfirmCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [exceptionalRefundEnabled, setExceptionalRefundEnabled] = useState(false);
  const [exceptionalRefundPercent, setExceptionalRefundPercent] = useState<number>(100);

  if (!selectedBooking) return null;

  const handleBookingTransition = async (
    action: "confirm_payment" | "cancel" | "mark_refund_disbursed",
    customPayload?: Record<string, unknown>
  ) => {
    setUpdatingAction(action === "confirm_payment" ? "confirm" : action === "cancel" ? "cancel" : "disburse");
    try {
      const res = await fetch(adminPath("/api/admin/bookings"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking.dbId || selectedBooking.id,
          bookingReference: selectedBooking.id,
          action,
          reason: cancelReason || undefined,
          ...customPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        triggerToast(data.message || t("Could not update booking.", "تعذر تحديث حالة الحجز."));
        return;
      }
      triggerToast(data.message || t("Booking status updated.", "تم تحديث حالة الحجز بنجاح."));
      await onRefresh?.();
      onClose();
    } catch {
      triggerToast(t("Network error updating booking.", "خطأ في الاتصال أثناء تحديث الحجز."));
    } finally {
      setUpdatingAction(null);
    }
  };

  const isPending =
    selectedBooking.status === "pending" ||
    selectedBooking.status === "pending_sadad";

  const isConfirmed =
    selectedBooking.status === "confirmed" ||
    selectedBooking.status === "completed";

  const isCancelled = selectedBooking.status === "cancelled";
  const refund = selectedBooking.refund;
  const transferClaim = selectedBooking.transferClaim;
  const currencyLabel = t("SAR", "ر.س");

  const bookingStatusMap: Record<string, string> = {
    pending: t("Pending", "قيد الانتظار"),
    pending_sadad: t("Pending SADAD", "بانتظار سداد"),
    confirmed: t("Confirmed", "مؤكد"),
    in_stay: t("In-Stay", "أثناء الإقامة"),
    completed: t("Completed", "مكتمل"),
    cancelled: t("Cancelled", "ملغي"),
    disputed: t("Disputed", "متنازع عليه"),
    refunded: t("Refunded", "مسترد"),
  };

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

  const localizedBookingStatus =
    bookingStatusMap[selectedBooking.status] || selectedBooking.status.replace(/_/g, " ");

  const formatGuestsText = (raw: string | number) => {
    const str = String(raw || "");
    const match = str.match(/(\d+)/);
    if (!match) return str;
    const count = Number(match[1]);
    return t(`${count} ${count === 1 ? "Guest" : "Guests"}`, `${count} ${count === 1 ? "ضيف" : "ضيوف"}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-on-surface/30 backdrop-blur-xs z-50 transition-opacity duration-300"
      />

      {/* Slide-over Drawer */}
      <div
        dir={dir}
        className={`fixed top-0 end-0 h-full w-full max-w-md bg-surface-container-lowest z-50 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in ${
          dir === "rtl" ? "slide-in-from-left" : "slide-in-from-right"
        } duration-300`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-surface-container flex items-center justify-between">
          <div>
            <span className="font-label-sm text-[11px] font-bold text-outline uppercase tracking-wider">
              {t("RESERVATION", "رقم الحجز")} #{selectedBooking.id}
            </span>
            <h3 className="font-headline-sm text-lg font-black text-on-surface mt-0.5">
              {t("Booking Detail & Operational SLA", "تفاصيل الحجز واتفاقية الخدمة")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
          >
            ×
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4 sm:p-6 space-y-5 flex-1">
          {/* Reservation Property Overview */}
          <div className="space-y-1">
            <h4 className="font-title-sm text-base text-on-surface font-extrabold">
              {selectedBooking.propertyTitle}
            </h4>
            <p className="font-body-sm text-xs text-outline">
              {selectedBooking.accommodations}
            </p>
          </div>

          {/* Transfer Claim Banner if present */}
          {transferClaim && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>{t("Guest Submitted Bank Transfer Reference", "إشعار تحويل بنكي مرفوع من الضيف")}</span>
              </div>
              <p className="font-mono">{t("Ref", "المرجع")}: #{transferClaim.transferReference} ({transferClaim.bankName})</p>
              <p className="text-[11px] text-amber-700">
                {t("Sender", "المحول")}: {transferClaim.senderName || t("Guest", "ضيف")} · {t("Status", "الحالة")}:{" "}
                {bookingStatusMap[transferClaim.status] || transferClaim.status}
              </p>
            </div>
          )}

          {/* Refund Tracking Card if cancelled */}
          {isCancelled && refund && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-emerald-900">
                <span className="flex items-center gap-1">
                  <RotateCcw className="w-4 h-4 text-emerald-700" />
                  {t("Refund Lifecycle Tracking", "متابعة دورة الاسترداد المالي")}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] uppercase font-bold">
                  {refundStatusMap[refund.status] || refund.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1 border-t border-emerald-200/60">
                <div>
                  <span className="text-slate-500 block text-[10px]">{t("Refund Amount", "مبلغ الاسترداد")}</span>
                  <strong className="text-emerald-800 font-mono text-sm">
                    {refund.refundAmount} {currencyLabel}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{t("Policy Tier", "شريحة السياسة")}</span>
                  <strong className="text-slate-800">
                    {policyTierMap[refund.policyTier] || refund.policyTier}
                  </strong>
                </div>
              </div>
              {refund.status !== "disbursed" && (
                <button
                  type="button"
                  disabled={updatingAction !== null}
                  onClick={() => handleBookingTransition("mark_refund_disbursed")}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  {updatingAction === "disburse"
                    ? t("Marking...", "جاري التحديث...")
                    : t("Mark Refund Disbursed via Bank Rail", "تأكيد إتمام التحويل البنكي للاسترداد")}
                </button>
              )}
            </div>
          )}

          {/* Stay Info & Timing */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-container-low text-xs">
            <div>
              <span className="text-[11px] text-outline block">{t("Dates", "التواريخ")}</span>
              <p className="font-bold text-on-surface mt-0.5">
                {selectedBooking.dates}
              </p>
              <span className="text-[11px] text-outline">
                {selectedBooking.nights} {t("nights", "ليالٍ")}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-outline block">{t("Guests & Status", "الضيوف والحالة")}</span>
              <p className="font-bold text-on-surface mt-0.5">
                {formatGuestsText(selectedBooking.guests)}
              </p>
              <span className="text-[11px] text-primary font-bold">
                {localizedBookingStatus}
              </span>
            </div>
          </div>

          {/* Billing & Settlement Breakdown */}
          <div className="space-y-2 border-t border-surface-container pt-3">
            <h5 className="text-xs font-bold text-on-surface">
              {t("Guest Billing & VAT Settlement", "الفاتورة والضريبة وحصة المضيف")}
            </h5>

            {(() => {
              const stayNights = Math.max(1, selectedBooking.nights || 1);
              const s: BookingSettlementBreakdown =
                selectedBooking.settlement ||
                (() => {
                  const cfg: PlatformFeeConfig = DEFAULT_FEE_CONFIG;
                  const total = Number(selectedBooking.amount || 0);
                  const vatPct = cfg.vatRatePercent ?? 15;
                  const guestPct = cfg.guestServiceFeePercent ?? 13;
                  const taxable = Math.round((total / (1 + vatPct / 100)) * 100) / 100;
                  const vatAmount = Math.round((total - taxable) * 100) / 100;
                  const listing =
                    cfg.guestFeeMode === "fixed_amount"
                      ? Math.max(0, Math.round((taxable - (cfg.guestFixedFeeAmountSar || 0)) * 100) / 100)
                      : Math.round((taxable / (1 + guestPct / 100)) * 100) / 100;
                  const guestFee = Math.max(0, Math.round((taxable - listing) * 100) / 100);
                  return calculateBookingSettlement({
                    listingAmountSar: listing,
                    guestServiceFeeSar: guestFee,
                    vatAmountSar: vatAmount,
                    hostCommissionPercent: cfg.baseCommissionPercent,
                    vatRatePercent: vatPct,
                  });
                })();

              return (
                <div className="space-y-1.5 text-xs text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>{t(`Listing Base Subtotal (${stayNights} nights)`, `أصل سعر الإقامة (${stayNights} ليالٍ)`)}</span>
                    <span className="font-mono">{s.listingAmountSar.toFixed(2)} {currencyLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("Guest Service Fee", "رسوم خدمة الضيف")}</span>
                    <span className="font-mono">+{s.guestServiceFeeSar.toFixed(2)} {currencyLabel}</span>
                  </div>
                  {s.promoDiscountSar > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>{t("Promo Discount", "خصم العرض")}</span>
                      <span className="font-mono">-{s.promoDiscountSar.toFixed(2)} {currencyLabel}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t(`ZATCA VAT (${s.vatRatePercent}%)`, `ضريبة القيمة المضافة (${s.vatRatePercent}%)`)}</span>
                    <span className="font-mono">+{s.governmentVatRemittanceSar.toFixed(2)} {currencyLabel}</span>
                  </div>
                  <div className="flex justify-between text-sm text-on-surface pt-2 font-bold border-t border-surface-container">
                    <span>{t("Gross Guest Billing", "المبلغ الإجمالي المدفوع")}</span>
                    <span className="text-primary font-mono font-black">
                      {selectedBooking.amount.toFixed(2)} {currencyLabel}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-dashed border-surface-container space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span>{t(`Host Commission (${s.hostCommissionPercent}%)`, `عمولة المنصة من المضيف (${s.hostCommissionPercent}%)`)}</span>
                      <span className="font-mono text-rose-600">-{s.hostCommissionAmountSar.toFixed(2)} {currencyLabel}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>{t("Host Net Payout", "صافي مستحق المضيف")}</span>
                      <span className="font-mono">{s.hostNetPayoutSar.toFixed(2)} {currencyLabel}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-on-surface">
                      <span>{t("Platform Net Revenue", "صافي إيراد المنصة")}</span>
                      <span className="font-mono">{s.platformNetRevenueSar.toFixed(2)} {currencyLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Guest Identity Card */}
          <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-xs">
                {(selectedBooking.guestName || "G").split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-xs text-on-surface">
                  {selectedBooking.guestName}
                </h4>
                <p className="text-[11px] text-outline font-mono">
                  {selectedBooking.phone || "—"}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase">
              {localizedBookingStatus}
            </span>
          </div>

          {/* Cancel Booking Prompt for Confirmed Stays */}
          {confirmCancelPrompt && isConfirmed && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{t("Confirm Manual Cancellation", "تأكيد الإلغاء اليدوي")}</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                {t(
                  "Default policy is strictly Non-Refundable (0% refund) after payment, releasing the calendar dates immediately.",
                  "السياسة الأساسية هي عدم الاسترداد (٠٪) بعد الدفع مع تحرير تواريخ العقار فوراً."
                )}
              </p>

              {/* Exceptional Case Manual Refund Toggle */}
              <div className="p-3 rounded-xl bg-white border border-rose-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={exceptionalRefundEnabled}
                    onChange={(e) => setExceptionalRefundEnabled(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span>
                    {t(
                      "Exceptional Case: Issue Manual Refund",
                      "حالة استثنائية: منح استرداد يدوي"
                    )}
                  </span>
                </label>

                {exceptionalRefundEnabled && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600">
                      <span>{t("Refund Percentage (%)", "نسبة الاسترداد (%)")}</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {Math.round((selectedBooking.amount * Math.min(100, Math.max(0, exceptionalRefundPercent))) / 100).toLocaleString()} {currencyLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[25, 50, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setExceptionalRefundPercent(pct)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                            exceptionalRefundPercent === pct
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={exceptionalRefundPercent}
                        onChange={(e) => setExceptionalRefundPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                        className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder={t("Cancellation / exceptional refund reason", "سبب الإلغاء أو الاسترداد الاستثنائي")}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmCancelPrompt(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer"
                >
                  {t("Back", "رجوع")}
                </button>
                <button
                  type="button"
                  disabled={updatingAction !== null}
                  onClick={() =>
                    handleBookingTransition("cancel", {
                      isAdminOverride: exceptionalRefundEnabled && exceptionalRefundPercent > 0,
                      adminOverridePercent: exceptionalRefundEnabled ? exceptionalRefundPercent : 0,
                    })
                  }
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  {updatingAction === "cancel"
                    ? t("Processing...", "جاري الإلغاء...")
                    : exceptionalRefundEnabled && exceptionalRefundPercent > 0
                    ? t(`Cancel & Refund (${exceptionalRefundPercent}%)`, `إلغاء واسترداد (${exceptionalRefundPercent}٪)`)
                    : t("Confirm Cancel (No Refund)", "تأكيد الإلغاء (بدون استرداد)")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="p-4 bg-surface-container-low flex flex-wrap items-center justify-between gap-2 border-t border-surface-container">
          {isPending ? (
            <>
              <button
                type="button"
                disabled={updatingAction !== null}
                onClick={() => handleBookingTransition("confirm_payment")}
                data-testid="drawer-confirm-sadad-btn"
                className="flex-1 py-2.5 px-4 rounded-xl bg-status-emerald text-white text-xs font-bold shadow hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {updatingAction === "confirm" ? t("Confirming...", "جاري التأكيد...") : t("Confirm SADAD Payment", "تأكيد سداد")}
              </button>
              <button
                type="button"
                disabled={updatingAction !== null}
                onClick={() => handleBookingTransition("cancel")}
                data-testid="drawer-cancel-hold-btn"
                className="py-2.5 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-50"
              >
                {updatingAction === "cancel" ? t("Cancelling...", "جاري الإلغاء...") : t("Cancel Hold", "إلغاء الحجز المؤقت")}
              </button>
            </>
          ) : isConfirmed ? (
            <>
              <button
                type="button"
                onClick={() => {
                  triggerToast(t("Booking verified and folio marked settled.", "تم اعتماد الحجز والمطابقة بنجاح."));
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold shadow hover:bg-primary/90 transition-all cursor-pointer"
              >
                {t("Inspect Host Folio", "معاينة حساب المضيف")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancelPrompt(true)}
                data-testid="drawer-cancel-confirmed-btn"
                className="py-2.5 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
              >
                {t("Cancel Booking", "إلغاء الحجز")}
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-surface-container-lowest text-on-surface text-xs font-bold hover:bg-surface-container transition-all cursor-pointer"
          >
            {t("Dismiss", "إغلاق")}
          </button>
        </div>
      </div>
    </>
  );
}
