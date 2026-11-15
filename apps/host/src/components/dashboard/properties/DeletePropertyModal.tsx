"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  ShieldAlert,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  PROPERTY_DELETION_REASONS,
  getNumericUnitCode,
  type PropertyDeletionEligibility,
  type PropertyDeletionReasonCode,
  type PropertyDeletionRequestSummary,
} from "@qafnest/shared";
import {
  fetchPropertyDeletionStatus,
  withdrawPropertyDeletionRequest,
} from "@/lib/hostPropertyActions";

export interface DeletePropertyTarget {
  id: string;
  unitCode?: string;
  title: string;
  titleAr?: string;
  isApproved?: boolean;
  status?: string;
  deletionRequest?: PropertyDeletionRequestSummary | null;
}

interface DeletePropertyModalProps {
  property: DeletePropertyTarget | null;
  userId?: string;
  busy: boolean;
  error: string | null;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
  onCancel: () => void;
  onConfirm: (payload: {
    reasonCode: PropertyDeletionReasonCode;
    reasonDetails: string;
  }) => void | Promise<void>;
  onWithdrawn?: () => void | Promise<void>;
}

export function DeletePropertyModal({
  property,
  userId,
  busy,
  error,
  lang,
  t,
  onCancel,
  onConfirm,
  onWithdrawn,
}: DeletePropertyModalProps) {
  const [reasonCode, setReasonCode] =
    useState<PropertyDeletionReasonCode>("property_sold");
  const [reasonDetails, setReasonDetails] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [eligibility, setEligibility] = useState<PropertyDeletionEligibility | null>(null);
  const [pendingRequest, setPendingRequest] =
    useState<PropertyDeletionRequestSummary | null>(null);
  const [latestRequest, setLatestRequest] =
    useState<PropertyDeletionRequestSummary | null>(null);

  useEffect(() => {
    if (!property) return;
    setLocalError(null);
    setReasonCode(property.deletionRequest?.reasonCode || "property_sold");
    setReasonDetails(
      property.deletionRequest?.status === "pending"
        ? property.deletionRequest.reasonDetails
        : ""
    );
    setPendingRequest(
      property.deletionRequest?.status === "pending" ? property.deletionRequest : null
    );
    setLatestRequest(property.deletionRequest || null);

    let cancelled = false;
    setLoadingCheck(true);
    fetchPropertyDeletionStatus(property.id, userId)
      .then((res) => {
        if (cancelled) return;
        setEligibility(res.eligibility);
        setPendingRequest(res.pendingRequest);
        setLatestRequest(res.latestRequest);
        if (res.pendingRequest) {
          setReasonCode(res.pendingRequest.reasonCode);
          setReasonDetails(res.pendingRequest.reasonDetails);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLocalError(
            err instanceof Error
              ? err.message
              : t(
                  "Could not verify reservation status.",
                  "تعذر التحقق من حالة الحجوزات الحالية."
                )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCheck(false);
      });

    return () => {
      cancelled = true;
    };
  }, [property, userId, t]);

  useEffect(() => {
    if (!property) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy && !withdrawing) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [property, busy, withdrawing, onCancel]);

  if (!property) return null;

  const displayTitle =
    (lang === "ar"
      ? property.titleAr || property.title
      : property.title || property.titleAr) || t("this property", "هذا العقار");
  const unitCode = property.unitCode || getNumericUnitCode(property.id);
  const isBlockedByBookings = eligibility ? !eligibility.eligible : false;
  const cleanedDetails = reasonDetails.trim();
  const canSubmit =
    !loadingCheck &&
    !isBlockedByBookings &&
    !pendingRequest &&
    cleanedDetails.length >= 10 &&
    !busy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (isBlockedByBookings) {
      setLocalError(
        lang === "ar"
          ? eligibility?.reasonAr || "توجد حجوزات قائمة تمنع حذف العقار."
          : eligibility?.reasonEn || "Active reservations prevent deleting this property."
      );
      return;
    }
    if (cleanedDetails.length < 10) {
      setLocalError(
        t(
          "Please write a clear specific reason (at least 10 characters) for admin review.",
          "يرجى كتابة سبب واضح ومحدد (10 أحرف على الأقل) لمراجعة الإدارة."
        )
      );
      return;
    }
    await onConfirm({ reasonCode, reasonDetails: cleanedDetails });
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setLocalError(null);
    try {
      await withdrawPropertyDeletionRequest(property.id, userId, lang);
      setPendingRequest(null);
      if (onWithdrawn) await onWithdrawn();
      onCancel();
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : t("Could not withdraw request.", "تعذر سحب طلب الحذف.")
      );
    } finally {
      setWithdrawing(false);
    }
  };

  const combinedError = error || localError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-property-title"
      dir={lang === "ar" ? "rtl" : "ltr"}
      onClick={() => {
        if (!busy && !withdrawing) onCancel();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                isBlockedByBookings
                  ? "bg-rose-100 text-rose-600"
                  : pendingRequest
                    ? "bg-amber-100 text-amber-700"
                    : "bg-violet-100 text-[#4F2396]"
              }`}
            >
              {isBlockedByBookings ? (
                <ShieldAlert size={22} />
              ) : pendingRequest ? (
                <Clock size={22} />
              ) : (
                <FileWarning size={22} />
              )}
            </div>
            <div>
              <h2
                id="delete-property-title"
                className="text-base sm:text-lg font-black text-slate-900"
              >
                {pendingRequest
                  ? t("Property Removal Request Pending Review", "طلب حذف العقار قيد المراجعة")
                  : t("Request Property Removal (Admin Review)", "طلب حذف العقار (مراجعة الإدارة)")}
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Unit #{unitCode} · {displayTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy || withdrawing}
            onClick={onCancel}
            aria-label={t("Close", "إغلاق")}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Reservation Check Status */}
        {loadingCheck ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold text-slate-600 flex items-center gap-2">
            <Clock size={16} className="animate-spin text-[#4F2396]" />
            <span>
              {t(
                "Checking active, upcoming, and unchecked-out guest reservations...",
                "جاري فحص الحجوزات النشطة والقادمة أو بانتظار المغادرة..."
              )}
            </span>
          </div>
        ) : isBlockedByBookings && eligibility ? (
          <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 space-y-3 text-xs text-rose-950">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-sm text-rose-900">
                  {t(
                    "Deletion Blocked — Active Reservation(s) Exist",
                    "الحذف غير متاح — توجد حجوزات نشطة على العقار"
                  )}
                </p>
                <p className="mt-1 font-medium leading-relaxed text-rose-800">
                  {lang === "ar" ? eligibility.reasonAr : eligibility.reasonEn}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1 border-t border-rose-200">
              {eligibility.blockingBookings.slice(0, 5).map((bk) => (
                <div
                  key={bk.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/90 border border-rose-200 px-3 py-2"
                >
                  <div>
                    <span className="font-mono font-black text-rose-900">
                      #{bk.bookingReference}
                    </span>
                    <span className="text-rose-700 ms-2">
                      {lang === "ar" ? bk.blockReasonAr : bk.blockReasonEn}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-600">
                    {bk.checkIn} → {bk.checkOut}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">
              {t(
                "0 active or upcoming reservations found. Specify your removal reason below for QafNest Admin review; once approved by Admin, this unit will be automatically deleted.",
                "لا توجد حجوزات نشطة أو قادمة على الوحدة. حدد سبب الحذف لإرساله إلى إدارة قاف نست، وسيتم حذف العقار تلقائياً فور اعتماد الإدارة للطلب."
              )}
            </p>
          </div>
        )}

        {/* Previous Admin Rejection Feedback if Resubmitting */}
        {!pendingRequest && latestRequest?.status === "rejected" && latestRequest.adminNotes && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 space-y-1">
            <p className="font-black text-amber-900">
              {t("Previous Removal Request Declined by Admin:", "تم رفض طلب الحذف السابق من الإدارة:")}
            </p>
            <p className="font-semibold">{latestRequest.adminNotes}</p>
          </div>
        )}

        {/* Existing Pending Request View OR Reason Submission Form */}
        {pendingRequest ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-900 uppercase tracking-wide">
                {t("Awaiting Admin Approval", "بانتظار موافقة الإدارة")}
              </span>
              <span className="font-mono text-[11px] text-amber-700">
                {new Date(pendingRequest.requestedAt).toLocaleDateString()}
              </span>
            </div>
            <p className="font-bold text-slate-900">
              {lang === "ar" ? pendingRequest.reasonLabelAr : pendingRequest.reasonLabelEn}
            </p>
            <p className="text-slate-700 leading-relaxed bg-white/80 rounded-xl p-2.5 border border-amber-200/70">
              {pendingRequest.reasonDetails}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="deletion-reason-select"
                className="block text-xs font-black text-slate-800 mb-1.5"
              >
                {t("Specific Removal Reason *", "سبب حذف العقار *")}
              </label>
              <select
                id="deletion-reason-select"
                value={reasonCode}
                disabled={isBlockedByBookings || loadingCheck}
                onChange={(e) =>
                  setReasonCode(e.target.value as PropertyDeletionReasonCode)
                }
                className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F2396]/25 disabled:opacity-60"
              >
                {PROPERTY_DELETION_REASONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {lang === "ar" ? opt.labelAr : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="deletion-reason-details"
                  className="block text-xs font-black text-slate-800"
                >
                  {t(
                    "Detailed Explanation for Admin Review *",
                    "توضيح السبب التفصيلي لمراجعة الإدارة *"
                  )}
                </label>
                <span
                  className={`text-[11px] font-mono font-bold ${
                    cleanedDetails.length >= 10 ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {cleanedDetails.length}/10+
                </span>
              </div>
              <textarea
                id="deletion-reason-details"
                rows={3}
                disabled={isBlockedByBookings || loadingCheck}
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                placeholder={t(
                  "Explain why this listing is being permanently removed (e.g., property sold on DD/MM, long-term contract signed, etc.)...",
                  "اكتب توضيحاً واضحاً لسبب رغبتك في إزالة العقار نهائياً لمراجعته من قِبل الإدارة..."
                )}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F2396]/25 disabled:opacity-60"
              />
            </div>
          </div>
        )}

        {combinedError && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700"
          >
            {combinedError}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            disabled={busy || withdrawing}
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
          >
            {t("Close", "إغلاق")}
          </button>

          {pendingRequest ? (
            <button
              type="button"
              disabled={withdrawing}
              onClick={handleWithdraw}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 transition cursor-pointer"
            >
              <Undo2 size={14} />
              <span>
                {withdrawing
                  ? t("Withdrawing...", "جارٍ السحب...")
                  : t("Withdraw Removal Request", "سحب طلب الحذف")}
              </span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-rose-700 disabled:opacity-45 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <Trash2 size={14} />
              <span>
                {busy
                  ? t("Submitting for Review...", "جارٍ إرسال الطلب...")
                  : isBlockedByBookings
                    ? t("Blocked (Active Bookings)", "محظور لوجود حجوزات")
                    : t("Submit for Admin Approval", "إرسال الطلب لمراجعة الإدارة")}
              </span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
