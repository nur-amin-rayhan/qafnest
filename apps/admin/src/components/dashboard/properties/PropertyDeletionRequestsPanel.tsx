"use client";

import React, { useMemo, useState } from "react";
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

  if (requests.length === 0) {
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
    <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 p-4 sm:p-5 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-800 shrink-0">
            <span className="material-symbols-outlined text-[22px]">
              delete_sweep
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-headline text-base sm:text-lg font-extrabold text-amber-950">
                {t(
                  "Property Deletion Review Queue",
                  "طابور مراجعة طلبات حذف العقارات"
                )}
              </h3>
              {pendingRequests.length > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-600 text-white">
                  {pendingRequests.length} {t("Pending", "قيد المراجعة")}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-600/15 text-emerald-800 border border-emerald-300">
                  {t("0 Pending", "لا توجد طلبات معلقة")}
                </span>
              )}
            </div>
            <p className="text-xs text-amber-900/80 mt-0.5">
              {t(
                "Approved requests auto-delete the listing only when zero active, upcoming, unchecked-out, or unsettled reservations exist.",
                "يتم حذف العقار تلقائياً عند الموافقة فقط بعد التحقق من خلوه تماماً من أي حجوزات نشطة أو قادمة أو غير مكتملة."
              )}
            </p>
          </div>
        </div>

        {historyRequests.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-bold text-amber-900 hover:bg-amber-100/60 transition cursor-pointer"
          >
            {showHistory
              ? t("Hide History", "إخفاء السجل")
              : t(
                  `View History (${historyRequests.length})`,
                  `عرض السجل (${historyRequests.length})`
                )}
          </button>
        )}
      </div>

      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          {pendingRequests.map((req) => {
            const unitLabel = req.unitCode || getNumericUnitCode(req.propertyId);
            const isBlocked =
              req.activeBookingsCount > 0 || !req.eligibleToDelete;
            const isBusy = busyId === req.id;

            return (
              <div
                key={req.id}
                className="rounded-xl border border-amber-200 bg-white p-4 space-y-3.5 shadow-2xs"
              >
                {/* Top Summary */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary">
                        Unit #{unitLabel}
                      </span>
                      <span className="text-sm font-black text-on-surface">
                        {lang === "ar"
                          ? req.propertyTitleAr || req.propertyTitle
                          : req.propertyTitle}
                      </span>
                      {req.propertyCity && (
                        <span className="text-xs text-on-surface-variant font-semibold">
                          · {req.propertyCity}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                      <span>
                        <strong className="text-on-surface">
                          {t("Host:", "المضيف:")}
                        </strong>{" "}
                        {req.hostName || req.hostEmail || req.hostId.slice(0, 8)}
                      </span>
                      {req.hostPhone && (
                        <span className="font-mono">{req.hostPhone}</span>
                      )}
                      <span>
                        · {t("Submitted:", "تاريخ الطلب:")}{" "}
                        {new Date(req.requestedAt).toLocaleString(
                          lang === "ar" ? "ar-SA" : "en-US"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {isBlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-3 py-1 text-[11px] font-black text-rose-800">
                        <span className="material-symbols-outlined text-[14px]">
                          block
                        </span>
                        {t(
                          `Blocked (${req.activeBookingsCount} Active Res.)`,
                          `محظور (${req.activeBookingsCount} حجوزات نشطة)`
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-[11px] font-black text-emerald-800">
                        <span className="material-symbols-outlined text-[14px]">
                          verified_user
                        </span>
                        {t(
                          "0 Active Reservations · Safe to Auto-Delete",
                          "0 حجوزات نشطة · جاهز للحذف التلقائي"
                        )}
                      </span>
                    )}

                    {onInspectProperty && (
                      <button
                        type="button"
                        onClick={() => onInspectProperty(req.propertyId)}
                        className="px-2.5 py-1 rounded-lg border border-primary/25 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition cursor-pointer"
                      >
                        {t("Inspect Listing", "معاينة العقار")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Host Reason Box */}
                <div className="rounded-xl bg-surface-container/60 border border-outline-variant/30 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-black text-on-surface">
                    <span>{t("Host Reason:", "سبب المضيف:")}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                      {lang === "ar" ? req.reasonLabelAr : req.reasonLabelEn}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {req.reasonDetails}
                  </p>
                </div>

                {/* Active Reservations Warning */}
                {isBlocked && req.blockingBookings.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3 space-y-2">
                    <p className="text-xs font-black text-rose-900">
                      {t(
                        "Auto-delete is locked until these active / unsettled reservations complete check-out and payout settlement:",
                        "الحذف التلقائي مقفل حتى تكتمل مغادرة الضيف والتسوية المالية للحجوزات التالية:"
                      )}
                    </p>
                    <div className="space-y-1">
                      {req.blockingBookings.slice(0, 5).map((bk) => (
                        <div
                          key={bk.id}
                          className="flex flex-wrap items-center justify-between gap-2 text-[11px] rounded-lg bg-white border border-rose-200 px-2.5 py-1.5"
                        >
                          <span className="font-mono font-bold text-rose-900">
                            #{bk.bookingReference} · {bk.status.toUpperCase()}
                          </span>
                          <span className="text-rose-800">
                            {bk.checkIn} → {bk.checkOut} ·{" "}
                            {lang === "ar" ? bk.blockReasonAr : bk.blockReasonEn}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errorById[req.id] && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800">
                    {errorById[req.id]}
                  </div>
                )}

                {/* Decision Bar */}
                <div className="flex flex-col md:flex-row md:items-center gap-2.5 pt-1">
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
                      "Admin review note (required to decline, optional for approval)...",
                      "ملاحظة الإدارة (إلزامية عند الرفض واختيارية عند الموافقة)..."
                    )}
                    disabled={isBusy}
                    className="flex-1 h-9 px-3 rounded-xl border border-outline-variant/60 bg-surface text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleAction(req, "reject")}
                      className="h-9 px-3.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
                    >
                      {isBusy
                        ? t("Saving...", "جاري الحفظ...")
                        : t("Decline Request", "رفض الطلب")}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || isBlocked}
                      onClick={() => void handleAction(req, "approve")}
                      title={
                        isBlocked
                          ? t(
                              "Blocked while active reservations exist",
                              "محظور لوجود حجوزات نشطة"
                            )
                          : t(
                              "Approve and immediately remove listing",
                              "اعتماد وحذف العقار تلقائياً"
                            )
                      }
                      className="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shadow-2xs"
                    >
                      {isBusy
                        ? t("Deleting...", "جاري الحذف...")
                        : t(
                            "Approve & Auto-Delete",
                            "موافقة وحذف تلقائي"
                          )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showHistory && historyRequests.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-amber-200/80">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
            {t("Recent Deletion Review History", "سجل مراجعات طلبات الحذف")}
          </h4>
          <div className="space-y-1.5">
            {historyRequests.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/70 bg-white/90 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      item.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.status === "approved"
                      ? t("Approved & Auto-Deleted", "تمت الموافقة والحذف")
                      : item.status === "rejected"
                        ? t("Declined", "مرفوض")
                        : t("Withdrawn", "ملغى من المضيف")}
                  </span>
                  <span className="font-bold text-on-surface">
                    {lang === "ar"
                      ? item.propertyTitleAr || item.propertyTitle
                      : item.propertyTitle}
                  </span>
                  <span className="text-on-surface-variant">
                    ({lang === "ar" ? item.reasonLabelAr : item.reasonLabelEn})
                  </span>
                </div>
                <span className="text-[11px] text-outline">
                  {item.reviewedBy ? `${item.reviewedBy} · ` : ""}
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
