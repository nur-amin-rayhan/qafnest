"use client";

import React from "react";
import { buildSelectedBookingDetail, type BookingItem, type SelectedBookingDetail } from "../types";
import type { CreatedConfirmation } from "./helplineTypes";

export function HelplineConfirmationCard({
  confirmation,
  onReset,
  onCopy,
  t,
}: {
  confirmation: CreatedConfirmation;
  onReset: () => void;
  onCopy: () => void;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div
      data-testid="helpline-confirmation-card"
      className="rounded-2xl border-2 border-status-emerald/40 bg-surface-container-lowest p-6 shadow-sm space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-status-emerald/15 text-status-emerald flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">check_circle</span>
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-status-emerald">
              {confirmation.paymentMode === "confirmed_paid"
                ? t("Confirmed & Paid", "مؤكد ومدفوع")
                : t("Room Held — Ready for SADAD Payment", "تم حجز الغرفة — بانتظار السداد")}
            </span>
            <h2 className="text-xl font-black text-on-surface mt-0.5">
              #{confirmation.bookingReference} · {confirmation.propertyTitle}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="px-3.5 py-2 rounded-xl border border-surface-container bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface cursor-pointer"
        >
          {t("+ New Phone Booking", "+ حجز جديد")}
        </button>
      </div>

      {confirmation.autoCreatedGuest && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
          <span className="material-symbols-outlined text-[18px] text-emerald-700 shrink-0">person_check</span>
          <div>
            <p className="font-black">
              {t("New Verified Guest Account Automatically Created", "تم إنشاء حساب عميل موثق جديد تلقائياً")}
            </p>
            <p className="mt-0.5 text-emerald-800">
              {t(
                "Whenever this caller logs in on the Guest Portal with their phone number, their saved profile and reservation history will restore automatically.",
                "عند تسجيل دخول العميل مستقبلاً برقم جواله في بوابة الضيوف، ستظهر بياناته وسجل حجوزاته تلقائياً."
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-surface-container-low">
          <div className="text-xs text-outline">{t("Caller", "الضيف")}</div>
          <div className="font-bold text-on-surface mt-0.5">{confirmation.guestName}</div>
          <div className="text-xs font-mono text-on-surface-variant">{confirmation.guestPhone}</div>
          {confirmation.guestEmail && <div className="text-[11px] text-outline truncate">{confirmation.guestEmail}</div>}
        </div>
        <div className="p-3 rounded-xl bg-surface-container-low">
          <div className="text-xs text-outline">{t("Dates Locked", "التواريخ المحجوزة")}</div>
          <div className="font-bold text-on-surface mt-0.5 font-mono">
            {confirmation.checkIn} → {confirmation.checkOut}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
          <div className="text-xs text-primary font-bold">{t("Total Payable", "الإجمالي")}</div>
          <div className="text-lg font-black text-primary mt-0.5">SAR {confirmation.guestTotalSar.toFixed(2)}</div>
        </div>
      </div>

      {confirmation.smartLockPin && (
        <div className="p-3.5 rounded-xl bg-status-emerald/10 border border-status-emerald/25 flex items-center justify-between text-sm">
          <span className="font-bold text-status-emerald">{t("Smart Lock PIN Issued:", "رمز القفل الذكي:")}</span>
          <span className="font-mono text-lg font-black text-status-emerald tracking-widest">{confirmation.smartLockPin}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCopy}
          className="h-10 px-4 rounded-xl bg-primary-container text-on-primary text-xs font-bold hover:bg-primary transition cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">content_copy</span>
          <span>{t("Copy WhatsApp / SMS Summary", "نسخ ملخص الحجز")}</span>
        </button>
      </div>
    </div>
  );
}

export function HelplineQueueTable({
  helplineBookings,
  queueBusyId,
  onQueueAction,
  setSelectedBooking,
  t,
}: {
  helplineBookings: BookingItem[];
  queueBusyId: string | null;
  onQueueAction: (b: BookingItem, action: "confirm_payment" | "cancel") => void;
  setSelectedBooking: (booking: SelectedBookingDetail | null) => void;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-black text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-600">receipt_long</span>
            <span>{t("Helpline & Pending SADAD Queue", "سجل حجوزات الهاتف وبانتظار سداد")}</span>
          </h2>
          <p className="text-xs text-on-surface-variant">
            {t("Track callers awaiting SADAD transfer or recently confirmed helpline stays.", "متابعة الحجوزات الهاتفية بانتظار السداد أو المؤكدة.")}
          </p>
        </div>
        <span className="text-xs font-bold text-outline">
          {helplineBookings.length} {t("helpline bookings", "حجز هاتفي")}
        </span>
      </div>

      {helplineBookings.length === 0 ? (
        <div className="p-6 text-center text-sm text-outline bg-surface-container-low rounded-xl">
          {t("No phone/helpline bookings created yet. Select any listing and dates above to create your first hold.", "لا توجد حجوزات هاتفية بعد. اختر العقار والتواريخ أعلاه للبدء.")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-start border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-container text-xs uppercase text-outline font-bold">
                <th className="py-2.5 px-3 text-start">{t("Ref", "المرجع")}</th>
                <th className="py-2.5 px-3 text-start">{t("Caller", "العميل")}</th>
                <th className="py-2.5 px-3 text-start">{t("Property", "العقار")}</th>
                <th className="py-2.5 px-3 text-start">{t("Dates", "التواريخ")}</th>
                <th className="py-2.5 px-3 text-start">{t("Total", "الإجمالي")}</th>
                <th className="py-2.5 px-3 text-start">{t("Status", "الحالة")}</th>
                <th className="py-2.5 px-3 text-end">{t("Quick Actions", "إجراءات سريعة")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {helplineBookings.slice(0, 20).map((b) => {
                const isHold = b.status === "pending" && String(b.auth_subject || "").includes("SADAD_HOLD");
                const isCancelled = b.status === "cancelled";
                return (
                  <tr key={b.id} className="hover:bg-surface-container-low/50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-xs text-primary">
                      #{b.booking_reference || b.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-on-surface text-xs">{b.guest_name || "Phone Guest"}</div>
                      <div className="text-[11px] font-mono text-outline">{b.guest_phone || "—"}</div>
                    </td>
                    <td className="py-3 px-3 text-xs font-semibold text-on-surface max-w-[200px] truncate">
                      {b.property_title || "Property"}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-on-surface-variant">
                      {b.check_in} → {b.check_out}
                    </td>
                    <td className="py-3 px-3 font-black text-xs text-on-surface">
                      SAR {Number(b.total_price || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isHold
                            ? "bg-amber-100 text-amber-800"
                            : isCancelled
                            ? "bg-rose-100 text-rose-700"
                            : "bg-status-emerald/15 text-status-emerald"
                        }`}
                      >
                        {isHold ? "PENDING SADAD" : b.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        {isHold && (
                          <>
                            <button
                              type="button"
                              disabled={queueBusyId === b.id}
                              onClick={() => onQueueAction(b, "confirm_payment")}
                              className="px-2.5 py-1 rounded-lg bg-status-emerald text-white text-[11px] font-bold hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
                            >
                              {t("Confirm Paid", "تأكيد الدفع")}
                            </button>
                            <button
                              type="button"
                              disabled={queueBusyId === b.id}
                              onClick={() => onQueueAction(b, "cancel")}
                              className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-[11px] font-bold hover:bg-rose-200 cursor-pointer disabled:opacity-50"
                            >
                              {t("Cancel Hold", "إلغاء")}
                            </button>
                          </>
                        )}
                        {(b.status === "confirmed" || b.status === "completed") && (
                          <button
                            type="button"
                            disabled={queueBusyId === b.id}
                            onClick={() => onQueueAction(b, "cancel")}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold hover:bg-rose-100 cursor-pointer disabled:opacity-50"
                          >
                            {t("Cancel & Refund", "إلغاء واسترداد")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedBooking({
                              ...buildSelectedBookingDetail(b, t),
                              id: `#${b.booking_reference || b.id.slice(0, 8)}`,
                              status: isHold ? "pending_sadad" : b.status,
                              payoutStatus:
                                b.status === "confirmed" || b.status === "completed"
                                  ? "Paid & Settled"
                                  : isHold
                                  ? "Awaiting SADAD Payment"
                                  : b.payment_status,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-surface-container bg-surface-container-low text-on-surface text-[11px] font-bold hover:bg-surface-container cursor-pointer"
                        >
                          {t("Details", "التفاصيل")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
