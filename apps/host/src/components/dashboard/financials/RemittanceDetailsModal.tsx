"use client";

import React from "react";
import { X, CheckCircle2, Clock, Calendar, ArrowUpRight, Copy } from "lucide-react";
import type { HostRemittance } from "@/lib/services/hostFinancialsService";

interface RemittanceDetailsModalProps {
  remittance: HostRemittance | null;
  onClose: () => void;
  lang: "ar" | "en";
  t: (en: string, ar: string) => string;
}

export function RemittanceDetailsModal({
  remittance,
  onClose,
  lang,
  t,
}: RemittanceDetailsModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!remittance) return null;

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(remittance.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 place-items-center rounded-2xl ${
                remittance.status === "settled"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-violet-50 text-violet-600"
              }`}
            >
              {remittance.status === "settled" ? <CheckCircle2 size={20} /> : <Clock size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {remittance.id}
                </h3>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  title="Copy Reference"
                >
                  <Copy size={13} />
                </button>
                {copied && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {lang === "ar" ? remittance.dateAr : remittance.dateEn} · {remittance.bank}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount Summary Strip */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("Gross Bookings Amount", "إجمالي قيمة الحجوزات")}</span>
            <span className="text-sm font-black text-slate-900">{remittance.grossAmount.toLocaleString()} SAR</span>
          </div>
          <div className="flex items-center justify-between text-xs text-rose-600 font-bold">
            <span>
              {(() => {
                const pct =
                  remittance.commissionRatePercent ??
                  (remittance.grossAmount > 0
                    ? Math.round((remittance.commissionAmount / remittance.grossAmount) * 1000) / 10
                    : 20);
                return t(`QafNest Service Fee (${pct}%)`, `عمولة قاف نست (${pct}%)`);
              })()}
            </span>
            <span>-{remittance.commissionAmount.toLocaleString()} SAR</span>
          </div>
          {(remittance.promoDiscountAmount || 0) > 0 && (
            <div className="flex items-center justify-between text-xs text-rose-600 font-bold">
              <span>{t("Promo Code Discount", "خصم كود الترويج")}</span>
              <span>-{Number(remittance.promoDiscountAmount).toLocaleString()} SAR</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
            <span className="text-sm font-black text-slate-900">{t("Net Transferred to IBAN", "صافي المبلغ المحول")}</span>
            <span className="text-lg font-black text-[#4F2396]">{remittance.amount} SAR</span>
          </div>
        </div>

        {/* Bookings Included List */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-400 uppercase mb-3">
            {t("Guest Reservations Included", "حجوزات الضيوف المشمولة في الحوالة")} ({remittance.bookings.length})
          </h4>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {remittance.bookings.map((b) => (
              <div key={b.bookingId} className="p-3.5 bg-white hover:bg-slate-50 transition flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{b.bookingReference}</span>
                    <span className="text-[11px] font-medium text-slate-500">· {b.propertyTitle}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <Calendar size={11} />
                    <span>{b.checkIn} → {b.checkOut}</span>
                  </div>
                </div>
                <div className="text-end">
                  <span className="font-black text-slate-900 block">{b.netPayout.toLocaleString()} SAR</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {t("Gross", "الإجمالي")}: {b.grossAmount} SAR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
          >
            {t("Close", "إغلاق")}
          </button>
        </div>
      </div>
    </div>
  );
}

