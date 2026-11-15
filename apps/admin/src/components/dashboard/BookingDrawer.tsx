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
import { getNumericUnitCode, validateLegalTransactionNumber } from "@qafnest/shared";
import {
  RotateCcw,
  AlertTriangle,
  Building2,
  Calendar,
  User,
  CreditCard,
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  KeyRound,
  Printer,
  Download,
  X,
  ExternalLink,
  Landmark,
  ShieldCheck,
  MapPin,
} from "lucide-react";

import { adminPath } from "@/lib/adminUrl";
import { downloadBookingVoucherPdf } from "@/lib/services/downloadBookingVoucherPdf";

function formatWhatsappHref(rawPhone?: string): string | null {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits || digits.length < 7) return null;
  const normalized = digits.startsWith("05") ? `966${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

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
  const refundTxnValidation = validateLegalTransactionNumber(refundTxnNumber);

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

  const guestWhatsapp = formatWhatsappHref(selectedBooking.phone);
  const hostWhatsapp = formatWhatsappHref(selectedBooking.hostPhone);
  const payout = selectedBooking.payoutSummary;
  const createdLabel = selectedBooking.createdAt
    ? new Date(selectedBooking.createdAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")
    : null;

  return (
    <div
      dir={dir}
      className="w-full space-y-6 animate-in fade-in duration-200 print:static print:bg-white"
    >
      {/* Inline Workspace Header (keeps AdminSidebar and AdminHeader visible) */}
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
              <span className="font-mono text-xs sm:text-sm font-black text-primary">
                #{selectedBooking.id}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10.5px] font-bold uppercase">
                {localizedBookingStatus}
              </span>
              {createdLabel && (
                <span className="hidden md:inline text-[11px] text-outline">
                  · {createdLabel}
                </span>
              )}
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

      {/* Main Inline Workspace */}
      <div className="space-y-6">
        {/* Executive Top KPI Row */}
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
              {t("Method:", "الوسيلة:")}{" "}
              <strong>{selectedBooking.paymentMethod || t("Online Checkout", "دفع إلكتروني")}</strong>
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
            <span className="text-[11px] text-on-surface-variant block mt-0.5 truncate">
              {selectedBooking.payoutStatus}
            </span>
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
            <p className="font-bold text-sm text-on-surface mt-1.5" dir="ltr">
              {selectedBooking.dates}
            </p>
            <div className="flex items-center justify-between gap-2 text-[11px] text-on-surface-variant mt-1">
              <span>
                {stayNights} {t("nights", "ليالٍ")} · {formatGuestsText(selectedBooking.guests)}
              </span>
              {selectedBooking.smartLockPin && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                  <KeyRound className="w-3 h-3" /> {selectedBooking.smartLockPin}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dedicated Booked Property Banner Card */}
        <section className="rounded-2xl bg-surface-container-lowest border border-surface-container p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {selectedBooking.propertyImage ? (
              <img
                src={selectedBooking.propertyImage}
                alt={selectedBooking.propertyTitle}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-surface-container shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7" />
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
                  {t("Booked Property / Purchased Unit", "العقار المحجوز / الوحدة")}
                </span>
                {selectedBooking.propertyCategory && (
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10.5px] font-bold text-on-surface-variant capitalize">
                    {selectedBooking.propertyCategory}
                  </span>
                )}
                {selectedBooking.propertyLicense && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
                    MOT #{selectedBooking.propertyLicense}
                  </span>
                )}
              </div>
              <h3 className="font-headline-sm text-base sm:text-lg font-black text-on-surface truncate">
                {selectedBooking.propertyTitle}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                <span>{selectedBooking.accommodations}</span>
                {Boolean(selectedBooking.propertyBasePrice && selectedBooking.propertyBasePrice > 0) && (
                  <span className="font-mono font-bold text-primary">
                    {Number(selectedBooking.propertyBasePrice).toLocaleString()} {currencyLabel} / {t("night", "ليلة")}
                  </span>
                )}
                {selectedBooking.propertyId && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-black">
                      #{getNumericUnitCode(selectedBooking.propertyId)}
                    </span>
                    <span className="text-outline">
                      ID: {selectedBooking.propertyId.slice(0, 8)}…
                    </span>
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

        {/* Transfer Claim & Refund Status Banners */}
        {(transferClaim || (isCancelled && refund)) && (
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
                    <strong className="text-slate-800">
                      {policyTierMap[refund.policyTier] || refund.policyTier}
                    </strong>
                  </div>
                </div>
                {refund.status !== "disbursed" && (
                  <div className="space-y-2 pt-2 border-t border-emerald-200/70">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t(
                          "Legal Bank Refund Transaction Number *",
                          "رقم العملية البنكية الرسمي للاسترداد *"
                        )}
                      </label>
                      <input
                        type="text"
                        value={refundTxnNumber}
                        onChange={(e) => {
                          setRefundTxnNumber(e.target.value);
                          if (!refundTxnTouched) setRefundTxnTouched(true);
                        }}
                        dir="ltr"
                        placeholder={t(
                          "Enter legal bank receipt reference (min 6 chars)",
                          "أدخل الرقم المرجعي الرسمي من إيصال التحويل البنكي"
                        )}
                        className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-emerald-600"
                      />
                      {refundTxnTouched && !refundTxnValidation.valid && (
                        <p className="text-[10px] font-bold text-rose-600 mt-1">
                          {t(
                            refundTxnValidation.errorEn || "Legal bank transaction number is required.",
                            refundTxnValidation.errorAr || "رقم العملية البنكية الرسمي مطلوب."
                          )}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={updatingAction !== null || !refundTxnValidation.valid}
                      onClick={() => {
                        setRefundTxnTouched(true);
                        if (!refundTxnValidation.valid) return;
                        handleBookingTransition("mark_refund_disbursed", {
                          transactionNumber: refundTxnValidation.cleaned,
                        });
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {updatingAction === "disburse"
                        ? t("Marking...", "جاري التحديث...")
                        : t("Mark Refund Disbursed via Bank Rail", "تأكيد إتمام التحويل البنكي للاسترداد")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main 2-Column Details Layout: Guest + Host/Property (Left) & Financial Waterfall (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Complete Guest Profile & Host/Property Profile */}
          <div className="lg:col-span-5 min-w-0 space-y-5">
            {/* Guest Full Profile Card */}
            <section className="rounded-2xl bg-surface-container-lowest border border-surface-container p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="font-title-sm text-sm font-black text-on-surface">
                    {t("Guest Information (Payer)", "بيانات الضيف (دافع الحجز)")}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                      selectedBooking.guestVerified
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-surface-container text-outline border-surface-container-high"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {selectedBooking.guestVerified
                      ? t("Verified", "موثق")
                      : t("Registered", "مسجل")}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                    {formatGuestsText(selectedBooking.guests)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm shrink-0">
                  {(selectedBooking.guestName || "G")
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-base text-on-surface truncate">
                    {selectedBooking.guestName || t("Verified Guest", "ضيف موثق")}
                  </p>
                  <p className="font-mono text-xs text-outline truncate">
                    {t("Ref:", "المرجع:")} #{selectedBooking.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 text-xs pt-1">
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-outline shrink-0" />
                    <span className="font-mono font-bold text-on-surface truncate" dir="ltr">
                      {selectedBooking.phone || t("No phone recorded", "لا يوجد رقم مسجل")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 print:hidden">
                    {selectedBooking.phone && selectedBooking.phone !== "—" && (
                      <a
                        href={`tel:${selectedBooking.phone}`}
                        className="px-2 py-1 rounded-lg bg-surface-container-lowest border border-surface-container text-[11px] font-bold text-on-surface hover:bg-surface-container"
                      >
                        {t("Call", "اتصال")}
                      </a>
                    )}
                    {guestWhatsapp && (
                      <a
                        href={guestWhatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{t("WhatsApp", "واتساب")}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-outline shrink-0" />
                    <span className="text-on-surface font-medium truncate" dir="ltr">
                      {selectedBooking.guestEmail || t("No email recorded", "لا يوجد بريد إلكتروني")}
                    </span>
                  </div>
                </div>

                {(selectedBooking.guestCity || selectedBooking.guestAddress) && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-container-low">
                    <MapPin className="w-3.5 h-3.5 text-outline shrink-0 mt-0.5" />
                    <span className="text-on-surface font-medium break-words">
                      {[selectedBooking.guestCity, selectedBooking.guestAddress]
                        .filter(Boolean)
                        .join(" — ")}
                    </span>
                  </div>
                )}

                {selectedBooking.guestIdMasked && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="text-outline">{t("National ID / Iqama:", "الهوية / الإقامة:")}</span>
                    </div>
                    <span className="font-mono font-bold text-on-surface" dir="ltr">
                      {selectedBooking.guestIdMasked}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Host & Property Full Profile Card */}
            <section className="rounded-2xl bg-surface-container-lowest border border-surface-container p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h3 className="font-title-sm text-sm font-black text-on-surface">
                    {t("Host & Property Partner", "بيانات المضيف والعقار")}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedBooking.hostVerified
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-surface-container text-outline border-surface-container-high"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {selectedBooking.hostVerified
                      ? t("Verified Host", "مضيف موثق")
                      : t("Partner Account", "حساب شريك")}
                  </span>
                  {selectedBooking.propertyLicense && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
                      MOT #{selectedBooking.propertyLicense}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-outline uppercase font-bold block">
                  {t("Property Name & Location", "اسم العقار والموقع")}
                </span>
                <p className="font-bold text-base text-on-surface">
                  {selectedBooking.propertyTitle}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {selectedBooking.accommodations}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs pt-2 border-t border-surface-container">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-outline">{t("Host Account Name:", "اسم حساب المضيف:")}</span>
                  <span className="font-bold text-on-surface text-end">
                    {selectedBooking.hostName || t("Unassigned / Platform Managed", "غير محدد")}
                  </span>
                </div>

                {selectedBooking.hostBusinessName &&
                  selectedBooking.hostBusinessName !== selectedBooking.hostName && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-outline">{t("Business / Entity:", "اسم المنشأة:")}</span>
                      <span className="font-bold text-on-surface text-end">
                        {selectedBooking.hostBusinessName}
                      </span>
                    </div>
                  )}

                {(selectedBooking.hostCity || selectedBooking.hostAddress) && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-container-low">
                    <MapPin className="w-3.5 h-3.5 text-outline shrink-0 mt-0.5" />
                    <span className="text-on-surface font-medium break-words">
                      {[selectedBooking.hostCity, selectedBooking.hostAddress]
                        .filter(Boolean)
                        .join(" — ")}
                    </span>
                  </div>
                )}

                {selectedBooking.hostIdMasked && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="text-outline">{t("Host ID / CR:", "هوية المضيف / السجل:")}</span>
                    </div>
                    <span className="font-mono font-bold text-on-surface" dir="ltr">
                      {selectedBooking.hostIdMasked}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-outline shrink-0" />
                    <span className="font-mono font-bold text-on-surface truncate" dir="ltr">
                      {selectedBooking.hostPhone || t("No host phone recorded", "لا يوجد جوال للمضيف")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 print:hidden">
                    {selectedBooking.hostPhone && (
                      <a
                        href={`tel:${selectedBooking.hostPhone}`}
                        className="px-2 py-1 rounded-lg bg-surface-container-lowest border border-surface-container text-[11px] font-bold text-on-surface hover:bg-surface-container"
                      >
                        {t("Call", "اتصال")}
                      </a>
                    )}
                    {hostWhatsapp && (
                      <a
                        href={hostWhatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{t("WhatsApp", "واتساب")}</span>
                      </a>
                    )}
                  </div>
                </div>

                {selectedBooking.hostEmail && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-container-low">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-outline shrink-0" />
                      <span className="text-on-surface font-medium truncate" dir="ltr">
                        {selectedBooking.hostEmail}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Full Billing, Tax, Commission, Payout & Admin Controls */}
          <div className="lg:col-span-7 min-w-0 space-y-5">
            {/* Full Billing & ZATCA Settlement Waterfall */}
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
                  <span>
                    {t(
                      `Listing Base Subtotal (${stayNights} nights)`,
                      `أصل سعر الإقامة (${stayNights} ليالٍ)`
                    )}
                  </span>
                  <span className="font-mono font-semibold text-on-surface shrink-0">
                    {s.listingAmountSar.toFixed(2)} {currencyLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t("Guest Service Fee", "رسوم خدمة الضيف")}</span>
                  <span className="font-mono shrink-0">
                    +{s.guestServiceFeeSar.toFixed(2)} {currencyLabel}
                  </span>
                </div>
                {s.promoDiscountSar > 0 && (
                  <div className="flex justify-between gap-2 text-emerald-700">
                    <span>{t("Promo Discount", "خصم العرض")}</span>
                    <span className="font-mono shrink-0">
                      -{s.promoDiscountSar.toFixed(2)} {currencyLabel}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span>
                    {t(
                      `ZATCA VAT (${s.vatRatePercent}%)`,
                      `ضريبة القيمة المضافة (${s.vatRatePercent}%)`
                    )}
                  </span>
                  <span className="font-mono shrink-0">
                    +{s.governmentVatRemittanceSar.toFixed(2)} {currencyLabel}
                  </span>
                </div>

                <div className="flex justify-between text-sm sm:text-base text-on-surface pt-3 font-bold border-t border-surface-container">
                  <span>{t("Gross Guest Billing", "المبلغ الإجمالي المدفوع من الضيف")}</span>
                  <span className="text-primary font-mono font-black">
                    {selectedBooking.amount.toFixed(2)} {currencyLabel}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-dashed border-surface-container space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span>
                      {t(
                        `Host Commission (${s.hostCommissionPercent}%)`,
                        `عمولة المنصة من المضيف (${s.hostCommissionPercent}%)`
                      )}
                    </span>
                    <span className="font-mono text-rose-600 shrink-0">
                      -{s.hostCommissionAmountSar.toFixed(2)} {currencyLabel}
                    </span>
                  </div>
                  {s.platformWelcomeBonusSubsidySar > 0 && (
                    <div className="flex justify-between gap-2 text-violet-700">
                      <span>{t("Welcome Bonus Subsidy (Platform-borne)", "دعم مكافأة الترحيب (على المنصة)")}</span>
                      <span className="font-mono shrink-0">
                        -{s.platformWelcomeBonusSubsidySar.toFixed(2)} {currencyLabel}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-emerald-700">
                    <span>{t("Host Net Payout", "صافي مستحق المضيف")}</span>
                    <span className="font-mono shrink-0">
                      {s.hostNetPayoutSar.toFixed(2)} {currencyLabel}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-on-surface">
                    <span>{t("Platform Net Revenue", "صافي إيراد المنصة")}</span>
                    <span className="font-mono shrink-0">
                      {s.platformNetRevenueSar.toFixed(2)} {currencyLabel}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SARIE Payout & Bank Destination Card */}
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
                    {!payout.iban && (
                      <span className="text-[10px] text-amber-700 font-semibold block mt-1">
                        {t(
                          "Host configures Beneficiary Name + SA IBAN (24 chars) in Host Portal -> Financials.",
                          "يضيف المضيف اسم المستفيد ورقم الآيبان (SA + 22 رقماً) من بوابة المضيف > المالية."
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl">
                  {selectedBooking.payoutStatus}
                </p>
              )}
            </section>

            {/* Cancel Booking Prompt for Confirmed Stays */}
            {confirmCancelPrompt && isConfirmed && (
              <section className="p-5 rounded-2xl border border-rose-200 bg-rose-50 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{t("Confirm Manual Cancellation", "تأكيد الإلغاء اليدوي")}</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {t(
                    "Default policy is strictly Non-Refundable (0% refund) after payment, releasing the calendar dates immediately.",
                    "السياسة الأساسية هي عدم الاسترداد (٠٪) بعد الدفع مع تحرير تواريخ العقار فوراً."
                  )}
                </p>

                <div className="p-3.5 rounded-xl bg-white border border-rose-200 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={exceptionalRefundEnabled}
                      onChange={(e) => setExceptionalRefundEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>
                      {t("Exceptional Case: Issue Manual Refund", "حالة استثنائية: منح استرداد يدوي")}
                    </span>
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
                          onChange={(e) =>
                            setExceptionalRefundPercent(
                              Math.min(100, Math.max(0, Number(e.target.value) || 0))
                            )
                          }
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

            {/* Action Footer Card */}
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
