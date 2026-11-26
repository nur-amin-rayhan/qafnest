"use client";

import React from "react";
import { CheckCircle2, UserCheck, Receipt, Copy, Plus } from "lucide-react";
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
      className="rounded-xl border border-emerald-500/40 bg-white dark:bg-[#0E0D16] p-5 sm:p-6 shadow-xs space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {confirmation.paymentMode === "confirmed_paid"
                ? t("Confirmed & Paid", "مؤكد ومدفوع")
                : t("Room Held — Ready for SADAD Payment", "تم حجز الغرفة — بانتظار السداد")}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              #{confirmation.bookingReference} · {confirmation.propertyTitle}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs"
        >
          <Plus size={14} />
          <span>{t("New Phone Booking", "حجز جديد")}</span>
        </button>
      </div>

      {confirmation.autoCreatedGuest && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
          <UserCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900 dark:text-emerald-200">
              {t("New Verified Guest Account Automatically Created", "تم إنشاء حساب عميل موثق جديد تلقائياً")}
            </p>
            <p className="mt-0.5 text-emerald-800 dark:text-emerald-300">
              {t(
                "Whenever this caller logs in on the Guest Portal with their phone number, their saved profile and reservation history will restore automatically.",
                "عند تسجيل دخول العميل مستقبلاً برقم جواله في بوابة الضيوف، ستظهر بياناته وسجل حجوزاته تلقائياً."
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">{t("Caller", "الضيف")}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{confirmation.guestName}</div>
          <div className="text-xs font-mono text-slate-600 dark:text-slate-400">{confirmation.guestPhone}</div>
          {confirmation.guestEmail && <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{confirmation.guestEmail}</div>}
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">{t("Dates Locked", "التواريخ المحجوزة")}</div>
          <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
            {confirmation.checkIn} → {confirmation.checkOut}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
          <div className="text-xs text-[#4F2396] dark:text-purple-300 font-semibold">{t("Total Payable", "الإجمالي")}</div>
          <div className="text-lg font-bold text-[#4F2396] dark:text-purple-200 mt-0.5">SAR {confirmation.guestTotalSar.toFixed(2)}</div>
        </div>
      </div>

      {confirmation.smartLockPin && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-sm">
          <span className="font-semibold text-emerald-800 dark:text-emerald-200">{t("Smart Lock PIN Issued:", "رمز القفل الذكي:")}</span>
          <span className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300 tracking-widest">{confirmation.smartLockPin}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCopy}
          className="h-9 px-4 rounded-lg bg-[#4F2396] hover:bg-[#3D1A78] text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
        >
          <Copy size={14} />
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
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E0D16] p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt size={18} className="text-amber-500" />
            <span>{t("Helpline & Pending SADAD Queue", "سجل حجوزات الهاتف وبانتظار سداد")}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("Track callers awaiting SADAD transfer or recently confirmed helpline stays.", "متابعة الحجوزات الهاتفية بانتظار السداد أو المؤكدة.")}
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {helplineBookings.length} {t("helpline bookings", "حجز هاتفي")}
        </span>
      </div>

      {helplineBookings.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
          {t("No phone/helpline bookings created yet. Select any listing and dates above to create your first hold.", "لا توجد حجوزات هاتفية بعد. اختر العقار والتواريخ أعلاه للبدء.")}
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-xl">
          <table className="w-full min-w-[680px] text-start border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 text-start">{t("Ref", "المرجع")}</th>
                <th className="py-2.5 px-3 text-start">{t("Caller", "العميل")}</th>
                <th className="py-2.5 px-3 text-start">{t("Property", "العقار")}</th>
                <th className="py-2.5 px-3 text-start">{t("Dates", "التواريخ")}</th>
                <th className="py-2.5 px-3 text-start">{t("Total", "الإجمالي")}</th>
                <th className="py-2.5 px-3 text-start">{t("Status", "الحالة")}</th>
                <th className="py-2.5 px-3 text-end">{t("Quick Actions", "إجراءات سريعة")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {helplineBookings.slice(0, 20).map((b) => {
                const isHold = b.status === "pending" && String(b.auth_subject || "").includes("SADAD_HOLD");
                const isCancelled = b.status === "cancelled";
                return (
                  <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-semibold text-xs text-[#4F2396] dark:text-purple-300">
                      #{b.booking_reference || b.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{b.guest_name || "Phone Guest"}</div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{b.guest_phone || "—"}</div>
                    </td>
                    <td className="py-3 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                      {b.property_title || "Property"}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {b.check_in} → {b.check_out}
                    </td>
                    <td className="py-3 px-3 font-bold text-xs text-slate-900 dark:text-slate-100 font-mono">
                      SAR {Number(b.total_price || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                          isHold
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : isCancelled
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                            : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
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
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50 transition shadow-xs"
                            >
                              {t("Confirm Paid", "تأكيد الدفع")}
                            </button>
                            <button
                              type="button"
                              disabled={queueBusyId === b.id}
                              onClick={() => onQueueAction(b, "cancel")}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-semibold cursor-pointer disabled:opacity-50 transition"
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
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-semibold cursor-pointer disabled:opacity-50 transition"
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
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition cursor-pointer shadow-xs"
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
