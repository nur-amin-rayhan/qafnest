"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle, Trash2, ExternalLink } from "lucide-react";
import { getNumericUnitCode } from "@qafnest/shared";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { AdminPropertyDeletionRequest } from "../types";

interface PropertyDeletionRequestsPanelProps {
  requests: AdminPropertyDeletionRequest[];
  onReviewDeletionRequest: (params: {
    requestId: string;
    action: "approve" | "reject";
    adminNotes?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onInspectProperty?: (propertyId: string) => void;
}

export function PropertyDeletionRequestsPanel({
  requests,
  onReviewDeletionRequest,
  onInspectProperty,
}: PropertyDeletionRequestsPanelProps) {
  const { lang, t } = useAdminAuth();
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests]
  );
  const historyRequests = useMemo(
    () => requests.filter((r) => r.status !== "pending"),
    [requests]
  );

  // Only render the warning banner when there are pending review requests requiring admin action
  if (pendingRequests.length === 0) {
    return null;
  }

  const handleAction = async (
    req: AdminPropertyDeletionRequest,
    action: "approve" | "reject"
  ) => {
    const notes = String(notesById[req.id] || "").trim();
    if (action === "reject" && notes.length < 5) {
      setErrorById((prev) => ({
        ...prev,
        [req.id]: t(
          "Please write an admin explanation (min 5 characters) before declining.",
          "يرجى كتابة سبب الرفض (5 أحرف على الأقل) لإرساله إلى المضيف."
        ),
      }));
      return;
    }

    setBusyId(req.id);
    setErrorById((prev) => ({ ...prev, [req.id]: "" }));
    const res = await onReviewDeletionRequest({
      requestId: req.id,
      action,
      adminNotes: notes || undefined,
    });
    setBusyId(null);

    if (!res.ok) {
      setErrorById((prev) => ({
        ...prev,
        [req.id]:
          res.error ||
          t(
            "Unable to process property deletion review.",
            "تعذر إتمام مراجعة طلب حذف العقار."
          ),
      }));
      return;
    }

    setNotesById((prev) => {
      const next = { ...prev };
      delete next[req.id];
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/40 p-4 mb-6 space-y-3.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100/80 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <Trash2 size={16} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-900">
                {t("Property deletion review queue", "طابور مراجعة طلبات حذف العقارات")}
              </h3>
              {pendingRequests.length > 0 ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono tabular-nums font-medium bg-amber-100 text-amber-900 border border-amber-200">
                  {pendingRequests.length} {t("pending", "قيد المراجعة")}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono tabular-nums font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {t("0 pending", "لا توجد طلبات معلقة")}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {t(
                "Approved deletion requests permanently remove the listing when zero active reservations exist.",
                "يتم حذف العقار نهائياً بعد التحقق من خلوه تماماً من أي حجوزات نشطة."
              )}
            </p>
          </div>
        </div>

        {historyRequests.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            {showHistory
              ? t("Hide history", "إخفاء السجل")
              : t(`View history (${historyRequests.length})`, `عرض السجل (${historyRequests.length})`)}
          </button>
        )}
      </div>

      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          {pendingRequests.map((req) => {
            const unitLabel = req.unitCode || getNumericUnitCode(req.propertyId);
            const isBlocked = req.activeBookingsCount > 0 || !req.eligibleToDelete;
            const isBusy = busyId === req.id;

            return (
              <div
                key={req.id}
                className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3 shadow-2xs"
              >
                {/* Top Summary */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        #{unitLabel}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {lang === "ar" ? req.propertyTitleAr || req.propertyTitle : req.propertyTitle}
                      </span>
                      {req.propertyCity && (
                        <span className="text-xs text-slate-500">· {req.propertyCity}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>
                        <span className="text-slate-700 font-medium">{t("Host:", "المضيف:")}</span>{" "}
                        {req.hostName || req.hostEmail || req.hostId.slice(0, 8)}
                      </span>
                      {req.hostPhone && <span className="font-mono text-slate-400">{req.hostPhone}</span>}
                      <span>
                        · {t("Submitted:", "تاريخ الطلب:")}{" "}
                        {new Date(req.requestedAt).toLocaleDateString(
                          lang === "ar" ? "ar-SA" : "en-US"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {isBlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-medium text-rose-700">
                        <XCircle size={13} strokeWidth={1.5} />
                        <span>
                          {t(
                            `Blocked (${req.activeBookingsCount} active)`,
                            `محظور (${req.activeBookingsCount} نشطة)`
                          )}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                        <CheckCircle2 size={13} strokeWidth={1.5} />
                        <span>{t("0 active bookings · Eligible", "0 حجوزات نشطة · متاح للحذف")}</span>
                      </span>
                    )}

                    {onInspectProperty && (
                      <button
                        type="button"
                        onClick={() => onInspectProperty(req.propertyId)}
                        className="px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
                      >
                        <ExternalLink size={12} strokeWidth={1.5} />
                        <span>{t("Inspect", "معاينة")}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Host Reason Box */}
                <div className="rounded-md bg-slate-50 border border-slate-100 p-2.5 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">{t("Reason:", "السبب:")}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-medium text-[11px]">
                      {lang === "ar" ? req.reasonLabelAr : req.reasonLabelEn}
                    </span>
                  </div>
                  {req.reasonDetails && (
                    <p className="text-slate-600 leading-relaxed">{req.reasonDetails}</p>
                  )}
                </div>

                {/* Active Reservations Warning */}
                {isBlocked && req.blockingBookings.length > 0 && (
                  <div className="rounded-md border border-rose-200 bg-rose-50/60 p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-rose-800 font-medium">
                      <AlertTriangle size={14} strokeWidth={1.5} />
                      <span>
                        {t(
                          "Active or unsettled reservations prevent auto-deletion:",
                          "توجد حجوزات نشطة تمنع الحذف التلقائي:"
                        )}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {req.blockingBookings.slice(0, 4).map((bk) => (
                        <div
                          key={bk.id}
                          className="flex flex-wrap items-center justify-between gap-2 text-[11px] rounded bg-white border border-rose-200/80 px-2 py-1 font-mono text-rose-900"
                        >
                          <span>#{bk.bookingReference}</span>
                          <span className="text-slate-500 font-sans">
                            {bk.checkIn} → {bk.checkOut}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errorById[req.id] && (
                  <div className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700">
                    {errorById[req.id]}
                  </div>
                )}

                {/* Decision Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={notesById[req.id] || ""}
                    onChange={(e) => {
                      setNotesById((prev) => ({
                        ...prev,
                        [req.id]: e.target.value,
                      }));
                      if (errorById[req.id]) {
                        setErrorById((prev) => ({ ...prev, [req.id]: "" }));
                      }
                    }}
                    placeholder={t(
                      "Admin explanation (required to decline)...",
                      "سبب قرار الإدارة (مطلوب عند الرفض)..."
                    )}
                    disabled={isBusy}
                    className="flex-1 h-8 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4F2396]"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleAction(req, "reject")}
                      className="h-8 px-3 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      {isBusy ? t("Saving...", "جاري الحفظ...") : t("Decline", "رفض الطلب")}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || isBlocked}
                      onClick={() => void handleAction(req, "approve")}
                      className="h-8 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    >
                      {isBusy
                        ? t("Deleting...", "جاري الحذف...")
                        : t("Approve & delete", "موافقة وحذف")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showHistory && historyRequests.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-amber-200/60">
          <h4 className="text-xs font-medium text-slate-600">
            {t("Recent deletion review history", "سجل مراجعات طلبات الحذف")}
          </h4>
          <div className="space-y-1">
            {historyRequests.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs text-slate-700"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                      item.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {item.status === "approved"
                      ? t("Approved", "معتمد")
                      : t("Declined", "مرفوض")}
                  </span>
                  <span className="font-medium">
                    {lang === "ar" ? item.propertyTitleAr || item.propertyTitle : item.propertyTitle}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {item.reviewedAt
                    ? new Date(item.reviewedAt).toLocaleDateString(
                        lang === "ar" ? "ar-SA" : "en-US"
                      )
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
