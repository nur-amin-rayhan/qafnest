"use client";

import React from "react";
import { BadgePercent, CheckCircle2, Clock, CreditCard, FileText } from "lucide-react";
import type { WalletTransaction } from "@/lib/services/walletService";

export type WalletFilterTab = "all" | "topup" | "booking" | "reward";

const FILTER_OPTIONS: Array<{ id: WalletFilterTab; labelEn: string; labelAr: string }> = [
  { id: "all", labelEn: "All", labelAr: "الكل" },
  { id: "topup", labelEn: "Top-ups", labelAr: "الشحن" },
  { id: "booking", labelEn: "Bookings", labelAr: "الحجوزات" },
  { id: "reward", labelEn: "Rewards", labelAr: "المكافآت" },
];

export function WalletTransactionsSection({
  activeFilter,
  setActiveFilter,
  transactions,
  onSelectReceipt,
  t,
}: {
  activeFilter: WalletFilterTab;
  setActiveFilter: (f: WalletFilterTab) => void;
  transactions: WalletTransaction[];
  onSelectReceipt: (tx: WalletTransaction) => void;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {t("Wallet Activity & Transactions", "سجل العمليات وحركات الرصيد")}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setActiveFilter(opt.id)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === opt.id
                  ? "bg-white dark:bg-[#0E0E1A] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t(opt.labelEn, opt.labelAr)}
            </button>
          ))}
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            {t("No wallet transactions found", "لا توجد عمليات مسجلة في هذا القسم")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const isPositive = tx.amount > 0;
            const isBooking = tx.type === "booking_payment";

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold ${
                      isBooking
                        ? "bg-purple-100 dark:bg-purple-950/40 text-[#4F2396] dark:text-purple-300"
                        : isPositive
                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {isBooking ? (
                      <CreditCard size={18} />
                    ) : isPositive ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <BadgePercent size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {t(tx.titleEn, tx.titleAr)}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      Ref: {tx.reference} · {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-end">
                    {tx.amount !== 0 && (
                      <div
                        className={`text-sm font-black font-mono ${
                          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                        }`}
                        dir="ltr"
                      >
                        {isPositive ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} SAR
                      </div>
                    )}
                    {tx.points !== undefined && tx.points !== 0 && (
                      <div
                        className={`text-[11px] font-bold ${
                          tx.points > 0 ? "text-purple-600 dark:text-purple-400" : "text-amber-600"
                        }`}
                      >
                        {tx.points > 0 ? `+${tx.points} Pts` : `${tx.points} Pts`}
                      </div>
                    )}
                  </div>

                  {Math.abs(tx.amount) > 0 &&
                    (tx.type === "topup" || tx.type === "booking_payment" || tx.type === "refund") && (
                      <button
                        type="button"
                        onClick={() => onSelectReceipt(tx)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white hover:bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700 dark:border-violet-500/30 dark:bg-white/5 dark:text-violet-300 dark:hover:bg-violet-950/40 transition cursor-pointer shadow-2xs shrink-0"
                        title={t("View official tax invoice & receipt", "عرض الفاتورة الضريبية والإيصال المالي")}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t("Invoice", "الفاتورة")}</span>
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
