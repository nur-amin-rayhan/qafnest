"use client";

import React, { useState, useEffect } from "react";
import type { SelectedBookingDetail } from "./types";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  calculateBookingSettlement,
  DEFAULT_FEE_CONFIG,
  type BookingSettlementBreakdown,
  type PlatformFeeConfig,
} from "@qafnest/shared/platformFee";
import { getNumericUnitCode } from "@qafnest/shared";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Download,
  ExternalLink,
  KeyRound,
  Landmark,
  Printer,
  ShieldCheck,
  X,
} from "lucide-react";
import { adminPath } from "@/lib/adminUrl";
import { downloadBookingVoucherPdf } from "@/lib/services/downloadBookingVoucherPdf";
import { BookingPartyCards } from "./booking-drawer/BookingPartyCards";
import {
  BookingSettlementSections,
  BookingTransferRefundBanner,
} from "./booking-drawer/BookingSettlementCard";

interface BookingDrawerProps {
  selectedBooking: SelectedBookingDetail | null;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
  onOpenFinancials?: () => void;
  onInspectProperty?: (propertyId: string) => void;
  triggerToast: (msg: string) => void;
}

export default function BookingDrawer({
  selectedBooking,
  onClose,
  onRefresh,
  onOpenFinancials,
  onInspectProperty,
  triggerToast,
}: BookingDrawerProps) {
  const { lang, dir, t } = useAdminAuth();
  const [updatingAction, setUpdatingAction] = useState<"confirm" | "cancel" | "disburse" | null>(null);
  const [confirmCancelPrompt, setConfirmCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [exceptionalRefundEnabled, setExceptionalRefundEnabled] = useState(false);
  const [exceptionalRefundPercent, setExceptionalRefundPercent] = useState<number>(100);
  const [downloadingVoucher, setDownloadingVoucher] = useState(false);
  const [refundTxnNumber, setRefundTxnNumber] = useState("");
  const [refundTxnTouched, setRefundTxnTouched] = useState(false);

  useEffect(() => {
    setRefundTxnNumber("");
    setRefundTxnTouched(false);
    setConfirmCancelPrompt(false);
    setCancelReason("");
    setExceptionalRefundEnabled(false);
  }, [selectedBooking?.id]);

  if (!selectedBooking) return null;

  const handleDownloadVoucher = async () => {
    setDownloadingVoucher(true);
    try {
      await downloadBookingVoucherPdf(selectedBooking);
    } finally {
      setDownloadingVoucher(false);
    }
  };

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

  const isPending = selectedBooking.status === "pending" || selectedBooking.status === "pending_sadad";
  const isConfirmed = selectedBooking.status === "confirmed" || selectedBooking.status === "completed";
  const isCancelled = selectedBooking.status === "cancelled";
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

  const formatGuestsText = (raw: string | number) => {
    const str = String(raw || "");
    const match = str.match(/(\d+)/);
    if (!match) return str;
    const count = Number(match[1]);
    return t(`${count} ${count === 1 ? "Guest" : "Guests"}`, `${count} ${count === 1 ? "ضيف" : "ضيوف"}`);
  };

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
      return calculateBookingSettlement({
        listingAmountSar: listing,
        guestServiceFeeSar: Math.max(0, Math.round((taxable - listing) * 100) / 100),
        vatAmountSar: vatAmount,
        hostCommissionPercent: cfg.baseCommissionPercent,
        vatRatePercent: vatPct,
      });
    })();

  const formattedGuests = formatGuestsText(selectedBooking.guests);
  const createdLabel = selectedBooking.createdAt
    ? new Date(selectedBooking.createdAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")
    : null;

  return (
    <div dir={dir} className="w-full space-y-6 animate-in fade-in duration-200 print:static print:bg-white">
      <header className="sticky top-16 z-20 rounded-2xl bg-surface-container-lowest/95 backdrop-blur-md border border-surface-container px-4 sm:px-6 py-3 min-h-16 flex flex-wrap items-center justify-between gap-3 shadow-2xs print:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold transition cursor-pointer shrink-0"
          >
            <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
            <span className="hidden sm:inline">{t("Back to Dashboard", "رجوع للوحة التحكم")}</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs sm:text-sm font-black text-primary">#{selectedBooking.id}</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10.5px] font-bold uppercase">
                {bookingStatusMap[selectedBooking.status] || selectedBooking.status.replace(/_/g, " ")}
              </span>
              {createdLabel && <span className="hidden md:inline text-[11px] text-outline">· {createdLabel}</span>}
            </div>
            <h2 className="font-headline-sm text-sm sm:text-base font-black text-on-surface truncate">
              {t("Transaction, Guest, Host & Settlement Dossier", "التفاصيل الكاملة للمعاملة والضيف والمضيف والتسوية")}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("Print", "طباعة")}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadVoucher}
            disabled={downloadingVoucher}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/25 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {downloadingVoucher ? t("Exporting...", "تصدير...") : t("Download", "تحميل السند (.PDF)")}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close", "إغلاق")}
            className="w-9 h-9 rounded-xl border border-surface-container bg-surface-container-low hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-primary" />
              {t("Guest Paid Total", "إجمالي مدفوعات الضيف")}
            </span>
            <p className="font-mono text-xl font-black text-primary mt-1.5">
              {selectedBooking.amount.toFixed(2)} {currencyLabel}
            </p>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              {t("Method:", "الوسيلة:")} <strong>{selectedBooking.paymentMethod || t("Online Checkout", "دفع إلكتروني")}</strong>
            </span>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-status-emerald" />
              {t("Host Net Entitlement", "صافي مستحق المضيف")}
            </span>
            <p className="font-mono text-xl font-black text-status-emerald mt-1.5">
              {s.hostNetPayoutSar.toFixed(2)} {currencyLabel}
            </p>
            <span className="text-[11px] text-on-surface-variant block mt-0.5 truncate">{selectedBooking.payoutStatus}</span>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              {t("Platform Revenue & VAT", "إيراد المنصة والضريبة")}
            </span>
            <p className="font-mono text-xl font-black text-on-surface mt-1.5">
              {s.platformNetRevenueSar.toFixed(2)} {currencyLabel}
            </p>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              {t(`ZATCA VAT (${s.vatRatePercent}%):`, `ضريبة القيمة المضافة (${s.vatRatePercent}%):`)}{" "}
              <strong className="font-mono">{s.governmentVatRemittanceSar.toFixed(2)} {currencyLabel}</strong>
            </span>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-4 shadow-2xs">
            <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {t("Stay & Smart Lock", "فترة الإقامة والقفل الذكي")}
            </span>
            <p className="font-bold text-sm text-on-surface mt-1.5" dir="ltr">{selectedBooking.dates}</p>
            <div className="flex items-center justify-between gap-2 text-[11px] text-on-surface-variant mt-1">
              <span>{stayNights} {t("nights", "ليالٍ")} · {formattedGuests}</span>
              {selectedBooking.smartLockPin && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                  <KeyRound className="w-3 h-3" /> {selectedBooking.smartLockPin}
                </span>
              )}
            </div>
          </div>
        </div>

        <section className="rounded-2xl bg-surface-container-lowest border border-surface-container p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {selectedBooking.propertyImage ? (
              <img src={selectedBooking.propertyImage} alt={selectedBooking.propertyTitle} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-surface-container shrink-0" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">{t("Booked Property / Purchased Unit", "العقار المحجوز / الوحدة")}</span>
                {selectedBooking.propertyCategory && (
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10.5px] font-bold text-on-surface-variant capitalize">{selectedBooking.propertyCategory}</span>
                )}
                {selectedBooking.propertyLicense && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">MOT #{selectedBooking.propertyLicense}</span>
                )}
              </div>
              <h3 className="font-headline-sm text-base sm:text-lg font-black text-on-surface truncate">{selectedBooking.propertyTitle}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                <span>{selectedBooking.accommodations}</span>
                {Boolean(selectedBooking.propertyBasePrice && selectedBooking.propertyBasePrice > 0) && (
                  <span className="font-mono font-bold text-primary">{Number(selectedBooking.propertyBasePrice).toLocaleString()} {currencyLabel} / {t("night", "ليلة")}</span>
                )}
                {selectedBooking.propertyId && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-black">#{getNumericUnitCode(selectedBooking.propertyId)}</span>
                    <span className="text-outline">ID: {selectedBooking.propertyId.slice(0, 8)}…</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {selectedBooking.propertyId && (
            <div className="flex flex-wrap items-center gap-2 shrink-0 print:hidden">
              {onInspectProperty && (
                <button
                  type="button"
                  onClick={() => onInspectProperty(selectedBooking.propertyId!)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow hover:bg-primary/90 transition cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{t("Inspect Full Property", "عرض تفاصيل العقار")}</span>
                </button>
              )}
              <a
                href={`/properties/${selectedBooking.propertyId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t("Open Tab", "فتح في تبويب")}</span>
              </a>
            </div>
          )}
        </section>

        <BookingTransferRefundBanner
          selectedBooking={selectedBooking}
          isCancelled={isCancelled}
          currencyLabel={currencyLabel}
          bookingStatusMap={bookingStatusMap}
          refundTxnNumber={refundTxnNumber}
          setRefundTxnNumber={setRefundTxnNumber}
          refundTxnTouched={refundTxnTouched}
          setRefundTxnTouched={setRefundTxnTouched}
          updatingAction={updatingAction}
          onDisburseRefund={(txn) => handleBookingTransition("mark_refund_disbursed", { transactionNumber: txn })}
          t={t}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <BookingPartyCards selectedBooking={selectedBooking} formattedGuests={formattedGuests} t={t} />

          <div className="lg:col-span-7 min-w-0 space-y-5">
            <BookingSettlementSections
              selectedBooking={selectedBooking}
              s={s}
              stayNights={stayNights}
              currencyLabel={currencyLabel}
              onOpenFinancials={onOpenFinancials}
              onClose={onClose}
              t={t}
            />

            {confirmCancelPrompt && isConfirmed && (
              <section className="p-5 rounded-2xl border border-rose-200 bg-rose-50 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{t("Confirm Manual Cancellation", "تأكيد الإلغاء اليدوي")}</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {t("Default policy is strictly Non-Refundable (0% refund) after payment, releasing the calendar dates immediately.", "السياسة الأساسية هي عدم الاسترداد (٠٪) بعد الدفع مع تحرير تواريخ العقار فوراً.")}
                </p>

                <div className="p-3.5 rounded-xl bg-white border border-rose-200 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={exceptionalRefundEnabled}
                      onChange={(e) => setExceptionalRefundEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>{t("Exceptional Case: Issue Manual Refund", "حالة استثنائية: منح استرداد يدوي")}</span>
                  </label>
                  {exceptionalRefundEnabled && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                        <span>{t("Refund Percentage (%)", "نسبة الاسترداد (%)")}</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {Math.round((selectedBooking.amount * Math.min(100, Math.max(0, exceptionalRefundPercent))) / 100).toLocaleString()} {currencyLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[25, 50, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setExceptionalRefundPercent(pct)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                              exceptionalRefundPercent === pct ? "bg-rose-600 text-white border-rose-600" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
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
                          className="w-24 px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
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
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer"
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
                    className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {updatingAction === "cancel"
                      ? t("Processing...", "جاري الإلغاء...")
                      : exceptionalRefundEnabled && exceptionalRefundPercent > 0
                      ? t(`Cancel & Refund (${exceptionalRefundPercent}%)`, `إلغاء واسترداد (${exceptionalRefundPercent}٪)`)
                      : t("Confirm Cancel (No Refund)", "تأكيد الإلغاء (بدون استرداد)")}
                  </button>
                </div>
              </section>
            )}

            <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                {isPending ? (
                  <>
                    <button
                      type="button"
                      disabled={updatingAction !== null}
                      onClick={() => handleBookingTransition("confirm_payment")}
                      data-testid="drawer-confirm-sadad-btn"
                      className="py-2.5 px-4 rounded-xl bg-status-emerald text-white text-xs font-bold shadow hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50"
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
                        if (onOpenFinancials) {
                          onOpenFinancials();
                          onClose();
                        } else {
                          triggerToast(t("Booking verified and folio marked settled.", "تم اعتماد الحجز والمطابقة بنجاح."));
                          onClose();
                        }
                      }}
                      className="py-2.5 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold shadow hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      {t("Inspect Host Financials & Payouts", "مراجعة مستحقات المضيف")}
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
              </div>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-surface-container-low text-on-surface text-xs font-bold hover:bg-surface-container transition-all cursor-pointer"
              >
                {t("Close / Back", "إغلاق / رجوع")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
