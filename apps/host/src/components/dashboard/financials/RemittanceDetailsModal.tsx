"use client";

import React from "react";
import { X, CheckCircle2, Clock, Calendar, Copy, Printer, Download } from "lucide-react";
import type { HostRemittance } from "@/lib/services/hostFinancialsService";
import { downloadHostRemittanceVoucher } from "@/lib/services/downloadHostVoucher";

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

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleDownloadVoucher = () => {
    downloadHostRemittanceVoucher(remittance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#12101a] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto print:border-none print:shadow-none print:max-w-none print:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 place-items-center rounded-2xl ${
                remittance.status === "settled"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                  : "bg-violet-50 dark:bg-purple-950/60 text-violet-600 dark:text-purple-300"
              }`}
            >
              {remittance.status === "settled" ? <CheckCircle2 size={20} /> : <Clock size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                  {remittance.id}
                </h3>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer p-1 print:hidden"
                  title="Copy Reference"
                >
                  <Copy size={13} />
                </button>
                {copied && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {lang === "ar" ? remittance.dateAr : remittance.dateEn} · {remittance.bank}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition"
            >
              <Printer size={13} />
              <span>{t("Print Voucher", "طباعة السند")}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadVoucher}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 dark:border-purple-800 bg-violet-50 dark:bg-purple-950/60 hover:bg-violet-100 dark:hover:bg-purple-900/60 px-3 py-1.5 text-xs font-bold text-[#4F2396] dark:text-purple-300 cursor-pointer transition"
            >
              <Download size={13} />
              <span>{t("Download", "تحميل")}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              aria-label={t("Close", "إغلاق")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Amount Summary Strip */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t("Gross Bookings Amount", "إجمالي قيمة الحجوزات")}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{remittance.grossAmount.toLocaleString()} SAR</span>
          </div>
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-bold">
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
            <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-bold">
              <span>{t("Promo Code Discount", "خصم كود الترويج")}</span>
              <span>-{Number(remittance.promoDiscountAmount).toLocaleString()} SAR</span>
            </div>
          )}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between">
            <span className="text-sm font-black text-slate-900 dark:text-white">{t("Net Transferred to IBAN", "صافي المبلغ المحول")}</span>
            <span className="text-lg font-black text-[#4F2396] dark:text-purple-300">{remittance.amount} SAR</span>
          </div>
        </div>

        {/* Bookings Included List */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-3">
            {t("Guest Reservations Included", "حجوزات الضيوف المشمولة في الحوالة")} ({remittance.bookings.length})
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
            {remittance.bookings.map((b) => (
              <div key={b.bookingId} className="p-3.5 bg-white dark:bg-[#12101a] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{b.bookingReference}</span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">· {b.propertyTitle}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    <Calendar size={11} />
                    <span>{b.checkIn} → {b.checkOut}</span>
                  </div>
                </div>
                <div className="text-end">
                  <span className="font-black text-slate-900 dark:text-white block">{b.netPayout.toLocaleString()} SAR</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
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

